import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  FREE_TIER_BLOCK_RANGE_RE,
  FREE_TIER_MAX_CHUNK_SIZE,
  INITIAL_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  RANGE_TOO_LARGE_ERROR_RE,
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_ERROR_RE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';

// Result/response overflow — shrink window; do not treat as free-tier.
const RESULT_OVERFLOW_RE = /query returned more than|10,?000 results|response size|exceeds limit/i;

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

export function isLogsRetryableError(err: unknown): boolean {
  const message = errorMessage(err);
  return RATE_LIMIT_ERROR_RE.test(message) || RANGE_TOO_LARGE_ERROR_RE.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Non-getLogs RPCs (getBlockNumber, ownerOf, …) still get a short rate-limit retry.
export async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!RATE_LIMIT_ERROR_RE.test(errorMessage(err)) || attempt >= RATE_LIMIT_MAX_RETRIES) {
        throw err;
      }
      await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

export const getLatestBlockWithRetry = (provider: Provider | ethersV6.Provider): Promise<number> =>
  withRateLimitRetry(() => provider.getBlockNumber());

// ethers v5 filters resolve topics sync; v6 DeferredTopicFilter needs getTopicFilter().
export async function resolveFilterTopics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | undefined> {
  if (typeof filter?.getTopicFilter === 'function') {
    return filter.getTopicFilter();
  }
  return filter?.topics;
}

interface ScanLogsBackwardResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
  foundMint: boolean;
  /** True when the scan stopped early due to a rate-limit / hard failure. */
  truncated: boolean;
}

interface AdaptiveScanState {
  chunkSize: number;
  maxChunkSize: number;
}

// Ladder: free-tier → hard jump to 10; result overflow / generic → /4 (or snap to 10k).
function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  if (FREE_TIER_BLOCK_RANGE_RE.test(message)) {
    state.maxChunkSize = FREE_TIER_MAX_CHUNK_SIZE;
    state.chunkSize = FREE_TIER_MAX_CHUNK_SIZE;
    return;
  }

  if (RESULT_OVERFLOW_RE.test(message)) {
    state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
    state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
    return;
  }

  // Unknown provider range cap.
  if (state.chunkSize > INITIAL_CHUNK_SIZE) {
    state.chunkSize = INITIAL_CHUNK_SIZE;
    return;
  }
  state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
  state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
}

function isFreeTierScan(state: AdaptiveScanState): boolean {
  return state.chunkSize <= FREE_TIER_MAX_CHUNK_SIZE;
}

// Single place for getLogs rate-limit retries.
// Free-tier (≤10 blocks): never retry a 429 — hard-fail so the scan stops.
async function getLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await provider.getLogs({ address, fromBlock, toBlock, topics })) as any[];
    } catch (err) {
      const message = errorMessage(err);
      if (!RATE_LIMIT_ERROR_RE.test(message)) throw err;

      // Free-tier 10-block windows: retrying a 429 cannot finish a deep chain.
      if (isFreeTierScan(state) || attempt >= RATE_LIMIT_MAX_RETRIES) {
        throw err;
      }
      await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

// Keep mint and any same-tx companion logs that precede it (e.g. StatusInitialized).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMintSliceStart(logs: any[], isMintLog: (log: any) => boolean): number {
  let mintIndex = -1;
  for (let i = 0; i < logs.length; i++) {
    if (isMintLog(logs[i])) {
      mintIndex = i;
      break;
    }
  }
  if (mintIndex < 0) return -1;

  const txHash = logs[mintIndex].transactionHash;
  let start = mintIndex;
  while (start > 0 && logs[start - 1].transactionHash === txHash) {
    start -= 1;
  }
  return start;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenOldestFirst(chunkGroups: any[][]): any[] {
  return chunkGroups.toReversed().flat();
}

/**
 * Backward eth_getLogs scanner: start at 10k, jump to 10 on free-tier,
 * /4 on result overflow; hard-stop on 429 while at ≤10 blocks.
 * Walks until mint, floor, or a hard failure — no time/request budget.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @param {any[]} [topics] - Optional topic filter (e.g. to scan only one tokenId's events)
 * @returns {Promise<ScanLogsBackwardResult>} Logs oldest→newest plus mint/truncation flags
 */
export const scanLogsBackward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
): Promise<ScanLogsBackwardResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  const state: AdaptiveScanState = {
    chunkSize: INITIAL_CHUNK_SIZE,
    maxChunkSize: INITIAL_CHUNK_SIZE,
  };
  const effectiveFloor = Math.max(0, toBlockFloor);
  let cursor = fromBlock;

  while (cursor >= effectiveFloor) {
    const chunkStart = Math.max(cursor - state.chunkSize + 1, effectiveFloor);
    try {
      const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor, state, topics);

      if (isMintLog) {
        const start = findMintSliceStart(chunkLogs, isMintLog);
        if (start >= 0) {
          chunkGroups.push(chunkLogs.slice(start));
          return { logs: flattenOldestFirst(chunkGroups), foundMint: true, truncated: false };
        }
      }
      chunkGroups.push(chunkLogs);
      cursor = chunkStart - 1;
    } catch (err) {
      const message = errorMessage(err);

      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
        shrinkForRangeLimit(state, message);
        continue; // retry same cursor with smaller window
      }

      // Rate limit: paid path already exhausted getLogsRange retries; free-tier never retries.
      // Either way, stop — do not outer-loop retry the same 429.
      if (RATE_LIMIT_ERROR_RE.test(message)) {
        return { logs: flattenOldestFirst(chunkGroups), foundMint: false, truncated: true };
      }

      throw err;
    }
  }

  return {
    logs: flattenOldestFirst(chunkGroups),
    foundMint: false,
    truncated: false,
  };
};

export interface ScanForMintEventOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: (log: any) => boolean;
  /** Thrown when the scan stopped early (e.g. rate-limit) before finding mint. */
  notFoundOnFailureMessage: string;
  notFoundMessage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[];
}

/**
 * Scan backward for mint; throw if truncated by failure or genuinely missing.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} scanFloor - Earliest block to stop at (0 if unknown)
 * @param {number} latestBlock - Latest block, already resolved by the caller
 * @param {ScanForMintEventOptions} options - Mint detector, error messages, optional topics
 * @returns {Promise<any[]>} The mint's log and any same-tx companion logs, oldest first
 */
export async function scanForMintEvent(
  provider: Provider | ethersV6.Provider,
  address: string,
  scanFloor: number,
  latestBlock: number,
  options: ScanForMintEventOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const { isMintLog, notFoundOnFailureMessage, notFoundMessage, topics } = options;

  const result = await scanLogsBackward(
    provider,
    address,
    latestBlock,
    scanFloor,
    isMintLog,
    topics,
  );

  if (!result.foundMint && result.truncated) {
    throw new Error(notFoundOnFailureMessage);
  }
  if (!result.foundMint) {
    throw new Error(notFoundMessage);
  }

  return result.logs;
}
