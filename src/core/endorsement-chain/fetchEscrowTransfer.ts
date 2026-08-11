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
import { getEthersContractFromProvider } from '../../utils/ethers';
import {
  isInfuraProvider,
  scanLogsBackward,
  scanLogsForward,
} from '../endorsement-chain/fetchLogsChunked';
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

/**
 * Fetch V5 Title Escrow (or ObligationEscrow) transfer events.
 * Infura Free-tier RPCs use a 10-block backward scan; other providers keep the
 * original unranged multi-filter queryFilter path.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} titleEscrowAddress - Title escrow / ObligationEscrow address
 * @param {string} [tokenRegistryAddress] - Token / obligation registry address
 * @param {boolean} [includeObligationStatus=false] - Also collect ObligationEscrow status events
 * @returns {Promise<TransferBaseEvent[]>} - Transfer (and optional status) events
 */
export const fetchEscrowTransfersV5 = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowAddress: string,
  tokenRegistryAddress?: string,
  includeObligationStatus = false,
): Promise<TransferBaseEvent[]> => {
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowContract = new Contract(
    titleEscrowAddress,
    includeObligationStatus ? ObligationEscrow__factory.abi : TitleEscrowFactoryV5.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  return fetchAllTransfers(
    provider,
    titleEscrowContract,
    titleEscrowAddress,
    tokenRegistryAddress,
    includeObligationStatus,
  );
};

const getParsedLogs = (
  logs: ethers.providers.Log[] | ethersV6.Log[],
  titleEscrow: TitleEscrowV4 | TitleEscrowV5,
): ParsedLog[] => {
  // Address-scoped scans can include topics the ABI cannot decode; skip those instead of failing the chain.
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

/*
  Retrieve all events that emits BENEFICIARY_TRANSFER
*/
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

/*
  Retrieve all events that emits HOLDER_TRANSFER
*/
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

/**
 * Retrieve all V5 / ObligationEscrow events.
 * Infura Free-tier RPCs use a 10-block backward scan; other providers keep the
 * original unranged multi-filter queryFilter path.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Escrow contract
 * @param {string} titleEscrowAddress - Escrow address
 * @param {string} tokenRegistryAddress - Registry address
 * @param {boolean} includeObligationStatus - When true, also collect ObligationEscrow status events
 * @returns {Promise<(TitleEscrowTransferEvent | TokenTransferEvent)[]>} - Array of events
 */
const fetchAllTransfers = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress?: string,
  tokenRegistryAddress?: string,
  includeObligationStatus = false,
): Promise<(TitleEscrowTransferEvent | TokenTransferEvent)[]> => {
  if (!titleEscrowAddress) {
    // Handle ethers v5 and v6 differently
    titleEscrowAddress = titleEscrowContract?.address ?? (await titleEscrowContract.getAddress());
  }

  if (!tokenRegistryAddress) {
    tokenRegistryAddress = await titleEscrowContract.registry();
  }

  const rawLogs = isInfuraProvider(provider)
    ? await fetchLogsInfuraChunked(
        provider,
        titleEscrowContract,
        titleEscrowAddress,
        includeObligationStatus,
      )
    : await fetchLogsUnranged(titleEscrowContract, includeObligationStatus);

  const holderChangeLogsParsed = getParsedLogs(
    rawLogs,
    titleEscrowContract as unknown as TitleEscrowV5,
  );

  return mapParsedLogsToEvents(holderChangeLogsParsed, titleEscrowAddress, tokenRegistryAddress);
};

/**
 * Original path: one queryFilter(0, 'latest') per event filter, in parallel.
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Escrow contract
 * @param {boolean} includeObligationStatus - Include ObligationEscrow status filters
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} - Raw logs
 */
const fetchLogsUnranged = async (
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  includeObligationStatus = false,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
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

  if (includeObligationStatus) {
    allFilters.push(
      titleEscrowContract.filters.StatusInitialized,
      titleEscrowContract.filters.StatusAccepted,
      titleEscrowContract.filters.StatusRejected,
      titleEscrowContract.filters.StatusDischarged,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLogs: any = await Promise.all(
    allFilters.map(async (filter) => {
      const logs = await titleEscrowContract.queryFilter(filter, 0, 'latest');
      return logs;
    }),
  );
  return allLogs.flat();
};

/**
 * Infura path: Obligation uses mintBlock()/shredBlock() then forward-scans that range.
 * Classic V5 falls back to an adaptive backward scan until the mint log.
 * @param {Provider | ethersV6.Provider} provider - Infura ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Escrow contract
 * @param {string} titleEscrowAddress - Escrow address
 * @param {boolean} includeObligationStatus - ObligationEscrow (has mintBlock/shredBlock)
 * @returns {Promise<ethers.providers.Log[] | ethersV6.Log[]>} - Raw logs
 */
const fetchLogsInfuraChunked = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress: string,
  includeObligationStatus = false,
): Promise<ethers.providers.Log[] | ethersV6.Log[]> => {
  if (includeObligationStatus) {
    const bounded = await tryObligationBoundedRange(provider, titleEscrowContract);
    if (bounded) {
      return scanLogsForward(provider, titleEscrowAddress, bounded.fromBlock, bounded.toBlock);
    }
  }

  const latestBlock = await provider.getBlockNumber();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMintLog = (log: any) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = (titleEscrowContract.interface as any).parseLog(log);
      // Obligation mints also emit StatusInitialized in the same tx; either marks the floor.
      return (
        (parsed?.name === 'TokenReceived' && parsed.args.isMinting) ||
        parsed?.name === 'StatusInitialized'
      );
    } catch {
      return false;
    }
  };
  return scanLogsBackward(provider, titleEscrowAddress, latestBlock, 0, isMintLog);
};

/**
 * ObligationEscrow exposes mintBlock()/shredBlock() as plain state — 1-2 eth_calls bound the
 * getLogs range instead of walking from chain tip (critical on Infura Free's 10-block windows).
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - ObligationEscrow contract
 * @returns {Promise<{ fromBlock: number; toBlock: number } | null>} - Bounded range, or null
 */
const tryObligationBoundedRange = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
): Promise<{ fromBlock: number; toBlock: number } | null> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contract = titleEscrowContract as any;
    const mintBlock = Number(await contract.mintBlock());
    if (!Number.isFinite(mintBlock) || mintBlock <= 0) return null;

    const shredBlock = Number(await contract.shredBlock());
    const toBlock =
      Number.isFinite(shredBlock) && shredBlock > 0 ? shredBlock : await provider.getBlockNumber();

    if (toBlock < mintBlock) return null;
    return { fromBlock: mintBlock, toBlock };
  } catch {
    return null;
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
        // MINT / RESTORE
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
          // Handle ethers v5 and v6 differently
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
  } else {
    return 'RETURN_TO_ISSUER_REJECTED';
  }
}
