import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';

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
  provider: Provider | ethersV6.Provider,
): typeof ethers.Contract | typeof ethersV6.Contract => {
  return isV6EthersProvider(provider) ? ethersV6.Contract : ethers.Contract;
};
