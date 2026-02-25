import {
  Provider as ProviderV6,
  Contract as ContractV6,
  ContractFactory as ContractFactoryV6,
} from 'ethersV6';
import { providers, Contract as ContractV5, ContractFactory as ContractFactoryV5 } from 'ethers';
type ProviderV5 = providers.Provider;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isV6EthersProvider = (provider: any): boolean => {
  // if ((provider as ethers.providers.Provider)._isProvider === true) {
  if (provider?._isProvider === true) {
    return false;
  } else if (provider?.provider && provider?.signTransaction) {
    // } else if ((provider as ethersV6.Signer)?.provider && (provider as ethersV6.Signer)?.signTransaction) {
    return isV6EthersProvider(provider.provider);
    // } else if (provider?._isSigner === true && provider?.provider && provider?.signTransaction) {
    //   // } else if ((provider as ethers.Signer)._isSigner === true && (provider as ethers.Signer)?.provider && (provider as ethers.Signer)?.signTransaction) {
    //   return isV6EthersProvider(provider.provider);
  } else if (provider?.provider && !provider?.signTransaction) {
    // } else if ((provider as ethersV6.Provider)?.provider && (provider as ethersV6.Provider)?.signTransaction) {
    return true;
  }

  throw new Error('Unknown provider type');
};

export const getEthersContractFromProvider = (
  provider: ProviderV5 | ProviderV6,
): typeof ContractV5 | typeof ContractV6 => {
  return isV6EthersProvider(provider) ? ContractV6 : ContractV5;
};

export const getEthersContractFactoryFromProvider = (
  provider: ProviderV5 | ProviderV6,
): typeof ContractFactoryV5 | typeof ContractFactoryV6 => {
  return isV6EthersProvider(provider) ? ContractFactoryV6 : ContractFactoryV5;
};
