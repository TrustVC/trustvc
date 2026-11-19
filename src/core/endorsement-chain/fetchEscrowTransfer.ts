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
import { getEthersContractFromProvider } from '../../utils/ethers';
import {
  getLatestBlockWithRetry,
  getLogsAdaptive,
  isRateLimit,
  withRateLimitRetry,
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

const mapV4RawLogsToTransfers = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawLogs: any[],
  titleEscrowContract: TitleEscrowV4,
): TitleEscrowTransferEvent[] => {
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

export const fetchEscrowTransfersV4 = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  /** Optional mint/creation floor (e.g. token INITIAL block) — avoids eth_getCode when known. */
  scanFloor = 0,
  /** Inclusive upper bound shared with the token scan. Omitted → current chain tip. */
  toBlock?: number,
): Promise<TitleEscrowTransferEvent[]> => {
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowContract = new Contract(
    address,
    TitleEscrowFactoryV4.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  ) as TitleEscrowV4;

  const latestBlock = toBlock ?? (await getLatestBlockWithRetry(provider));
  let fromBlock = scanFloor > 0 && scanFloor <= latestBlock ? scanFloor : 0;

  // No token mint floor → resolve escrow creation so the scan does not start at block 0.
  if (fromBlock === 0) {
    fromBlock = await resolveContractCreationBlock(provider, address, latestBlock);
  }

  const rawLogs = await getLogsAdaptive(provider, address, fromBlock, latestBlock);
  return mapV4RawLogsToTransfers(rawLogs, titleEscrowContract);
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

  const rawLogs = await fetchEscrowLogs(provider, titleEscrowContract, titleEscrowAddress);
  const holderChangeLogsParsed = getParsedLogs(
    rawLogs,
    titleEscrowContract as unknown as TitleEscrowV5,
  );

  return mapParsedLogsToEvents(
    holderChangeLogsParsed,
    titleEscrowAddress,
    tokenRegistryAddress,
    includeObligationStatus,
  );
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
    return high;
  } catch {
    return 0;
  }
};

/**
 * Resolve inclusive [fromBlock, toBlock] for an escrow log scan.
 * ObligationEscrow: mintBlock → start, shredBlock → end when shredded (else latest).
 * Classic Title Escrow V5: creation binary-search floor → latest (no shredBlock).
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Escrow contract
 * @param {string} titleEscrowAddress - Escrow address
 * @param {number} latestBlock - Chain tip
 * @returns {Promise<{ fromBlock: number; toBlock: number }>} Inclusive scan bounds
 */
export const resolveEscrowScanBounds = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
  latestBlock: number,
): Promise<{ fromBlock: number; toBlock: number }> => {
  let fromBlock = 0;
  let toBlock = latestBlock;

  try {
    // ObligationEscrow (and compatible) — mintBlock is the document start.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mintBlock = Number(await (titleEscrowContract as any).mintBlock());
    if (Number.isFinite(mintBlock) && mintBlock > 0 && mintBlock <= latestBlock) {
      fromBlock = mintBlock;
    }
  } catch {
    // Classic Title Escrow V5 — mintBlock reverts.
  }

  if (fromBlock === 0) {
    // Without a floor, a 0→latest scan walks the whole chain on capped providers.
    // ~20–25 getCode calls beat thousands of sequential eth_getLogs.
    const creationBlock = await resolveContractCreationBlock(
      provider,
      titleEscrowAddress,
      latestBlock,
    );
    if (creationBlock > 0 && creationBlock <= latestBlock) {
      fromBlock = creationBlock;
    }
  }

  try {
    // ObligationEscrow — shredBlock is the document end (0 while still active).
    const shredBlock = Number(
      await withRateLimitRetry(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => (titleEscrowContract as any).shredBlock(),
      ),
    );
    if (
      Number.isFinite(shredBlock) &&
      shredBlock > 0 &&
      shredBlock <= latestBlock &&
      shredBlock >= fromBlock
    ) {
      toBlock = shredBlock;
    }
  } catch (err) {
    // Throttling is not a missing getter. Retries already ran inside withRateLimitRetry.
    if (isRateLimit(err)) throw err;
    // Classic Title Escrow V4/V5 — no shredBlock; scan through latest.
  }

  return { fromBlock, toBlock };
};

/**
 * One address-scoped eth_getLogs from the mint/creation floor to shred or latest.
 * The provider's range limit, if any, is handled inside getLogsAdaptive.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Title escrow contract
 * @param {string} titleEscrowAddress - Title escrow address
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} Escrow event logs
 */
const fetchEscrowLogs = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  const latestBlock = await getLatestBlockWithRetry(provider);
  const { fromBlock, toBlock } = await resolveEscrowScanBounds(
    provider,
    titleEscrowContract,
    titleEscrowAddress,
    latestBlock,
  );
  return getLogsAdaptive(provider, titleEscrowAddress, fromBlock, toBlock);
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

const OBLIGATION_STATUS_EVENTS = new Set([
  'StatusInitialized',
  'StatusAccepted',
  'StatusRejected',
  'StatusDischarged',
]);

const mapParsedLogsToEvents = (
  holderChangeLogsParsed: ParsedLog[],
  titleEscrowAddress: string,
  tokenRegistryAddress: string,
  includeObligationStatus: boolean,
): (TitleEscrowTransferEvent | TokenTransferEvent)[] => {
  return holderChangeLogsParsed
    .filter((event) => includeObligationStatus || !OBLIGATION_STATUS_EVENTS.has(event.name))
    .map((event) => mapParsedLogToEvent(event, titleEscrowAddress, tokenRegistryAddress))
    .filter((event) => event !== undefined) as (TitleEscrowTransferEvent | TokenTransferEvent)[];
};

function identifyTokenReceivedType(event: ParsedLog): TokenTransferEventType {
  if (event.args.isMinting) {
    return 'INITIAL';
  }
  return 'RETURN_TO_ISSUER_REJECTED';
}
