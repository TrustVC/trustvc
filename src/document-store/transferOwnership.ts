import { Signer as SignerV6, ContractTransaction as ContractTransactionV6 } from 'ethersV6';
import { ContractTransaction as ContractTransactionV5, Signer as SignerV5 } from 'ethers';
import { CHAIN_ID } from '../utils';
import { GasValue } from '../token-registry-functions/types';
import { revokeDocumentStoreRole } from './revoke-role';

import { grantDocumentStoreRole } from './grant-role';
import { getRoleString } from './document-store-roles';

export interface IssueOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: GasValue;
  maxPriorityFeePerGas?: GasValue;
  isTransferable?: boolean;
}

/**
 * Revokes a role from an account on the DocumentStore contract.
 * Supports both Ethers v5 and v6 signers.
 * Supports three types of document stores:
 * 1. DocumentStore (ERC-165 compliant)
 * 2. TransferableDocumentStore (ERC-165 compliant)
 * 3. TT Document Store (legacy, no ERC-165 support - used as fallback)
 * @param {string} documentStoreAddress - The address of the DocumentStore contract.
 * @param {string} account - The account to revoke the role from.
 * @param {SignerV5 | SignerV6} signer - Signer instance (Ethers v5 or v6) that authorizes the revoke role transaction.
 * @param {IssueOptions} options - Optional transaction metadata including gas values and chain ID.
 * @returns {Promise<{grantTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>; revokeTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>}>} A promise resolving to the transaction result from the revoke role call.
 * @throws {Error} If the document store address or signer provider is not provided.
 * @throws {Error} If the role is invalid.
 * @throws {Error} If the `callStatic.revokeRole` fails as a pre-check.
 */
export const transferOwnershipDocumentStore = async (
  documentStoreAddress: string,
  account: string,
  signer: SignerV5 | SignerV6,
  options: IssueOptions = {},
): Promise<{
  grantTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>;
  revokeTransaction: Promise<ContractTransactionV5 | ContractTransactionV6>;
}> => {
  if (!documentStoreAddress) throw new Error('Document store address is required');
  if (!signer.provider) throw new Error('Provider is required');
  if (!account) throw new Error('Account is required');

  const ownerAddress = await signer.getAddress();
  const roleString = await getRoleString(documentStoreAddress, 'admin');
  //call the transferOwnership function of the document store contract

  //call grant and revoke function here
  const grantTransaction = grantDocumentStoreRole(
    documentStoreAddress,
    roleString,
    account,
    signer,
    options,
  );
  const revokeTransaction = revokeDocumentStoreRole(
    documentStoreAddress,
    roleString,
    ownerAddress,
    signer,
    options,
  );
  return { grantTransaction, revokeTransaction };
};
