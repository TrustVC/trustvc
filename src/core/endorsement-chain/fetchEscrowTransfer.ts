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
import {
  getLatestBlockWithRetry,
  isLogsRetryableError,
  resolveFilterTopics,
  scanForMintEvent,
  scanLogsBackward,
} from './fetchLogsChunked';
import {
  ParsedLog,
  TerminationReasonLabel,
  TitleEscrowTransferEvent,
  TokenTransferEvent,
  TokenTransferEventType,
  TransferBaseEvent,
} from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';

const TERMINATION_REASON_LABELS: TerminationReasonLabel[] = [
  'None',
  'ReturnToIssuer',
  'Rejected',
  'Discharged',
];

const toTerminationReasonLabel = (reason: unknown): TerminationReasonLabel | undefined => {
  const index = Number(reason);
  // Index 0 is TerminationReason.None — omit so shred rows don't expose a fake reason.
  if (!Number.isInteger(index) || index <= 0 || index >= TERMINATION_REASON_LABELS.length) {
    return undefined;
  }
  return TERMINATION_REASON_LABELS[index];
};

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

  const holderChangeLogsDeferred = fetchHolderTransfers(provider, titleEscrowContract, address);
  const ownerChangeLogsDeferred = fetchOwnerTransfers(provider, titleEscrowContract, address);
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
  includeObligationStatus?: boolean,
): Promise<TransferBaseEvent[]> => {
  const isObligationEscrow =
    includeObligationStatus ?? (await supportsObligationEscrow(titleEscrowAddress, provider));
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
  const code = (err as { code?: unknown } | null | undefined)?.code;
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

// Shared by fetchOwnerTransfers/fetchHolderTransfers: falls back to a chunked scan on a
// range/rate-limit error, filtered to this filter's own topics (never the unfiltered
// address — this contract emits other event types under the same ABI).
const queryEscrowFilterWithFallback = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: TitleEscrowV4,
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: any,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  try {
    // exiting function put under try/catch to handle rate limit errors
    return await titleEscrowContract.queryFilter(filter, 0, 'latest');
  } catch (err) {
    if (!isLogsRetryableError(err)) throw err;
    const latestBlock = await getLatestBlockWithRetry(provider);
    const scanFloor = await resolveContractCreationBlock(provider, address, latestBlock);
    const maxBlocksToScan = Math.max(DEFAULT_MAX_BLOCKS_TO_SCAN, latestBlock - scanFloor);
    const topics = await resolveFilterTopics(filter);
    const result = await scanLogsBackward(
      provider,
      address,
      latestBlock,
      scanFloor,
      undefined,
      maxBlocksToScan,
      topics,
    );
    return result.logs;
  }
};

const fetchOwnerTransfers = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: TitleEscrowV4,
  address: string,
): Promise<TitleEscrowTransferEvent[]> => {
  const ownerChangeFilter = titleEscrowContract.filters.BeneficiaryTransfer(null, null);
  const ownerChangeLogs = await queryEscrowFilterWithFallback(
    provider,
    titleEscrowContract,
    address,
    ownerChangeFilter,
  );

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
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: TitleEscrowV4,
  address: string,
): Promise<TitleEscrowTransferEvent[]> => {
  const holderChangeFilter = titleEscrowContract.filters.HolderTransfer(null, null);
  const holderChangeLogs = await queryEscrowFilterWithFallback(
    provider,
    titleEscrowContract,
    address,
    holderChangeFilter,
  );
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

const isNonEmptyCode = (code: unknown): boolean =>
  typeof code === 'string' && code !== '0x' && code.length > 2;

// Binary-search the first block where the escrow has code (Title Escrow V5 has no mintBlock).
// Exported so fetchTokenTransfer.ts can reuse the same scan-floor logic for the token registry.
export const resolveContractCreationBlock = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  latestBlock: number,
): Promise<number> => {
  try {
    const hasCodeAt = async (block: number): Promise<boolean> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return isNonEmptyCode(await (provider as any).getCode(address, block));
    };

    if (!(await hasCodeAt(latestBlock))) return 0;
    // Already present at genesis — cannot bound a useful floor.
    if (await hasCodeAt(0)) return 0;

    let low = 0;
    let high = latestBlock;
    while (low + 1 < high) {
      const mid = Math.floor((low + high) / 2);
      if (await hasCodeAt(mid)) high = mid;
      else low = mid;
    }
    return high;
  } catch {
    return 0;
  }
};

const resolveEscrowScanFloor = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
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

  const creationBlock = await resolveContractCreationBlock(
    provider,
    titleEscrowAddress,
    latestBlock,
  );
  if (creationBlock > 0 && creationBlock <= latestBlock) {
    return creationBlock;
  }
  return 0;
};

