import { utils } from '@tradetrust-tt/token-registry-v5';
import { contractInterfaces } from './contract-interfaces';

/**
 * ERC-165 Interface IDs for DocumentStore contracts
 * These IDs are computed from the function selectors of each interface
 */
const { computeInterfaceId } = utils;

export const supportInterfaceIds = {
  /**
   * IDocumentStore interface ID
   * Functions: isActive, isIssued, isRevoked, name, revoke
   * Computed: 0xb9391097
   */
  IDocumentStore: computeInterfaceId(contractInterfaces.DocumentStore),

  /**
   * ITransferableDocumentStore interface ID
   * Functions: isActive, isIssued, isRevoked, issue, name, revoke
   * Computed: 0xc2cb4227
   */
  ITransferableDocumentStore: computeInterfaceId(contractInterfaces.TransferableDocumentStore),
};
