import { LogDescription } from 'ethers/lib/utils';
import { sortLogChain } from '../endorsement-chain/helpers';
import { TokenTransferEvent, TokenTransferEventType, TypedEvent } from '../endorsement-chain/types';
import { TradeTrustToken } from '../../token-registry-v4/contracts';

import type { Event } from 'ethers';

export const fetchTokenTransfers = async (
  tokenRegistry: TradeTrustToken,
  tokenId: string,
): Promise<TokenTransferEvent[]> => {
  // Fetch transfer logs from token registry
  const logs = await fetchLogs(tokenRegistry, tokenId);
  const parsedLogs = parseLogs(logs, tokenRegistry);
  const tokenRegistryAddress = tokenRegistry.address;

  const reformattedLogs = parsedLogs.map((event) =>
    formatTokenTransferEvent(event, tokenRegistryAddress),
  );

  sortLogChain(reformattedLogs);
  return reformattedLogs;
};

const fetchLogs = async (tokenRegistry: TradeTrustToken, tokenId: string): Promise<Event[]> => {
  const transferLogFilter = tokenRegistry.filters.Transfer(null, null, tokenId);
  const logs = await tokenRegistry.queryFilter(transferLogFilter, 0);

  if (logs.length === 0) {
    throw new Error('Unminted Title Escrow');
  }
  return logs;
};

const parseLogs = (
  logs: Event[],
  tokenRegistry: TradeTrustToken,
): (TypedEvent & LogDescription)[] => {
  return logs.map((log) => {
    if (!log.args) throw new Error(`Transfer log malformed: ${log}`);
    if (!log.blockNumber) throw new Error('Block number not present');
    if (!log.transactionHash) throw new Error('Transaction hash not present');
    return {
      ...log,
      ...tokenRegistry.interface.parseLog(log),
    };
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
