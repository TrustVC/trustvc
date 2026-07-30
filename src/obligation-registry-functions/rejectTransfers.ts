import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  getEncryptedRemarks,
  getObligationEscrowContract,
  resolveObligationEscrowAddress,
  runStaticCall,
  sendTransaction,
} from './utils';
import { ObligationContractOptions, ObligationRemarkParams, TransactionOptions } from './types';

const rejectTransferHolderObligationRegistry = async (
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

  await runStaticCall(obligationEscrowContract, 'rejectTransferHolder', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'rejectTransferHolder', args, signer, options);
};

const rejectTransferBeneficiaryObligationRegistry = async (
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

  await runStaticCall(obligationEscrowContract, 'rejectTransferBeneficiary', args, signer.provider);
  return sendTransaction(
    obligationEscrowContract,
    'rejectTransferBeneficiary',
    args,
    signer,
    options,
  );
};

const rejectTransferOwnersObligationRegistry = async (
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

  await runStaticCall(obligationEscrowContract, 'rejectTransferOwners', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'rejectTransferOwners', args, signer, options);
};

export {
  rejectTransferHolderObligationRegistry,
  rejectTransferBeneficiaryObligationRegistry,
  rejectTransferOwnersObligationRegistry,
};
