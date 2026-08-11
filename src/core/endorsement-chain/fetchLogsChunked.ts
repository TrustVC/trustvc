import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// Infura Free-tier eth_getLogs: max 10-block window (-32600).
// Example: "Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block difference..."
const INFURA_FREE_TIER_RANGE_RE =
  /free tier plan|10\s*block difference|block range should work:\s*\[0x0,\s*0x9\]|-32600/i;

// Also shrink for dense windows (result-count / response-size caps).
const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|range.*(too large|exceed)|(too large|exceed).*range|block range|10\s*block|block difference|free tier plan|10,?000 results|response size|log response size|-32600|-32012/i;

const INFURA_HOST_RE = /infura\.io/i;

// Try paid-tier sized windows first; Free-tier errors snap the cap to 10.
const INITIAL_CHUNK_SIZE = 10_000;
const FREE_TIER_MAX_CHUNK_SIZE = 10;
const MIN_CHUNK_SIZE = 1;
const MAX_CHUNK_SIZE = 50_000;
const GROW_AFTER_EMPTY_CHUNKS = 1;
// Parallel windows once we know a stable Free-tier size (no adaptive shrink mid-flight).
const FREE_TIER_CONCURRENCY = 8;

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

function maybeGrowAfterEmpty(state: AdaptiveScanState, emptyStreak: number): number {
  if (emptyStreak < GROW_AFTER_EMPTY_CHUNKS) return emptyStreak;
  if (state.chunkSize >= state.maxChunkSize) return 0;
  state.chunkSize = Math.min(state.chunkSize * 2, state.maxChunkSize);
  return 0;
}

async function getLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return provider.getLogs({ address, fromBlock, toBlock }) as Promise<any[]>;
}

/**
 * Fetch logs over a known [fromBlock, toBlock] with Free-tier-sized parallel windows.
 * Used after Infura Free-tier has already capped the window at 10.
 * @param {Provider | ethersV6.Provider} provider - Infura ethers provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Inclusive start
 * @param {number} toBlock - Inclusive end
 * @param {number} chunkSize - Window size (typically 10)
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} - Logs oldest → newest
 */
const scanLogsParallelFixed = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  chunkSize: number,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  const windows: Array<{ start: number; end: number }> = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    windows.push({ start, end: Math.min(start + chunkSize - 1, toBlock) });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[][] = new Array(windows.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: Math.min(FREE_TIER_CONCURRENCY, windows.length) }, async () => {
      while (next < windows.length) {
        const index = next++;
        const { start, end } = windows[index];
        results[index] = await getLogsRange(provider, address, start, end);
      }
    }),
  );

  return results.flat();
};

/**
 * Forward eth_getLogs over a known block range. Starts near paid Infura caps, shrinks on
 * range/result-size errors (snapping to 10 on Free-tier), and grows through empty stretches.
 * Once Free-tier has capped the window, remaining blocks are fetched in parallel.
 * @param {Provider | ethersV6.Provider} provider - Infura ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Inclusive start block
 * @param {number} toBlock - Inclusive end block
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} - Logs oldest → newest
 */
export const scanLogsForward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  if (toBlock < fromBlock) return [];

  const state: AdaptiveScanState = {
    chunkSize: Math.min(INITIAL_CHUNK_SIZE, MAX_CHUNK_SIZE),
    maxChunkSize: MAX_CHUNK_SIZE,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = [];
  let cursor = fromBlock;
  let emptyStreak = 0;

  while (cursor <= toBlock) {
    // Free-tier path: finish the remaining range with parallel fixed windows.
    if (state.maxChunkSize <= FREE_TIER_MAX_CHUNK_SIZE) {
      const remaining = await scanLogsParallelFixed(
        provider,
        address,
        cursor,
        toBlock,
        state.maxChunkSize,
      );
      logs.push(...remaining);
      break;
    }

    const chunkEnd = Math.min(cursor + state.chunkSize - 1, toBlock);
    try {
      const chunkLogs = await getLogsRange(provider, address, cursor, chunkEnd);
      logs.push(...chunkLogs);
      emptyStreak = chunkLogs.length === 0 ? maybeGrowAfterEmpty(state, emptyStreak + 1) : 0;
      cursor = chunkEnd + 1;
    } catch (err) {
      const message = errorMessage(err);
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
        shrinkForRangeLimit(state, message);
        continue;
      }
      throw err;
    }
  }

  return logs;
};

/**
 * Infura-only backward eth_getLogs scanner. Starts near paid Infura caps, shrinks toward 1
 * on range/result-size limits (Free-tier snaps max to 10), stops at toBlockFloor or isMintLog.
 * @param {Provider | ethersV6.Provider} provider - Infura ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} - Logs oldest → newest
 */
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
    chunkSize: Math.min(INITIAL_CHUNK_SIZE, MAX_CHUNK_SIZE),
    maxChunkSize: MAX_CHUNK_SIZE,
  };
  let cursor = fromBlock;
  let emptyStreak = 0;

  while (cursor >= toBlockFloor) {
    const chunkStart = Math.max(cursor - state.chunkSize + 1, toBlockFloor);
    try {
      const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor);
      if (isMintLog) {
        // Keep mint and everything after it in this chunk; drop any earlier logs.
        let mintIndex = -1;
        for (let i = chunkLogs.length - 1; i >= 0; i--) {
          if (isMintLog(chunkLogs[i])) {
            mintIndex = i;
            break;
          }
        }
        if (mintIndex >= 0) {
          chunkGroups.push(chunkLogs.slice(mintIndex));
          break;
        }
      }
      chunkGroups.push(chunkLogs);
      emptyStreak = chunkLogs.length === 0 ? maybeGrowAfterEmpty(state, emptyStreak + 1) : 0;
    } catch (err) {
      const message = errorMessage(err);
      // Shrink even when already at the Free-tier max (10) so dense windows can retry at 1..9.
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
        shrinkForRangeLimit(state, message);
        continue;
      }
      throw err;
    }

    if (chunkStart <= toBlockFloor) break;
    cursor = chunkStart - 1;
  }

  // Collected newest-first; reverse so the result is oldest → newest.
  return chunkGroups.reverse().flat();
};
