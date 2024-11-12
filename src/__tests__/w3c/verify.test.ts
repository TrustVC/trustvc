import { describe, it } from 'vitest';
import { verifyW3CSignature } from '../..';
import { W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';

describe.concurrent('W3C verify', () => {
  it('should verify a valid document', async ({ expect }) => {
    const verificationResult = await verifyW3CSignature(W3C_VERIFIABLE_DOCUMENT);
    expect(verificationResult.verified).toBe(true);
  });

  it('should verify a tampered document', async ({ expect }) => {
    const tampered = { ...W3C_VERIFIABLE_DOCUMENT, expirationDate: '2029-12-03T12:19:53Z' };
    const verificationResult = await verifyW3CSignature(tampered);
    expect(verificationResult.verified).toBe(false);
  });
});
