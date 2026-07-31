import { Signer as SignerV6 } from 'ethersV6';
import { Signer } from 'ethers';
import { executeEscrowMethod, getEncryptedRemarks } from './utils';
import {
  NominateObligationParams,
  ObligationContractOptions,
  ObligationTransactionResponse,
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
): Promise<ObligationTransactionResponse> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeEscrowMethod(
    contractOptions,
    signer,
    'transferHolder',
    [params.holderAddress, encryptedRemarks],
    options,
  );
};

const transferBeneficiaryObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: TransferObligationBeneficiaryParams,
  options: TransactionOptions,
): Promise<ObligationTransactionResponse> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeEscrowMethod(
    contractOptions,
    signer,
    'transferBeneficiary',
    [params.newBeneficiaryAddress, encryptedRemarks],
    options,
  );
};

const nominateObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: NominateObligationParams,
  options: TransactionOptions,
): Promise<ObligationTransactionResponse> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeEscrowMethod(
    contractOptions,
    signer,
    'nominate',
    [params.newBeneficiaryAddress, encryptedRemarks],
    options,
  );
};

const transferOwnersObligationRegistry = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  params: TransferObligationOwnersParams,
  options: TransactionOptions,
): Promise<ObligationTransactionResponse> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeEscrowMethod(
    contractOptions,
    signer,
    'transferOwners',
    [params.newBeneficiaryAddress, params.newHolderAddress, encryptedRemarks],
    options,
  );
};

export {
  transferHolderObligationRegistry,
  transferBeneficiaryObligationRegistry,
  nominateObligationRegistry,
  transferOwnersObligationRegistry,
};
