import {
  Signer as SignerV6,
  ContractTransactionResponse as ContractTransactionV6,
  Contract as ContractV6,
} from 'ethersV6';
import {
  ContractTransaction as ContractTransactionV5,
  Signer as SignerV5,
  Contract as ContractV5,
} from 'ethers';
import { documentStoreRevokeRole } from './revoke-role';
import { documentStoreGrantRole } from './grant-role';
import { getRoleString } from './document-store-roles';
import { CommandOptions } from './types';
import { checkSupportsInterface } from '../core';
import { supportInterfaceIds } from './supportInterfaceIds';
import { TT_DOCUMENT_STORE_ABI } from './tt-document-store-abi';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  DocumentStore__factory,
  TransferableDocumentStore__factory,
} from '@trustvc/document-store';

/**
 * Transfers ownership of a DocumentStore contract to a new owner.
 * Supports both Ethers v5 and v6 signers.
 * Supports three types of document stores:
 * 1. DocumentStore (ERC-165 compliant)
 * 2. TransferableDocumentStore (ERC-165 compliant)
 * 3. TT Document Store (legacy, no ERC-165 support - used as fallback)
 * @param {string} documentStoreAddress - The address of the DocumentStore contract.
 * @param {string} account - The account to transfer ownership to.
 * @param {SignerV5 | SignerV6} signer - Signer instance (Ethers v5 or v6) that authorizes the transfer ownership transaction.
 * @param {CommandOptions} options - Optional transaction metadata including gas values and chain ID.
 * @returns {Promise<{grantTransaction: ContractTransactionV5 | ContractTransactionV6; revokeTransaction: ContractTransactionV5 | ContractTransactionV6}>} A promise resolving to the transaction result from the grant and revoke role calls.
 * @throws {Error} If the document store address or signer provider is not provided.
 * @throws {Error} If the role is invalid.
 * @throws {Error} If either the `callStatic.grantRole` or `callStatic.revokeRole` pre-check fails.
 */
export const documentStoreTransferOwnership = async (
  documentStoreAddress: string,
  account: string,
  signer: SignerV5 | SignerV6,
  options: CommandOptions = {},
): Promise<{
  grantTransaction: ContractTransactionV5 | ContractTransactionV6;
  revokeTransaction: ContractTransactionV5 | ContractTransactionV6;
}> => {
  if (!documentStoreAddress) throw new Error('Document store address is required');
  if (!signer.provider) throw new Error('Provider is required');
  if (!account) throw new Error('Account is required');

  const ownerAddress = await signer.getAddress();
  const roleString = await getRoleString(documentStoreAddress, 'DEFAULT_ADMIN_ROLE', {
    provider: signer.provider,
  });

  // Get the contract instance for pre-checks
  const Contract = getEthersContractFromProvider(signer.provider);
  const isDocumentStore = await checkSupportsInterface(
    documentStoreAddress,
    supportInterfaceIds.IDocumentStore,
    signer.provider,
  );
  const isTransferableDocumentStore = await checkSupportsInterface(
    documentStoreAddress,
    supportInterfaceIds.ITransferableDocumentStore,
    signer.provider,
  );

  let documentStoreAbi;
  if (isDocumentStore || isTransferableDocumentStore) {
    const DocumentStoreFactory = isTransferableDocumentStore
      ? TransferableDocumentStore__factory
      : DocumentStore__factory;
    documentStoreAbi = DocumentStoreFactory.abi;
  } else {
    documentStoreAbi = TT_DOCUMENT_STORE_ABI;
  }

  const documentStoreContract: ContractV5 | ContractV6 = new Contract(
    documentStoreAddress,
    documentStoreAbi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );

  // CRITICAL: Perform BOTH static call pre-checks BEFORE executing any real transactions
  // This prevents partial ownership transfer if revoke would fail after grant succeeds
  const isV6 = isV6EthersProvider(signer.provider);

  try {
    // Pre-check 1: Verify grant will succeed
    if (isV6) {
      await (documentStoreContract as ContractV6).grantRole!.staticCall(roleString, account);
    } else {
      await (documentStoreContract as ContractV5).callStatic.grantRole!(roleString, account);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for grant-role failed');
  }

  try {
    // Pre-check 2: Verify revoke will succeed
    if (isV6) {
      await (documentStoreContract as ContractV6).revokeRole!.staticCall(roleString, ownerAddress);
    } else {
      await (documentStoreContract as ContractV5).callStatic.revokeRole!(roleString, ownerAddress);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for revoke-role failed');
  }

  // Both pre-checks passed - now execute the real transactions
  const grantTransaction = await documentStoreGrantRole(
    documentStoreAddress,
    roleString,
    account,
    signer,
    options,
  );

  if (!grantTransaction) {
    throw new Error('Grant transaction failed, not proceeding with revoke transaction');
  }

  const revokeTransaction = await documentStoreRevokeRole(
    documentStoreAddress,
    roleString,
    ownerAddress,
    signer,
    options,
  );

  if (!revokeTransaction) {
    throw new Error('Revoke transaction failed');
  }

  return { grantTransaction, revokeTransaction };
};
