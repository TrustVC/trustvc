import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// Match "block range too large" errors (need a smaller window).
const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|range.*(too large|exceed)|(too large|exceed).*range|block range|10\s*block|block difference|free tier plan|10,?000 results|response size|log response size|-32600|-32012/i;

// Start with 1000-block windows; shrink to as low as 10 (Alchemy Free eth_getLogs cap).
const INITIAL_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 10;
const MAX_CHUNK_SIZE = 50_000;
const GROW_AFTER_EMPTY_CHUNKS = 3;

// Alchemy Free: "up to a 10 block difference" / suggested "[0x0, 0x9]".
const FREE_TIER_TEN_BLOCK_RE =
  /10\s*block|free tier plan|block range should work:\s*\[0x0,\s*0x9\]/i;

function errorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  return [
    anyErr?.message,
    anyErr?.shortMessage,
    anyErr?.error?.message,
    anyErr?.info?.error?.message,
    String(err),
  ]
    .filter(Boolean)
    .join(' ');
}

interface AdaptiveScanState {
  chunkSize: number;
  maxChunkSize: number;
  consecutiveEmpty: number;
}

function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  // Snap straight to the Free-tier 10-block cap when the provider says so.
  if (FREE_TIER_TEN_BLOCK_RE.test(message)) {
    state.chunkSize = MIN_CHUNK_SIZE;
    state.maxChunkSize = MIN_CHUNK_SIZE;
    state.consecutiveEmpty = 0;
    return;
  }
  const reducedChunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
  state.maxChunkSize = Math.min(state.maxChunkSize, reducedChunkSize);
  state.chunkSize = reducedChunkSize;
}

// Fetch one block window. Returns undefined to retry with a smaller window; rethrows other errors.
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
    return (await provider.getLogs({ address, fromBlock, toBlock })) as any[];
  } catch (err) {
    const message = errorMessage(err);
    if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
      shrinkForRangeLimit(state, message);
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
