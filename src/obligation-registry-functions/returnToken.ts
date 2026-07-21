import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { encrypt } from '../core';
import { obligationRegistryContracts } from '../obligation-registry';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  ObligationAcceptReturnedOptions,
  ObligationAcceptReturnedParams,
  ObligationEscrowContractOptions,
  ObligationRegistryTransactionOptions,
  ObligationRejectReturnedOptions,
  ObligationRejectReturnedParams,
  ObligationReturnToIssuerParams,
} from './types';
import { getObligationEscrowAddress, getTxOptions } from './utils';

export const returnToIssuerObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationReturnToIssuerParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  let escrowAddress = contractOptions.titleEscrowAddress;
  if (!escrowAddress) {
    const { obligationRegistry, tokenId } = contractOptions;
    if (!obligationRegistry) throw new Error('Obligation registry address is required');
    if (tokenId === undefined || tokenId === null || tokenId === '') {
      throw new Error('Token ID is required');
    }
    escrowAddress = await getObligationEscrowAddress(obligationRegistry, tokenId, signer.provider);
  }
  const Contract = getEthersContractFromProvider(signer.provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obligationEscrowContract: any = new Contract(
    escrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const { remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.returnToIssuer.staticCall(encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.returnToIssuer(encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for returnToIssuer failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.returnToIssuer(encryptedRemarks, txOptions);
};

export const acceptReturnedObligationRegistry = async (
  contractOptions: ObligationAcceptReturnedOptions,
  signer: Signer | SignerV6,
  params: ObligationAcceptReturnedParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const Contract = getEthersContractFromProvider(signer.provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obligationTokenContract: any = new Contract(
    obligationRegistry,
    obligationRegistryContracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationTokenContract.burn.staticCall(tokenId, encryptedRemarks);
    } else {
      await obligationTokenContract.callStatic.burn(tokenId, encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for acceptReturned failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationTokenContract.burn(tokenId, encryptedRemarks, txOptions);
};

export const rejectReturnedObligationRegistry = async (
  contractOptions: ObligationRejectReturnedOptions,
  signer: Signer | SignerV6,
  params: ObligationRejectReturnedParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const Contract = getEthersContractFromProvider(signer.provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obligationTokenContract: any = new Contract(
    obligationRegistry,
    obligationRegistryContracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationTokenContract.restore.staticCall(tokenId, encryptedRemarks);
    } else {
      await obligationTokenContract.callStatic.restore(tokenId, encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for rejectReturned failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationTokenContract.restore(tokenId, encryptedRemarks, txOptions);
};
