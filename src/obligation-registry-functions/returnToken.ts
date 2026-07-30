import { checkSupportsInterface } from '../core';
import { v5SupportInterfaceIds } from '../token-registry-v5';
import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  AcceptReturnedObligationOptions,
  AcceptReturnedObligationParams,
  ObligationContractOptions,
  ObligationRemarkParams,
  RejectReturnedObligationOptions,
  RejectReturnedObligationParams,
  TransactionOptions,
} from './types';
import {
  getEncryptedRemarks,
  getObligationEscrowContract,
  getObligationRegistryContract,
  getTxOptions,
  resolveObligationEscrowAddress,
  runStaticCall,
  sendTransaction,
} from './utils';

const returnToIssuerObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRemarkParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  const args = [encryptedRemarks];

  await runStaticCall(obligationEscrowContract, 'returnToIssuer', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'returnToIssuer', args, signer, options);
};

const acceptReturnedObligationRegistry = async (
  contractOptions: AcceptReturnedObligationOptions,
  signer: Signer | SignerV6,
  params: AcceptReturnedObligationParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { obligationRegistryAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  if (!obligationRegistryAddress) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');

  const isSupported = await checkSupportsInterface(
    obligationRegistryAddress,
    v5SupportInterfaceIds.TradeTrustTokenBurnable,
    signer.provider,
  );
  if (!isSupported) {
    throw new Error('Only TrustVCToken obligation registry is supported');
  }

  const { tokenId, remarks } = params;
  const obligationRegistryContract = getObligationRegistryContract(
    obligationRegistryAddress,
    signer,
  );
  const encryptedRemarks = getEncryptedRemarks(remarks, options.id);
  const args = [tokenId, encryptedRemarks];

  await runStaticCall(obligationRegistryContract, 'burn', args, signer.provider);

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return obligationRegistryContract.burn(tokenId, encryptedRemarks, txOptions);
};

const rejectReturnedObligationRegistry = async (
  contractOptions: RejectReturnedObligationOptions,
  signer: Signer | SignerV6,
  params: RejectReturnedObligationParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { obligationRegistryAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  if (!obligationRegistryAddress) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');

  const isSupported = await checkSupportsInterface(
    obligationRegistryAddress,
    v5SupportInterfaceIds.TradeTrustTokenRestorable,
    signer.provider,
  );
  if (!isSupported) {
    throw new Error('Only TrustVCToken obligation registry is supported');
  }

  const { tokenId, remarks } = params;
  const obligationRegistryContract = getObligationRegistryContract(
    obligationRegistryAddress,
    signer,
  );
  const encryptedRemarks = getEncryptedRemarks(remarks, options.id);
  const args = [tokenId, encryptedRemarks];

  await runStaticCall(obligationRegistryContract, 'restore', args, signer.provider);

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return obligationRegistryContract.restore(tokenId, encryptedRemarks, txOptions);
};

export {
  returnToIssuerObligationRegistry,
  acceptReturnedObligationRegistry,
  rejectReturnedObligationRegistry,
};
