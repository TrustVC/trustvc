import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentBuilder } from '../../core/documentBuilder';
import { PrivateKeyPair, VerificationType } from '@trustvc/w3c-issuer';
import { ContextDocument } from '@trustvc/w3c-context';

const BBS2020testPrivateKey: PrivateKeyPair = {
  id: 'did:web:trustvc.github.io:did:1#keys-1',
  controller: 'did:web:trustvc.github.io:did:1',
  type: VerificationType.Bls12381G2Key2020,
  publicKeyBase58:
    'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
  privateKeyBase58: '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF',
};

const ECDSAtestPrivateKey: PrivateKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: 'did:web:trustvc.github.io:did:1#multikey-1',
  type: VerificationType.Multikey,
  controller: 'did:web:trustvc.github.io:did:1',
  publicKeyMultibase: 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc',
  secretKeyMultibase: 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW',
};

describe('DocumentBuilder data model 2.0 using ECDSA', () => {
  let documentBuilder: DocumentBuilder;

  beforeEach(() => {
    documentBuilder = new DocumentBuilder({}).credentialSubject({});
  });

  describe('Initialization', () => {
    it('should initialize with default context and type', async () => {
      const signedDocument = await documentBuilder.sign(ECDSAtestPrivateKey, 'ecdsa-sd-2023');
      expect(signedDocument).toMatchObject({
        '@context': expect.arrayContaining([
          'https://www.w3.org/ns/credentials/v2',
          'https://w3id.org/security/data-integrity/v2',
        ]),
        type: expect.arrayContaining(['VerifiableCredential']),
      });
    });
  });

  describe('toString()', () => {
    it('should return the current state of the document as a JSON string', () => {
      const expectedJson = JSON.stringify(
        {
          '@context': ['https://www.w3.org/ns/credentials/v2'],
          type: ['VerifiableCredential'],
          credentialSubject: {},
        },
        null,
        2,
      );

      expect(documentBuilder.toString()).toBe(expectedJson);
    });
  });

  describe('Validation Errors', () => {
    it('should throw an error when required fields are missing', async () => {
      await expect(new DocumentBuilder({}).sign(ECDSAtestPrivateKey)).rejects.toThrow(
        'Validation Error: Missing required field "credentialSubject" in the credential.',
      );
    });

    it('should throw an error when document is already signed', async () => {
      await documentBuilder.sign(ECDSAtestPrivateKey);
      expect(() =>
        documentBuilder.credentialStatus({
          chain: 'amoy',
          chainId: 80002,
          tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
          rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
        }),
      ).toThrow('Configuration Error: Document is already signed.');
    });
  });

  describe('Credential Status Configuration', () => {
    it('should configure transferableRecords correctly', () => {
      documentBuilder.credentialStatus({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      });
      expect(documentBuilder).toBeDefined();
    });

    it('should configure verifiableDocument correctly', () => {
      documentBuilder.credentialStatus({
        url: 'https://trustvc.github.io/did/credentials/statuslist/1',
        index: 10,
      });
      expect(documentBuilder).toBeDefined();
    });

    it('should throw an error when both transferableRecords and verifiableDocument properties are provided', () => {
      expect(() =>
        documentBuilder.credentialStatus({
          chain: 'amoy',
          chainId: 80002,
          tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
          rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
          url: 'https://trustvc.github.io/did/credentials/statuslist/1',
          index: 10,
        }),
      ).toThrow(
        'Configuration Error: Do not mix transferable records and verifiable document properties.',
      );
    });

    it('should throw an error when required fields for credential status are missing', () => {
      expect(() =>
        documentBuilder.credentialStatus({
          url: 'https://trustvc.github.io/did/credentials/statuslist/1',
        } as any),
      ).toThrow('Configuration Error: Missing required fields for credential status.');
    });
  });

  describe('Sign, Derive and Verify', () => {
    it('should sign, derive and verify the document successfully for transferableRecords', async () => {
      documentBuilder.credentialStatus({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      });
      const signedDocument = await documentBuilder.sign(ECDSAtestPrivateKey);
      expect(signedDocument).toBeDefined();
      const derivedDocument = await documentBuilder.derive(signedDocument, []);
      expect(derivedDocument).toBeDefined();
      const verificationResult = await documentBuilder.verify(derivedDocument);
      expect(verificationResult).toBe(true);
    }, 10000);

    it('should sign, derive and verify the document successfully for verifiableDocument', async () => {
      documentBuilder.credentialStatus({
        url: 'https://trustvc.github.io/did/credentials/statuslist/1',
        index: 10, // Not revoked
      });
      const signedDocument = await documentBuilder.sign(ECDSAtestPrivateKey);
      expect(signedDocument).toBeDefined();
      const derivedDocument = await documentBuilder.derive(signedDocument, []);
      expect(derivedDocument).toBeDefined();
      const verificationResult = await documentBuilder.verify(derivedDocument);
      expect(verificationResult).toBe(true);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('Should throw error if document builder initialized with data model v1.1 context', () => {
      expect(
        () => new DocumentBuilder({ '@context': ['https://www.w3.org/2018/credentials/v1'] }),
      ).toThrow('Document builder does not support data model v1.1.');
    });

    it('Should throw an error when trying to verify without deriving', async () => {
      documentBuilder.credentialStatus({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      });
      const signedDocument = await documentBuilder.sign(ECDSAtestPrivateKey);
      expect(signedDocument).toBeDefined();
      await expect(documentBuilder.verify()).rejects.toThrow(
        'Verification Error: ecdsa-sd-2023 base credentials must be derived before verification. Use deriveCredential() first.',
      );
    });

    it('should throw an error for an unsupported chain ID', async () => {
      documentBuilder.credentialStatus({
        chain: 'unknown-chain',
        chainId: 999999, // Invalid chainId
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      });
      await expect(documentBuilder.sign(ECDSAtestPrivateKey)).rejects.toThrow(
        'Unsupported Chain: Chain ID 999999 is not supported.',
      );
    });

    it('should throw an error when unable to verify token registry', async () => {
      documentBuilder.credentialStatus({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://invalid-rpc-url', // Invalid RPC URL
      });
      await expect(documentBuilder.sign(ECDSAtestPrivateKey)).rejects.toThrow(
        'Network Error: Unable to verify token registry. Please check the RPC URL or token registry address.',
      );
    }, 45_000);

    it('should throw an error when signing a document with a revoked credential status', async () => {
      documentBuilder.credentialStatus({
        url: 'https://trustvc.github.io/did/credentials/statuslist/1',
        index: 5, // Revoked
      });
      await expect(documentBuilder.sign(ECDSAtestPrivateKey)).rejects.toThrow(
        'Credential Verification Failed: Invalid credential status detected.',
      );
    });

    it('should throw an error when signing a document with an invalid credential status', async () => {
      documentBuilder.credentialStatus({
        url: 'https://trustvc.github.io/did/credentials/statuslist/3', // Invalid URL
        index: 10,
      });
      await expect(documentBuilder.sign(ECDSAtestPrivateKey)).rejects.toThrowError(
        /Credential Verification Failed:/,
      );
    });
  });

  describe('validUntil', () => {
    it('should set valid until (expiration) date when given a string', () => {
      documentBuilder.expirationDate('2025-12-31T23:59:59Z');
      expect(documentBuilder['document'].validUntil).toBe('2025-12-31T23:59:59Z');
    });

    it('should set valid until (expiration) date when given a Date object', () => {
      const date = new Date('2025-12-31T23:59:59Z');
      documentBuilder.expirationDate(date);
      expect(documentBuilder['document'].validUntil).toBe(date.toISOString());
    });
  });

  describe('renderMethod', () => {
    it('should set the render method', async () => {
      const method = {
        id: 'https://localhost:3000/renderer',
        type: 'EMBEDDED_RENDERER',
        templateName: 'BILL_OF_LADING',
      };

      documentBuilder.renderMethod({
        id: 'https://localhost:3000/renderer',
        type: 'EMBEDDED_RENDERER',
        templateName: 'BILL_OF_LADING',
      });
      expect(documentBuilder['document'].renderMethod).toEqual([method]);
      expect(documentBuilder['document']['@context']).toContain(
        'https://trustvc.io/context/render-method-context-v2.json',
      );
    });
  });

  describe('qrCode', () => {
    it('should set the qrcode method', async () => {
      const method = {
        uri: 'https://localhost:3000/qrcode',
        type: 'TrustVCQRCode',
      };

      documentBuilder.qrCode({
        uri: 'https://localhost:3000/qrcode',
        type: 'TrustVCQRCode',
      });
      expect(documentBuilder['document'].qrCode).toEqual(method);
      expect(documentBuilder['document']['@context']).toContain(
        'https://trustvc.io/context/qrcode-context.json',
      );
    });
  });
});

describe('DocumentBuilder Data model 2.0 using BBS2020', () => {
  let documentBuilder: DocumentBuilder;

  beforeEach(() => {
    documentBuilder = new DocumentBuilder({}).credentialSubject({});
  });

  describe('Initialization', () => {
    it('should initialize with default context and type', async () => {
      const signedDocument = await documentBuilder.sign(
        BBS2020testPrivateKey,
        'BbsBlsSignature2020',
      );
      expect(signedDocument).toMatchObject({
        '@context': expect.arrayContaining([
          'https://www.w3.org/ns/credentials/v2',
          'https://w3id.org/security/bbs/v1',
        ]),
        type: expect.arrayContaining(['VerifiableCredential']),
      });
    });
  });

  describe('Validation Errors', () => {
    it('should throw an error when required fields are missing', async () => {
      await expect(
        new DocumentBuilder({}).sign(BBS2020testPrivateKey, 'BbsBlsSignature2020'),
      ).rejects.toThrow(
        'Validation Error: Missing required field "credentialSubject" in the credential.',
      );
    });

    it('should throw an error when document is already signed', async () => {
      await documentBuilder.sign(BBS2020testPrivateKey, 'BbsBlsSignature2020');
      expect(() =>
        documentBuilder.credentialStatus({
          chain: 'amoy',
          chainId: 80002,
          tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
          rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
        }),
      ).toThrow('Configuration Error: Document is already signed.');
    });
  });

  describe('Signing and Verification', () => {
    it('should sign and verify the document successfully for transferableRecords', async () => {
      documentBuilder.credentialStatus({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      });
      const signedDocument = await documentBuilder.sign(
        BBS2020testPrivateKey,
        'BbsBlsSignature2020',
      );
      expect(signedDocument).toBeDefined();
      const verificationResult = await documentBuilder.verify();
      expect(verificationResult).toBe(true);
    });

    it('should sign and verify the document successfully for verifiableDocument', async () => {
      documentBuilder.credentialStatus({
        url: 'https://trustvc.github.io/did/credentials/statuslist/1',
        index: 10, // Not revoked
      });
      const signedDocument = await documentBuilder.sign(
        BBS2020testPrivateKey,
        'BbsBlsSignature2020',
      );
      expect(signedDocument).toBeDefined();
      const verificationResult = await documentBuilder.verify();
      expect(verificationResult).toBe(true);
    });

    it('should not verify the document if it is not signed yet', async () => {
      await expect(documentBuilder.verify()).rejects.toThrow(
        'Verification Error: Document is not signed yet.',
      );
    });

    it('should be able to derive document and verify derived document', async () => {
      const contextDocument: ContextDocument = {
        '@context': [
          'https://www.w3.org/ns/credentials/v2',
          'https://w3id.org/security/bbs/v1',
          'https://trustvc.io/context/transferable-records-context.json',
        ],
        type: ['VerifiableCredential'],
      };

      documentBuilder.credentialStatus({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      });
      const signedDocument = await documentBuilder.sign(
        BBS2020testPrivateKey,
        'BbsBlsSignature2020',
      );
      const derivedDocument = await documentBuilder.derive(signedDocument, contextDocument);
      expect(derivedDocument).toBeDefined();
      const verificationResult = await documentBuilder.verify(derivedDocument);
      expect(verificationResult).toBe(true);
    });
  });
});
