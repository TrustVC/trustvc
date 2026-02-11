import { utils } from '@tradetrust-tt/tt-verify';
import { Provider, Contract as ContractV6 } from 'ethersV6';
import { providers, Contract as ContractV5 } from 'ethers';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../utils';
import { getEthersContractFromProvider } from '../utils/ethers';
import { TT_DOCUMENT_STORE_ABI } from './tt-document-store-abi';

interface CallOptions {
  chainId?: CHAIN_ID;
  provider?: Provider | providers.Provider;
}

export const getRoleString = async (
  documentStoreAddress: string,
  role: string,
  options?: CallOptions,
): Promise<string> => {
  const { chainId } = options || {};
  let provider = options?.provider;

  if (!provider) {
    if (!chainId) throw new Error('Either provider or chainId must be provided');
    provider = utils.getProvider({ network: SUPPORTED_CHAINS[chainId].name });
  }

  const Contract = getEthersContractFromProvider(provider);
  const documentStore: ContractV5 | ContractV6 = new Contract(
    documentStoreAddress,
    TT_DOCUMENT_STORE_ABI,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  switch (role) {
    case 'admin':
      return await documentStore.DEFAULT_ADMIN_ROLE();
    case 'issuer':
      return await documentStore.ISSUER_ROLE();
    case 'revoker':
      return await documentStore.REVOKER_ROLE();
    default:
      throw new Error('Invalid role');
  }
};

export const rolesList = ['admin', 'issuer', 'revoker'];
