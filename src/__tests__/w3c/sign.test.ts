import { describe, expect, it } from 'vitest';
import { W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import { signW3C } from '../..';
import { VerificationType } from '@trustvc/w3c-issuer';

describe('W3C sign', () => {
  it('should sign a document', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proof, id, ...documentWithoutProof } = W3C_VERIFIABLE_DOCUMENT;

    const signingResult = await signW3C(documentWithoutProof, {
      id: 'did:web:trustvc.github.io:did:1#keys-1',
      controller: 'did:web:trustvc.github.io:did:1',
      type: VerificationType.Bls12381G2Key2020,
      publicKeyBase58:
        'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
      privateKeyBase58: '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF',
    });
    expect(signingResult.signed).toBeDefined();
    expect(signingResult.signed.proof).toBeDefined();
    expect(signingResult.signed.proof.type).toBe('BbsBlsSignature2020');
  });
});
