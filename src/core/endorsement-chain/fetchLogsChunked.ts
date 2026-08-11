import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  DEFAULT_MAX_BLOCKS_TO_SCAN,
  FREE_TIER_CONCURRENCY,
  FREE_TIER_MAX_CHUNK_SIZE,
  FREE_TIER_MAX_DURATION_MS,
  FREE_TIER_MAX_REQUESTS,
  INFURA_FREE_TIER_RANGE_RE,
  INFURA_HOST_RE,
  INITIAL_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  RANGE_TOO_LARGE_ERROR_RE,
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_ERROR_RE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';

function errorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const parts = [
    anyErr?.message,
    anyErr?.shortMessage,
    anyErr?.error?.message,
    anyErr?.info?.error?.message,
    typeof anyErr?.statusCode === 'number' ? String(anyErr.statusCode) : undefined,
    typeof anyErr?.code === 'number' || typeof anyErr?.code === 'string'
      ? String(anyErr.code)
      : undefined,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  if (parts.length > 0) return parts.join(' ');
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  return RATE_LIMIT_ERROR_RE.test(errorMessage(err));
}

function getProviderRpcUrl(provider: Provider | ethersV6.Provider): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyProvider = provider as any;
  return String(
    anyProvider?.connection?.url ||
      anyProvider?._getConnection?.()?.url ||
      anyProvider?.provider?.connection?.url ||
      anyProvider?.provider?._getConnection?.()?.url ||
      '',
  );
}

/**
 * True when the provider talks to Infura (JSON-RPC URL host contains infura.io).
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @returns {boolean} - Whether the provider RPC URL is Infura
 */
export function isInfuraProvider(provider: Provider | ethersV6.Provider): boolean {
  return INFURA_HOST_RE.test(getProviderRpcUrl(provider));
}

export interface ScanLogsBackwardResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
  /** True when isMintLog matched before hitting the floor. */
  foundMint: boolean;
  /** True when the scan stopped at the block budget / floor without a mint match. */
  truncated: boolean;
}

interface AdaptiveScanState {
  chunkSize: number;
  /** Once Free-tier rejects a large window, never request more than 10 blocks again. */
  maxChunkSize: number;
}

interface FreeTierBudget {
  requestsUsed: number;
  deadlineAt: number;
}

type BlockWindow = { start: number; end: number };

function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  if (INFURA_FREE_TIER_RANGE_RE.test(message)) {
    state.maxChunkSize = Math.min(state.maxChunkSize, FREE_TIER_MAX_CHUNK_SIZE);
  }
  state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
  state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
}

function assertBudgets(budget: FreeTierBudget, upcoming = 0): void {
  if (Date.now() >= budget.deadlineAt) {
    throw new Error(
      `Infura Free-tier scan time budget exhausted after ${FREE_TIER_MAX_DURATION_MS}ms`,
    );
  }
  if (budget.requestsUsed + upcoming > FREE_TIER_MAX_REQUESTS) {
    throw new Error(
      `Infura Free-tier scan request budget exhausted (${FREE_TIER_MAX_REQUESTS} eth_getLogs calls)`,
    );
  }
}

/**
 * Race an RPC against the scan deadline so hanging calls cannot outlive the budget.
 * @param {Promise<T>} promise - In-flight RPC
 * @param {number} deadlineAt - Absolute deadline timestamp (ms)
 * @returns {Promise<T>} - RPC result or deadline error
 */
