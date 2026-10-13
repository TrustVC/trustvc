import { ethers as ethersV6 } from 'ethersV6';
import { Dictionary, groupBy } from 'lodash';
import { TransferBaseEvent, TransferEventType } from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';

export const fetchEventTime = async (
  blockNumber: number,
  provider: Provider | ethersV6.Provider,
): Promise<number> => {
  const msecToSec = 1000;
  const eventTimestamp = (await provider.getBlock(blockNumber))!.timestamp * msecToSec;
  return eventTimestamp;
};

/*
  Get available owner/holder from list of events
*/
export const isZeroAddress = (address?: string): boolean => {
  if (!address) return true;
  return /^0x0{40}$/i.test(address);
};

const getHolderOwner = (events: TransferBaseEvent[]): { owner: string; holder: string } => {
  let owner = '';
  let holder = '';
  for (const event of events) {
    // Skip burn/zero addresses so shred companion transfers keep the last real parties.
    if (event.owner && !isZeroAddress(event.owner)) owner = event.owner;
    if (event.holder && !isZeroAddress(event.holder)) holder = event.holder;
  }
  return { owner, holder };
};

export const mergeTransfersV4 = (transferEvents: TransferBaseEvent[]): TransferBaseEvent[] => {
  const groupedEventsDict: Dictionary<TransferBaseEvent[]> = groupBy(
    transferEvents,
    'transactionHash',
  );
  const transactionHashValues = Object.values(groupedEventsDict);
  const mergedTransaction = transactionHashValues.flatMap((groupedEvents) => {
    if (groupedEvents.length === 1) return groupedEvents;
    if (groupedEvents.length === 2) {
      // 2 Transaction with the same transactionHash, (transactionIndex and blockNumber)
      // Merging HOLDER_TRANSFER and OWNER_TRANSFER transactions
      const type: TransferEventType = 'TRANSFER_OWNERS';
      const base: TransferBaseEvent = groupedEvents[0];
      const { owner, holder } = getHolderOwner(groupedEvents);
      return [{ ...base, type, owner, holder }];
    }
    if (groupedEvents.length === 3) {
      // 3 Transaction with the same transactionHash, (transactionIndex and blockNumber)
      // Merging HOLDER_TRANSFER, OWNER_TRANSFER and INITIAL/SURRENDER_ACCEPTED transactions
      // SURRENDER_ACCPTED: changes owner and holder to 0x0
      const base = groupedEvents[0];
      const type: TransferEventType = 'INITIAL';
      const { owner, holder } = getHolderOwner(groupedEvents);
      const found = groupedEvents.find((x) => {
        return x.type === 'INITIAL' || x.type === 'SURRENDER_ACCEPTED';
      });
      return [{ ...base, owner, holder, type: found?.type || type }];
    }
    throw new Error('Invalid hash, update your configuration');
  });
  return mergedTransaction;
};

/**
 * Non-empty on-chain remark hex (`0x` alone is empty).
 * @param {string} [remark] Hex-encoded remark from an on-chain event
 * @returns {boolean} True when remark has payload beyond the `0x` prefix
 */
const hasRemarkPayload = (remark?: string): boolean =>
  typeof remark === 'string' && remark.length > 2;

export const mergeTransfersV5 = (transferEvents: TransferBaseEvent[]): TransferBaseEvent[] => {
  const groupedEventsDict: Dictionary<TransferBaseEvent[]> = groupBy(
    transferEvents,
    'transactionHash',
  );
  const transactionHashValues = Object.values(groupedEventsDict);
  const mergedTransaction = transactionHashValues.flatMap((groupedEvents) => {
    if (groupedEvents.length === 1) return groupedEvents;
    if (groupedEvents.length > 1) {
      const { owner, holder } = getHolderOwner(groupedEvents);
      const type = identifyEventTypeFromLogs(groupedEvents);
      /**
       * Find the first event of the type.
       * for type INITIAL, the remark is only available in the INITIAL event, TRANSFER_HOLDER and TRANSFER_BENEFICIARY does not contain remark, hence we need to return INITIAL event as base.
       * for type TRANSFER_OWNERS, it does not exist, both TRANSFER_HOLDER and TRANSFER_BENEFICIARY will have same details, hence default to return first event
       */
      const base = groupedEvents.find((event) => event.type === type) ?? groupedEvents[0];
      // Obligation mint emits StatusInitialized (no remark) in the same tx as TokenReceived.
      // Prefer any event that carries the encrypted remark payload.
      const remark =
        groupedEvents.find((event) => hasRemarkPayload(event.remark))?.remark ?? base.remark;
      const terminationReason = groupedEvents.find(
        (event) => event.terminationReason,
      )?.terminationReason;
      return [
        {
          ...base,
          owner,
          holder,
          type,
          remark,
          ...(terminationReason ? { terminationReason } : {}),
        },
      ];
    }

    throw new Error('Invalid hash, update your configuration');
  });
  return mergedTransaction;
};

const OBLIGATION_STATUS_TYPES = new Set<TransferEventType>([
  'STATUS_ACCEPTED',
  'STATUS_REJECTED',
  'STATUS_DISCHARGED',
]);

const identifyEventTypeFromLogs = (groupedEvents: TransferBaseEvent[]): TransferEventType => {
  // Obligation mint emits StatusInitialized before TokenReceived(INITIAL) in log order.
  // Prefer INITIAL so owner/holder/remarks match classic ETR mint display.
  if (groupedEvents.some((event) => event.type === 'INITIAL')) {
    return 'INITIAL';
  }

  // Obligation accept/reject/discharge must keep their status type.
  // Reject/discharge auto-shred in the same tx — do not let Shred win as
  // RETURN_TO_ISSUER_ACCEPTED (that type is classic ETR shred only).
  const obligationStatus = groupedEvents.find((event) => OBLIGATION_STATUS_TYPES.has(event.type));
  if (obligationStatus) {
    return obligationStatus.type;
  }

  if (groupedEvents.some((event) => event.type === 'RETURN_TO_ISSUER_ACCEPTED')) {
    return 'RETURN_TO_ISSUER_ACCEPTED';
  }

  for (const event of groupedEvents) {
    if (
      ['RETURNED_TO_ISSUER', 'RETURN_TO_ISSUER_REJECTED', 'STATUS_INITIALIZED'].includes(
        event.type,
      ) ||
      event.type.startsWith('REJECT_')
    ) {
      return event.type;
    }
  }

  const isTransferHolder = groupedEvents.some((event) => event.type === 'TRANSFER_HOLDER');
  const isTransferBeneficiary = groupedEvents.some(
    (event) => event.type === 'TRANSFER_BENEFICIARY',
  );

  if (isTransferHolder && isTransferBeneficiary) {
    return 'TRANSFER_OWNERS';
  } else if (isTransferHolder) {
    return 'TRANSFER_HOLDER';
  } else if (isTransferBeneficiary) {
    return 'TRANSFER_BENEFICIARY';
  }

  throw new Error('Unable to identify event type');
};

/*
  Sort based on blockNumber
*/
export const sortLogChain = (logChain: TransferBaseEvent[]): TransferBaseEvent[] => {
  return logChain.sort((a, b) => {
    return a.blockNumber - b.blockNumber;
  });
};
