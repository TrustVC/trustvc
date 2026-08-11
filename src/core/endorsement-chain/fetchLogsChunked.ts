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

// Best-effort RPC URL from ethers v5 / v6 / wrapped providers.
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

function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  if (INFURA_FREE_TIER_RANGE_RE.test(message)) {
    state.maxChunkSize = Math.min(state.maxChunkSize, FREE_TIER_MAX_CHUNK_SIZE);
  }
  state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
  state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
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
  const oldestFirstGroups = chunkGroups.toReversed();
  return oldestFirstGroups.flat();
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
  let requestsUsed = 0;
  const startedAt = Date.now();
  let foundMint = false;

  while (cursor >= toBlockFloor) {
    if (Date.now() - startedAt > FREE_TIER_MAX_DURATION_MS) {
      throw new Error(
        `Infura Free-tier scan time budget exhausted after ${FREE_TIER_MAX_DURATION_MS}ms`,
      );
    }

    const windows: Array<{ start: number; end: number }> = [];
    let winCursor = cursor;
    for (let i = 0; i < FREE_TIER_CONCURRENCY && winCursor >= toBlockFloor; i++) {
      const start = Math.max(winCursor - windowSize + 1, toBlockFloor);
      windows.push({ start, end: winCursor });
      if (start <= toBlockFloor) break;
      winCursor = start - 1;
    }

    if (requestsUsed + windows.length > FREE_TIER_MAX_REQUESTS) {
      throw new Error(
        `Infura Free-tier scan request budget exhausted (${FREE_TIER_MAX_REQUESTS} eth_getLogs calls)`,
      );
    }

    let results: Awaited<ReturnType<typeof getLogsRange>>[];
    try {
      results = await Promise.all(
        windows.map(({ start, end }) => getLogsRange(provider, address, start, end)),
      );
      requestsUsed += windows.length;
    } catch (err) {
      const message = errorMessage(err);
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && windowSize > MIN_CHUNK_SIZE) {
        // Keep already-collected chunkGroups; only shrink and retry this batch.
        windowSize = Math.max(Math.floor(windowSize / 4), MIN_CHUNK_SIZE);
        continue;
      }
      throw err;
    }

    for (const chunkLogs of results) {
      if (pushMintSliceIfFound(chunkLogs, isMintLog, chunkGroups)) {
        foundMint = true;
        break;
      }
      chunkGroups.push(chunkLogs);
    }

    if (foundMint) {
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
  // Paid-tier chunks collected newest-first while walking backward.
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
    // Free-tier: finish remaining (older) range with parallel fixed windows.
    if (state.maxChunkSize <= FREE_TIER_MAX_CHUNK_SIZE) {
      const older = await scanLogsBackwardParallel(
        provider,
        address,
        cursor,
        effectiveFloor,
        state.chunkSize,
        isMintLog,
      );
      return {
        logs: [...older.logs, ...flattenOldestFirst(newerChunkGroups)],
        foundMint: older.foundMint,
        truncated: older.foundMint ? false : older.truncated,
      };
    }

    const chunkStart = Math.max(cursor - state.chunkSize + 1, effectiveFloor);
    try {
      const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor);
      if (pushMintSliceIfFound(chunkLogs, isMintLog, newerChunkGroups)) {
        return {
          logs: flattenOldestFirst(newerChunkGroups),
          foundMint: true,
          truncated: false,
        };
      }
      newerChunkGroups.push(chunkLogs);
    } catch (err) {
      const message = errorMessage(err);
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
        shrinkForRangeLimit(state, message);
        continue;
      }
      throw err;
    }

    if (chunkStart <= effectiveFloor) break;
    cursor = chunkStart - 1;
  }

  return {
    logs: flattenOldestFirst(newerChunkGroups),
    foundMint: false,
    truncated: Boolean(isMintLog) && budgetRaisedFloor,
  };
};
