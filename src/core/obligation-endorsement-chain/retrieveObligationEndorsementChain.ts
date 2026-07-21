import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  createFetchEventTimeCache,
  mapWithConcurrency,
  ObligationEndorsementChainRpcOptions,
  resolveObligationEndorsementChainRpcOptions,
  sortObligationLogChain,
} from './helpers';
import {
  ObligationEndorsementChain,
  ObligationTransferBaseEvent,
  ObligationTransferEvent,
} from './types';

/**
 * Adds timestamps and carries previous beneficiary/holder across events,
 * including STATUS_* lifecycle events (does not wipe owner/holder on status).
 * @param {Provider | ethersV6.Provider} provider - Ethereum JSON-RPC provider.
 * @param {ObligationTransferBaseEvent[]} logChain - Raw transfer and status events.
 * @param {ObligationEndorsementChainRpcOptions} [rpcOptions] - RPC concurrency options for block fetches.
 * @returns {Promise<ObligationEndorsementChain>} Enriched endorsement chain with timestamps.
 */
export const getObligationEndorsementChain = async (
  provider: Provider | ethersV6.Provider,
  logChain: ObligationTransferBaseEvent[],
  rpcOptions?: ObligationEndorsementChainRpcOptions,
): Promise<ObligationEndorsementChain> => {
  const { rpcConcurrency } = resolveObligationEndorsementChainRpcOptions(rpcOptions);
  const historyChain: ObligationEndorsementChain = [];
  sortObligationLogChain(logChain);
  let previousBeneficiary = '';
  let previousHolder = '';

  const fetchTime = createFetchEventTimeCache(provider);
  const timestamps = await mapWithConcurrency(
    logChain,
    (log) => fetchTime(log.blockNumber),
    rpcConcurrency,
  );

  logChain.forEach((log, index) => {
    const timestamp = timestamps[index];
    const transactionDetails = {
      type: log.type,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      blockNumber: log.blockNumber,
      owner: log.owner || previousBeneficiary,
      holder: log.holder || previousHolder,
      timestamp,
      remark: log?.remark || '',
    } as ObligationTransferEvent;

    if (
      log.type === 'TRANSFER_OWNERS' ||
      log.type === 'TRANSFER_BENEFICIARY' ||
      log.type === 'TRANSFER_HOLDER' ||
      log.type === 'INITIAL'
    ) {
      historyChain.push(transactionDetails);
      previousHolder = transactionDetails.holder;
      previousBeneficiary = transactionDetails.owner;
    } else if (log.type === 'RETURN_TO_ISSUER_ACCEPTED') {
      previousHolder = '';
      previousBeneficiary = '';
      historyChain.push(transactionDetails);
    } else if (
      log.type === 'RETURNED_TO_ISSUER' ||
      log.type === 'RETURN_TO_ISSUER_REJECTED' ||
      log.type.startsWith('STATUS_') ||
      log.type.startsWith('REJECT_')
    ) {
      historyChain.push(transactionDetails);
      if (log.owner) previousBeneficiary = transactionDetails.owner;
      if (log.holder) previousHolder = transactionDetails.holder;
    } else {
      historyChain.push(transactionDetails);
    }
  });
  return historyChain;
};
