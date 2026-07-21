import { Signer as SignerV6 } from 'ethersV6';
import { Signer } from 'ethers';
import { obligationRegistryContracts } from '../obligation-registry';
import { getEthersContractFromProvider } from '../utils/ethers';
import {
  DocumentStatus,
  ObligationEscrowTerminationReason,
  ObligationRegistryContractOptions,
  ObligationRegistryReadOptions,
  ObligationRegistryReadParams,
} from './types';
import { getObligationEscrowAddress } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connectObligationEscrow = (escrowAddress: string, signer: Signer | SignerV6): any => {
  if (!signer.provider) throw new Error('Provider is required');
  const Contract = getEthersContractFromProvider(signer.provider);
  return new Contract(
    escrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
};

export const getObligationRegistryStatus = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRegistryReadParams,
  options: ObligationRegistryReadOptions = {},
): Promise<DocumentStatus> => {
  const { obligationRegistry } = contractOptions;
  const { tokenId } = params;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await getObligationEscrowAddress(
    obligationRegistry,
    tokenId,
    signer.provider,
  );
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const status = options.blockTag
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
  const { obligationRegistry } = contractOptions;
  const { tokenId } = params;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await getObligationEscrowAddress(
    obligationRegistry,
    tokenId,
    signer.provider,
  );
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  return options.blockTag
    ? await obligationEscrowContract.isRegistered({ blockTag: options.blockTag })
    : await obligationEscrowContract.isRegistered();
};

export const getObligationEscrowTerminationReason = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: ObligationRegistryReadParams,
  options: ObligationRegistryReadOptions = {},
): Promise<ObligationEscrowTerminationReason> => {
  const { obligationRegistry } = contractOptions;
  const { tokenId } = params;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const escrowAddress = await getObligationEscrowAddress(
    obligationRegistry,
    tokenId,
    signer.provider,
  );
  const obligationEscrowContract = connectObligationEscrow(escrowAddress, signer);
  const reason = options.blockTag
    ? await obligationEscrowContract.terminationReason({ blockTag: options.blockTag })
    : await obligationEscrowContract.terminationReason();
  return Number(reason) as ObligationEscrowTerminationReason;
};
