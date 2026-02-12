import {
  DocumentStore__factory,
  TransferableDocumentStore__factory,
} from '@trustvc/document-store';
import {
  Signer as SignerV6,
  ContractFactory as ContractFactoryV6,
  ContractTransactionReceipt as ContractReceiptV6,
} from 'ethersV6';
import {
  Signer as SignerV5,
  ContractFactory as ContractFactoryV5,
  ContractReceipt as ContractReceiptV5,
} from 'ethers';
import { isV6EthersProvider } from '../utils/ethers';
import { CHAIN_ID } from '../utils';
import { GasValue } from '../token-registry-functions/types';
import { getTxOptions } from '../token-registry-functions/utils';

/**
 * Deploys a new DocumentStore contract.
 * Supports both Ethers v5 and v6 signers.
 * @param {string} storeName - The name of the document store.
 * @param {string} owner - The owner address of the document store.
 * @param {SignerV5 | SignerV6} signer - Signer instance (Ethers v5 or v6) that authorizes the deployment.
 * @param {DeployOptions} options - Optional transaction metadata including gas values and chain ID.
 * @returns {Promise<TransactionReceipt>} A promise resolving to the deployed contract address and transaction hash.
 * @throws {Error} If the signer provider is not provided.
 * @throws {Error} If the store name or owner address is not provided.
 * @throws {Error} If deployment fails.
 */

export interface DeployOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: GasValue;
  maxPriorityFeePerGas?: GasValue;
  isTransferable?: boolean;
}

export type TransactionReceipt = ContractReceiptV5 | ContractReceiptV6;

const deployDocumentStore = async (
  storeName: string,
  owner: string,
  signer: SignerV5 | SignerV6,
  options: DeployOptions = {},
): Promise<TransactionReceipt> => {
  if (!storeName) throw new Error('Store name is required');
  if (!owner) throw new Error('Owner address is required');
  if (!signer.provider) throw new Error('Provider is required');

  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  // Get transaction options (gas settings)
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  const isV6 = isV6EthersProvider(signer.provider);
  const DocumentStoreFactory = options.isTransferable
    ? TransferableDocumentStore__factory
    : DocumentStore__factory;

  try {
    if (isV6) {
      // Ethers v6 deployment
      const ContractFactory = new ContractFactoryV6(
        DocumentStoreFactory.abi,
        DocumentStoreFactory.bytecode,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signer as any,
      );
      const contract = await ContractFactory.deploy(storeName, owner, txOptions);
      const receipt = await contract.deploymentTransaction()?.wait();

      return receipt;
    } else {
      // Ethers v5 deployment
      const ContractFactory = new ContractFactoryV5(
        DocumentStoreFactory.abi,
        DocumentStoreFactory.bytecode,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signer as any,
      );
      const contract = await ContractFactory.deploy(storeName, owner, txOptions);
      const receipt = await contract.deployTransaction.wait();

      return receipt;
    }
  } catch (e) {
    console.error('Deployment failed:', e);
    throw new Error(
      `Failed to deploy DocumentStore: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
};

export { deployDocumentStore };
