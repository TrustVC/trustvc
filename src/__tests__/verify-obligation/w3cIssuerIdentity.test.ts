import { describe, expect, it, vi } from 'vitest';
import { w3cIssuerIdentity } from '../../verify-obligation/fragments/issuer-identity/w3cIssuerIdentity';

const baseDocument = {
  issuer: 'did:web:example.com',
  proof: {
    verificationMethod: 'did:web:example.com#keys-1',
  },
} as never;

describe('w3cIssuerIdentity (verify-obligation)', () => {
  it('returns INVALID when the document loader resolves without a DID document', async () => {
    const result = await w3cIssuerIdentity.verify(baseDocument, {
      documentLoader: vi.fn().mockResolvedValue({ document: null }),
    } as never);

    expect(result).toEqual({
      type: 'ISSUER_IDENTITY',
      name: 'W3CIssuerIdentity',
      data: false,
      reason: { message: 'The DID cannot be resolved.' },
      status: 'INVALID',
    });
  });

  it('returns ERROR when the document loader throws a network error', async () => {
    const result = await w3cIssuerIdentity.verify(baseDocument, {
      documentLoader: vi.fn().mockRejectedValue(new Error('network request failed')),
    } as never);

    expect(result).toEqual({
      type: 'ISSUER_IDENTITY',
      name: 'W3CIssuerIdentity',
      status: 'ERROR',
      reason: { message: 'network request failed' },
    });
  });

  it('returns VALID when the document loader returns a DID document', async () => {
    const result = await w3cIssuerIdentity.verify(baseDocument, {
      documentLoader: vi.fn().mockResolvedValue({ document: { id: 'did:web:example.com' } }),
    } as never);

    expect(result).toEqual({
      type: 'ISSUER_IDENTITY',
      name: 'W3CIssuerIdentity',
      data: true,
      status: 'VALID',
    });
  });

  it('returns INVALID for malformed did:key identifiers', async () => {
    const result = await w3cIssuerIdentity.verify(
      {
        issuer: 'did:key:not-a-valid-key',
        proof: { verificationMethod: 'did:key:not-a-valid-key#keys-1' },
      } as never,
      {} as never,
    );

    expect(result).toEqual({
      type: 'ISSUER_IDENTITY',
      name: 'W3CIssuerIdentity',
      data: false,
      reason: { message: 'The DID cannot be resolved.' },
      status: 'INVALID',
    });
  });
});
