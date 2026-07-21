import { Provider } from '@ethersproject/abstract-provider';
import { Provider as ProviderV6 } from 'ethersV6';
import { getTitleEscrowAddress } from '../core';

export {
  getChainIdSafe,
  getSignerAddressSafe,
  getTxOptions,
} from '../token-registry-functions/utils';

/**
 * Resolves the ObligationEscrow address for a given (obligationRegistry, tokenId) pair.
 * Delegates to the generic, contract-family-agnostic `getTitleEscrowAddress` core primitive with
 * `titleEscrowVersion` fixed to 'v5', since ObligationRegistry is a v5-only feature.
 * @param {string} obligationRegistry - Obligation registry contract address.
 * @param {string | number} tokenId - Token ID whose escrow address to resolve.
 * @param {Provider | ProviderV6} provider - Ethereum JSON-RPC provider.
 * @returns {Promise<string>} Obligation escrow contract address.
 */
export const getObligationEscrowAddress = async (
  obligationRegistry: string,
  tokenId: string | number,
  provider: Provider | ProviderV6,
): Promise<string> => {
  return getTitleEscrowAddress(obligationRegistry, String(tokenId), provider, {
    titleEscrowVersion: 'v5',
  });
};
