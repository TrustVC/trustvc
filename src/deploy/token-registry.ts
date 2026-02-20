/**
 * Token Registry Deployment Module
 *
 * This module provides functionality to deploy TradeTrust Token Registry contracts
 * with support for both ethers v5 and v6 signers. It handles two deployment modes:
 *
 * 1. **Quick-start mode** (default): Uses a pre-deployed deployer contract and implementation
 *    - Faster deployment with lower gas costs
 *    - Requires network to have deployer and implementation contracts
 *
 * 2. **Standalone mode**: Deploys a fresh Token Registry contract from scratch
 *    - Works on any network with a supported Title Escrow Factory
 *    - Higher gas costs but more flexible
 */

import {
  TDocDeployer__factory,
  TradeTrustToken__factory,
} from '@tradetrust-tt/token-registry/contracts';
import { GasValue } from '../token-registry-functions/types';
import {
  getChainIdSafe,
  getDefaultContractAddress,
  getTxOptions,
  isSupportedTitleEscrowFactory,
  isValidAddress,
} from '../token-registry-functions/utils';
import { encodeInitParams } from '../token-registry-v5/utils';
import { CHAIN_ID } from '../utils';
import {
  getEthersContractFactoryFromProvider,
  getEthersContractFromProvider,
  isV6EthersProvider,
} from '../utils/ethers';
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

/**
 * Union type for transaction receipts from both ethers v5 and v6
 */
export type TransactionReceipt = ContractReceiptV5 | ContractReceiptV6;

/**
 * Configuration options for Token Registry deployment
 */
export interface DeployOptions {
  // Chain ID for deployment (auto-detected if not provided)
  chainId?: CHAIN_ID;
  // Maximum fee per gas unit (EIP-1559)
  maxFeePerGas?: GasValue;
  // Maximum priority fee per gas (EIP-1559)
  maxPriorityFeePerGas?: GasValue;
  // If true, deploys standalone contract; if false, uses deployer contract
  standalone?: boolean;
  // Custom Title Escrow Factory address (for standalone mode)
  factoryAddress?: string;
  // Custom Token Registry implementation address (for quick-start mode)
  tokenRegistryImplAddress?: string;
  // Custom deployer contract address (for quick-start mode)
  deployerContractAddress?: string;
}

/**
 * Deploys a new Token Registry contract with automatic mode selection.
 *
 * **Deployment Modes:**
 * - **Quick-start** (default): Uses pre-deployed contracts for faster, cheaper deployment
 * - **Standalone**: Deploys fresh contract when quick-start is unavailable
 *
 * **Ethers Compatibility:**
 * - Automatically detects and handles both ethers v5 and v6 signers
 * - Returns appropriate receipt type based on signer version
 * @param {string} registryName - The name of the token registry (e.g., "My Token Registry")
 * @param {string} registrySymbol - The symbol of the token registry (e.g., "MTR")
 * @param {SignerV5 | SignerV6} signer - Signer instance that authorizes the deployment
 * @param {DeployOptions} options - Configuration options for deployment
 * @returns {Promise<TransactionReceipt>} Transaction receipt with deployed contract address
 * @throws {Error} If network is not supported and no custom addresses provided
 * @throws {Error} If Title Escrow Factory is not supported (standalone mode)
 * @throws {Error} If deployment transaction fails
 * @example
 * ```typescript
 * // Quick-start deployment
 * const receipt = await deployTokenRegistry(
 *   "My Registry",
 *   "MTR",
 *   signer,
 *   { chainId: CHAIN_ID.SEPOLIA }
 * );
 *
 * // Standalone deployment with custom factory
 * const receipt = await deployTokenRegistry(
 *   "My Registry",
 *   "MYR",
 *   signer,
 *   {
 *     standalone: true,
 *     factoryAddress: "0x..."
 *   }
 * );
 * ```
 */

