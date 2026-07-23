import { beforeEach, describe, it, vi } from 'vitest';
import { verifyDocument } from '../..';
import * as transferableRecordsUtils from '../../verify/fragments/document-status/transferableRecords/utils';
import {
  W3C_TRANSFERABLE_RECORD,
  WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3,
} from '../fixtures/fixtures';
import { W3CCredentialStatusCode } from '../../verify/fragments/document-status/w3cCredentialStatus';

/**
 * Extra verify coverage that mocks / soft-asserts around flaky public Amoy RPC.
 * Keeps src/__tests__/core/verify.test.ts aligned with main (live RPC snapshots).
 */
const providerUrl = 'https://rpc-amoy.polygon.technology';

describe.concurrent('W3C verify (RPC resilience)', () => {
  describe.concurrent('W3C_TRANSFERABLE_RECORD mocked mint checks', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it(
      'should return VALID status for TransferableRecords when mint check is mocked',
      { timeout: 300000 },
      async ({ expect }) => {
        vi.spyOn(transferableRecordsUtils, 'isTokenMintedOnRegistry').mockResolvedValue({
          minted: true,
          address: '0x6c2a002A5833a100f38458c50F11E71Aa1A342c6',
        });
        expect(
          await verifyDocument(W3C_TRANSFERABLE_RECORD as any, { rpcProviderUrl: providerUrl }),
        ).toMatchInlineSnapshot(`
          [
            {
              "data": true,
              "name": "W3CSignatureIntegrity",
              "status": "VALID",
              "type": "DOCUMENT_INTEGRITY",
            },
            {
              "name": "EcdsaW3CSignatureIntegrity",
              "reason": {
                "code": 0,
                "codeString": "SKIPPED",
                "message": "Document either has no proof or proof type is not 'DataIntegrityProof' or proof cryptosuite is not 'ecdsa-sd-2023'.",
              },
              "status": "SKIPPED",
              "type": "DOCUMENT_INTEGRITY",
            },
            {
              "name": "Bbs2023W3CSignatureIntegrity",
              "reason": {
                "code": 0,
                "codeString": "SKIPPED",
                "message": "Document either has no proof or proof type is not 'DataIntegrityProof' or proof cryptosuite is not 'bbs-2023'.",
              },
              "status": "SKIPPED",
              "type": "DOCUMENT_INTEGRITY",
            },
            {
              "name": "W3CCredentialStatus",
              "reason": {
                "code": 0,
                "codeString": "SKIPPED",
                "message": "Document does not have a valid credentialStatus or type.",
              },
              "status": "SKIPPED",
              "type": "DOCUMENT_STATUS",
            },
            {
              "data": {
                "tokenRegistry": "0x6c2a002A5833a100f38458c50F11E71Aa1A342c6",
              },
              "name": "TransferableRecords",
              "status": "VALID",
              "type": "DOCUMENT_STATUS",
            },
            {
              "name": "W3CEmptyCredentialStatus",
              "reason": {
                "code": 0,
                "codeString": "SKIPPED",
                "message": "Document contains a credentialStatus.",
              },
              "status": "SKIPPED",
              "type": "DOCUMENT_STATUS",
            },
            {
              "data": true,
              "name": "W3CIssuerIdentity",
              "status": "VALID",
              "type": "ISSUER_IDENTITY",
            },
          ]
        `);
      },
    );

    it('should return INVALID status for TransferableRecords when mint check is mocked as not minted', async ({
      expect,
    }) => {
      vi.spyOn(transferableRecordsUtils, 'isTokenMintedOnRegistry').mockResolvedValue({
        minted: false,
        address: '0x6c2a002A5833a100f38458c50F11E71Aa1A342c6',
        reason: {
          code: W3CCredentialStatusCode.DOCUMENT_NOT_ISSUED,
          codeString: 'DOCUMENT_NOT_MINTED',
          message: 'Document has not been issued under token registry',
        },
      });
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD,
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD.credentialStatus,
          tokenId: '123',
        },
      };
      expect(await verifyDocument(tampered, { rpcProviderUrl: providerUrl })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TransferableRecords',
            reason: {
              code: W3CCredentialStatusCode.DOCUMENT_NOT_ISSUED,
              codeString: 'DOCUMENT_NOT_MINTED',
              message: 'Document has not been issued under token registry',
            },
            status: 'INVALID',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });
  });
});

describe.concurrent('V3 verify (RPC resilience)', () => {
  it(
    'should verify a DID_TOKEN_REGISTRY document with soft asserts for flaky Amoy RPC',
    { timeout: 300000 },
    async ({ expect }) => {
      const fragments = await verifyDocument(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3, {
        rpcProviderUrl: providerUrl,
      });

      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'OpenAttestationHash',
            status: 'VALID',
            type: 'DOCUMENT_INTEGRITY',
          }),
          expect.objectContaining({
            name: 'OpenAttestationEthereumDocumentStoreStatus',
            status: 'SKIPPED',
            type: 'DOCUMENT_STATUS',
          }),
          expect.objectContaining({
            name: 'OpenAttestationDidSignedDocumentStatus',
            status: 'SKIPPED',
            type: 'DOCUMENT_STATUS',
          }),
          expect.objectContaining({
            name: 'OpenAttestationDnsDidIdentityProof',
            status: 'SKIPPED',
            type: 'ISSUER_IDENTITY',
          }),
          expect.objectContaining({
            name: 'OpencertsRegistryVerifier',
            status: 'SKIPPED',
            type: 'ISSUER_IDENTITY',
          }),
        ]),
      );

      // Token registry / DNS-TXT can ERROR when public Amoy RPC is flaky.
      const tokenRegistryFragment = fragments.find(
        (fragment) => fragment.name === 'OpenAttestationEthereumTokenRegistryStatus',
      );
      expect(tokenRegistryFragment).toBeDefined();
      expect(['VALID', 'ERROR']).toContain(tokenRegistryFragment?.status);

      const dnsTxtFragment = fragments.find(
        (fragment) => fragment.name === 'OpenAttestationDnsTxtIdentityProof',
      );
      expect(dnsTxtFragment).toBeDefined();
      expect(['VALID', 'ERROR']).toContain(dnsTxtFragment?.status);
    },
  );
});
