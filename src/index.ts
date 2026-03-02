import {
  v4RoleHash,
  v4ContractAddress,
  v4SupportInterfaceIds,
  v4Contracts,
  v4Utils,
  v4ComputeTitleEscrowAddress,
  v4EncodeInitParams,
  v4GetEventFromReceipt,
  v4ComputeInterfaceId,
} from './token-registry-v4';
import {
  v5RoleHash,
  v5ContractAddress,
  v5SupportInterfaceIds,
  v5Contracts,
  v5Utils,
  v5EncodeInitParams,
  v5GetEventFromReceipt,
  v5ComputeInterfaceId,
} from './token-registry-v5';
import {
  deployDocumentStore,
  documentStoreGrantRole,
  documentStoreRevokeRole,
  documentStoreIssue,
  documentStoreRevoke,
  DocumentStore__factory,
  TransferableDocumentStore__factory,
  getRoleString,
  documentStoreTransferOwnership,
} from './document-store';
import { cancelTransaction } from './transaction';
export type { TypedContractMethod } from './token-registry-v5/typedContractMethod';
export * from './token-registry-functions';
export * from './core';
export * from './open-attestation';
export * from './verify';
export * from './open-cert';
export * from './w3c';
export * from './utils';
export * from './dnsprove';
export * from './transaction';

export {
  v4SupportInterfaceIds,
  v4ContractAddress,
  v4RoleHash,
  v4Contracts,
  v5SupportInterfaceIds,
  v5ContractAddress,
  v4Utils,
  v4ComputeTitleEscrowAddress,
  v4EncodeInitParams,
  v4GetEventFromReceipt,
  v4ComputeInterfaceId,
  v5RoleHash,
  v5Contracts,
  v5Utils,
  v5EncodeInitParams,
  v5GetEventFromReceipt,
  v5ComputeInterfaceId,
  deployDocumentStore,
  documentStoreGrantRole,
  documentStoreRevokeRole,
  documentStoreIssue,
  documentStoreRevoke,
  getRoleString,
  documentStoreTransferOwnership,
  DocumentStore__factory,
  TransferableDocumentStore__factory,
  cancelTransaction,
};
