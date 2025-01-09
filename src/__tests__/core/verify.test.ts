import { beforeEach } from 'node:test';
import { describe, it, vi } from 'vitest';
import { verifyDocument } from '../..';
import * as transferableRecordsUtils from '../../verify/fragments/document-status/transferableRecords/utils';
import {
  SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3,
  W3C_TRANSFERABLE_RECORD,
  W3C_VERIFIABLE_DOCUMENT,
  WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3,
  WRAPPED_DOCUMENT_DNS_TXT_V2,
} from '../fixtures/fixtures';

const providerUrl = 'https://rpc-amoy.polygon.technology';

describe.concurrent('W3C verify', () => {
  describe.concurrent('W3C_VERIFIABLE_DOCUMENT', () => {
    it('should verify the document and return all valid fragments', async ({ expect }) => {
      expect(await verifyDocument(W3C_VERIFIABLE_DOCUMENT, '')).toMatchInlineSnapshot(`
        [
          {
            "data": true,
            "name": "W3CSignatureIntegrity",
            "status": "VALID",
            "type": "DOCUMENT_INTEGRITY",
          },
          {
            "data": [
              {
                "purpose": "revocation",
                "status": false,
              },
            ],
            "name": "W3CCredentialStatus",
            "status": "VALID",
            "type": "DOCUMENT_STATUS",
          },
          {
            "name": "TransferableRecords",
            "reason": {
              "code": 4,
              "codeString": "SKIPPED",
              "message": "Document does not have TransferableRecords status",
            },
            "status": "SKIPPED",
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
    });

    it('should return INVALID status for DOCUMENT_INTEGRITY when signature is tampered', async ({
      expect,
    }) => {
      const tampered: any = { ...W3C_VERIFIABLE_DOCUMENT, expirationDate: '2029-12-03T12:19:53Z' };
      expect(await verifyDocument(tampered, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: false,
            name: 'W3CSignatureIntegrity',
            reason: {
              message: 'Invalid signature.',
            },
            status: 'INVALID',
            type: 'DOCUMENT_INTEGRITY',
          }),
        ]),
      );
    });

    it('should skip DOCUMENT_INTEGRITY verification for unsupported proof type', async ({
      expect,
    }) => {
      const tampered: any = {
        ...W3C_VERIFIABLE_DOCUMENT,
        proof: {
          ...W3C_VERIFIABLE_DOCUMENT.proof,
          type: 'Ed25519Signature2020',
        },
      };

      expect(await verifyDocument(tampered, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'W3CSignatureIntegrity',
            reason: {
              code: 0,
              codeString: 'SKIPPED',
              message: "Document either has no proof or proof.type is not 'BbsBlsSignature2020'.",
            },
            status: 'SKIPPED',
            type: 'DOCUMENT_INTEGRITY',
          }),
        ]),
      );
    });

    it('should skip ISSUER_IDENTITY verification when issuer field is missing', async ({
      expect,
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { issuer, ...documentWithoutIssuer } = W3C_VERIFIABLE_DOCUMENT;

      expect(await verifyDocument(documentWithoutIssuer as any, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'W3CIssuerIdentity',
            reason: {
              code: 0,
              codeString: 'SKIPPED',
              message: 'Document has no issuer field.',
            },
            status: 'SKIPPED',
            type: 'ISSUER_IDENTITY',
          }),
        ]),
      );
    });

    it('should return INVALID status for ISSUER_IDENTITY when DID cannot be resolved', async ({
      expect,
    }) => {
      const tampered: any = {
        ...W3C_VERIFIABLE_DOCUMENT,
        issuer: 'did:example:abc',
        proof: {
          ...W3C_VERIFIABLE_DOCUMENT.proof,
          verificationMethod: 'did:example:abc#keys-1',
        },
      };

      expect(await verifyDocument(tampered, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: false,
            name: 'W3CIssuerIdentity',
            reason: {
              message: 'The DID cannot be resolved.',
            },
            status: 'INVALID',
            type: 'ISSUER_IDENTITY',
          }),
        ]),
      );
    });

    it('should return INVALID status for ISSUER_IDENTITY when issuer and verification method do not match', async ({
      expect,
    }) => {
      const tampered: any = { ...W3C_VERIFIABLE_DOCUMENT, issuer: 'did:example:abc' };
      expect(await verifyDocument(tampered, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: false,
            name: 'W3CIssuerIdentity',
            reason: {
              message: 'Issuer and verification method do not match.',
            },
            status: 'INVALID',
            type: 'ISSUER_IDENTITY',
          }),
        ]),
      );
    });

    it('should skip DOCUMENT_STATUS verification when credentialStatus is missing', async ({
      expect,
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { credentialStatus, ...documentWithoutCredentialStatus } = W3C_VERIFIABLE_DOCUMENT;

      expect(await verifyDocument(documentWithoutCredentialStatus as any, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'W3CCredentialStatus',
            reason: {
              code: 0,
              codeString: 'SKIPPED',
              message: 'Document does not have a valid credentialStatus or type.',
            },
            status: 'SKIPPED',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });

    it('should return INVALID status for DOCUMENT_STATUS when credential is revoked', async ({
      expect,
    }) => {
      const tampered: any = {
        ...W3C_VERIFIABLE_DOCUMENT,
        credentialStatus: {
          ...W3C_VERIFIABLE_DOCUMENT.credentialStatus,
          statusListIndex: '5',
        },
      };

      expect(await verifyDocument(tampered, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                purpose: 'revocation',
                status: true,
              }),
            ]),
            name: 'W3CCredentialStatus',
            status: 'INVALID',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });

    it('should return ERROR status for DOCUMENT_STATUS when statusListIndex is out of range', async ({
      expect,
    }) => {
      const tampered: any = {
        ...W3C_VERIFIABLE_DOCUMENT,
        credentialStatus: {
          ...W3C_VERIFIABLE_DOCUMENT.credentialStatus,
          statusListIndex: '131072',
        },
      };

      expect(await verifyDocument(tampered, '')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'W3CCredentialStatus',
            reason: {
              message: 'Invalid statusListIndex: Index out of range: min=0, max=131071',
            },
            status: 'ERROR',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });
  });

  describe.concurrent('W3C_TRANSFERABLE_RECORD', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it(
      'should return VALID status for TransferableRecords',
      { timeout: 300000 },
      async ({ expect }) => {
        expect(await verifyDocument(W3C_TRANSFERABLE_RECORD as any, providerUrl))
          .toMatchInlineSnapshot(`
            [
              {
                "data": true,
                "name": "W3CSignatureIntegrity",
                "status": "VALID",
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

    it(
      'should return INVALID status for TransferableRecords when tokenRegistry is missing',
      { timeout: 300000 },
      async ({ expect }) => {
        const tampered: any = {
          ...W3C_TRANSFERABLE_RECORD,
          credentialStatus: {
            ...W3C_TRANSFERABLE_RECORD.credentialStatus,
            tokenRegistry: '',
          },
        };
        expect(await verifyDocument(tampered, providerUrl)).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'TransferableRecords',
              reason: {
                code: 9,
                codeString: 'UNRECOGNIZED_DOCUMENT',
                message: "Document's credentialStatus does not have tokenRegistry",
              },
              status: 'ERROR',
              type: 'DOCUMENT_STATUS',
            }),
          ]),
        );
      },
    );

    it('should return INVALID status for TransferableRecords when tokenNetwork.chainId is missing', async ({
      expect,
    }) => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD,
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD.credentialStatus,
          tokenNetwork: {
            chainId: '',
            chain: 'MATIC',
          },
        },
      };
      expect(await verifyDocument(tampered, providerUrl)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TransferableRecords',
            reason: {
              code: 9,
              codeString: 'UNRECOGNIZED_DOCUMENT',
              message: "Document's credentialStatus does not have tokenNetwork.chainId",
            },
            status: 'ERROR',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });

    it('should return INVALID status for TransferableRecords when token is not minted', async ({
      expect,
    }) => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD,
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD.credentialStatus,
          tokenId: '123',
        },
      };
      expect(await verifyDocument(tampered, providerUrl)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TransferableRecords',
            reason: {
              code: 1,
              codeString: 'DOCUMENT_NOT_MINTED',
              message: 'Document has not been issued under token registry',
            },
            status: 'INVALID',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });

    it('should return ERROR status for TransferableRecords when unexpected error', async ({
      expect,
    }) => {
      vi.spyOn(transferableRecordsUtils, 'isTokenMintedOnRegistry').mockRejectedValue(
        new Error('Unexpected error'),
      );

      expect(await verifyDocument(W3C_TRANSFERABLE_RECORD, providerUrl)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TransferableRecords',
            reason: {
              code: 0,
              codeString: 'UNEXPECTED_ERROR',
              message: 'Unexpected error',
            },
            status: 'ERROR',
            type: 'DOCUMENT_STATUS',
          }),
        ]),
      );
    });
  });
});

