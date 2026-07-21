import { Signer as SignerV6 } from 'ethersV6';
import { Signer } from 'ethers';
import {
  DocumentStatus,
  ObligationEscrowTerminationReason,
  ObligationRegistryContractOptions,
  ObligationRegistryReadOptions,
  ObligationRegistryReadParams,
} from './types';
import { connectObligationEscrow, getObligationEscrowAddress } from './utils';

const getEscrowForRead = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRegistryReadParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const { obligationRegistry } = contractOptions;
  const { tokenId } = params;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await getObligationEscrowAddress(
    obligationRegistry,
    tokenId,
    signer.provider,
  );
  return connectObligationEscrow(escrowAddress, signer);
};

export const getObligationRegistryStatus = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRegistryReadParams,
  options: ObligationRegistryReadOptions = {},
): Promise<DocumentStatus> => {
  const obligationEscrowContract = await getEscrowForRead(contractOptions, signer, params);
  const status =
    options.blockTag !== undefined
      ? await obligationEscrowContract.status({ blockTag: options.blockTag })
      : await obligationEscrowContract.status();
  return Number(status) as DocumentStatus;
};

export const isObligationRegistryRegistered = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRegistryReadParams,
  options: ObligationRegistryReadOptions = {},
): Promise<boolean> => {
  const obligationEscrowContract = await getEscrowForRead(contractOptions, signer, params);
  return options.blockTag !== undefined
    ? await obligationEscrowContract.isRegistered({ blockTag: options.blockTag })
    : await obligationEscrowContract.isRegistered();
};

export const getObligationEscrowTerminationReason = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRegistryReadParams,
  options: ObligationRegistryReadOptions = {},
): Promise<ObligationEscrowTerminationReason> => {
  const obligationEscrowContract = await getEscrowForRead(contractOptions, signer, params);
  const reason =
    options.blockTag !== undefined
      ? await obligationEscrowContract.terminationReason({ blockTag: options.blockTag })
      : await obligationEscrowContract.terminationReason();
  return Number(reason) as ObligationEscrowTerminationReason;
};
