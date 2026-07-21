import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  ObligationAcceptReturnedOptions,
  ObligationAcceptReturnedParams,
  ObligationEscrowContractOptions,
  ObligationRegistryTransactionOptions,
  ObligationRejectReturnedOptions,
  ObligationRejectReturnedParams,
  ObligationReturnToIssuerParams,
} from './types';
import {
  callStaticThenSend,
  connectObligationEscrow,
  connectTrustVCToken,
  encryptRemarks,
  resolveObligationEscrowAddress,
} from './utils';

export const returnToIssuerObligationRegistry = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
  params: ObligationReturnToIssuerParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await resolveObligationEscrowAddress(contractOptions, signer);
  return callStaticThenSend(
    connectObligationEscrow(escrowAddress, signer),
    'returnToIssuer',
    [encryptRemarks(params.remarks, options.id)],
    signer,
    options,
  );
};

export const acceptReturnedObligationRegistry = async (
  contractOptions: ObligationAcceptReturnedOptions,
  signer: Signer | SignerV6,
  params: ObligationAcceptReturnedParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;
  return callStaticThenSend(
    connectTrustVCToken(obligationRegistry, signer),
    'burn',
    [tokenId, encryptRemarks(remarks, options.id)],
    signer,
    options,
    'acceptReturned',
  );
};

export const rejectReturnedObligationRegistry = async (
  contractOptions: ObligationRejectReturnedOptions,
  signer: Signer | SignerV6,
  params: ObligationRejectReturnedParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;
  return callStaticThenSend(
    connectTrustVCToken(obligationRegistry, signer),
    'restore',
    [tokenId, encryptRemarks(remarks, options.id)],
    signer,
    options,
    'rejectReturned',
  );
};
