import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  ACCEPT,
  AcceptObligationRegistryParams,
  DISCHARGE,
  DischargeObligationRegistryParams,
  ObligationRegistryContractOptions,
  ObligationRegistryTransactionOptions,
  ObligationStatusActionName,
  REJECT,
  RejectObligationRegistryParams,
} from './types';
import {
  callStaticThenSend,
  connectObligationEscrow,
  encryptRemarks,
  getObligationEscrowAddress,
} from './utils';

type EscrowRemarksParams =
  | AcceptObligationRegistryParams
  | RejectObligationRegistryParams
  | DischargeObligationRegistryParams;

const createEscrowRemarksAction =
  (method: ObligationStatusActionName) =>
  async (
    contractOptions: ObligationRegistryContractOptions,
    signer: Signer | SignerV6,
    params: EscrowRemarksParams,
    options: ObligationRegistryTransactionOptions = {},
  ): Promise<ContractTransaction> => {
    const { obligationRegistry } = contractOptions;
    if (!obligationRegistry) throw new Error('Obligation registry address is required');
    if (!signer.provider) throw new Error('Provider is required');
    const { tokenId, remarks } = params;
    const escrowAddress = await getObligationEscrowAddress(
      obligationRegistry,
      tokenId,
      signer.provider,
    );
    return callStaticThenSend(
      connectObligationEscrow(escrowAddress, signer),
      method,
      [encryptRemarks(remarks, options.id)],
      signer,
      options,
    );
  };

export const acceptObligationRegistry = createEscrowRemarksAction(ACCEPT);
export const rejectObligationRegistry = createEscrowRemarksAction(REJECT);
export const dischargeObligationRegistry = createEscrowRemarksAction(DISCHARGE);
