import { ethers as ethersV6 } from 'ethersV6';
import { fetchEventTime, isZeroAddress, sortLogChain } from '../endorsement-chain/helpers';
import { EndorsementChain, TransferBaseEvent, TransferEvent } from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';

const pickParty = (value: string | undefined, fallback: string): string =>
  value && !isZeroAddress(value) ? value : fallback;

/*
  Adds details of previous records (Previous Beneficiary/Holder)
  to current events history
*/
export const getEndorsementChain = async (
  provider: Provider | ethersV6.Provider,
  logChain: TransferBaseEvent[],
): Promise<EndorsementChain> => {
  const historyChain: EndorsementChain = [];
  sortLogChain(logChain);
  let previousBeneficiary = '';
  let previousHolder = '';

  const timestampPromises = logChain.map((log) => fetchEventTime(log.blockNumber, provider));
  const timestamps = await Promise.all(timestampPromises);

  logChain.forEach((log, index) => {
    const timestamp = timestamps[index];
    const transactionDetails = {
      type: log.type,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      blockNumber: log.blockNumber,
      owner: pickParty(log.owner, previousBeneficiary),
      holder: pickParty(log.holder, previousHolder),
      timestamp: timestamp,
      remark: log?.remark || '',
      terminationReason: log.terminationReason,
    } as TransferEvent;

    if (
      log.type === 'TRANSFER_OWNERS' ||
      log.type === 'TRANSFER_BENEFICIARY' ||
      log.type === 'TRANSFER_HOLDER' ||
      log.type === 'INITIAL' ||
      log.type === 'REJECT_TRANSFER_OWNERS' ||
      log.type === 'REJECT_TRANSFER_BENEFICIARY' ||
      log.type === 'REJECT_TRANSFER_HOLDER' ||
      log.type === 'STATUS_INITIALIZED' ||
      log.type === 'STATUS_ACCEPTED' ||
      log.type === 'STATUS_REJECTED' ||
      log.type === 'STATUS_DISCHARGED'
    ) {
      // Owner/Holder change (or carried forward for status / reject events)
      historyChain.push(transactionDetails);
      previousHolder = transactionDetails.holder;
      previousBeneficiary = transactionDetails.owner;
    } else if (log.type === 'SURRENDER_ACCEPTED' || log.type === 'RETURN_TO_ISSUER_ACCEPTED') {
      // Prefer Shred event lastBeneficiary/lastHolder when present; else carry previous (old ABI).
      historyChain.push({
        ...transactionDetails,
        owner: pickParty(log.owner, previousBeneficiary),
        holder: pickParty(log.holder, previousHolder),
        terminationReason: log.terminationReason,
      });
      previousHolder = '';
      previousBeneficiary = '';
    } else if (
      log.type === 'SURRENDERED' ||
      log.type === 'SURRENDER_REJECTED' ||
      log.type === 'RETURNED_TO_ISSUER' ||
      log.type === 'RETURN_TO_ISSUER_REJECTED'
    ) {
      // No state changes, except document owner
      historyChain.push(transactionDetails);
    } else {
      // No state changes
      historyChain.push(transactionDetails);
    }
  });
  return historyChain;
};
