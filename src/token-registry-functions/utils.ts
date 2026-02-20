import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import { DeployContractAddress, GasValue } from './types';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../utils';
import { Signer, providers } from 'ethers';
import { isAddress, Signer as SignerV6, Provider as ProviderV6 } from 'ethersV6';
import { constants, v5Contracts } from '../token-registry-v5';

const getTxOptions = async (
  signer: SignerV6 | Signer,
  chainId: CHAIN_ID,
  maxFeePerGas: GasValue,
  maxPriorityFeePerGas: GasValue,
) => {
  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
    const gasStation = SUPPORTED_CHAINS[chainId]?.gasStation;

    if (gasStation) {
      const gasFees = await gasStation();
      maxFeePerGas = gasFees?.maxFeePerGas ?? 0;
      maxPriorityFeePerGas = gasFees?.maxPriorityFeePerGas ?? 0;
    }
  }
  return maxFeePerGas && maxPriorityFeePerGas ? { maxFeePerGas, maxPriorityFeePerGas } : {};
};

// 🔍 Handles both Ethers v5 and v6 signer types
const getChainIdSafe = async (signer: SignerV6 | Signer): Promise<bigint | number> => {
  if (isV6EthersProvider(signer.provider)) {
    const network = await (signer as SignerV6).provider?.getNetwork();
    if (!network?.chainId) throw new Error('Cannot determine chainId: provider is missing');
    return network.chainId;
  }
  return await (signer as Signer).getChainId();
};

const getSignerAddressSafe = async (signer: SignerV6 | Signer): Promise<string> => {
  if (isV6EthersProvider(signer.provider)) {
    return await (signer as SignerV6).getAddress();
  }
  return await (signer as unknown as Signer).getAddress();
};

const { contractInterfaceId: CONTRACT_INTERFACE_ID, contractAddress: CONTRACT_ADDRESS } = constants;

const getDefaultContractAddress = (chainId: CHAIN_ID): DeployContractAddress => {
  const { TitleEscrowFactory, TokenImplementation, Deployer } = CONTRACT_ADDRESS;
  const chainTitleEscrowFactory = TitleEscrowFactory[chainId];
  const chainTokenImplementation = TokenImplementation[chainId];
  const chainDeployer = Deployer[chainId];
  return {
    TitleEscrowFactory: chainTitleEscrowFactory,
    TokenImplementation: chainTokenImplementation,
    Deployer: chainDeployer,
  };
};

const isValidAddress = (address?: string): boolean => {
  if (!address) return false;
  return isAddress(address);
};

export const isSupportedTitleEscrowFactory = async (
  factoryAddress: string,
  provider?: providers.Provider | ProviderV6,
): Promise<boolean> => {
  const Contract = getEthersContractFromProvider(provider);
  const titleEscrowFactoryContract = new Contract(
    factoryAddress,
    ['function implementation() view returns (address)'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  ) as unknown as v5Contracts.TitleEscrowFactory;
  const implAddr = await titleEscrowFactoryContract.implementation();

  const implContract = new Contract(
    implAddr,
    ['function supportsInterface(bytes4 interfaceId) view returns (bool)'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  const { TitleEscrow: titleEscrowInterfaceId } = CONTRACT_INTERFACE_ID;
  return implContract.supportsInterface(titleEscrowInterfaceId);
};

export {
  getChainIdSafe,
  getTxOptions,
  getSignerAddressSafe,
  getDefaultContractAddress,
  isValidAddress,
};
