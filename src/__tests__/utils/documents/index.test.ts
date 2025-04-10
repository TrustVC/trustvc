import { describe, expect, it } from 'vitest';
import {
  getChainId,
  getTokenId,
  getTokenRegistryAddress,
  isTransferableRecord,
} from '../../../utils';
import {
  W3C_TRANSFERABLE_RECORD,
  W3C_VERIFIABLE_DOCUMENT,
  WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V2,
  WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3,
  WRAPPED_DOCUMENT_DID_V2,
  WRAPPED_DOCUMENT_DNS_DID_V3,
} from '../../fixtures/fixtures';

describe.concurrent('documents', () => {
  describe.concurrent('isTransferableRecord', () => {
    it('isTransferableRecord - VALID W3C VC Transferable Record Document', () => {
      const transferableRecord = isTransferableRecord(W3C_TRANSFERABLE_RECORD);
      expect(transferableRecord).toBe(true);
    });

    it('isTransferableRecord - VALID OA V2 Transferable Record Document', () => {
      const transferableRecord = isTransferableRecord(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V2);
      expect(transferableRecord).toBe(true);
    });

    it('isTransferableRecord - VALID OA V3 Transferable Record Document', () => {
      const transferableRecord = isTransferableRecord(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3);
      expect(transferableRecord).toBe(true);
    });

    it('isTransferableRecord - INVALID W3C VC Transferable Record Document', () => {
      const transferableRecord = isTransferableRecord(W3C_VERIFIABLE_DOCUMENT);
      expect(transferableRecord).toBe(false);
    });

    it('isTransferableRecord - INVALID OA V2 Transferable Record Document', () => {
      const transferableRecord = isTransferableRecord(WRAPPED_DOCUMENT_DID_V2);
      expect(transferableRecord).toBe(false);
    });

    it('isTransferableRecord - INVALID OA V3 Transferable Record Document', () => {
      const transferableRecord = isTransferableRecord(WRAPPED_DOCUMENT_DNS_DID_V3);
      expect(transferableRecord).toBe(false);
    });
  });

  describe.concurrent('getTokenRegistryAddress', () => {
    it('getTokenRegistryAddress - VALID W3C VC Transferable Record Document', () => {
      const tokenRegistryAddress = getTokenRegistryAddress(W3C_TRANSFERABLE_RECORD);
      expect(tokenRegistryAddress).toBe('0x6c2a002A5833a100f38458c50F11E71Aa1A342c6');
    });

    it('getTokenRegistryAddress - VALID OA V2 Transferable Record Document', () => {
      const tokenRegistryAddress = getTokenRegistryAddress(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V2);
      expect(tokenRegistryAddress).toBe('0x71D28767662cB233F887aD2Bb65d048d760bA694');
    });

    it('getTokenRegistryAddress - VALID OA V3 Transferable Record Document', () => {
      const tokenRegistryAddress = getTokenRegistryAddress(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3);
      expect(tokenRegistryAddress).toBe('0x71D28767662cB233F887aD2Bb65d048d760bA694');
    });

    it('getTokenRegistryAddress - INVALID W3C VC Transferable Record Document', () => {
      const tokenRegistryAddress = getTokenRegistryAddress(W3C_VERIFIABLE_DOCUMENT);
      expect(tokenRegistryAddress).toBe(undefined);
    });

    it('getTokenRegistryAddress - INVALID OA V2 Transferable Record Document', () => {
      const tokenRegistryAddress = getTokenRegistryAddress(WRAPPED_DOCUMENT_DID_V2);
      expect(tokenRegistryAddress).toBe(undefined);
    });
  });

  describe.concurrent('getTokenId', () => {
    it('getTokenId - VALID W3C VC Transferable Record Document', () => {
      const tokenId = getTokenId(W3C_TRANSFERABLE_RECORD);
      expect(tokenId).toBe('0x23f719b016c88ba1ef2e10c0718d7d0f0026b1dc6e219629f81e2f0f811c4e3e');
    });

    it('getTokenId - VALID OA V2 Transferable Record Document', () => {
      const tokenId = getTokenId(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V2);
      expect(tokenId).toBe('0xc999d6bf0b5e18bc6051bf60779e2a6891dc41294a35f0b0e0ea9addd774294c');
    });

    it('getTokenId - VALID OA V3 Transferable Record Document', () => {
      const tokenId = getTokenId(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3);
      expect(tokenId).toBe('0xfb8e4b7199e5ddeb6b3a24e508108de965e4f0f4ff55248c5a5a9325223b65d9');
    });

    it('getTokenId - INVALID W3C VC Transferable Record Document', () => {
      const tokenId = getTokenId(W3C_VERIFIABLE_DOCUMENT);
      expect(tokenId).toBe(undefined);
    });

    it('getTokenId - INVALID OA V2 Transferable Record Document', async () => {
      await expect(async () => getTokenId(WRAPPED_DOCUMENT_DID_V2)).rejects.toThrowError(
        'Unsupported document type: Only can retrieve asset id from wrapped OpenAttestation v2 & v3 transferable documents.',
      );
    });

    it('getTokenId - INVALID OA V3 Transferable Record Document', async () => {
      await expect(async () => getTokenId(WRAPPED_DOCUMENT_DNS_DID_V3)).rejects.toThrowError(
        'Unsupported document type: Only can retrieve asset id from wrapped OpenAttestation v2 & v3 transferable documents.',
      );
    });
  });

  describe.concurrent('getChainId', () => {
    it('getChainId - VALID W3C VC Transferable Record Document', () => {
      const chainId = getChainId(W3C_TRANSFERABLE_RECORD);
      expect(chainId).toBe(80002);
    });

    it('getChainId - VALID OA V2 Transferable Record Document', () => {
      const chainId = getChainId(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V2);
      expect(chainId).toBe(80002);
    });

    it('getChainId - VALID OA V3 Transferable Record Document', () => {
      const chainId = getChainId(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3);
      expect(chainId).toBe(80002);
    });

    it('getChainId - INVALID W3C VC Transferable Record Document', () => {
      const chainId = getChainId(W3C_VERIFIABLE_DOCUMENT);
      expect(chainId).toBe(undefined);
    });

    it('getChainId - INVALID OA V2 Transferable Record Document', async () => {
      const chainId = getChainId(WRAPPED_DOCUMENT_DID_V2);
      expect(chainId).toBe(undefined);
    });

    it('getChainId - INVALID OA V3 Transferable Record Document', async () => {
      const chainId = getChainId(WRAPPED_DOCUMENT_DNS_DID_V3);
      expect(chainId).toBe(undefined);
    });

    it('getChainId - Empty Document', async () => {
      const chainId = getChainId({} as any);
      expect(chainId).toBe(undefined);
    });
  });
});
