import { describe, expect, it } from 'vitest';
import { W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import { verifyW3CSignature } from '../..';

describe('W3C verify', () => {
  it('should verify a valid document', async () => {
    const verificationResult = await verifyW3CSignature(W3C_VERIFIABLE_DOCUMENT as any);
    expect(verificationResult.verified).toBe(true);
  });

  it('should verify a tampered document', async () => {
    const tampered = { ...W3C_VERIFIABLE_DOCUMENT, expirationDate: '2029-12-03T12:19:53Z' };
    const verificationResult = await verifyW3CSignature(tampered as any);
    expect(verificationResult.verified).toBe(false);
  });
});
