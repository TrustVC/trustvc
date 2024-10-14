import { verifyDocument } from '../..';
import {
  SIGNED_WRAPPED_DOCUMENT_DID,
  WRAPPED_DOCUMENT_DNS_TXT_V2,
  W3C_VERIFIABLE_DOCUMENT,
} from '../fixtures/fixtures';
import { describe, expect, it } from 'vitest';

describe('W3C verify', () => {
  it('should verify the document and return all valid fragments', async () => {
    expect(await verifyDocument(W3C_VERIFIABLE_DOCUMENT, '')).toMatchInlineSnapshot(`
      [
        {
          "data": true,
          "name": "W3CSignatureIntegrity",
          "status": "VALID",
          "type": "DOCUMENT_INTEGRITY",
        },
        {
          "data": true,
          "name": "W3CCredentialStatus",
          "status": "VALID",
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

  it('should return INVALID status for DOCUMENT_INTEGRITY when signature is tampered', async () => {
    const tampered = { ...W3C_VERIFIABLE_DOCUMENT, expirationDate: '2029-12-03T12:19:53Z' };
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

  it('should skip DOCUMENT_INTEGRITY verification for unsupported proof type', async () => {
    const tampered = {
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

  it('should skip ISSUER_IDENTITY verification when issuer field is missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { issuer, ...documentWithoutIssuer } = W3C_VERIFIABLE_DOCUMENT;

    expect(await verifyDocument(documentWithoutIssuer, '')).toEqual(
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

  it('should return INVALID status for ISSUER_IDENTITY when DID cannot be resolved', async () => {
    const tampered = {
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

  it('should return INVALID status for ISSUER_IDENTITY when issuer and verification method do not match', async () => {
    const tampered = { ...W3C_VERIFIABLE_DOCUMENT, issuer: 'did:example:abc' };
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

  it('should skip DOCUMENT_STATUS verification when credentialStatus is missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credentialStatus, ...documentWithoutCredentialStatus } = W3C_VERIFIABLE_DOCUMENT;

    expect(await verifyDocument(documentWithoutCredentialStatus, '')).toEqual(
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

  it('should return INVALID status for DOCUMENT_STATUS when credential is revoked', async () => {
    const tampered = {
      ...W3C_VERIFIABLE_DOCUMENT,
      credentialStatus: {
        ...W3C_VERIFIABLE_DOCUMENT.credentialStatus,
        statusListIndex: '5',
      },
    };

    expect(await verifyDocument(tampered, '')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: false,
          name: 'W3CCredentialStatus',
          status: 'INVALID',
          type: 'DOCUMENT_STATUS',
        }),
      ]),
    );
  });

  it('should return ERROR status for DOCUMENT_STATUS when statusListIndex is out of range', async () => {
    const tampered = {
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

describe('V4 verify', () => {
  it('should verify a document and return fragments', async () => {
    expect(await verifyDocument(SIGNED_WRAPPED_DOCUMENT_DID, '')).toMatchInlineSnapshot(`
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
                "did": "did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90",
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
            "location": "example.openattestation.com",
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
});

describe('V2 verify', () => {
  it('should verify a document and return fragments', async () => {
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
