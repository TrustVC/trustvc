import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentBuilder } from '../../core/documentBuilder';
import { PrivateKeyPair, VerificationType } from '@trustvc/w3c-issuer';
import { verifyCredential } from '@trustvc/w3c-vc';

const testPrivateKey: PrivateKeyPair = {
  id: 'did:web:trustvc.github.io:did:1#keys-1',
  controller: 'did:web:trustvc.github.io:did:1',
  type: VerificationType.Bls12381G2Key2020,
  publicKeyBase58:
    'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
  privateKeyBase58: '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF',
};

describe('DocumentBuilder', () => {
  let documentBuilder: DocumentBuilder;

  beforeEach(() => {
    documentBuilder = new DocumentBuilder({ credentialSubject: {} });
  });

  it('should initialize with default context and type', () => {
    expect(documentBuilder).toBeDefined();
  });

  it('should throw an error when required fields are missing', () => {
    expect(() => new DocumentBuilder({})).toThrow(
      'Validation Error: Missing required field "credentialSubject" in the credential.',
    );
  });

  it('should configure transferableRecords correctly', () => {
    documentBuilder.transferableRecords({
      chain: 'amoy',
      chainId: 80002,
      tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
    });
    expect(documentBuilder).toBeDefined();
  });

  it('should configure verifiableDocument correctly', () => {
    documentBuilder.verifiableDocument({
      url: 'https://trustvc.github.io/did/credentials/statuslist/1',
      index: 10,
    });
    expect(documentBuilder).toBeDefined();
  });

  it('should throw an error when configuring verifiableDocument after transferableRecords', () => {
    documentBuilder.transferableRecords({
      chain: 'amoy',
      chainId: 80002,
      tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
    });
    expect(() =>
      documentBuilder.verifiableDocument({
        url: 'https://trustvc.github.io/did/credentials/statuslist/1',
        index: 10,
      }),
    ).toThrow(
      'Configuration Error: You can only call either .transferableRecords() or .verifiableDocument(), not both.',
    );
  });

  it('should throw an error when configuring transferableRecords after verifiableDocument', () => {
    documentBuilder.verifiableDocument({
      url: 'https://trustvc.github.io/did/credentials/statuslist/1',
      index: 10,
    });
    expect(() =>
      documentBuilder.transferableRecords({
        chain: 'amoy',
        chainId: 80002,
        tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
        rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
      }),
    ).toThrow(
      'Configuration Error: You can only call either .transferableRecords() or .verifiableDocument(), not both.',
    );
  });

  it('should sign the document successfully for transferableRecords', async () => {
    documentBuilder.transferableRecords({
      chain: 'amoy',
      chainId: 80002,
      tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
    });
    const signedDocument = await documentBuilder.sign(testPrivateKey);
    expect(signedDocument).toBeDefined();
    const verificationResult = await verifyCredential(signedDocument);
    expect(verificationResult.verified).toBe(true);
    expect(verificationResult.error).toBeUndefined();
  });

  it('should sign the document successfully for verifiableDocument', async () => {
    documentBuilder.verifiableDocument({
      url: 'https://trustvc.github.io/did/credentials/statuslist/1',
      index: 10, // Not revoked
    });
    const signedDocument = await documentBuilder.sign(testPrivateKey);
    expect(signedDocument).toBeDefined();
    const verificationResult = await verifyCredential(signedDocument);
    expect(verificationResult.verified).toBe(true);
    expect(verificationResult.error).toBeUndefined();
  });

  it('should throw an error for an unsupported chain ID', async () => {
    documentBuilder.transferableRecords({
      chain: 'unknown-chain',
      chainId: 999999, // Invalid chainId
      tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
    });
    await expect(documentBuilder.sign(testPrivateKey)).rejects.toThrow(
      'Unsupported Chain: Chain ID 999999 is not supported.',
    );
  });

  it('should throw an error when unable to verify token registry', async () => {
    documentBuilder.transferableRecords({
      chain: 'amoy',
      chainId: 80002,
      tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      rpcProviderUrl: 'https://invalid-rpc-url', // Invalid RPC URL
    });
    await expect(documentBuilder.sign(testPrivateKey)).rejects.toThrow(
      'Network Error: Unable to verify token registry. Please check the RPC URL or token registry address.',
    );
  });

  it('should throw an error when signing a document with a revoked credential status (bitstring index)', async () => {
    documentBuilder.verifiableDocument({
      url: 'https://trustvc.github.io/did/credentials/statuslist/1',
      index: 5, // Revoked
    });
    await expect(documentBuilder.sign(testPrivateKey)).rejects.toThrow(
      'Credential Verification Failed: Invalid credential status detected.',
    );
  });

  it('should throw an error when signing a document with an invalid credential status', async () => {
    documentBuilder.verifiableDocument({
      url: 'https://trustvc.github.io/did/credentials/statuslist/2', // Invalid URL
      index: 10,
    });
    await expect(documentBuilder.sign(testPrivateKey)).rejects.toThrowError(
      /Credential Verification Failed:/,
    );
  });
});
