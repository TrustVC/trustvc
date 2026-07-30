import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  getEncryptedRemarks,
  getObligationEscrowContract,
  resolveObligationEscrowAddress,
  runStaticCall,
  sendTransaction,
} from './utils';
import {
  NominateObligationParams,
  ObligationContractOptions,
  TransactionOptions,
  TransferObligationBeneficiaryParams,
  TransferObligationHolderParams,
  TransferObligationOwnersParams,
} from './types';

const transferHolderObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: TransferObligationHolderParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  const args = [params.holderAddress, encryptedRemarks];

  await runStaticCall(obligationEscrowContract, 'transferHolder', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'transferHolder', args, signer, options);
};

const transferBeneficiaryObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: TransferObligationBeneficiaryParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  const args = [params.newBeneficiaryAddress, encryptedRemarks];

  await runStaticCall(obligationEscrowContract, 'transferBeneficiary', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'transferBeneficiary', args, signer, options);
};

const nominateObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: NominateObligationParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  const args = [params.newBeneficiaryAddress, encryptedRemarks];

  await runStaticCall(obligationEscrowContract, 'nominate', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'nominate', args, signer, options);
};

const transferOwnersObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: TransferObligationOwnersParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  const args = [params.newHolderAddress, params.newBeneficiaryAddress, encryptedRemarks];

  await runStaticCall(obligationEscrowContract, 'transferOwners', args, signer.provider);
  return sendTransaction(obligationEscrowContract, 'transferOwners', args, signer, options);
};

export {
  transferHolderObligationRegistry,
  transferBeneficiaryObligationRegistry,
  nominateObligationRegistry,
  transferOwnersObligationRegistry,
};
