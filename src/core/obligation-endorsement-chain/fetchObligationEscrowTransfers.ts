import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import { obligationRegistryContracts } from '../../obligation-registry';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { findObligationMintBlock } from './findObligationMintBlock';
import {
  getLogsInBlockRange,
  ObligationEndorsementChainRpcOptions,
  resolveObligationEndorsementChainRpcOptions,
} from './helpers';
import {
  ObligationParsedLog,
  ObligationStatusEvent,
  ObligationStatusEventType,
  ObligationTitleEscrowTransferEvent,
  ObligationTokenTransferEvent,
  ObligationTokenTransferEventType,
  ObligationTransferBaseEvent,
} from './types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type StatusLog = {
  transactionHash: string;
  blockNumber: number;
  transactionIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any;
};

const STATUS_EVENT_TYPES: Record<string, ObligationStatusEventType> = {
  StatusInitialized: 'STATUS_INITIALIZED',
  StatusAccepted: 'STATUS_ACCEPTED',
  StatusRejected: 'STATUS_REJECTED',
  StatusDischarged: 'STATUS_DISCHARGED',
};

const mapStatusLog = (log: StatusLog, type: ObligationStatusEventType): ObligationStatusEvent => {
  const args = log.args ?? {};
  const remark =
    args.remark !== undefined && args.remark !== null ? String(args.remark) : undefined;

  if (type === 'STATUS_INITIALIZED') {
    return {
      type,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      remark: remark || '',
    };
  }

  if (type === 'STATUS_DISCHARGED') {
    return {
      type,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      transactionIndex: log.transactionIndex,
      owner: args.beneficiary ?? '',
      holder: args.beneficiary ?? '',
      remark: remark || '',
    };
  }

  return {
    type,
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    transactionIndex: log.transactionIndex,
    holder: args.holder ?? '',
    owner: args.holder ?? '',
    remark: remark || '',
  };
};