describe.concurrent('V3 verify', () => {
  it('should verify a DND_DID document and return fragments', async ({ expect }) => {
    expect(await verifyDocument(SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3, '')).toMatchInlineSnapshot(`
      [
        {
          "data": true,
          "name": "OpenAttestationHash",
          "status": "VALID",
          "type": "DOCUMENT_INTEGRITY",
        },
        {
          "name": "OpenAttestationEthereumTokenRegistryStatus",
          "reason": {
            "code": 4,
            "codeString": "SKIPPED",
            "message": "Document issuers doesn't have "tokenRegistry" property or TOKEN_REGISTRY method",
          },
          "status": "SKIPPED",
          "type": "DOCUMENT_STATUS",
        },
        {
          "name": "OpenAttestationEthereumDocumentStoreStatus",
          "reason": {
            "code": 4,
            "codeString": "SKIPPED",
            "message": "Document issuers doesn't have "documentStore" or "certificateStore" property or DOCUMENT_STORE method",
          },
          "status": "SKIPPED",
          "type": "DOCUMENT_STATUS",
        },
        {
          "data": {
            "details": {
              "issuance": {
                "did": "did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller",
                "issued": true,
              },
              "revocation": {
                "revoked": false,
              },
            },
            "issuedOnAll": true,
            "revokedOnAny": false,
          },
          "name": "OpenAttestationDidSignedDocumentStatus",
          "status": "VALID",
          "type": "DOCUMENT_STATUS",
        },
        {
          "name": "OpenAttestationDnsTxtIdentityProof",
          "reason": {
            "code": 2,
            "codeString": "SKIPPED",
            "message": "Document issuers doesn't have "documentStore" / "tokenRegistry" property or doesn't use DNS-TXT type",
          },
          "status": "SKIPPED",
          "type": "ISSUER_IDENTITY",
        },
        {
          "data": {
            "key": "did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller",
            "location": "example.tradetrust.io",
            "status": "VALID",
          },
          "name": "OpenAttestationDnsDidIdentityProof",
          "status": "VALID",
          "type": "ISSUER_IDENTITY",
        },
        {
          "name": "OpenAttestationDidIdentityProof",
          "reason": {
            "code": 0,
            "codeString": "SKIPPED",
            "message": "Document is not using DID as top level identifier or has not been wrapped",
          },
          "status": "SKIPPED",
          "type": "ISSUER_IDENTITY",
        },
      ]
    `);
  });

  it(
    'should verify a DID_TOKEN_REGISTRY document and return fragments',
    { timeout: 300000 },
    async ({ expect }) => {
      expect(await verifyDocument(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3, providerUrl))
        .toMatchInlineSnapshot(`
        [
          {
            "data": true,
            "name": "OpenAttestationHash",
            "status": "VALID",
            "type": "DOCUMENT_INTEGRITY",
          },
          {
            "data": {
              "details": {
                "address": "0x71D28767662cB233F887aD2Bb65d048d760bA694",
                "minted": true,
              },
              "mintedOnAll": true,
            },
            "name": "OpenAttestationEthereumTokenRegistryStatus",
            "status": "VALID",
            "type": "DOCUMENT_STATUS",
          },
          {
            "name": "OpenAttestationEthereumDocumentStoreStatus",
            "reason": {
              "code": 4,
              "codeString": "SKIPPED",
              "message": "Document issuers doesn't have "documentStore" or "certificateStore" property or DOCUMENT_STORE method",
            },
            "status": "SKIPPED",
            "type": "DOCUMENT_STATUS",
          },
          {
            "name": "OpenAttestationDidSignedDocumentStatus",
            "reason": {
              "code": 0,
              "codeString": "SKIPPED",
              "message": "Document was not signed by DID directly",
            },
            "status": "SKIPPED",
            "type": "DOCUMENT_STATUS",
          },
          {
            "data": {
              "identifier": "example.tradetrust.io",
              "value": "0x71D28767662cB233F887aD2Bb65d048d760bA694",
            },
            "name": "OpenAttestationDnsTxtIdentityProof",
            "status": "VALID",
            "type": "ISSUER_IDENTITY",
          },
          {
            "name": "OpenAttestationDnsDidIdentityProof",
            "reason": {
              "code": 0,
              "codeString": "SKIPPED",
              "message": "Document was not issued using DNS-DID",
            },
            "status": "SKIPPED",
            "type": "ISSUER_IDENTITY",
          },
          {
            "name": "OpenAttestationDidIdentityProof",
            "reason": {
              "code": 0,
              "codeString": "SKIPPED",
              "message": "Document is not using DID as top level identifier or has not been wrapped",
            },
            "status": "SKIPPED",
            "type": "ISSUER_IDENTITY",
          },
        ]
      `);
    },
  );
});

