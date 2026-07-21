import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { encrypt } from '../core';
import { obligationRegistryContracts } from '../obligation-registry';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  ObligationEscrowContractOptions,
  ObligationNominateParams,
  ObligationRegistryTransactionOptions,
  ObligationTransferBeneficiaryParams,
  ObligationTransferHolderParams,
  ObligationTransferOwnersParams,
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

export const nominateObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationNominateParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { newBeneficiaryAddress, remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.nominate.staticCall(newBeneficiaryAddress, encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.nominate(newBeneficiaryAddress, encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for nominate failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.nominate(
    newBeneficiaryAddress,
    encryptedRemarks,
    txOptions,
  );
};

export const transferBeneficiaryObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationTransferBeneficiaryParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { newBeneficiaryAddress, remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.transferBeneficiary.staticCall(
        newBeneficiaryAddress,
        encryptedRemarks,
      );
    } else {
      await obligationEscrowContract.callStatic.transferBeneficiary(
        newBeneficiaryAddress,
        encryptedRemarks,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferBeneficiary failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.transferBeneficiary(
    newBeneficiaryAddress,
    encryptedRemarks,
    txOptions,
  );
};

export const transferHolderObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationTransferHolderParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { holderAddress, remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.transferHolder.staticCall(holderAddress, encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.transferHolder(holderAddress, encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.transferHolder(holderAddress, encryptedRemarks, txOptions);
};

export const transferOwnersObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationTransferOwnersParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const { newBeneficiaryAddress, newHolderAddress, remarks } = params;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.transferOwners.staticCall(
        newBeneficiaryAddress,
        newHolderAddress,
        encryptedRemarks,
      );
    } else {
      await obligationEscrowContract.callStatic.transferOwners(
        newBeneficiaryAddress,
        newHolderAddress,
        encryptedRemarks,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferOwners failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.transferOwners(
    newBeneficiaryAddress,
    newHolderAddress,
    encryptedRemarks,
    txOptions,
  );
};
