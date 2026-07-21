import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import { obligationRegistryContracts } from '../../obligation-registry';
import { getEthersContractFromProvider } from '../../utils/ethers';
import {
  getLogsInBlockRange,
  isEthGetLogsRangeError,
  ObligationEndorsementChainRpcOptions,
  resolveObligationEndorsementChainRpcOptions,
} from './helpers';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const normalizeTokenId = (tokenId: string): string | bigint => {
  try {
    return BigInt(tokenId);
  } catch {
    return tokenId;
  }
};

/**
 * Resolve filter topics for ethers v5 (sync `.topics`) and v6 (deferred filter).
 * @param {unknown} filter - Event filter from an ethers v5 or v6 contract.
 * @returns {Promise<unknown[] | undefined>} Resolved topic array, if available.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolveFilterTopics = async (filter: any): Promise<any[] | undefined> => {
  if (filter?.topics) return filter.topics as unknown[];
  try {
    const resolved = await filter;
    return resolved?.topics as unknown[] | undefined;
  } catch {
    return undefined;
  }
};

/**
 * Topic-filtered mint Transfer on the obligation registry (from = 0x0, tokenId indexed).
 * Starts from registry `genesis()` when available. Prefer escrow address scan when known
 * (Alchemy Free-friendly). Falls back to registry Transfer, factory created, then
 * StatusInitialized topics.
 * @param {Provider | ethersV6.Provider} provider - Ethereum JSON-RPC provider.
 * @param {string} obligationRegistryAddress - Obligation registry contract address.
 * @param {string} tokenId - Token ID to locate the mint block for.
 * @param {string} [titleEscrowAddress] - Known escrow address for address-only log scan.
 * @param {ObligationEndorsementChainRpcOptions} [rpcOptions] - RPC chunking and concurrency options.
 * @returns {Promise<number>} Block number of the mint (or earliest genesis) event.
 */
export const findObligationMintBlock = async (
  provider: Provider | ethersV6.Provider,
  obligationRegistryAddress: string,
  tokenId: string,
  titleEscrowAddress?: string,
  rpcOptions?: ObligationEndorsementChainRpcOptions,
): Promise<number> => {
  const { maxBlockRange, rpcConcurrency } = resolveObligationEndorsementChainRpcOptions(rpcOptions);
  const Contract = getEthersContractFromProvider(provider);
  const token = new Contract(
    obligationRegistryAddress,
    obligationRegistryContracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );

  const latest = await provider.getBlockNumber();
  let genesisBlock = 0;
  try {
    genesisBlock = Number(await token.genesis());
  } catch {
    genesisBlock = 0;
  }
  const fromBlock = Number.isFinite(genesisBlock) ? Math.max(0, genesisBlock) : 0;
  const tokenIdValue = normalizeTokenId(tokenId);

  // Prefer escrow address scan when known — no topics, stops at mint/status-init.
  if (titleEscrowAddress) {
    const escrow = new Contract(
      titleEscrowAddress,
      obligationRegistryContracts.ObligationEscrow__factory.abi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider as any,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isGenesisChunk = (chunkLogs: any[]) =>
      chunkLogs.some((log) => {
        try {
          const decoded = escrow.interface.parseLog(log);
          if (!decoded) return false;
          if (decoded.name === 'StatusInitialized') return true;
          if (decoded.name === 'TokenReceived' && decoded.args?.isMinting) return true;
          return false;
        } catch {
          return false;
        }
      });

    const escrowLogs = await getLogsInBlockRange(
      provider,
      { address: titleEscrowAddress },
      fromBlock,
      latest,
      maxBlockRange,
      { shouldStop: isGenesisChunk, rpcConcurrency },
    );
    if (escrowLogs.length > 0) {
      return Math.min(...escrowLogs.map((l: { blockNumber: number }) => l.blockNumber));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mintFilter: any = token.filters.Transfer(ZERO_ADDRESS, null, tokenIdValue);
  try {
    const logs = await token.queryFilter(mintFilter, fromBlock, latest);
    if (logs.length > 0) {
      return Math.min(...logs.map((l: { blockNumber: number }) => l.blockNumber));
    }
  } catch (err) {
    if (!isEthGetLogsRangeError(err)) throw err;
    const topics = await resolveFilterTopics(mintFilter);
    const logs = await getLogsInBlockRange(
      provider,
      {
        address: obligationRegistryAddress,
        topics,
      },
      fromBlock,
      latest,
      maxBlockRange,
      { newestFirstUntilHit: true, rpcConcurrency },
    );
    if (logs.length > 0) {
      return Math.min(...logs.map((l: { blockNumber: number }) => l.blockNumber));
    }
  }

  // Fallback: factory ObligationEscrowCreated(..., tokenId)
  const factoryAddress: string = await token.titleEscrowFactory();
  const factory = new Contract(
    factoryAddress,
    obligationRegistryContracts.ObligationEscrowFactory__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createdFilter: any = factory.filters.ObligationEscrowCreated(
    null,
    obligationRegistryAddress,
    tokenIdValue,
  );

  try {
    const created = await factory.queryFilter(createdFilter, fromBlock, latest);
    if (created.length > 0) {
      return Math.min(...created.map((l: { blockNumber: number }) => l.blockNumber));
    }
  } catch (err) {
    if (!isEthGetLogsRangeError(err)) throw err;
    const topics = await resolveFilterTopics(createdFilter);
    const logs = await getLogsInBlockRange(
      provider,
      {
        address: factoryAddress,
        topics,
      },
      fromBlock,
      latest,
      maxBlockRange,
      { newestFirstUntilHit: true, rpcConcurrency },
    );
    if (logs.length > 0) {
      return Math.min(...logs.map((l: { blockNumber: number }) => l.blockNumber));
    }
  }

  throw new Error('Unminted Title Escrow');
};
