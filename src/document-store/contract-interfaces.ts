import { utils as ethersUtils } from 'ethers';
import {
  IDocumentStore__factory,
  ITransferableDocumentStore__factory,
} from '@trustvc/document-store';

/**
 * Contract interface function signatures for DocumentStore contracts
 * These are used for ERC-165 interface detection and other purposes
 */

const IDocumentStoreInterface = IDocumentStore__factory.createInterface() as ethersUtils.Interface;
const ITransferableDocumentStoreInterface =
  ITransferableDocumentStore__factory.createInterface() as ethersUtils.Interface;

// Extract function signatures from interfaces
const IDocumentStoreFunctions = Object.values(IDocumentStoreInterface.fragments)
  .filter((f) => f.type === 'function')
  .map((f) => f.format('sighash'));

const ITransferableDocumentStoreFunctions = Object.values(
  ITransferableDocumentStoreInterface.fragments,
)
  .filter((f) => f.type === 'function')
  .map((f) => f.format('sighash'));

export const contractInterfaces = {
  /**
   * IDocumentStore interface functions
   * Functions: isActive, isIssued, isRevoked, name, revoke
   */
  DocumentStore: IDocumentStoreFunctions,

  /**
   * ITransferableDocumentStore interface functions
   * Functions: isActive, isIssued, isRevoked, issue, name, revoke
   */
  TransferableDocumentStore: ITransferableDocumentStoreFunctions,
};
