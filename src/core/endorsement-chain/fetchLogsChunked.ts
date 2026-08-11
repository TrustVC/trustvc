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
// Parallel Free-tier windows once the cap is ≤10 (no adaptive shrink mid-batch).
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMintIndex(logs: any[], isMintLog: (log: any) => boolean): number {
  // Prefer the earliest mint marker so logs after mint are kept and nothing before mint is dropped incorrectly when several mint-like logs share a chunk.
  for (let i = 0; i < logs.length; i++) {
    if (isMintLog(logs[i])) return i;
  }
  return -1;
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
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} - Logs oldest → newest
 */
const scanLogsBackwardParallel = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  chunkSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  let cursor = fromBlock;
  let windowSize = Math.max(Math.min(chunkSize, FREE_TIER_MAX_CHUNK_SIZE), MIN_CHUNK_SIZE);

  while (cursor >= toBlockFloor) {
    const windows: Array<{ start: number; end: number }> = [];
    let winCursor = cursor;
    for (let i = 0; i < FREE_TIER_CONCURRENCY && winCursor >= toBlockFloor; i++) {
      const start = Math.max(winCursor - windowSize + 1, toBlockFloor);
      windows.push({ start, end: winCursor });
      if (start <= toBlockFloor) break;
      winCursor = start - 1;
    }

    let results: Awaited<ReturnType<typeof getLogsRange>>[];
    try {
      results = await Promise.all(
        windows.map(({ start, end }) => getLogsRange(provider, address, start, end)),
      );
    } catch (err) {
      const message = errorMessage(err);
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && windowSize > MIN_CHUNK_SIZE) {
        windowSize = Math.max(Math.floor(windowSize / 4), MIN_CHUNK_SIZE);
        continue;
      }
      throw err;
    }

    let foundMint = false;
    for (let i = 0; i < results.length; i++) {
      const chunkLogs = results[i];
      if (isMintLog) {
        const mintIndex = findMintIndex(chunkLogs, isMintLog);
        if (mintIndex >= 0) {
          chunkGroups.push(chunkLogs.slice(mintIndex));
          foundMint = true;
          break;
        }
      }
      chunkGroups.push(chunkLogs);
    }

    if (foundMint) break;

    const oldest = windows[windows.length - 1];
    if (oldest.start <= toBlockFloor) break;
    cursor = oldest.start - 1;
  }

  return chunkGroups.reverse().flat();
};

/**
 * Infura-only backward eth_getLogs scanner. Starts near paid Infura caps, shrinks on
 * range/result-size limits (Free-tier snaps max to 10), then finishes with parallel
 * Free-tier windows. Stops at toBlockFloor or isMintLog.
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
  // Paid-tier chunks collected newest-first while walking backward.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newerChunkGroups: any[][] = [];
  const state: AdaptiveScanState = {
    chunkSize: Math.min(INITIAL_CHUNK_SIZE, MAX_CHUNK_SIZE),
    maxChunkSize: MAX_CHUNK_SIZE,
  };
  let cursor = fromBlock;

  while (cursor >= toBlockFloor) {
    // Free-tier: finish remaining (older) range with parallel fixed windows.
    if (state.maxChunkSize <= FREE_TIER_MAX_CHUNK_SIZE) {
      const olderLogs = await scanLogsBackwardParallel(
        provider,
        address,
        cursor,
        toBlockFloor,
        state.chunkSize,
        isMintLog,
      );
      return [...olderLogs, ...newerChunkGroups.reverse().flat()];
    }

    const chunkStart = Math.max(cursor - state.chunkSize + 1, toBlockFloor);
    try {
      const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor);
      if (isMintLog) {
        const mintIndex = findMintIndex(chunkLogs, isMintLog);
        if (mintIndex >= 0) {
          newerChunkGroups.push(chunkLogs.slice(mintIndex));
          return newerChunkGroups.reverse().flat();
        }
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

    if (chunkStart <= toBlockFloor) break;
    cursor = chunkStart - 1;
  }

  return newerChunkGroups.reverse().flat();
};
