import { describe, expect, it } from 'vitest';
import { decodeObligationRegistryError } from '../../verify/fragments/document-status/obligationRecords/utils';

describe('decodeObligationRegistryError', () => {
  it('classifies nonexistent token by selector even when an unrelated message is present', () => {
    expect(
      decodeObligationRegistryError({
        message: 'call revert exception',
        data: '0x7e2732890000000000000000000000000000000000000000000000000000000000000001',
      }),
    ).toBe('Document has not been issued under obligation registry');
  });

  it('classifies nonexistent token by message phrase', () => {
    expect(
      decodeObligationRegistryError({
        message: 'ERC721: owner query for nonexistent token',
      }),
    ).toBe('Document has not been issued under obligation registry');
  });

  it('classifies nonexistent token by selector when message is missing', () => {
    expect(
      decodeObligationRegistryError({
        data: '0x7e273289abcdef',
      }),
    ).toBe('Document has not been issued under obligation registry');
  });
});