const getParsedLogs = (
  logs: ethers.providers.Log[] | ethersV6.Log[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  escrow: any,
): ObligationParsedLog[] => {
  const parsed: ObligationParsedLog[] = [];
  for (const log of logs) {
    if (!log.blockNumber) throw new Error('Block number not present');
    try {
      const decoded = escrow.interface.parseLog(log);
      if (!decoded) continue;
      parsed.push({
        ...log,
        ...decoded,
      });
    } catch {
      // Ignore logs that do not match ObligationEscrow ABI.
    }
  }
  return parsed;
};

function identifyTokenReceivedType(event: ObligationParsedLog): ObligationTokenTransferEventType {
  if (event.args.isMinting) {
    return 'INITIAL';
  }
  return 'RETURN_TO_ISSUER_REJECTED';
}

function tokenIdMatches(args: { tokenId?: unknown }, tokenId: string): boolean {
  if (args.tokenId === undefined || args.tokenId === null) return true;
  try {
    return BigInt(String(args.tokenId)).toString() === BigInt(tokenId).toString();
  } catch {
    return String(args.tokenId) === tokenId;
  }
}

function mapTransferEvent(
  event: ObligationParsedLog,
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
): ObligationTransferBaseEvent | undefined {
  if (event?.name === 'HolderTransfer') {
    return {
      type: 'TRANSFER_HOLDER',
      blockNumber: event.blockNumber,
      holder: event.args.toHolder,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTitleEscrowTransferEvent;
  }
  if (event?.name === 'BeneficiaryTransfer') {
    return {
      type: 'TRANSFER_BENEFICIARY',
      owner: event.args.toBeneficiary,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTitleEscrowTransferEvent;
  }
  if (event?.name === 'TokenReceived') {
    const type = identifyTokenReceivedType(event);
    return {
      type,
      from: type === 'INITIAL' ? ZERO_ADDRESS : tokenRegistryAddress,
      to: titleEscrowAddress,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTokenTransferEvent;
  }
  if (event?.name === 'ReturnToIssuer') {
    return {
      type: 'RETURNED_TO_ISSUER',
      blockNumber: event.blockNumber,
      from: titleEscrowAddress,
      to: tokenRegistryAddress,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTokenTransferEvent;
  }
  if (event?.name === 'RejectTransferOwners') {
    return {
      type: 'REJECT_TRANSFER_OWNERS',
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTitleEscrowTransferEvent;
  }
  if (event?.name === 'RejectTransferBeneficiary') {
    return {
      type: 'REJECT_TRANSFER_BENEFICIARY',
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTitleEscrowTransferEvent;
  }
  if (event?.name === 'RejectTransferHolder') {
    return {
      type: 'REJECT_TRANSFER_HOLDER',
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTitleEscrowTransferEvent;
  }
  if (event?.name === 'Shred') {
    return {
      type: 'RETURN_TO_ISSUER_ACCEPTED',
      blockNumber: event.blockNumber,
      from: tokenRegistryAddress,
      to: '0x00000000000000000000000000000000000dead',
      transactionHash: event.transactionHash,
      transactionIndex: event.transactionIndex,
      remark: event.args?.remark,
    } as ObligationTokenTransferEvent;
  }
  return undefined;
}

function classifyEscrowLogs(
  parsedLogs: ObligationParsedLog[],
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
  tokenId: string,
): { transfers: ObligationTransferBaseEvent[]; statusEvents: ObligationStatusEvent[] } {
  const transfers: ObligationTransferBaseEvent[] = [];
  const statusEvents: ObligationStatusEvent[] = [];

  for (const event of parsedLogs) {
    const statusType = STATUS_EVENT_TYPES[event.name];
    if (statusType) {
      if (!tokenIdMatches(event.args as { tokenId?: unknown }, tokenId)) continue;
      statusEvents.push(
        mapStatusLog(
          {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            args: event.args,
          },
          statusType,
        ),
      );
      continue;
    }

    const transfer = mapTransferEvent(event, titleEscrowAddress, tokenRegistryAddress);
    if (transfer) transfers.push(transfer);
  }

  return { transfers, statusEvents };
}

/**
 * Obligation endorsement events: mint-block on the registry, then escrow logs in
 * [mintBlock, latest] only (chunked only if Free-tier range limits apply).
 * @param {Provider | ethersV6.Provider} provider - Ethereum JSON-RPC provider.
 * @param {string} obligationRegistryAddress - Obligation registry contract address.
 * @param {string} tokenId - Token ID to fetch events for.
 * @param {string} titleEscrowAddress - Obligation escrow contract address.
 * @param {ObligationEndorsementChainRpcOptions} [rpcOptions] - RPC chunking and concurrency options.
 * @returns {Promise<{ transfers: ObligationTransferBaseEvent[]; statusEvents: ObligationStatusEvent[] }>} Parsed transfer and status events.
 */
export const fetchObligationEscrowTransfers = async (
  provider: Provider | ethersV6.Provider,
  obligationRegistryAddress: string,
  tokenId: string,
  titleEscrowAddress: string,
  rpcOptions?: ObligationEndorsementChainRpcOptions,
): Promise<{
  transfers: ObligationTransferBaseEvent[];
  statusEvents: ObligationStatusEvent[];
}> => {
  const { maxBlockRange, rpcConcurrency } = resolveObligationEndorsementChainRpcOptions(rpcOptions);
  const mintBlock = await findObligationMintBlock(
    provider,
    obligationRegistryAddress,
    tokenId,
    titleEscrowAddress,
    rpcOptions,
  );
  const toBlock = await provider.getBlockNumber();

  const Contract = getEthersContractFromProvider(provider);
  const escrow = new Contract(
    titleEscrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );

  const rawLogs = await getLogsInBlockRange(
    provider,
    { address: titleEscrowAddress },
    mintBlock,
    toBlock,
    maxBlockRange,
    { rpcConcurrency },
  );
  const parsedLogs = getParsedLogs(rawLogs, escrow);

  return classifyEscrowLogs(parsedLogs, titleEscrowAddress, obligationRegistryAddress, tokenId);
};
