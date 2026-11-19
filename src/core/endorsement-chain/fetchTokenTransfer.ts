import { ethers } from 'ethers';
import { LogDescription } from 'ethers/lib/utils';
import { ethers as ethersV6 } from 'ethersV6';
import { TradeTrustToken__factory } from '../../token-registry-v4/contracts';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { sortLogChain } from '../endorsement-chain/helpers';
import { TokenTransferEvent, TokenTransferEventType, TypedEvent } from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';
import { resolveContractCreationBlock } from './fetchEscrowTransfer';
import { getLatestBlockWithRetry, getLogsAdaptive, resolveFilterTopics } from './fetchLogsChunked';

export const fetchTokenTransfers = async (
  provider: Provider | ethersV6.Provider,
  tokenRegistryAddress: string,
  tokenId: string,
  /** Inclusive upper bound shared with the escrow scan. Omitted → current chain tip. */
  toBlock?: number,
): Promise<TokenTransferEvent[]> => {
  const Contract = getEthersContractFromProvider(provider);
  const tokenRegistryContract = new Contract(
    tokenRegistryAddress,
    TradeTrustToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );

  // Fetch transfer logs from token registry
  const logs = await fetchLogs(
    provider,
    tokenRegistryContract,
    tokenRegistryAddress,
    tokenId,
    toBlock,
  );
  const parsedLogs = parseLogs(logs, tokenRegistryContract);

  const reformattedLogs = parsedLogs.map((event) =>
    formatTokenTransferEvent(event, tokenRegistryAddress),
  );

  sortLogChain(reformattedLogs);
  return reformattedLogs;
};

/**
 * Transfer logs for one token, topic-scoped, from block 0 through `toBlock`.
 * The full span is tried once. If that request is rejected, chunked windows
 * start at the token registry creation block instead of genesis.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethersV6.Contract | ethers.Contract} tokenRegistry - Token Registry contract
 * @param {string} tokenRegistryAddress - Token Registry contract address
 * @param {string} tokenId - Token ID
 * @param {number} [toBlock] - Inclusive upper bound; current chain tip when omitted
 * @returns {Promise<Array<{ blockNumber?: number; transactionHash?: string }>>} Transfer logs
 */
async function fetchLogs(
  provider: Provider | ethersV6.Provider,
  tokenRegistry: ethersV6.Contract | ethers.Contract,
  tokenRegistryAddress: string,
  tokenId: string,
  toBlock?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transferLogFilter: any = tokenRegistry.filters.Transfer(null, null, tokenId);
  const topics = await resolveFilterTopics(transferLogFilter);
  const latestBlock = toBlock ?? (await getLatestBlockWithRetry(provider));
  const logs = await getLogsAdaptive(provider, tokenRegistryAddress, 0, latestBlock, topics, () =>
    resolveContractCreationBlock(provider, tokenRegistryAddress, latestBlock),
  );
  if (logs.length === 0) {
    throw new Error('Unminted Title Escrow');
  }
  return logs;
}

const parseLogs = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[],
  tokenRegistry: ethers.Contract | ethersV6.Contract,
): (TypedEvent & LogDescription)[] => {
  return logs.map((log) => {
    if (!log.blockNumber) throw new Error('Block number not present');
    if (!log.transactionHash) throw new Error('Transaction hash not present');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (tokenRegistry.interface as any).parseLog(log);
    if (!parsed?.args) throw new Error(`Transfer log malformed: ${log}`);
    return {
      ...log,
      ...parsed,
    } as TypedEvent & LogDescription;
  });
};

const formatTokenTransferEvent = (
  event: TypedEvent & LogDescription,
  tokenRegistryAddress: string,
): TokenTransferEvent => {
  const type = identifyTokenTransferEvent(event, tokenRegistryAddress);
  return {
    type,
    from: event.args.from as string,
    to: event.args.to as string,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    transactionIndex: event.transactionIndex,
  };
};

/*
  Used to distinguish the nature of the transfer events
  Current interactions between Title Escrow and Token Transfer are:
  SURRENDER, SURRENDER_REJECTED, SURRENDER_ACCEPTED (SHRED), INITIAL (Minting)
*/
const identifyTokenTransferEvent = (
  log: TypedEvent | LogDescription,
  tokenRegistryAddress: string,
): TokenTransferEventType => {
  const InitialAddress = '0x0000000000000000000000000000000000000000';
  const BurnAddress = '0x000000000000000000000000000000000000dEaD';
  const { from, to } = log.args as { from: string; to: string };

  // Title Escrow surrender transfers document owner back to token registry
  if (to === tokenRegistryAddress) return 'SURRENDERED';
  // Title Escrow shredded transfers document owner to 0xdead (ETH Burner Address)
  if (to === BurnAddress) return 'SURRENDER_ACCEPTED';
  // Title Escrow reject surrender transfers document owner back to owner
  if (from === tokenRegistryAddress) return 'SURRENDER_REJECTED';
  // Title Escrow mint from thin air - 0x0 (Burn Address)
  if (from === InitialAddress) return 'INITIAL';

  throw new Error('Unidentified transfer event');
};
