import { checkSupportsInterface } from '../core';
import { v5Contracts, v5SupportInterfaceIds } from '../token-registry-v5';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Contract as ContractV5, Signer } from 'ethers';
import { getEthersContractFromProvider } from '../utils/ethers';
import {
  OwnerOfObligationTokenOptions,
  OwnerOfObligationTokenParams,
  TransactionOptions,
} from './types';

const ownerOfObligationRegistry = async (
  contractOptions: OwnerOfObligationTokenOptions,
  signer: Signer | SignerV6,
  params: OwnerOfObligationTokenParams,
  // Kept for API parity with other obligation-registry functions.
  _options: TransactionOptions,
): Promise<string> => {
  const { obligationRegistryAddress } = contractOptions;
  const { obligationRegistryAddress } = contractOptions;
  const { tokenId } = params;

  if (!obligationRegistryAddress) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');

  const isSupported = await checkSupportsInterface(
    obligationRegistryAddress,
    v5SupportInterfaceIds.SBT,
    signer.provider,
  );
  if (!isSupported) {
    throw new Error('Only TrustVCToken obligation registry is supported');
  }

  const Contract = getEthersContractFromProvider(signer.provider);
  const obligationRegistryContract = new Contract(
    obligationRegistryAddress,
    v5Contracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  ) as ContractV5 | ContractV6;

  return obligationRegistryContract.ownerOf(tokenId);
};

export { ownerOfObligationRegistry };
