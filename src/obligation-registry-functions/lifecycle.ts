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

const acceptObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRemarkParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);

  await runStaticCall(obligationEscrowContract, 'accept', [encryptedRemarks], signer.provider);
  return sendTransaction(obligationEscrowContract, 'accept', [encryptedRemarks], signer, options);
};

const rejectObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRemarkParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);

  await runStaticCall(obligationEscrowContract, 'reject', [encryptedRemarks], signer.provider);
  return sendTransaction(obligationEscrowContract, 'reject', [encryptedRemarks], signer, options);
};

const dischargeObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRemarkParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);

  await runStaticCall(obligationEscrowContract, 'discharge', [encryptedRemarks], signer.provider);
  return sendTransaction(
    obligationEscrowContract,
    'discharge',
    [encryptedRemarks],
    signer,
    options,
  );
};

export { acceptObligationRegistry, rejectObligationRegistry, dischargeObligationRegistry };
