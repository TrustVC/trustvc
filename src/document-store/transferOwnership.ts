import { Signer as SignerV6, ContractTransactionResponse as ContractTransactionV6 } from 'ethersV6';
import { ContractTransaction as ContractTransactionV5, Signer as SignerV5 } from 'ethers';
import { documentStoreRevokeRole } from './revoke-role';

import { documentStoreGrantRole } from './grant-role';
import { getRoleString } from './document-store-roles';
import { CommandOptions } from './types';

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
 * @returns {Promise<{grantTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>; revokeTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>}>} A promise resolving to the transaction result from the grant and revoke role calls.
 * @throws {Error} If the document store address or signer provider is not provided.
 * @throws {Error} If the role is invalid.
 * @throws {Error} If the `callStatic.revokeRole` fails as a pre-check.
 */
export const documentStoreTransferOwnership = async (
  documentStoreAddress: string,
  account: string,
  signer: SignerV5 | SignerV6,
  options: CommandOptions = {},
): Promise<{
  grantTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>;
  revokeTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>;
}> => {
  if (!documentStoreAddress) throw new Error('Document store address is required');
  if (!signer.provider) throw new Error('Provider is required');
  if (!account) throw new Error('Account is required');

  const ownerAddress = await signer.getAddress();
  const roleString = await getRoleString(documentStoreAddress, 'admin', {
    provider: signer.provider,
  });
  //call the transferOwnership function of the document store contract

  //call grant and revoke function here
  const grantTransaction = documentStoreGrantRole(
    documentStoreAddress,
    roleString,
    account,
    signer,
    options,
  );
  //check if the grant transaction is successful
  const grantTransactionResult = await grantTransaction;
  if (!grantTransactionResult) {
    //add custom error message not proceeding eith the revoke transaction
    throw new Error('Grant transaction failed, not proceeding with revoke transaction');
    //return the grant transaction result
  }
  //call revoke function here
  const revokeTransaction = documentStoreRevokeRole(
    documentStoreAddress,
    roleString,
    ownerAddress,
    signer,
    options,
  );
  //check if the revoke transaction is successful
  const revokeTransactionResult = await revokeTransaction;
  if (!revokeTransactionResult) {
    throw new Error('Revoke transaction failed');
    //return the revoke transaction result
  }
  return { grantTransaction, revokeTransaction };
};
