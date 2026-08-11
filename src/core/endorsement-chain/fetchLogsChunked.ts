import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// Rate limit means the window was fine, just retry it; range-too-large means the window itself must shrink instead.
const RATE_LIMIT_ERROR_RE = /could not coalesce|rate-?limit|too many requests|429|-32005/i;
// Providers phrase this both ways ("range ... exceeds" and "exceeded ... range"), so both word orders are matched.
const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|range.*(too large|exceed)|(too large|exceed).*range|block range|10,?000 results|response size should not exceed|limit exceeded|-32600|-32012/i;

// ethers v5/v6 tag genuine transport failures with these `.code` values, distinct from 'CALL_EXCEPTION' (the call executed and reverted).
const TRANSIENT_ERROR_CODES = new Set(['SERVER_ERROR', 'TIMEOUT', 'NETWORK_ERROR']);

const INITIAL_CHUNK_SIZE = 2000;
const MIN_CHUNK_SIZE = 10;
const MAX_CHUNK_SIZE = 50_000;
const GROW_AFTER_EMPTY_CHUNKS = 3;
const MAX_RETRIES = 8;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Concatenates every message-like field instead of picking one: ethers v6 sometimes buries the useful
// detail (e.g. a batched "Too Many Requests") in `.message` while `.shortMessage` is a generic label,
// so matching against only the first truthy field can miss it.
function errorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  return [anyErr?.message, anyErr?.shortMessage, anyErr?.error?.message, String(err)]
    .filter(Boolean)
    .join(' ');
}

// True for a transport-level failure (rate limit/timeout/network error) — false for a call that executed and reverted, or any other error.
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

// Fetches one window. On range-too-large / transient errors, mutates state for the next attempt and
// returns undefined so the caller can retry the same cursor without advancing. Other errors rethrow.
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
      // Cap growth to the reduced size, not rejected-1 — otherwise empty-window growth climbs
      // back to near the failed range and keeps re-triggering the same provider limit.
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

// After a successful window: grow chunk size on quiet stretches, otherwise reset the empty streak.
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

// Adaptively-chunked backward eth_getLogs scan for one address, from fromBlock down to toBlockFloor: one
// address-scoped call per window instead of several unranged per-event-name filters, growing the window on
// quiet stretches and shrinking it (remembering the cap) when the provider rejects a range as too large.
// Pass an exact toBlockFloor to stop by block, or toBlockFloor: 0 with an isMintLog predicate to stop by
// log content when the floor isn't known upfront.
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

  // Chunks were collected latest-first; each chunk is already ascending internally.
  return chunkGroups.reverse().flat();
};
