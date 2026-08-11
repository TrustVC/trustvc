import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// Match RPC rate-limit errors (safe to retry the same block window).
const RATE_LIMIT_ERROR_RE = /could not coalesce|rate-?limit|too many requests|429|-32005/i;
// Match "block range too large" errors (need a smaller window).
const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|range.*(too large|exceed)|(too large|exceed).*range|block range|10,?000 results|response size should not exceed|limit exceeded|-32600|-32012/i;

// ethers transport error codes (not contract reverts).
const TRANSIENT_ERROR_CODES = new Set(['SERVER_ERROR', 'TIMEOUT', 'NETWORK_ERROR']);

// Start with 1000-block windows; shrink to as low as 10 if the provider rejects the range.
const INITIAL_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 10;
const MAX_CHUNK_SIZE = 50_000;
const GROW_AFTER_EMPTY_CHUNKS = 3;
const MAX_RETRIES = 8;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Join all error message fields so rate-limit text isn't missed (ethers v5 vs v6).
function errorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  return [anyErr?.message, anyErr?.shortMessage, anyErr?.error?.message, String(err)]
    .filter(Boolean)
    .join(' ');
}

// True for rate-limit / timeout / network errors; false for reverts and other failures.
export function isTransientRpcError(err: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  if (anyErr?.code && TRANSIENT_ERROR_CODES.has(anyErr.code)) return true;
  return RATE_LIMIT_ERROR_RE.test(errorMessage(err));
}

interface AdaptiveScanState {
  chunkSize: number;
  maxChunkSize: number;
  retries: number;
  consecutiveEmpty: number;
}

// Fetch one block window. Returns undefined to retry the same range; rethrows hard errors.
async function requestLogsWindow(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: any[] = await provider.getLogs({ address, fromBlock, toBlock });
    state.retries = 0;
    return logs;
  } catch (err) {
    const message = errorMessage(err);
    if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
      // Shrink the window and remember the cap so we don't grow past the provider limit again.
      const reducedChunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
      state.maxChunkSize = Math.min(state.maxChunkSize, reducedChunkSize);
      state.chunkSize = reducedChunkSize;
      state.retries = 0;
      return undefined;
    }
    if (isTransientRpcError(err) && state.retries < MAX_RETRIES) {
      state.retries++;
      await sleep(Math.min(1000 * 2 ** state.retries, 30_000));
      return undefined;
    }
    throw err;
  }
}

// Grow the window after several empty chunks; reset when logs are found.
function adaptChunkSizeAfterSuccess(state: AdaptiveScanState, logCount: number): void {
  if (logCount === 0) {
    state.consecutiveEmpty++;
    if (state.consecutiveEmpty >= GROW_AFTER_EMPTY_CHUNKS && state.chunkSize < state.maxChunkSize) {
      state.chunkSize = Math.min(state.chunkSize * 2, state.maxChunkSize);
      state.consecutiveEmpty = 0;
    }
  } else {
    state.consecutiveEmpty = 0;
  }
}

// Scan eth_getLogs backward from fromBlock to toBlockFloor (or until isMintLog matches).
// Window size grows on empty ranges and shrinks when the provider says the range is too large.
export const scanLogsBackward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  const state: AdaptiveScanState = {
    chunkSize: INITIAL_CHUNK_SIZE,
    maxChunkSize: MAX_CHUNK_SIZE,
    retries: 0,
    consecutiveEmpty: 0,
  };
  let cursor = fromBlock;

  while (cursor >= toBlockFloor) {
    const chunkStart = Math.max(cursor - state.chunkSize + 1, toBlockFloor);
    const chunkLogs = await requestLogsWindow(provider, address, chunkStart, cursor, state);
    if (chunkLogs === undefined) continue;

    chunkGroups.push(chunkLogs);
    if (isMintLog && chunkLogs.some(isMintLog)) break;

    adaptChunkSizeAfterSuccess(state, chunkLogs.length);

    if (chunkStart <= toBlockFloor) break;
    cursor = chunkStart - 1;
  }

  // Collected newest-first; reverse so the result is oldest → newest.
  return chunkGroups.reverse().flat();
};
