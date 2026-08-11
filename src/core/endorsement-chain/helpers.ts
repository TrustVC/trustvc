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
const getHolderOwner = (events: TransferBaseEvent[]): { owner: string; holder: string } => {
  let owner = '';
  let holder = '';
  for (const event of events) {
    owner = event.owner || owner;
    holder = event.holder || holder;
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
  return sortLogChain(mergedTransaction);
};

const isObligationStatusEvent = (type: TransferEventType): boolean =>
  type === 'STATUS_INITIALIZED' ||
  type === 'STATUS_ACCEPTED' ||
  type === 'STATUS_REJECTED' ||
  type === 'STATUS_DISCHARGED';

const earliestLogIndex = (events: TransferBaseEvent[]): number | undefined => {
  const indexes = events
    .map((event) => event.logIndex)
    .filter((logIndex): logIndex is number => logIndex !== undefined);
  return indexes.length > 0 ? Math.min(...indexes) : undefined;
};

export const mergeTransfersV5 = (transferEvents: TransferBaseEvent[]): TransferBaseEvent[] => {
  // ObligationEscrow co-emits status + transfer/shred in one tx; keep STATUS_* rows so
  // chronological order (block → tx → logIndex) can replay the on-chain sequence.
  const statusEvents = transferEvents.filter((event) => isObligationStatusEvent(event.type));
  const mergeableEvents = transferEvents.filter((event) => !isObligationStatusEvent(event.type));

  const groupedEventsDict: Dictionary<TransferBaseEvent[]> = groupBy(
    mergeableEvents,
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
      return [{ ...base, owner, holder, type, logIndex: earliestLogIndex(groupedEvents) }];
    }

    throw new Error('Invalid hash, update your configuration');
  });
  return sortLogChain([...statusEvents, ...mergedTransaction]);
};

const identifyEventTypeFromLogs = (groupedEvents: TransferBaseEvent[]): TransferEventType => {
  // Prefer mint/return/terminal transfer types over STATUS_* when both appear in the same
  // collapsed group (STATUS rows are normally kept separate by mergeTransfersV5).
  for (const type of [
    'INITIAL',
    'RETURNED_TO_ISSUER',
    'RETURN_TO_ISSUER_ACCEPTED',
    'RETURN_TO_ISSUER_REJECTED',
    'STATUS_INITIALIZED',
    'STATUS_ACCEPTED',
    'STATUS_REJECTED',
    'STATUS_DISCHARGED',
  ] as TransferEventType[]) {
    if (groupedEvents.some((event) => event.type === type)) return type;
  }

  const rejectEvent = groupedEvents.find((event) => event.type.startsWith('REJECT_'));
  if (rejectEvent) return rejectEvent.type;

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
  Chronological chain order matching on-chain creation:
  blockNumber → transactionIndex → logIndex (emission order within a tx).
*/
export const sortLogChain = (logChain: TransferBaseEvent[]): TransferBaseEvent[] => {
  return logChain.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
    if (a.transactionIndex !== b.transactionIndex) {
      return a.transactionIndex - b.transactionIndex;
    }
    return (a.logIndex ?? 0) - (b.logIndex ?? 0);
  });
};
