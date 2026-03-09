import {
  DocumentStore__factory,
  TransferableDocumentStore__factory,
} from '@trustvc/document-store';
import {
  Signer as SignerV6,
  Contract as ContractV6,
  ContractTransactionResponse as ContractTransactionV6,
} from 'ethersV6';
import {
  Contract as ContractV5,
  ContractTransaction as ContractTransactionV5,
  Signer as SignerV5,
} from 'ethers';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import { getTxOptions } from '../token-registry-functions/utils';
import { checkSupportsInterface } from '../core';
import { supportInterfaceIds } from './supportInterfaceIds';
import { TT_DOCUMENT_STORE_ABI } from './tt-document-store-abi';
import { CommandOptions } from './types';

/**
 * Issues a document hash to the DocumentStore contract.
 * Supports both Ethers v5 and v6 signers.
 * Supports three types of document stores:
 * 1. DocumentStore (ERC-165 compliant)
 * 2. TransferableDocumentStore (ERC-165 compliant)
 * 3. TT Document Store (legacy, no ERC-165 support - used as fallback)
 * @param {string} documentStoreAddress - The address of the DocumentStore contract.
 * @param {string} documentHash - The hash of the document to issue (must be a valid hex string).
 * @param {SignerV5 | SignerV6} signer - Signer instance (Ethers v5 or v6) that authorizes the issue transaction.
 * @param {CommandOptions} options - Optional transaction metadata including gas values and chain ID.
 * @returns {Promise<ContractTransactionV5 | ContractTransactionV6>} A promise resolving to the transaction result from the issue call.
 * @throws {Error} If the document store address or signer provider is not provided.
 * @throws {Error} If the document hash is invalid.
 * @throws {Error} If the `callStatic.issue` fails as a pre-check.
 */

const documentStoreIssue = async (
  documentStoreAddress: string,
  documentHash: string,
  signer: SignerV5 | SignerV6,
  options: CommandOptions = {},
): Promise<ContractTransactionV5 | ContractTransactionV6> => {
  if (!documentStoreAddress) throw new Error('Document store address is required');
  if (!signer.provider) throw new Error('Provider is required');
  if (!documentHash) throw new Error('Document hash is required');

  const { chainId, maxFeePerGas, maxPriorityFeePerGas, isTransferable } = options;

  let isDocumentStore = !isTransferable;
  let isTransferableDocumentStore = isTransferable;
  let isTTDocumentStore = false;

  // Detect contract type by checking interface support
  if (isTransferable === undefined) {
    [isDocumentStore, isTransferableDocumentStore] = await Promise.all([
      checkSupportsInterface(
        documentStoreAddress,
        supportInterfaceIds.IDocumentStore,
        signer.provider,
      ),
      checkSupportsInterface(
        documentStoreAddress,
        supportInterfaceIds.ITransferableDocumentStore,
        signer.provider,
      ),
    ]);

    // If neither DocumentStore nor TransferableDocumentStore is supported,
    // fallback to TT Document Store (legacy contract without ERC-165)
    if (!isDocumentStore && !isTransferableDocumentStore) {
      isTTDocumentStore = true;
    }
  }

  // Get the appropriate Contract class based on provider version
  const Contract = getEthersContractFromProvider(signer.provider);

  // Connect to the appropriate DocumentStore contract based on interface detection
  let documentStoreAbi;
  if (isTTDocumentStore) {
    documentStoreAbi = TT_DOCUMENT_STORE_ABI;
  } else {
    const DocumentStoreFactory = isTransferableDocumentStore
      ? TransferableDocumentStore__factory
      : DocumentStore__factory;
    documentStoreAbi = DocumentStoreFactory.abi;
  }

  const documentStoreContract: ContractV5 | ContractV6 = new Contract(
    documentStoreAddress,
    documentStoreAbi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );

  // Check callStatic (dry run) to ensure transaction will succeed
  try {
    const isV6 = isV6EthersProvider(signer.provider);

    if (isV6) {
      await (documentStoreContract as ContractV6).issue!.staticCall(documentHash);
    } else {
      await (documentStoreContract as ContractV5).callStatic.issue!(documentHash);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for issue failed');
  }

  // Get transaction options (gas settings)
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction
  return await documentStoreContract.issue(documentHash, txOptions);
};

export { documentStoreIssue };
