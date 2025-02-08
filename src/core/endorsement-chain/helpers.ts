import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Dictionary, groupBy } from 'lodash';
import { TransferBaseEvent, TransferEventType } from '../endorsement-chain/types';

export const fetchEventTime = async (
  blockNumber: number,
  provider: ethers.providers.Provider | ethersV6.Provider,
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
  return mergedTransaction;
};

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
      const base = groupedEvents[0];
      const type = identifyEventTypeFromLogs(groupedEvents);
      return [{ ...base, owner, holder, type }];
    }

    throw new Error('Invalid hash, update your configuration');
  });
  return mergedTransaction;
};

const identifyEventTypeFromLogs = (groupedEvents: TransferBaseEvent[]): TransferEventType => {
  for (const event of groupedEvents) {
    if (
      [
        'INITIAL',
        'RETURNED_TO_ISSUER',
        'RETURN_TO_ISSUER_ACCEPTED',
        'RETURN_TO_ISSUER_REJECTED',
      ].includes(event.type) ||
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
