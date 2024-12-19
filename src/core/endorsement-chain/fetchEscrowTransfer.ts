import {
  TitleEscrow as TitleEscrowV4,
  TitleEscrow__factory as TitleEscrowFactoryV4,
} from '../../token-registry-v4/contracts';
import {
  TitleEscrow as TitleEscrowV5,
  TitleEscrow__factory as TitleEscrowFactoryV5,
} from '../../token-registry-v5/contracts';
import { providers } from 'ethers';
import {
  ParsedLog,
  TitleEscrowTransferEvent,
  TokenTransferEvent,
  TokenTransferEventType,
  TransferBaseEvent,
} from '../endorsement-chain/types';

export const fetchEscrowTransfersV4 = async (
  provider: providers.Provider,
  address: string,
): Promise<TitleEscrowTransferEvent[]> => {
  const titleEscrowContract = TitleEscrowFactoryV4.connect(address, provider);
  const holderChangeLogsDeferred = await fetchHolderTransfers(titleEscrowContract, provider);
  const ownerChangeLogsDeferred = await fetchOwnerTransfers(titleEscrowContract, provider);
  const [holderChangeLogs, ownerChangeLogs] = await Promise.all([
    holderChangeLogsDeferred,
    ownerChangeLogsDeferred,
  ]);
  return [...holderChangeLogs, ...ownerChangeLogs];
};

export const fetchEscrowTransfersV5 = async (
  provider: providers.Provider,
  address: string,
): Promise<TransferBaseEvent[]> => {
  const titleEscrowContract = TitleEscrowFactoryV5.connect(address, provider);
  const holderChangeLogsDeferred = await fetchAllTransfers(titleEscrowContract);
  return holderChangeLogsDeferred;
};

const getParsedLogs = (
  logs: providers.Log[],
  titleEscrow: TitleEscrowV4 | TitleEscrowV5,
): ParsedLog[] => {
  return logs.map((log) => {
    if (!log.blockNumber) throw new Error('Block number not present');
    return {
      ...log,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(titleEscrow.interface as any).parseLog(log),
    };
  });
};

/*
  Retrieve all events that emits BENEFICIARY_TRANSFER 
*/
const fetchOwnerTransfers = async (
  titleEscrowContract: TitleEscrowV4,
  provider: providers.Provider,
): Promise<TitleEscrowTransferEvent[]> => {
  const ownerChangeFilter = titleEscrowContract.filters.BeneficiaryTransfer(null, null);
  const ownerChangeLogs = await provider.getLogs({ ...ownerChangeFilter, fromBlock: 0 });

  const ownerChangeLogsParsed = getParsedLogs(ownerChangeLogs, titleEscrowContract);
  return ownerChangeLogsParsed.map((event) => ({
    type: 'TRANSFER_BENEFICIARY',
    owner: event.args.toBeneficiary,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    transactionIndex: event.transactionIndex,
  }));
};

/*
  Retrieve all events that emits HOLDER_TRANSFER 
*/
const fetchHolderTransfers = async (
  titleEscrowContract: TitleEscrowV4,
  provider: providers.Provider,
): Promise<TitleEscrowTransferEvent[]> => {
  const holderChangeFilter = titleEscrowContract.filters.HolderTransfer(null, null);
  const holderChangeLogs = await provider.getLogs({ ...holderChangeFilter, fromBlock: 0 });
  const holderChangeLogsParsed = getParsedLogs(holderChangeLogs, titleEscrowContract);
  return holderChangeLogsParsed.map((event) => ({
    type: 'TRANSFER_HOLDER',
    blockNumber: event.blockNumber,
    holder: event.args.toHolder,
    transactionHash: event.transactionHash,
    transactionIndex: event.transactionIndex,
  }));
};

/*
  Retrieve all V5 events 
*/
const fetchAllTransfers = async (
  titleEscrowContract: TitleEscrowV5,
): Promise<(TitleEscrowTransferEvent | TokenTransferEvent)[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFilters: any[] = [
    titleEscrowContract.filters.HolderTransfer,
    titleEscrowContract.filters.BeneficiaryTransfer,
    titleEscrowContract.filters.TokenReceived,
    titleEscrowContract.filters.ReturnToIssuer,
    // titleEscrowContract.filters.Nomination,
    titleEscrowContract.filters.RejectTransferOwners,
    titleEscrowContract.filters.RejectTransferBeneficiary,
    titleEscrowContract.filters.RejectTransferHolder,
    titleEscrowContract.filters.Shred,
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLogs: any = await Promise.all(
    allFilters.map(async (filter) => {
      const logs = await titleEscrowContract.queryFilter(filter, 0, 'latest');
      return logs;
    }),
  );

  const holderChangeLogsParsed = getParsedLogs(allLogs.flat(), titleEscrowContract);

  const tokenRegistryAddress: string = await titleEscrowContract.registry();

  return holderChangeLogsParsed
    .map((event) => {
      if (event?.name === 'HolderTransfer') {
        return {
          type: 'TRANSFER_HOLDER',
          blockNumber: event.blockNumber,
          holder: event.args.toHolder,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'BeneficiaryTransfer') {
        return {
          type: 'TRANSFER_BENEFICIARY',
          owner: event.args.toBeneficiary,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'TokenReceived') {
        // MINT / RESTORE
        const type = identifyTokenReceivedType(event);
        return {
          type,
          from:
            type === 'INITIAL'
              ? '0x0000000000000000000000000000000000000000'
              : tokenRegistryAddress,
          to: titleEscrowContract.address,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TokenTransferEvent;
      } else if (event?.name === 'ReturnToIssuer') {
        return {
          type: 'RETURNED_TO_ISSUER',
          blockNumber: event.blockNumber,
          from: titleEscrowContract.address,
          to: tokenRegistryAddress,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TokenTransferEvent;
      } else if (event?.name === 'Nomination') {
        return undefined;
      } else if (event?.name === 'RejectTransferOwners') {
        return {
          type: 'REJECT_TRANSFER_OWNERS',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'RejectTransferBeneficiary') {
        return {
          type: 'REJECT_TRANSFER_BENEFICIARY',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'RejectTransferHolder') {
        return {
          type: 'REJECT_TRANSFER_HOLDER',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'Shred') {
        return {
          type: 'RETURN_TO_ISSUER_ACCEPTED',
          blockNumber: event.blockNumber,
          from: tokenRegistryAddress,
          to: '0x00000000000000000000000000000000000dead',
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TokenTransferEvent;
      }

      return undefined;
    })
    .filter((event) => event !== undefined) as (TitleEscrowTransferEvent | TokenTransferEvent)[];
};

function identifyTokenReceivedType(event: ParsedLog): TokenTransferEventType {
  if (event.args.isMinting) {
    return 'INITIAL';
  } else {
    return 'RETURN_TO_ISSUER_REJECTED';
  }
}
