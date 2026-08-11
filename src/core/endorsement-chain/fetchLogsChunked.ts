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
  let chunkSize = INITIAL_CHUNK_SIZE;
  let maxChunkSize = MAX_CHUNK_SIZE;
  let cursor = fromBlock;
  let consecutiveEmpty = 0;
  let retries = 0;

  while (cursor >= toBlockFloor) {
    const chunkStart = Math.max(cursor - chunkSize + 1, toBlockFloor);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chunkLogs: any[];
    try {
      chunkLogs = await provider.getLogs({ address, fromBlock: chunkStart, toBlock: cursor });
    } catch (err) {
      const message = errorMessage(err);
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && chunkSize > MIN_CHUNK_SIZE) {
        maxChunkSize = Math.min(maxChunkSize, chunkSize - 1);
        chunkSize = Math.max(Math.floor(chunkSize / 4), MIN_CHUNK_SIZE);
        retries = 0;
        continue;
      }
      if (isTransientRpcError(err) && retries < MAX_RETRIES) {
        retries++;
        await sleep(Math.min(1000 * 2 ** retries, 30_000));
        continue;
      }
      throw err;
    }
    retries = 0;

    chunkGroups.push(chunkLogs);
    if (isMintLog && chunkLogs.some(isMintLog)) break;

    if (chunkLogs.length === 0) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= GROW_AFTER_EMPTY_CHUNKS && chunkSize < maxChunkSize) {
        chunkSize = Math.min(chunkSize * 2, maxChunkSize);
        consecutiveEmpty = 0;
      }
    } else {
      consecutiveEmpty = 0;
    }

    if (chunkStart <= toBlockFloor) break;
    cursor = chunkStart - 1;
  }

  // Chunks were collected latest-first; each chunk is already ascending internally.
  return chunkGroups.reverse().flat();
};
