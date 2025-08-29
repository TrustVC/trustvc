import { describe, it, expect } from 'vitest';
import { CONSTANTS } from '@tradetrust-tt/tradetrust-utils';

import { errorMessageHandling } from 'src/utils/fragment';

// Fixtures
import {
  whenW3CDocumentNotIssued,
  whenW3CDocumentHashInvalid,
  whenW3CDocumentValid,
  whenW3CDocumentIssuerIdentityInvalid,
  whenOADocumentHashInvalid,
} from 'src/__tests__/fixtures/fragments';

describe('errorMessageHandling with fixtures', () => {
  it('W3C: returns INVALID when document is not issued (TransferableRecords INVALID)', () => {
    const res = errorMessageHandling(whenW3CDocumentNotIssued as any);
    expect(res).toEqual([CONSTANTS.TYPES.INVALID]);
  });

  it('W3C: returns HASH when hash is invalid (W3CSignatureIntegrity INVALID)', () => {
    const res = errorMessageHandling(whenW3CDocumentHashInvalid as any);
    expect(res).toEqual([CONSTANTS.TYPES.HASH]);
  });

  it('W3C: returns IDENTITY when issuer identity invalid', () => {
    const res = errorMessageHandling(whenW3CDocumentIssuerIdentityInvalid as any);
    expect(res).toEqual([CONSTANTS.TYPES.IDENTITY]);
  });

  it('W3C: returns empty array when all fragments are valid', () => {
    const res = errorMessageHandling(whenW3CDocumentValid as any);
    expect(res).toEqual([]);
  });

  it('OA: returns the OA invalid hash error when the fragment has invalid hash', () => {
    const res = errorMessageHandling(whenOADocumentHashInvalid as any);
    expect(res).toEqual([CONSTANTS.TYPES.HASH]);
  });
});