export const deployTokenRegistry = async (
  registryName: string,
  registrySymbol: string,
  signer: SignerV5 | SignerV6,
  options: DeployOptions,
): Promise<TransactionReceipt> => {
  // Extract gas options
  const { maxFeePerGas, maxPriorityFeePerGas } = options;
  let { chainId, standalone, factoryAddress, tokenRegistryImplAddress, deployerContractAddress } =
    options;

  // Get deployer's address for initialization
  const deployerAddress = await signer.getAddress();

  // Auto-detect chain ID if not provided
  if (!chainId) {
    chainId = (await getChainIdSafe(signer)) as unknown as CHAIN_ID;
  }
  // Get default contract addresses for this chain
  const {
    TitleEscrowFactory: defaultTitleEscrowFactoryAddress,
    TokenImplementation: defaultTokenImplementationContractAddress,
    Deployer: defaultDeployerContractAddress,
  } = getDefaultContractAddress(chainId);

  // Use default addresses if custom ones not provided or invalid
  if (!isValidAddress(deployerContractAddress)) {
    deployerContractAddress = defaultDeployerContractAddress;
  }
  if (!isValidAddress(tokenRegistryImplAddress)) {
    tokenRegistryImplAddress = defaultTokenImplementationContractAddress;
  }

  // Auto-switch to standalone mode if quick-start contracts unavailable
  if (standalone !== false && (!deployerContractAddress || !tokenRegistryImplAddress)) {
    console.error(
      `Network ${chainId} does not support "quick-start" mode. Defaulting to standalone mode.`,
    );
    standalone = true;
  }

  // === QUICK-START MODE: Use pre-deployed contracts ===
  if (!standalone) {
    // Validate required contracts are available
    if (!deployerContractAddress || !tokenRegistryImplAddress) {
      throw new Error(`Network ${chainId} currently is not supported. Use --standalone instead.`);
    }

    // Get appropriate Contract class for signer version (v5 or v6)
    const Contract = getEthersContractFromProvider(signer.provider);

    // Connect to the deployer contract
    const deployerContract = new Contract(
      deployerContractAddress,
      TDocDeployer__factory.abi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer as any, // Type assertion needed for v5/v6 compatibility
    );

    // Encode initialization parameters for the Token Registry
    const initParam = encodeInitParams({
      name: registryName,
      symbol: registrySymbol,
      deployer: deployerAddress,
    });

    // Get transaction options (gas settings)
    const txOptions = await getTxOptions(
      signer,
      chainId as unknown as CHAIN_ID,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    // Deploy using the deployer contract (creates a minimal proxy)
    return await deployerContract.deploy(tokenRegistryImplAddress, initParam, txOptions);
  } else {
    // === STANDALONE MODE: Deploy fresh contract ===

    // Validate or use default Title Escrow Factory address
    if (!factoryAddress || !isValidAddress(factoryAddress)) {
      factoryAddress = defaultTitleEscrowFactoryAddress;
      if (!factoryAddress) {
        throw new Error(`Network ${chainId} currently is not supported. Supply a factory address.`);
      }
    }

    // Verify the Title Escrow Factory supports required interface
    const supportedTitleEscrowFactory = await isSupportedTitleEscrowFactory(
      factoryAddress,
      signer.provider,
    );
    if (!supportedTitleEscrowFactory) {
      throw new Error(`Title Escrow Factory ${factoryAddress} is not supported.`);
    }

    // Get appropriate ContractFactory class for signer version
    const Contract = getEthersContractFactoryFromProvider(signer.provider);
    // Create contract factory with Token Registry bytecode
    const tokenFactory = new Contract(
      TradeTrustToken__factory.abi,
      TradeTrustToken__factory.bytecode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer as any, // Type assertion needed for v5/v6 compatibility
    );

    // Detect signer version for proper deployment handling
    const isV6 = isV6EthersProvider(signer.provider);
    const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
    // Deploy contract with version-specific handling
    if (isV6) {
      // Ethers v6: Use deploymentTransaction() method
      const contract = await (tokenFactory as ContractFactoryV6).deploy(
        registryName,
        registrySymbol,
        factoryAddress,
        txOptions,
      );
      return await contract.deploymentTransaction()?.wait();
    } else {
      // Ethers v5: Use deployTransaction property
      const contract = await (tokenFactory as ContractFactoryV5).deploy(
        registryName,
        registrySymbol,
        factoryAddress,
        txOptions,
      );
      return await contract.deployTransaction.wait();
    }
  }
};
