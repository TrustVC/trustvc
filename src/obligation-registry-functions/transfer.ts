import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  ObligationEscrowContractOptions,
  ObligationNominateParams,
  ObligationRegistryTransactionOptions,
  ObligationTransferBeneficiaryParams,
  ObligationTransferHolderParams,
  ObligationTransferOwnersParams,
} from './types';
import {
  callStaticThenSend,
  connectObligationEscrow,
  encryptRemarks,
  resolveObligationEscrowAddress,
} from './utils';

const withEscrowContract = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
) => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  return connectObligationEscrow(escrowAddress, signer);
};

export const nominateObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationNominateParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { newBeneficiaryAddress, remarks } = params;
  return callStaticThenSend(
    await withEscrowContract(contractOptions, signer),
    'nominate',
    [newBeneficiaryAddress, encryptRemarks(remarks, options.id)],
    signer,
    options,
  );
};

export const transferBeneficiaryObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationTransferBeneficiaryParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { newBeneficiaryAddress, remarks } = params;
  return callStaticThenSend(
    await withEscrowContract(contractOptions, signer),
    'transferBeneficiary',
    [newBeneficiaryAddress, encryptRemarks(remarks, options.id)],
    signer,
    options,
  );
};

export const transferHolderObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationTransferHolderParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { holderAddress, remarks } = params;
  return callStaticThenSend(
    await withEscrowContract(contractOptions, signer),
    'transferHolder',
    [holderAddress, encryptRemarks(remarks, options.id)],
    signer,
    options,
  );
};

export const transferOwnersObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationTransferOwnersParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { newBeneficiaryAddress, newHolderAddress, remarks } = params;
  return callStaticThenSend(
    await withEscrowContract(contractOptions, signer),
    'transferOwners',
    [newBeneficiaryAddress, newHolderAddress, encryptRemarks(remarks, options.id)],
    signer,
    options,
  );
};
