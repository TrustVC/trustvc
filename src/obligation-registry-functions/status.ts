import { Signer as SignerV6 } from 'ethersV6';
import { Signer } from 'ethers';
import {
  ObligationContractOptions,
  ObligationDocumentStatus,
  ObligationEscrowTerminationReason,
  ObligationStatusReadOptions,
  ObligationTokenIdParams,
} from './types';
import { getObligationEscrowContract, resolveObligationEscrowAddress } from './utils';

const getObligationRegistryStatus = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  // Unused; escrow resolution uses contractOptions.tokenId (API parity).
  _params: ObligationTokenIdParams,
  options: ObligationStatusReadOptions = {},
): Promise<ObligationDocumentStatus> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const status = await obligationEscrowContract.status({ blockTag: options.blockTag });

  return Number(status) as ObligationDocumentStatus;
};

const isObligationRegistryRegistered = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  // Unused; escrow resolution uses contractOptions.tokenId (API parity).
  _params: ObligationTokenIdParams,
  options: ObligationStatusReadOptions = {},
): Promise<boolean> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);

  return obligationEscrowContract.isRegistered({ blockTag: options.blockTag });
};

const getObligationEscrowTerminationReason = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  // Unused; escrow resolution uses contractOptions.tokenId (API parity).
  _params: ObligationTokenIdParams,
  options: ObligationStatusReadOptions = {},
): Promise<ObligationEscrowTerminationReason> => {
  if (!signer.provider) throw new Error('Provider is required');

  const obligationEscrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  const obligationEscrowContract = getObligationEscrowContract(obligationEscrowAddress, signer);
  const reason = await obligationEscrowContract.terminationReason({ blockTag: options.blockTag });

  return Number(reason) as ObligationEscrowTerminationReason;
};

export {
  getObligationRegistryStatus,
  isObligationRegistryRegistered,
  getObligationEscrowTerminationReason,
};
