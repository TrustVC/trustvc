import { Provider } from '@ethersproject/abstract-provider';
import { ethers as ethersV6 } from 'ethersV6';
import { EndorsementChain } from './types';
import { fetchEndorsementChain, getTitleEscrowAddress } from './useEndorsementChain';

export const getObligationEscrowAddress = async (
  obligationRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
  options?: {
    titleEscrowVersion?: 'v4' | 'v5';
  },
): Promise<string> => {
  return getTitleEscrowAddress(obligationRegistryAddress, tokenId, provider, options);
};

export const fetchObligationEndorsementChain = async (
  obligationRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
  options?: {
    encryptionId?: string;
    obligationEscrowAddress?: string;
  },
): Promise<EndorsementChain> => {
  return fetchEndorsementChain(
    obligationRegistryAddress,
    tokenId,
    provider,
    options?.encryptionId,
    options?.obligationEscrowAddress,
  );
};
