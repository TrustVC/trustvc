import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  ObligationEscrowContractOptions,
  ObligationRegistryTransactionOptions,
  ObligationRejectTransferParams,
} from './types';
import {
  callStaticThenSend,
  connectObligationEscrow,
  encryptRemarks,
  resolveObligationEscrowAddress,
} from './utils';

const rejectTransfer =
  (method: 'rejectTransferHolder' | 'rejectTransferBeneficiary' | 'rejectTransferOwners') =>
  async (
    contractOptions: ObligationEscrowContractOptions,
    signer: Signer | SignerV6,
    params: ObligationRejectTransferParams,
    options: ObligationRegistryTransactionOptions = {},
  ): Promise<ContractTransaction> => {
    if (!signer.provider) throw new Error('Provider is required');
    const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
    return callStaticThenSend(
      connectObligationEscrow(escrowAddress, signer),
      method,
      [encryptRemarks(params.remarks, options.id)],
      signer,
      options,
    );
  };

export const rejectTransferHolderObligationRegistry = rejectTransfer('rejectTransferHolder');
export const rejectTransferBeneficiaryObligationRegistry = rejectTransfer(
  'rejectTransferBeneficiary',
);
export const rejectTransferOwnersObligationRegistry = rejectTransfer('rejectTransferOwners');
