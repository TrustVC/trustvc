import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// Infura Free-tier eth_getLogs: max 10-block window (-32600).
// Example: "Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block difference..."
const INFURA_FREE_TIER_RANGE_RE =
  /free tier plan|10\s*block difference|block range should work:\s*\[0x0,\s*0x9\]|-32600/i;

// Also shrink for dense windows (result-count / response-size caps) inside ≤10 blocks.
const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|range.*(too large|exceed)|(too large|exceed).*range|block range|10\s*block|block difference|free tier plan|10,?000 results|response size|log response size|-32600|-32012/i;

const INFURA_HOST_RE = /infura\.io/i;

// Free-tier max window is 10; min 1 lets dense 10-block ranges shrink instead of failing.
const INFURA_MAX_CHUNK_SIZE = 10;
const MIN_CHUNK_SIZE = 1;

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
}

function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  // Free-tier message: never request more than 10 blocks again.
  if (INFURA_FREE_TIER_RANGE_RE.test(message)) {
    state.chunkSize = Math.min(state.chunkSize, INFURA_MAX_CHUNK_SIZE);
  }
  state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
}

/**
 * Infura-only backward eth_getLogs scanner. Starts at the Free-tier max window (10),
 * shrinks toward 1 on range/result-size limits, stops at toBlockFloor or isMintLog.
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
  const state: AdaptiveScanState = { chunkSize: INFURA_MAX_CHUNK_SIZE };
  let cursor = fromBlock;

  while (cursor >= toBlockFloor) {
    const chunkStart = Math.max(cursor - state.chunkSize + 1, toBlockFloor);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chunkLogs: any[] = await provider.getLogs({
        address,
        fromBlock: chunkStart,
        toBlock: cursor,
      });
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
