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
import { INITIAL_CHUNK_SIZE } from '../../constants';
import { getEthersContractFromProvider } from '../../utils/ethers';
import {
  getLatestBlockWithRetry,
  isLogsRetryableError,
  probeLogsRange,
  scanForMintEvent,
  scanLogsBackward,
  scanLogsForward,
  warmProviderNetwork,
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
  /** Optional mint/creation floor (e.g. token INITIAL block) — avoids eth_getCode when known. */
  scanFloor = 0,
): Promise<TitleEscrowTransferEvent[]> => {
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowContract = new Contract(
    address,
    TitleEscrowFactoryV4.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  ) as TitleEscrowV4;

  await warmProviderNetwork(provider);
  const latestBlock = await getLatestBlockWithRetry(provider);
  let fromBlock = scanFloor > 0 && scanFloor <= latestBlock ? scanFloor : 0;

  // No token mint floor → resolve escrow creation so we never sequential-backward the whole chain.
  if (fromBlock === 0) {
    fromBlock = await resolveContractCreationBlock(provider, address, latestBlock);
  }

  const span = latestBlock - fromBlock;
  console.log(
    `[getLogs] v4-plan floor=${fromBlock} latest=${latestBlock} span=${span} (limit ${INITIAL_CHUNK_SIZE})`,
  );

  // Fits in one paid window — ranged filters, no probe/chunking.
  if (span <= INITIAL_CHUNK_SIZE) {
    const [holderChangeLogs, ownerChangeLogs] = await Promise.all([
      fetchHolderTransfers(titleEscrowContract, fromBlock, latestBlock),
      fetchOwnerTransfers(titleEscrowContract, fromBlock, latestBlock),
    ]);
    return [...holderChangeLogs, ...ownerChangeLogs];
  }

  // Large span: one probe. Enterprise → ranged filters; paid → one shared forward-parallel scan.
  try {
    await probeLogsRange(provider, address, fromBlock, latestBlock);
    console.log(`[getLogs] v4-path probe-ok → filters ${fromBlock}→${latestBlock}`);
    const [holderChangeLogs, ownerChangeLogs] = await Promise.all([
      fetchHolderTransfers(titleEscrowContract, fromBlock, latestBlock),
      fetchOwnerTransfers(titleEscrowContract, fromBlock, latestBlock),
    ]);
    return [...holderChangeLogs, ...ownerChangeLogs];
  } catch (err) {
    if (!isLogsRetryableError(err)) throw err;
    console.log(`[getLogs] v4-path probe failed → shared forward-chunk`);
  }

  // One address-wide parallel scan (not two topic scans) — owner+holder parsed from the same logs.
  const rawLogs =
    fromBlock > 0
      ? await scanLogsForward(provider, address, fromBlock, latestBlock, undefined, {
          assumePaidTier: true,
        })
      : (await scanLogsBackward(provider, address, latestBlock, 0)).logs;

  const parsed = getParsedLogs(rawLogs, titleEscrowContract);
  const ownerChangeLogs: TitleEscrowTransferEvent[] = [];
  const holderChangeLogs: TitleEscrowTransferEvent[] = [];
  for (const event of parsed) {
    if (event.name === 'BeneficiaryTransfer') {
      ownerChangeLogs.push({
        type: 'TRANSFER_BENEFICIARY',
        owner: event.args.toBeneficiary,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        transactionIndex: event.transactionIndex,
      });
    } else if (event.name === 'HolderTransfer') {
      holderChangeLogs.push({
        type: 'TRANSFER_HOLDER',
        blockNumber: event.blockNumber,
        holder: event.args.toHolder,
        transactionHash: event.transactionHash,
        transactionIndex: event.transactionIndex,
      });
    }
  }
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

const queryEscrowFilter = async (
  titleEscrowContract: TitleEscrowV4,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: any,
  fromBlock: number,
  latestBlock: number,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  return titleEscrowContract.queryFilter(filter, fromBlock, latestBlock);
};

const fetchOwnerTransfers = async (
  titleEscrowContract: TitleEscrowV4,
  fromBlock: number,
  latestBlock: number,
): Promise<TitleEscrowTransferEvent[]> => {
  const ownerChangeFilter = titleEscrowContract.filters.BeneficiaryTransfer(null, null);
  const ownerChangeLogs = await queryEscrowFilter(
    titleEscrowContract,
    ownerChangeFilter,
    fromBlock,
    latestBlock,
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
  titleEscrowContract: TitleEscrowV4,
  fromBlock: number,
  latestBlock: number,
): Promise<TitleEscrowTransferEvent[]> => {
  const holderChangeFilter = titleEscrowContract.filters.HolderTransfer(null, null);
  const holderChangeLogs = await queryEscrowFilter(
    titleEscrowContract,
    holderChangeFilter,
    fromBlock,
    latestBlock,
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

const fetchLogsInRange = async (
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  fromBlock: number,
  toBlock: number | 'latest',
  includeObligationStatus: boolean,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  const allFilters = buildEscrowFilters(titleEscrowContract, includeObligationStatus);
  const allLogs = await Promise.all(
    allFilters.map(async (filterFactory) => {
      return titleEscrowContract.queryFilter(filterFactory(), fromBlock, toBlock);
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return allLogs.flat() as any;
};

const isNonEmptyCode = (code: unknown): boolean =>
  typeof code === 'string' && code !== '0x' && code.length > 2;

/**
 * Binary-search first block where `address` has code (~log2(latest) eth_getCode calls).
 * Used only when mintBlock is unavailable — still far cheaper than scanning 0→latest in 10k windows.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address
 * @param {number} latestBlock - Latest block
 * @returns {Promise<number>} Creation block, or 0 if unknown
 */
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
    if (await hasCodeAt(0)) return 0;

    let low = 0;
    let high = latestBlock;
    while (low + 1 < high) {
      const mid = Math.floor((low + high) / 2);
      if (await hasCodeAt(mid)) high = mid;
      else low = mid;
    }
    console.log(`[getLogs] creation-floor via getCode: ${high} (binary search)`);
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
    // Obligation / some escrows expose mintBlock — one eth_call, no getCode.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mintBlock = Number(await (titleEscrowContract as any).mintBlock());
    if (Number.isFinite(mintBlock) && mintBlock > 0 && mintBlock <= latestBlock) {
      console.log(`[getLogs] floor via mintBlock: ${mintBlock}`);
      return mintBlock;
    }
  } catch {
    // Classic Title Escrow V5 / this Amoy escrow — mintBlock reverts.
  }

  // Without a floor, paid keys fall into sequential backward mint-hunt (concurrency unused).
  // ~20–25 getCode calls beat thousands of sequential eth_getLogs.
  const creationBlock = await resolveContractCreationBlock(
    provider,
    titleEscrowAddress,
    latestBlock,
  );
  if (creationBlock > 0 && creationBlock <= latestBlock) {
    return creationBlock;
  }
  console.log(`[getLogs] floor unknown → sequential backward mint scan`);
  return 0;
};

/**
 * Fetch escrow logs without burning a parallel 0→latest storm on paid 10k keys.
 * 1. Resolve mint/creation floor.
 * 2. If span fits one paid window → query all filters in that range.
 * 3. Else one full-span probe (enterprise) → all filters; on range error → chunk forward.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Title escrow contract
 * @param {string} titleEscrowAddress - Title escrow address
 * @param {boolean} includeObligationStatus - Include obligation status event filters
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} Escrow event logs
 */
const fetchEscrowLogs = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
  includeObligationStatus: boolean,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  await warmProviderNetwork(provider);
  const latestBlock = await getLatestBlockWithRetry(provider);
  const scanFloor = await resolveEscrowScanFloor(
    provider,
    titleEscrowContract,
    titleEscrowAddress,
    latestBlock,
  );
  const fromBlock = scanFloor > 0 ? scanFloor : 0;
  const span = latestBlock - fromBlock;

  // Temporary debug for endorsement-chain range ladder — remove once verified.
  console.log(
    `[getLogs] escrow-plan floor=${fromBlock} latest=${latestBlock} span=${span} (limit ${INITIAL_CHUNK_SIZE})`,
  );

  // Fits in a single paid 10k window — no probe, no chunking.
  if (span <= INITIAL_CHUNK_SIZE) {
    console.log(`[getLogs] escrow-path single-range ${fromBlock}→${latestBlock}`);
    return fetchLogsInRange(titleEscrowContract, fromBlock, latestBlock, includeObligationStatus);
  }

  // Large span: one address-scoped probe. Enterprise succeeds; paid/free range-cap fails.
  try {
    await probeLogsRange(provider, titleEscrowAddress, fromBlock, latestBlock);
    console.log(`[getLogs] escrow-path probe-ok → filters ${fromBlock}→${latestBlock}`);
    return fetchLogsInRange(titleEscrowContract, fromBlock, latestBlock, includeObligationStatus);
  } catch (err) {
    if (!isLogsRetryableError(err)) throw err;
    console.log(`[getLogs] escrow-path last-range probe failed → chunking`);
  }

  // Paid 10k / free: walk floor→latest in adaptive chunks (all event types on the escrow).
  if (fromBlock > 0) {
    console.log(`[getLogs] escrow-path forward-chunk ${fromBlock}→${latestBlock}`);
    // Probe already failed with a range cap — parallelize all 10k windows immediately.
    return scanLogsForward(provider, titleEscrowAddress, fromBlock, latestBlock, undefined, {
      assumePaidTier: true,
    });
  }

  // No floor — fall back to mint-seeking backward scan (same as before).
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

  return scanForMintEvent(provider, titleEscrowAddress, 0, latestBlock, {
    isMintLog,
    notFoundOnFailureMessage:
      'Unable to locate TokenReceived (mint); scan stopped after an RPC failure; refusing incomplete endorsement chain',
    notFoundMessage:
      'Unable to locate TokenReceived (mint) before the escrow scan floor; refusing incomplete endorsement chain',
  });
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
