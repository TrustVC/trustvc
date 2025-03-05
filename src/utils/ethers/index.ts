import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isV6EthersProvider = (provider: any): boolean => {
  return provider instanceof ethersV6.AbstractProvider;
};

export const getEthersContractFromProvider = (
  provider: Provider | ethersV6.Provider,
): typeof ethers.Contract | typeof ethersV6.Contract => {
  return isV6EthersProvider(provider) ? ethersV6.Contract : ethers.Contract;
};
