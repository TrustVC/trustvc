/**
 * Document Store Deployment Module
 *
 * This module provides functionality to deploy TrustVC Document Store contracts
 * with support for both ethers v5 and v6 signers. It supports two types of stores:
 *
 * 1. **Standard Document Store**: For issuing and revoking verifiable documents
 *    - Immutable ownership (documents cannot be transferred)
 *    - Suitable for most credential use cases
 *
 * 2. **Transferable Document Store**: For documents that can change ownership
 *    - Supports ownership transfers between addresses
 *    - Useful for transferable credentials or certificates
 */

import {
  DocumentStore__factory,
  TransferableDocumentStore__factory,
} from '@trustvc/document-store';
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
import { getEthersContractFactoryFromProvider, isV6EthersProvider } from '../utils/ethers';
import { CHAIN_ID } from '../utils';
import { GasValue } from '../token-registry-functions/types';
import { getTxOptions } from '../token-registry-functions/utils';

/**
 * Configuration options for Document Store deployment
 */
export interface DeployOptions {
  // Chain ID for deployment (auto-detected if not provided)
  chainId?: CHAIN_ID;
  // Maximum fee per gas unit (EIP-1559)
  maxFeePerGas?: GasValue;
  // Maximum priority fee per gas (EIP-1559)
  maxPriorityFeePerGas?: GasValue;
  // If true, deploys TransferableDocumentStore; if false, deploys standard DocumentStore
  isTransferable?: boolean;
}

/**
 * Union type for transaction receipts from both ethers v5 and v6
 */
export type TransactionReceipt = ContractReceiptV5 | ContractReceiptV6;

/**
 * Deploys a new Document Store contract with automatic type selection.
 * **Store Types:**
 * - **Standard** (default): Documents are immutable and cannot be transferred
 * - **Transferable**: Documents can be transferred to different owners
 * **Ethers Compatibility:**
 * - Automatically detects and handles both ethers v5 and v6 signers
 * - Returns appropriate receipt type based on signer version
 * @param {string} storeName - The name of the document store (e.g., "My University Credentials")
 * @param {string} owner - The owner address that will control the document store
 * @param {SignerV5 | SignerV6} signer - Signer instance that authorizes the deployment
 * @param {DeployOptions} options - Configuration options for deployment
 * @returns {Promise<TransactionReceipt>} Transaction receipt with deployed contract address
 * @throws {Error} If store name is not provided
 * @throws {Error} If owner address is not provided
 * @throws {Error} If signer provider is not available
 * @throws {Error} If deployment transaction fails
 * @example
 * ```typescript
 *  Deploy standard document store
 * const receipt = await deployDocumentStore(
 *   "My Document Store",
 *   "0x1234...",
 *   signer,
 *   { chainId: CHAIN_ID.SEPOLIA }
 * );
 *
 *  Deploy transferable document store
 * const receipt = await deployDocumentStore(
 *   "My Transferable Store",
 *   "0x1234...",
 *   signer,
 *   {
 *     isTransferable: true,
 *     maxFeePerGas: 50000000000n
 *   }
 * );
 * ```
 */
const deployDocumentStore = async (
  storeName: string,
  owner: string,
  signer: SignerV5 | SignerV6,
  options: DeployOptions = {},
): Promise<TransactionReceipt> => {
  // Validate required parameters
  if (!storeName) throw new Error('Store name is required');
  if (!owner) throw new Error('Owner address is required');
  if (!signer.provider) throw new Error('Provider is required');

  // Extract deployment options
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  // Get transaction options (gas settings)
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Detect signer version for proper deployment handling
  const isV6 = isV6EthersProvider(signer.provider);

  // Select appropriate factory based on transferability requirement
  const DocumentStoreFactory = options.isTransferable
    ? TransferableDocumentStore__factory
    : DocumentStore__factory;

  // Get appropriate ContractFactory class for signer version
  const ContractFactory = getEthersContractFactoryFromProvider(signer.provider);

  // Create contract factory with Document Store bytecode
  const contractFactory = new ContractFactory(
    DocumentStoreFactory.abi,
    DocumentStoreFactory.bytecode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any, // Type assertion needed for v5/v6 compatibility
  );
  try {
    // Deploy contract with version-specific handling
    if (isV6) {
      // Ethers v6: Use deploymentTransaction() method
      const contract = await (contractFactory as ContractFactoryV6).deploy(
        storeName,
        owner,
        txOptions,
      );
      return await contract.deploymentTransaction().wait();
    } else {
      // Ethers v5: Use deployTransaction property
      const contract = await (contractFactory as ContractFactoryV5).deploy(
        storeName,
        owner,
        txOptions,
      );
      return await contract.deployTransaction.wait();
    }
  } catch (e) {
    // Provide detailed error message on deployment failure
    console.error('Deployment failed:', e);
    throw new Error(
      `Failed to deploy DocumentStore: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
};

export { deployDocumentStore };
