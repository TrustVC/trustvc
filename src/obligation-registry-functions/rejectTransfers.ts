import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { encrypt } from '../core';
import { obligationRegistryContracts } from '../obligation-registry';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  ObligationEscrowContractOptions,
  ObligationRegistryTransactionOptions,
  ObligationRejectTransferParams,
} from './types';
import { getObligationEscrowAddress, getTxOptions } from './utils';

const resolveObligationEscrowAddress = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
): Promise<string> => {
  if (contractOptions.titleEscrowAddress) return contractOptions.titleEscrowAddress;
  const { obligationRegistry, tokenId } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!tokenId) throw new Error('Token ID is required');
  if (!signer.provider) throw new Error('Provider is required');
  return getObligationEscrowAddress(obligationRegistry, tokenId, signer.provider);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connectObligationEscrow = (escrowAddress: string, signer: Signer | SignerV6): any => {
  if (!signer.provider) throw new Error('Provider is required');
  const Contract = getEthersContractFromProvider(signer.provider);
  return new Contract(
    escrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
};

export const rejectTransferHolderObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRejectTransferParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.rejectTransferHolder.staticCall(encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.rejectTransferHolder(encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for rejectTransferHolder failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.rejectTransferHolder(encryptedRemarks, txOptions);
};

export const rejectTransferBeneficiaryObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRejectTransferParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.rejectTransferBeneficiary.staticCall(encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.rejectTransferBeneficiary(encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for rejectTransferBeneficiary failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.rejectTransferBeneficiary(encryptedRemarks, txOptions);
};

export const rejectTransferOwnersObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRejectTransferParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.rejectTransferOwners.staticCall(encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.rejectTransferOwners(encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for rejectTransferOwners failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.rejectTransferOwners(encryptedRemarks, txOptions);
};