const fetchLogsChunked = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  const latestBlock = await getLatestBlockWithRetry(provider);
  const scanFloor = await resolveEscrowScanFloor(
    provider,
    titleEscrowContract,
    titleEscrowAddress,
    latestBlock,
  );
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

  return scanForMintEvent(provider, titleEscrowAddress, scanFloor, latestBlock, {
    isMintLog,
    notFoundInBudgetMessage:
      'Unable to locate TokenReceived (mint) within the scan budget; refusing incomplete endorsement chain',
    notFoundMessage:
      'Unable to locate TokenReceived (mint) before the escrow scan floor; refusing incomplete endorsement chain',
  });
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

const logMeta = (event: ParsedLog) => ({
  blockNumber: event.blockNumber,
  transactionHash: event.transactionHash,
  transactionIndex: event.transactionIndex,
  remark: event.args?.remark,
});

const mapTokenReceivedEvent = (
  event: ParsedLog,
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
): TokenTransferEvent => {
  const type = identifyTokenReceivedType(event);
  return {
    type,
    from: type === 'INITIAL' ? '0x0000000000000000000000000000000000000000' : tokenRegistryAddress,
    to: titleEscrowAddress,
    // TokenReceived carries beneficiary/holder — needed when merge prefers INITIAL.
    owner: event.args?.beneficiary,
    holder: event.args?.holder,
    ...logMeta(event),
  } as TokenTransferEvent;
};

const mapShredEvent = (event: ParsedLog, tokenRegistryAddress: string): TokenTransferEvent => {
  // New ABI: lastBeneficiary/lastHolder on Shred. Old ABI: leave unset (carry-forward fallback).
  const terminationReason = toTerminationReasonLabel(event.args?.reason);
  return {
    type: 'RETURN_TO_ISSUER_ACCEPTED',
    from: tokenRegistryAddress,
    to: '0x000000000000000000000000000000000000dead',
    owner: event.args?.lastBeneficiary as string | undefined,
    holder: event.args?.lastHolder as string | undefined,
    ...logMeta(event),
    ...(terminationReason ? { terminationReason } : {}),
  } as TokenTransferEvent;
};

const mapParsedLogToEvent = (
  event: ParsedLog,
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
): TitleEscrowTransferEvent | TokenTransferEvent | undefined => {
  switch (event?.name) {
    case 'HolderTransfer':
      return {
        type: 'TRANSFER_HOLDER',
        holder: event.args.toHolder,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'BeneficiaryTransfer':
      return {
        type: 'TRANSFER_BENEFICIARY',
        owner: event.args.toBeneficiary,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'TokenReceived':
      return mapTokenReceivedEvent(event, titleEscrowAddress, tokenRegistryAddress);
    case 'ReturnToIssuer':
      return {
        type: 'RETURNED_TO_ISSUER',
        from: titleEscrowAddress,
        to: tokenRegistryAddress,
        ...logMeta(event),
      } as TokenTransferEvent;
    case 'Nomination':
      return undefined;
    case 'RejectTransferOwners':
      return {
        type: 'REJECT_TRANSFER_OWNERS',
        owner: event.args?.toBeneficiary,
        holder: event.args?.toHolder,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'RejectTransferBeneficiary':
      return {
        type: 'REJECT_TRANSFER_BENEFICIARY',
        owner: event.args?.toBeneficiary,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'RejectTransferHolder':
      return {
        type: 'REJECT_TRANSFER_HOLDER',
        holder: event.args?.toHolder,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'Shred':
      return mapShredEvent(event, tokenRegistryAddress);
    case 'StatusInitialized':
      return { type: 'STATUS_INITIALIZED', ...logMeta(event) } as TitleEscrowTransferEvent;
    case 'StatusAccepted':
      return {
        type: 'STATUS_ACCEPTED',
        holder: event.args?.holder,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'StatusRejected':
      return {
        type: 'STATUS_REJECTED',
        holder: event.args?.holder,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    case 'StatusDischarged':
      return {
        type: 'STATUS_DISCHARGED',
        owner: event.args?.beneficiary,
        ...logMeta(event),
      } as TitleEscrowTransferEvent;
    default:
      return undefined;
  }
};

const mapParsedLogsToEvents = (
  holderChangeLogsParsed: ParsedLog[],
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
): (TitleEscrowTransferEvent | TokenTransferEvent)[] => {
  return holderChangeLogsParsed
    .map((event) => mapParsedLogToEvent(event, titleEscrowAddress, tokenRegistryAddress))
    .filter((event) => event !== undefined) as (TitleEscrowTransferEvent | TokenTransferEvent)[];
};

function identifyTokenReceivedType(event: ParsedLog): TokenTransferEventType {
  if (event.args.isMinting) {
    return 'INITIAL';
  }
  return 'RETURN_TO_ISSUER_REJECTED';
}
