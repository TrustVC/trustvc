import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import { decrypt } from '../decrypt';
import { getTitleEscrowAddress } from '../endorsement-chain';
import { fetchObligationEscrowTransfers } from './fetchObligationEscrowTransfers';
import { mergeObligationTransfers, ObligationEndorsementChainRpcOptions } from './helpers';
import { getObligationEndorsementChain } from './retrieveObligationEndorsementChain';
import { ObligationEndorsementChain } from './types';

export type FetchObligationEndorsementChainOptions = ObligationEndorsementChainRpcOptions & {
  keyId?: string;
  titleEscrowAddress?: string;
};

/**
 * Fetches the obligation (BOE) endorsement / activity chain for a minted title.
 * Separate from classic `fetchEndorsementChain` — does not touch ETR V4/V5 paths.
 *
 * Override RPC defaults via `options.maxBlockRange` / `options.rpcConcurrency`
 * (e.g. from your app `.env`). Defaults: 10-block chunks, concurrency 3.
 * @param {string} obligationRegistryAddress - Obligation registry contract address.
 * @param {string} tokenId - Token ID to fetch the chain for.
 * @param {Provider | ethersV6.Provider} provider - Ethereum JSON-RPC provider.
 * @param {FetchObligationEndorsementChainOptions} [options] - Escrow override, decryption key, and RPC options.
 * @returns {Promise<ObligationEndorsementChain>} Full endorsement chain, with remarks decrypted when `keyId` is set.
 */
export const fetchObligationEndorsementChain = async (
  obligationRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
  options: FetchObligationEndorsementChainOptions = {},
): Promise<ObligationEndorsementChain> => {
  const { keyId, titleEscrowAddress, maxBlockRange, rpcConcurrency } = options;
  const rpcOptions: ObligationEndorsementChainRpcOptions = {
    maxBlockRange,
    rpcConcurrency,
  };

  const escrowAddress =
    titleEscrowAddress ||
    (await getTitleEscrowAddress(obligationRegistryAddress, tokenId, provider, {
      titleEscrowVersion: 'v5',
    }));

  const { transfers, statusEvents } = await fetchObligationEscrowTransfers(
    provider,
    obligationRegistryAddress,
    tokenId,
    escrowAddress,
    rpcOptions,
  );

  const merged = mergeObligationTransfers([...transfers, ...statusEvents]);
  const chain = await getObligationEndorsementChain(provider, merged, rpcOptions);

  if (!keyId) return chain;

  return chain.map((event) => {
    if (!event.remark || event.remark === '0x' || event.remark === '') {
      return { ...event, remark: '' };
    }
    try {
      const remarkHex = event.remark.startsWith('0x') ? event.remark.slice(2) : event.remark;
      return { ...event, remark: decrypt(remarkHex, keyId) };
    } catch {
      return event;
    }
  });
};
