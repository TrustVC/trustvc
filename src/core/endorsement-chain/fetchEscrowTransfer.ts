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
import { scanLogsBackward } from '../endorsement-chain/fetchLogsChunked';
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
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowContract = new Contract(
    titleEscrowAddress,
    TitleEscrowFactoryV5.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  return fetchAllTransfers(provider, titleEscrowContract, titleEscrowAddress, tokenRegistryAddress);
};

/**
 * ObligationEscrow shares Title Escrow V5 transfer events and adds status lifecycle events.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} obligationEscrowAddress - ObligationEscrow contract address
 * @param {string} [obligationRegistryAddress] - Obligation registry (TrustVCToken) address
 * @returns {Promise<TransferBaseEvent[]>} - Transfer and status events
 */
export const fetchEscrowTransfersObligation = async (
  provider: Provider | ethersV6.Provider,
  obligationEscrowAddress: string,
  obligationRegistryAddress?: string,
): Promise<TransferBaseEvent[]> => {
  const Contract = getEthersContractFromProvider(provider);
  const obligationEscrowContract = new Contract(
    obligationEscrowAddress,
    ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  return fetchAllTransfers(
    provider,
    obligationEscrowContract,
    obligationEscrowAddress,
    obligationRegistryAddress,
  );
};

const getParsedLogs = (
  logs: ethers.providers.Log[] | ethersV6.Log[],
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
 * Retrieve all V5 / ObligationEscrow events via backward log scan
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {ethers.Contract | ethersV6.Contract} titleEscrowContract - Escrow contract
 * @param {string} titleEscrowAddress - Escrow address
 * @param {string} tokenRegistryAddress - Registry address
 * @returns {Promise<(TitleEscrowTransferEvent | TokenTransferEvent)[]>} - Array of events
 */
const fetchAllTransfers = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowContract: ethers.Contract | ethersV6.Contract,
  titleEscrowAddress?: string,
  tokenRegistryAddress?: string,
): Promise<(TitleEscrowTransferEvent | TokenTransferEvent)[]> => {
  if (!titleEscrowAddress) {
    // Handle ethers v5 and v6 differently
    titleEscrowAddress = titleEscrowContract?.address ?? (await titleEscrowContract.getAddress());
  }

  const fromBlock = await provider.getBlockNumber();
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

  const rawLogs = await scanLogsBackward(provider, titleEscrowAddress, fromBlock, 0, isMintLog);

  const holderChangeLogsParsed = getParsedLogs(
    rawLogs,
    titleEscrowContract as unknown as TitleEscrowV5,
  );

  if (!tokenRegistryAddress) {
    tokenRegistryAddress = await titleEscrowContract.registry();
  }

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
