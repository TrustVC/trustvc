import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// Infura Free-tier eth_getLogs: max 10-block window (-32600).
// Example: "Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block difference..."
const INFURA_FREE_TIER_RANGE_RE =
  /free tier plan|10\s*block difference|block range should work:\s*\[0x0,\s*0x9\]|-32600/i;

const INFURA_HOST_RE = /infura\.io/i;

// Infura Free allows at most 10 blocks per eth_getLogs.
const INFURA_CHUNK_SIZE = 10;

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

/**
 * Infura-only backward eth_getLogs scanner using a fixed 10-block window (Free-tier max),
 * walking backward until toBlockFloor or isMintLog matches.
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
  let cursor = fromBlock;
  const chunkSize = INFURA_CHUNK_SIZE;

  while (cursor >= toBlockFloor) {
    const chunkStart = Math.max(cursor - chunkSize + 1, toBlockFloor);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chunkLogs: any[] = await provider.getLogs({
        address,
        fromBlock: chunkStart,
        toBlock: cursor,
      });
      chunkGroups.push(chunkLogs);
      if (isMintLog && chunkLogs.some(isMintLog)) break;
    } catch (err) {
      const message = errorMessage(err);
      if (INFURA_FREE_TIER_RANGE_RE.test(message)) {
        throw new Error(
          `Infura Free-tier eth_getLogs rejects this block range (max ${INFURA_CHUNK_SIZE} blocks). ${message}`,
        );
      }
      throw err;
    }

    if (chunkStart <= toBlockFloor) break;
    cursor = chunkStart - 1;
  }

  // Collected newest-first; reverse so the result is oldest → newest.
  return chunkGroups.reverse().flat();
};
