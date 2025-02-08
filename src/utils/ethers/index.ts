import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isV6EthersProvider = (provider: any): boolean => {
  return !!provider?.provider;
};

export const getEthersContractFromProvider = (
  provider: ethers.providers.Provider | ethersV6.Provider,
): typeof ethers.Contract | typeof ethersV6.Contract => {
  if (isV6EthersProvider(provider)) {
    return ethersV6.Contract;
  } else {
    return ethers.Contract;
  }
};