function withDeadline<T>(promise: Promise<T>, deadlineAt: number): Promise<T> {
  const remaining = deadlineAt - Date.now();
  if (remaining <= 0) {
    return Promise.reject(
      new Error(`Infura Free-tier scan time budget exhausted after ${FREE_TIER_MAX_DURATION_MS}ms`),
    );
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Infura Free-tier scan time budget exhausted after ${FREE_TIER_MAX_DURATION_MS}ms`,
        ),
      );
    }, remaining);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function getLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  let attempt = 0;
  while (true) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await provider.getLogs({ address, fromBlock, toBlock })) as any[];
    } catch (err) {
      if (isRateLimitError(err) && attempt < RATE_LIMIT_MAX_RETRIES) {
        await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt);
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
}

/**
 * Free-tier getLogs: count every attempt before invoke, retry 429s, bound by deadline.
 * @param {Provider | ethersV6.Provider} provider - Infura provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Inclusive start
 * @param {number} toBlock - Inclusive end
 * @param {FreeTierBudget} budget - Shared request/time budget (mutated)
 * @returns {Promise<any[]>} - Raw logs
 */
async function getLogsRangeFreeTier(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  budget: FreeTierBudget,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  for (let attempt = 0; ; attempt++) {
    assertBudgets(budget);
    budget.requestsUsed += 1;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pending = provider.getLogs({ address, fromBlock, toBlock }) as Promise<any[]>;
      return await withDeadline(pending, budget.deadlineAt);
    } catch (err) {
      if (isRateLimitError(err) && attempt < RATE_LIMIT_MAX_RETRIES) {
        assertBudgets(budget);
        await sleep(
          Math.min(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt, budget.deadlineAt - Date.now()),
        );
        continue;
      }
      throw err;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMintIndex(logs: any[], isMintLog: (log: any) => boolean): number {
  // Prefer the earliest mint marker so logs after mint are kept and nothing before mint is dropped incorrectly when several mint-like logs share a chunk.
  for (let i = 0; i < logs.length; i++) {
    if (isMintLog(logs[i])) return i;
  }
  return -1;
}

/**
 * Newest-first chunk groups → oldest→newest flat log list.
 * @param {any[][]} chunkGroups - Log groups collected newest-first
 * @returns {any[]} - Flattened logs oldest → newest
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenOldestFirst(chunkGroups: any[][]): any[] {
  return chunkGroups.toReversed().flat();
}

/**
 * Push mint-truncated chunk when a mint marker is present.
 * @param {any[]} chunkLogs - Logs for one window
 * @param {(log: any) => boolean | undefined} isMintLog - Optional mint detector
 * @param {any[][]} groups - Output groups (mutated)
 * @returns {boolean} - Whether a mint slice was pushed
 */
function pushMintSliceIfFound(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkLogs: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: ((log: any) => boolean) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groups: any[][],
): boolean {
  if (!isMintLog) return false;
  const mintIndex = findMintIndex(chunkLogs, isMintLog);
  if (mintIndex < 0) return false;
  groups.push(chunkLogs.slice(mintIndex));
  return true;
}

function buildParallelWindows(
  cursor: number,
  toBlockFloor: number,
  windowSize: number,
): BlockWindow[] {
  const windows: BlockWindow[] = [];
  for (let winCursor = cursor, i = 0; i < FREE_TIER_CONCURRENCY && winCursor >= toBlockFloor; i++) {
    const start = Math.max(winCursor - windowSize + 1, toBlockFloor);
    windows.push({ start, end: winCursor });
    if (start <= toBlockFloor) break;
    winCursor = start - 1;
  }
  return windows;
}

/**
 * Settle a Free-tier batch: wait for all in-flight calls before shrink/retry/throw.
 * @param {PromiseSettledResult<any[]>[]} settled - Batch outcomes
 * @param {number} windowSize - Current window size
 * @returns {{ results: any[][]; rangeTooLarge: boolean; hardError?: unknown }} - Parsed batch outcome
 */
function processSettledBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settled: PromiseSettledResult<any[]>[],
  windowSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { results: any[][]; rangeTooLarge: boolean; hardError?: unknown } {
  let rangeTooLarge = false;
  let hardError: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[][] = new Array(settled.length);

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      results[i] = outcome.value;
      continue;
    }
    const message = errorMessage(outcome.reason);
    if (RANGE_TOO_LARGE_ERROR_RE.test(message) && windowSize > MIN_CHUNK_SIZE) {
      rangeTooLarge = true;
    } else if (!hardError) {
      hardError = outcome.reason;
    }
  }

  return { results, rangeTooLarge, hardError };
}

/**
 * Append batch chunks newest→oldest; stop early when a mint marker is found.
 * @param {any[][]} results - Settled chunk logs in newest-first window order
 * @param {(log: any) => boolean | undefined} isMintLog - Optional mint detector
 * @param {any[][]} chunkGroups - Output groups (mutated)
 * @returns {boolean} - Whether a mint was found
 */
function collectBatchChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: ((log: any) => boolean) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkGroups: any[][],
): boolean {
  for (const chunkLogs of results) {
    if (pushMintSliceIfFound(chunkLogs, isMintLog, chunkGroups)) {
      return true;
    }
    chunkGroups.push(chunkLogs);
  }
  return false;
}

/**
 * Free-tier path: fetch up to FREE_TIER_CONCURRENCY fixed windows in parallel while walking
 * backward, then process newest→oldest so mint truncation stays correct.
 * @param {Provider | ethersV6.Provider} provider - Infura ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {number} chunkSize - Window size (typically ≤10)
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @returns {Promise<ScanLogsBackwardResult>} - Logs plus mint/truncation flags
 */
const scanLogsBackwardParallel = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  chunkSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
): Promise<ScanLogsBackwardResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  let cursor = fromBlock;
  let windowSize = Math.max(Math.min(chunkSize, FREE_TIER_MAX_CHUNK_SIZE), MIN_CHUNK_SIZE);
  const budget: FreeTierBudget = {
    requestsUsed: 0,
    deadlineAt: Date.now() + FREE_TIER_MAX_DURATION_MS,
  };

  while (cursor >= toBlockFloor) {
    const windows = buildParallelWindows(cursor, toBlockFloor, windowSize);
    assertBudgets(budget, windows.length);

    const settled = await Promise.allSettled(
      windows.map(({ start, end }) => getLogsRangeFreeTier(provider, address, start, end, budget)),
    );
    const { results, rangeTooLarge, hardError } = processSettledBatch(settled, windowSize);

    if (hardError) throw hardError;
    if (rangeTooLarge) {
      windowSize = Math.max(Math.floor(windowSize / 4), MIN_CHUNK_SIZE);
      continue;
    }

    if (collectBatchChunks(results, isMintLog, chunkGroups)) {
      return { logs: flattenOldestFirst(chunkGroups), foundMint: true, truncated: false };
    }

    const oldest = windows[windows.length - 1];
    if (oldest.start <= toBlockFloor) break;
    cursor = oldest.start - 1;
  }

  return {
    logs: flattenOldestFirst(chunkGroups),
    foundMint: false,
    truncated: Boolean(isMintLog),
  };
};

/**
 * Hand off remaining older range to Free-tier parallel scan and prepend paid-tier chunks.
 * @param {Provider | ethersV6.Provider} provider - Infura provider
 * @param {string} address - Contract address
 * @param {number} cursor - Current (newest unpaid) block
 * @param {number} effectiveFloor - Scan floor
 * @param {number} chunkSize - Window size for Free-tier
 * @param {(log: any) => boolean | undefined} isMintLog - Optional mint detector
 * @param {any[][]} newerChunkGroups - Already-collected paid-tier chunks (newest-first)
 * @returns {Promise<ScanLogsBackwardResult>} - Combined scan result
 */
async function handoffToFreeTier(
  provider: Provider | ethersV6.Provider,
  address: string,
  cursor: number,
  effectiveFloor: number,
  chunkSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: ((log: any) => boolean) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newerChunkGroups: any[][],
): Promise<ScanLogsBackwardResult> {
  const older = await scanLogsBackwardParallel(
    provider,
    address,
    cursor,
    effectiveFloor,
    chunkSize,
    isMintLog,
  );
  return {
    logs: [...older.logs, ...flattenOldestFirst(newerChunkGroups)],
    foundMint: older.foundMint,
    truncated: older.foundMint ? false : older.truncated,
  };
}

/**
 * Fetch one paid-tier window; shrink state on range limits.
 * @param {Provider | ethersV6.Provider} provider - Infura provider
 * @param {string} address - Contract address
 * @param {number} cursor - Current newest block of the window
 * @param {number} effectiveFloor - Scan floor
 * @param {AdaptiveScanState} state - Adaptive chunk sizing (mutated on range limits)
 * @param {(log: any) => boolean | undefined} isMintLog - Optional mint detector
 * @param {any[][]} newerChunkGroups - Paid-tier chunks collected newest-first (mutated)
 * @returns {Promise<'mint' | 'continue' | 'done'>} - Loop control for the paid-tier walker
 */
async function fetchPaidTierChunk(
  provider: Provider | ethersV6.Provider,
  address: string,
  cursor: number,
  effectiveFloor: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: ((log: any) => boolean) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newerChunkGroups: any[][],
): Promise<'mint' | 'continue' | 'done'> {
  const chunkStart = Math.max(cursor - state.chunkSize + 1, effectiveFloor);
  try {
    const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor);
    if (pushMintSliceIfFound(chunkLogs, isMintLog, newerChunkGroups)) {
      return 'mint';
    }
    newerChunkGroups.push(chunkLogs);
  } catch (err) {
    const message = errorMessage(err);
    if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
      shrinkForRangeLimit(state, message);
      return 'continue';
    }
    throw err;
  }
  return chunkStart <= effectiveFloor ? 'done' : 'continue';
}

/**
 * Infura-only backward eth_getLogs scanner. Starts near paid Infura caps, shrinks on
 * range/result-size limits (Free-tier snaps max to 10), then finishes with parallel
 * Free-tier windows. Stops at toBlockFloor, maxBlocksToScan budget, or isMintLog.
 * @param {Provider | ethersV6.Provider} provider - Infura ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @param {number} [maxBlocksToScan=DEFAULT_MAX_BLOCKS_TO_SCAN] - Max blocks to walk backward from fromBlock
 * @returns {Promise<ScanLogsBackwardResult>} - Logs plus mint/truncation flags
 */
export const scanLogsBackward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
  maxBlocksToScan: number = DEFAULT_MAX_BLOCKS_TO_SCAN,
): Promise<ScanLogsBackwardResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newerChunkGroups: any[][] = [];
  const state: AdaptiveScanState = {
    chunkSize: Math.min(INITIAL_CHUNK_SIZE, MAX_CHUNK_SIZE),
    maxChunkSize: MAX_CHUNK_SIZE,
  };
  const budgetFloor = Math.max(0, fromBlock - maxBlocksToScan);
  const effectiveFloor = Math.max(toBlockFloor, budgetFloor);
  const budgetRaisedFloor = effectiveFloor > toBlockFloor;
  let cursor = fromBlock;

  while (cursor >= effectiveFloor) {
    if (state.maxChunkSize <= FREE_TIER_MAX_CHUNK_SIZE) {
      return handoffToFreeTier(
        provider,
        address,
        cursor,
        effectiveFloor,
        state.chunkSize,
        isMintLog,
        newerChunkGroups,
      );
    }

    const priorChunkSize = state.chunkSize;
    const outcome = await fetchPaidTierChunk(
      provider,
      address,
      cursor,
      effectiveFloor,
      state,
      isMintLog,
      newerChunkGroups,
    );
    if (outcome === 'mint') {
      return {
        logs: flattenOldestFirst(newerChunkGroups),
        foundMint: true,
        truncated: false,
      };
    }
    // Range-limit shrink: retry same cursor with smaller window.
    if (state.chunkSize !== priorChunkSize) continue;

    const chunkStart = Math.max(cursor - priorChunkSize + 1, effectiveFloor);
    if (outcome === 'done' || chunkStart <= effectiveFloor) break;
    cursor = chunkStart - 1;
  }

  return {
    logs: flattenOldestFirst(newerChunkGroups),
    foundMint: false,
    truncated: Boolean(isMintLog) && budgetRaisedFloor,
  };
};