describe.concurrent('V2 verify', () => {
  it('should verify a document and return fragments', { timeout: 300000 }, async ({ expect }) => {
    expect(
      await verifyDocument(
        WRAPPED_DOCUMENT_DNS_TXT_V2,
        'https://ethereum-sepolia-rpc.publicnode.com',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "data": true,
          "name": "OpenAttestationHash",
          "status": "VALID",
          "type": "DOCUMENT_INTEGRITY",
        },
        {
          "data": {
            "details": [
              {
                "address": "0x142Ca30e3b78A840a82192529cA047ED759a6F7e",
                "minted": true,
              },
            ],
            "mintedOnAll": true,
          },
          "name": "OpenAttestationEthereumTokenRegistryStatus",
          "status": "VALID",
          "type": "DOCUMENT_STATUS",
        },
        {
          "name": "OpenAttestationEthereumDocumentStoreStatus",
          "reason": {
            "code": 4,
            "codeString": "SKIPPED",
            "message": "Document issuers doesn't have "documentStore" or "certificateStore" property or DOCUMENT_STORE method",
          },
          "status": "SKIPPED",
          "type": "DOCUMENT_STATUS",
        },
        {
          "name": "OpenAttestationDidSignedDocumentStatus",
          "reason": {
            "code": 0,
            "codeString": "SKIPPED",
            "message": "Document was not signed by DID directly",
          },
          "status": "SKIPPED",
          "type": "DOCUMENT_STATUS",
        },
        {
          "data": [
            {
              "location": "example.tradetrust.io",
              "status": "VALID",
              "value": "0x142Ca30e3b78A840a82192529cA047ED759a6F7e",
            },
          ],
          "name": "OpenAttestationDnsTxtIdentityProof",
          "status": "VALID",
          "type": "ISSUER_IDENTITY",
        },
        {
          "name": "OpenAttestationDnsDidIdentityProof",
          "reason": {
            "code": 0,
            "codeString": "SKIPPED",
            "message": "Document was not issued using DNS-DID",
          },
          "status": "SKIPPED",
          "type": "ISSUER_IDENTITY",
        },
        {
          "name": "OpenAttestationDidIdentityProof",
          "reason": {
            "code": 0,
            "codeString": "SKIPPED",
            "message": "Document is not using DID as top level identifier or has not been wrapped",
          },
          "status": "SKIPPED",
          "type": "ISSUER_IDENTITY",
        },
      ]
    `);
  });
});
