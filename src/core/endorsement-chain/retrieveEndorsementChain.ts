import { ethers as ethersV6 } from 'ethersV6';
import { fetchEventTime, sortLogChain } from '../endorsement-chain/helpers';
import { EndorsementChain, TransferBaseEvent, TransferEvent } from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';

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
      owner: log.owner || previousBeneficiary,
      holder: log.holder || previousHolder,
      timestamp: timestamp,
      remark: log?.remark || '',
    } as TransferEvent;

    if (
      log.type === 'TRANSFER_OWNERS' ||
      log.type === 'TRANSFER_BENEFICIARY' ||
      log.type === 'TRANSFER_HOLDER' ||
      log.type === 'INITIAL'
    ) {
      // Owner/Holder change
      historyChain.push(transactionDetails);
      previousHolder = transactionDetails.holder;
      previousBeneficiary = transactionDetails.owner;
    } else if (log.type === 'SURRENDER_ACCEPTED' || log.type === 'RETURN_TO_ISSUER_ACCEPTED') {
      // Title Escrow Voided
      previousHolder = '';
      previousBeneficiary = '';
      historyChain.push(transactionDetails);
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
