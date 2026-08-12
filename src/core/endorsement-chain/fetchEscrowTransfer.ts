import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import {
  TitleEscrow__factory as TitleEscrowFactoryV4,
  TitleEscrow as TitleEscrowV4,
} from '../../token-registry-v4/contracts';
import {
  TitleEscrow__factory as TitleEscrowFactoryV5,
  TitleEscrow as TitleEscrowV5,
  ObligationEscrow__factory,
} from '../../token-registry-v5/contracts';
import { supportInterfaceIds as supportInterfaceIdsV5 } from '../../token-registry-v5/supportInterfaceIds';
import { DEFAULT_MAX_BLOCKS_TO_SCAN } from '../../constants';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { isLogsRetryableError, scanLogsBackward } from './fetchLogsChunked';
import {
  ParsedLog,
  TitleEscrowTransferEvent,
  TokenTransferEvent,
  TokenTransferEventType,
  TransferBaseEvent,
} from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';

export const fetchEscrowTransfersV4 = async (
  provider: Provider | ethersV6.Provider,
  address: string,
): Promise<TitleEscrowTransferEvent[]> => {
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowContract = new Contract(
    address,
    TitleEscrowFactoryV4.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  ) as TitleEscrowV4;

  const holderChangeLogsDeferred = fetchHolderTransfers(titleEscrowContract);
  const ownerChangeLogsDeferred = fetchOwnerTransfers(titleEscrowContract);
  const [holderChangeLogs, ownerChangeLogs] = await Promise.all([
    holderChangeLogsDeferred,
    ownerChangeLogsDeferred,
  ]);
  return [...holderChangeLogs, ...ownerChangeLogs];
};

export const fetchEscrowTransfersV5 = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowAddress: string,
  tokenRegistryAddress?: string,
): Promise<TransferBaseEvent[]> => {
  const isObligationEscrow = await supportsObligationEscrow(titleEscrowAddress, provider);
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowContract = new Contract(
    titleEscrowAddress,
    isObligationEscrow ? ObligationEscrow__factory.abi : TitleEscrowFactoryV5.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  return fetchAllTransfers(
    provider,
    titleEscrowContract,
    titleEscrowAddress,
    tokenRegistryAddress,
    isObligationEscrow,
  );
};

const isContractInterfaceCallException = (err: unknown): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (err as any)?.code;
  // CALL_EXCEPTION: contract revert / missing ERC-165. BAD_DATA: ethers v6 empty/undecodable return.
  return code === 'CALL_EXCEPTION' || code === 'BAD_DATA';
};

const supportsObligationEscrow = async (
  contractAddress: string,
  provider: Provider | ethersV6.Provider,
): Promise<boolean> => {
  try {
    const abi = ['function supportsInterface(bytes4 interfaceId) external view returns (bool)'];
    const Contract = getEthersContractFromProvider(provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contract = new Contract(contractAddress, abi, provider as any);
    return await contract.supportsInterface(supportInterfaceIdsV5.ObligationEscrow);
  } catch (err) {
    if (isContractInterfaceCallException(err)) return false;
    throw err;
  }
};

const getParsedLogs = (
  logs: ethers.providers.Log[] | ethersV6.Log[],
  titleEscrow: TitleEscrowV4 | TitleEscrowV5,
): ParsedLog[] => {
  return logs.flatMap((log) => {
    if (!log.blockNumber) throw new Error('Block number not present');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = (titleEscrow.interface as any).parseLog(log);
      if (!parsed) return [];
      return [{ ...log, ...parsed }];
    } catch {
      return [];
    }
  });
};

const fetchOwnerTransfers = async (
  titleEscrowContract: TitleEscrowV4,
): Promise<TitleEscrowTransferEvent[]> => {
  const ownerChangeFilter = titleEscrowContract.filters.BeneficiaryTransfer(null, null);
  const ownerChangeLogs = await titleEscrowContract.queryFilter(ownerChangeFilter, 0, 'latest');

  const ownerChangeLogsParsed = getParsedLogs(ownerChangeLogs, titleEscrowContract);
  return ownerChangeLogsParsed.map((event) => ({
    type: 'TRANSFER_BENEFICIARY',
    owner: event.args.toBeneficiary,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    transactionIndex: event.transactionIndex,
  }));
};

const fetchHolderTransfers = async (
  titleEscrowContract: TitleEscrowV4,
): Promise<TitleEscrowTransferEvent[]> => {
  const holderChangeFilter = titleEscrowContract.filters.HolderTransfer(null, null);
  const holderChangeLogs = await titleEscrowContract.queryFilter(holderChangeFilter, 0, 'latest');
  const holderChangeLogsParsed = getParsedLogs(holderChangeLogs, titleEscrowContract);
  return holderChangeLogsParsed.map((event) => ({
    type: 'TRANSFER_HOLDER',
    blockNumber: event.blockNumber,
    holder: event.args.toHolder,
    transactionHash: event.transactionHash,
    transactionIndex: event.transactionIndex,
  }));
};

