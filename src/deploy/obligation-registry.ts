import { GasValue } from '../token-registry-functions/types';
import { getChainIdSafe, getTxOptions } from '../token-registry-functions/utils';
import { obligationRegistryContracts } from '../obligation-registry';
import { CHAIN_ID } from '../utils';
import { getEthersContractFactoryFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  Signer as SignerV6,
  ContractTransactionReceipt as ContractReceiptV6,
  ContractFactory as ContractFactoryV6,
} from 'ethersV6';
import {
  Signer as SignerV5,
  ContractReceipt as ContractReceiptV5,
  ContractFactory as ContractFactoryV5,
} from 'ethers';

export type ObligationRegistryTransactionReceipt = ContractReceiptV5 | ContractReceiptV6;
type TransactionReceipt = ObligationRegistryTransactionReceipt;

export interface ObligationRegistryDeployOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: GasValue;
  maxPriorityFeePerGas?: GasValue;
}

export interface DeployObligationRegistryOptions extends ObligationRegistryDeployOptions {
  /** Existing ObligationEscrowFactory; if omitted a fresh one is deployed first. */
  escrowFactoryAddress?: string;
}

export interface DeployObligationEscrowFactoryResult {
  receipt: TransactionReceipt;
  obligationEscrowFactoryAddress: string;
}

export interface DeployObligationRegistryResult {
  receipt: TransactionReceipt;
  obligationRegistry: string;
  obligationEscrowFactoryAddress: string;
}

const deployAndWait = async (
  factory: ContractFactoryV5 | ContractFactoryV6,
  signer: SignerV5 | SignerV6,
  args: unknown[],
): Promise<{ receipt: TransactionReceipt; contractAddress: string }> => {
  if (isV6EthersProvider(signer.provider)) {
    const contract = await (factory as ContractFactoryV6).deploy(...args);
    const receipt = await contract.deploymentTransaction()?.wait();
    if (!receipt) throw new Error('Deployment receipt missing');
    return { receipt, contractAddress: await contract.getAddress() };
  }
  const contract = await (factory as ContractFactoryV5).deploy(...args);
  const receipt = await contract.deployTransaction.wait();
  return { receipt, contractAddress: contract.address };
};

/**
 * Deploys a standalone `ObligationEscrowFactory` (classic TitleEscrowFactory deploy step).
 * @param {SignerV5 | SignerV6} signer - Signer that authorizes deployment.
 * @param {ObligationRegistryDeployOptions} [options] - Chain ID and gas options.
 * @returns {Promise<DeployObligationEscrowFactoryResult>} Deployment receipt and factory address.
 */
export const deployObligationEscrowFactory = async (
  signer: SignerV5 | SignerV6,
  options: ObligationRegistryDeployOptions = {},
): Promise<DeployObligationEscrowFactoryResult> => {
  if (!signer.provider) throw new Error('Provider is required');
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  const resolvedChainId = (chainId ?? (await getChainIdSafe(signer))) as CHAIN_ID;
  const txOptions = await getTxOptions(signer, resolvedChainId, maxFeePerGas, maxPriorityFeePerGas);
  const ContractFactory = getEthersContractFactoryFromProvider(signer.provider);
  const factoryDeployer = new ContractFactory(
    obligationRegistryContracts.ObligationEscrowFactory__factory.abi,
    obligationRegistryContracts.ObligationEscrowFactory__factory.bytecode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const { receipt, contractAddress } = await deployAndWait(factoryDeployer, signer, [txOptions]);
  return { receipt, obligationEscrowFactoryAddress: contractAddress };
};

/**
 * Deploys `TrustVCToken(name, symbol, escrowFactory)` like classic `TradeTrustToken`.
 * Reuses an existing factory when `options.escrowFactoryAddress` is supplied.
 * @param {string} registryName - Human-readable registry name.
 * @param {string} registrySymbol - Token symbol for the registry.
 * @param {SignerV5 | SignerV6} signer - Signer that authorizes deployment.
 * @param {DeployObligationRegistryOptions} [options] - Factory reuse, chain ID, and gas options.
 * @returns {Promise<DeployObligationRegistryResult>} Deployment receipt and contract addresses.
 */
export const deployObligationRegistry = async (
  registryName: string,
  registrySymbol: string,
  signer: SignerV5 | SignerV6,
  options: DeployObligationRegistryOptions = {},
): Promise<DeployObligationRegistryResult> => {
  if (!signer.provider) throw new Error('Provider is required');
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  let { escrowFactoryAddress } = options;
  if (!escrowFactoryAddress) {
    console.warn('No escrowFactoryAddress supplied — deploying a fresh ObligationEscrowFactory.');
    ({ obligationEscrowFactoryAddress: escrowFactoryAddress } = await deployObligationEscrowFactory(
      signer,
      {
        chainId,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
    ));
  }
  const resolvedChainId = (chainId ?? (await getChainIdSafe(signer))) as CHAIN_ID;
  const txOptions = await getTxOptions(signer, resolvedChainId, maxFeePerGas, maxPriorityFeePerGas);
  const ContractFactory = getEthersContractFactoryFromProvider(signer.provider);
  const tokenDeployer = new ContractFactory(
    obligationRegistryContracts.TrustVCToken__factory.abi,
    obligationRegistryContracts.TrustVCToken__factory.bytecode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const { receipt, contractAddress } = await deployAndWait(tokenDeployer, signer, [
    registryName,
    registrySymbol,
    escrowFactoryAddress,
    txOptions,
  ]);
  return {
    receipt,
    obligationRegistry: contractAddress,
    obligationEscrowFactoryAddress: escrowFactoryAddress,
  };
};
