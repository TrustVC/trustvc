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

  // Role should be the actual contract method name (e.g., 'DEFAULT_ADMIN_ROLE', 'ISSUER_ROLE', 'REVOKER_ROLE')
  if (typeof documentStore[role as keyof typeof documentStore] !== 'function') {
    throw new Error(`Invalid role: ${role}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (documentStore as any)[role]();
};

export const rolesList = ['DEFAULT_ADMIN_ROLE', 'ISSUER_ROLE', 'REVOKER_ROLE'];