const fetchAllTransfers = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress?: string,
  tokenRegistryAddress?: string,
  includeObligationStatus = false,
): Promise<(TitleEscrowTransferEvent | TokenTransferEvent)[]> => {
  if (!titleEscrowAddress) {
    titleEscrowAddress = titleEscrowContract?.address ?? (await titleEscrowContract.getAddress());
  }

  if (!tokenRegistryAddress) {
    tokenRegistryAddress = await titleEscrowContract.registry();
  }

  const rawLogs = await fetchEscrowLogs(
    provider,
    titleEscrowContract,
    titleEscrowAddress,
    includeObligationStatus,
  );
  const holderChangeLogsParsed = getParsedLogs(
    rawLogs,
    titleEscrowContract as unknown as TitleEscrowV5,
  );

  return mapParsedLogsToEvents(holderChangeLogsParsed, titleEscrowAddress, tokenRegistryAddress);
};

const buildEscrowFilters = (
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  includeObligationStatus: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] => {
  const filters = [
    titleEscrowContract.filters.HolderTransfer,
    titleEscrowContract.filters.BeneficiaryTransfer,
    titleEscrowContract.filters.TokenReceived,
    titleEscrowContract.filters.ReturnToIssuer,
    titleEscrowContract.filters.RejectTransferOwners,
    titleEscrowContract.filters.RejectTransferBeneficiary,
    titleEscrowContract.filters.RejectTransferHolder,
    titleEscrowContract.filters.Shred,
  ];

  if (includeObligationStatus) {
    filters.push(
      titleEscrowContract.filters.StatusInitialized,
      titleEscrowContract.filters.StatusAccepted,
      titleEscrowContract.filters.StatusRejected,
      titleEscrowContract.filters.StatusDischarged,
    );
  }

  return filters;
};

const fetchLogsUnranged = async (
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  includeObligationStatus: boolean,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  const allFilters = buildEscrowFilters(titleEscrowContract, includeObligationStatus);
  const allLogs = await Promise.all(
    allFilters.map(async (filterFactory) => {
      const logs = await titleEscrowContract.queryFilter(filterFactory(), 0, 'latest');
      return logs;
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return allLogs.flat() as any;
};

const resolveEscrowScanFloor = async (
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  latestBlock: number,
): Promise<number> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mintBlock = Number(await (titleEscrowContract as any).mintBlock());
    if (Number.isFinite(mintBlock) && mintBlock > 0 && mintBlock <= latestBlock) {
      return mintBlock;
    }
  } catch {
    // Title Escrow V5 does not expose mintBlock.
  }
  return 0;
};

const fetchLogsChunked = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  const latestBlock = await provider.getBlockNumber();
  const scanFloor = await resolveEscrowScanFloor(titleEscrowContract, latestBlock);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMintLog = (log: any) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = (titleEscrowContract.interface as any).parseLog(log);
      return parsed?.name === 'TokenReceived' && parsed.args.isMinting;
    } catch {
      return false;
    }
  };

  const maxBlocksToScan =
    scanFloor > 0
      ? Math.max(DEFAULT_MAX_BLOCKS_TO_SCAN, latestBlock - scanFloor)
      : DEFAULT_MAX_BLOCKS_TO_SCAN;

  const result = await scanLogsBackward(
    provider,
    titleEscrowAddress,
    latestBlock,
    scanFloor,
    isMintLog,
    maxBlocksToScan,
  );

  if (!result.foundMint && result.truncated) {
    throw new Error(
      'Unable to locate TokenReceived (mint) within the scan budget; refusing incomplete endorsement chain',
    );
  }
  if (!result.foundMint) {
    throw new Error(
      'Unable to locate TokenReceived (mint) before the escrow scan floor; refusing incomplete endorsement chain',
    );
  }

  return result.logs;
};

const fetchEscrowLogs = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
  includeObligationStatus: boolean,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  try {
    return await fetchLogsUnranged(titleEscrowContract, includeObligationStatus);
  } catch (err) {
    if (!isLogsRetryableError(err)) throw err;
    return fetchLogsChunked(provider, titleEscrowContract, titleEscrowAddress);
  }
};

const mapParsedLogsToEvents = (
  holderChangeLogsParsed: ParsedLog[],
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
): (TitleEscrowTransferEvent | TokenTransferEvent)[] => {
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
        const type = identifyTokenReceivedType(event);
        return {
          type,
          from:
            type === 'INITIAL'
              ? '0x0000000000000000000000000000000000000000'
              : tokenRegistryAddress,
          to: titleEscrowAddress,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TokenTransferEvent;
      } else if (event?.name === 'ReturnToIssuer') {
        return {
          type: 'RETURNED_TO_ISSUER',
          blockNumber: event.blockNumber,
          from: titleEscrowAddress,
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
      } else if (event?.name === 'StatusInitialized') {
        return {
          type: 'STATUS_INITIALIZED',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'StatusAccepted') {
        return {
          type: 'STATUS_ACCEPTED',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'StatusRejected') {
        return {
          type: 'STATUS_REJECTED',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      } else if (event?.name === 'StatusDischarged') {
        return {
          type: 'STATUS_DISCHARGED',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          remark: event.args?.remark,
        } as TitleEscrowTransferEvent;
      }

      return undefined;
    })
    .filter((event) => event !== undefined) as (TitleEscrowTransferEvent | TokenTransferEvent)[];
};

function identifyTokenReceivedType(event: ParsedLog): TokenTransferEventType {
  if (event.args.isMinting) {
    return 'INITIAL';
  }
  return 'RETURN_TO_ISSUER_REJECTED';
}
