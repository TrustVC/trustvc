import {
  Signer as SignerV6,
  Contract as ContractV6,
  ContractTransaction as ContractTransactionV6,
} from 'ethersV6';
import {
  Contract as ContractV5,
  ContractTransaction as ContractTransactionV5,
  Signer as SignerV5,
} from 'ethers';
import { CHAIN_ID } from '../utils';
import { GasValue } from '../token-registry-functions/types';
import { checkSupportsInterface } from '../core';
import { supportInterfaceIds } from './supportInterfaceIds';
import { TT_DOCUMENT_STORE_ABI } from './tt-document-store-abi';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  DocumentStore__factory,
  TransferableDocumentStore__factory,
} from '@trustvc/document-store';
import { getTxOptions } from '../token-registry-functions/utils';

export interface IssueOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: GasValue;
  maxPriorityFeePerGas?: GasValue;
  isTransferable?: boolean;
}

/**
 * Grants a role to an account on the DocumentStore contract.
 * Supports both Ethers v5 and v6 signers.
 * Supports three types of document stores:
 * 1. DocumentStore (ERC-165 compliant)
 * 2. TransferableDocumentStore (ERC-165 compliant)
 * 3. TT Document Store (legacy, no ERC-165 support - used as fallback)
 * @param {string} documentStoreAddress - The address of the DocumentStore contract.
 * @param {string} role - The role to grant (e.g., 'ISSUER', 'REVOKER', 'ADMIN').
 * @param {string} account - The account to grant the role to.
 * @param {SignerV5 | SignerV6} signer - Signer instance (Ethers v5 or v6) that authorizes the grant role transaction.
 * @param {IssueOptions} options - Optional transaction metadata including gas values and chain ID.
 * @returns {Promise<ContractTransactionV5 | ContractTransactionV6>} A promise resolving to the transaction result from the grant role call.
 * @throws {Error} If the document store address or signer provider is not provided.
 * @throws {Error} If the role is invalid.
 * @throws {Error} If the `callStatic.grantRole` fails as a pre-check.
 */
export const grantDocumentStoreRole = async (
  documentStoreAddress: string,
  role: string,
  account: string,
  signer: SignerV5 | SignerV6,
  options: IssueOptions = {},
): Promise<ContractTransactionV5 | ContractTransactionV6> => {
  if (!documentStoreAddress) throw new Error('Document store address is required');
  if (!signer.provider) throw new Error('Provider is required');
  if (!role) throw new Error('Role is required');
  if (!account) throw new Error('Account is required');

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

  if (!isDocumentStore && !isTransferableDocumentStore && !isTTDocumentStore) {
    throw new Error(
      'Contract does not support DocumentStore, TransferableDocumentStore, or TT Document Store interface',
    );
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
      await (documentStoreContract as ContractV6).grantRole.staticCall(role, account);
    } else {
      await (documentStoreContract as ContractV5).callStatic.grantRole(role, account);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for grant-role failed');
  }

  // Get transaction options (gas settings)
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction
  return await documentStoreContract.grantRole(role, account, txOptions);
};
