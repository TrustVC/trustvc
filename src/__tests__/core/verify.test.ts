import { verifyDocument } from '../../core';
import { SIGNED_WRAPPED_DOCUMENT_DID, WRAPPED_DOCUMENT_DNS_TXT_V2 } from '../fixtures/fixtures';
import { describe, expect, it } from 'vitest';

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
