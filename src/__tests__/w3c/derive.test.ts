import { describe, expect, it } from 'vitest';
import { ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0 } from '../fixtures/fixtures';
import { deriveW3C } from 'src/w3c';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

describe('W3C derive', () => {
  it('should derive a W3C v2.0 document using ECDSA-SD-2023 without custom selective pointers', async () => {
    const result = await deriveW3C(
      ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0 as unknown as SignedVerifiableCredential,
      [],
    );
    expect(result.derived).toBeDefined();
    expect(result.derived.proof).toBeDefined();
    expect(result.derived['@context']).toBeDefined();
    expect(result.derived.credentialStatus).toBeDefined();
    expect(result.derived.renderMethod).toBeUndefined();
    expect(result.derived.qrCode).toBeUndefined();
  });

  it('should derive a W3C v2.0 document using ECDSA-SD-2023 without custom selective pointers', async () => {
    const result = await deriveW3C(
      ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0 as unknown as SignedVerifiableCredential,
      ['/renderMethod', '/qrCode'],
    );
    expect(result.derived).toBeDefined();
    expect(result.derived.proof).toBeDefined();
    expect(result.derived['@context']).toBeDefined();
    expect(result.derived.credentialStatus).toBeDefined();
    expect(result.derived.renderMethod).toBeDefined();
    expect(result.derived.qrCode).toBeDefined();
  });
});
