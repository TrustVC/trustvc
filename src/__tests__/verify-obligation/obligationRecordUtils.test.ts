import { TradeTrustToken__factory } from '@tradetrust-tt/token-registry-v4/contracts';
import { describe, expect, it, vi } from 'vitest';
import { ObligationRecordsStatusCode } from '../../verify-obligation/fragments/document-status/obligationRecords/obligationRecordVerifier.types';
import {
  decodeObligationRegistryError,
  isTokenMintedOnObligationRegistry,
} from '../../verify-obligation/fragments/document-status/obligationRecords/utils';

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

describe('isTokenMintedOnObligationRegistry', () => {
  const obligationRegistry = '0x71D28767662cB233F887aD2Bb65d048d760bA694';
  const tokenId = '0xabc';

  it('rejects when provider chain ID does not match the credential chain ID', async () => {
    const provider = {
      _isProvider: true,
      getNetwork: vi.fn().mockResolvedValue({ chainId: 137 }),
    };

    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistry,
      tokenId,
      provider: provider as never,
      chainId: 80002,
    });

    expect(result).toEqual({
      minted: false,
      address: obligationRegistry,
      reason: {
        code: ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
        codeString: 'UNRECOGNIZED_DOCUMENT',
        message:
          "Provider network chain ID (137) does not match credential's declared chain ID (80002)",
      },
    });
    expect(provider.getNetwork).toHaveBeenCalledOnce();
  });

  it('normalizes string chain IDs before comparing provider network', async () => {
    const ownerOf = vi.fn().mockResolvedValue('0x0000000000000000000000000000000000000001');
    const connect = vi.spyOn(TradeTrustToken__factory, 'connect').mockReturnValue({
      ownerOf,
    } as never);
    const provider = {
      _isProvider: true,
      getNetwork: vi.fn().mockResolvedValue({ chainId: 80002 }),
    };

    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistry,
      tokenId,
      provider: provider as never,
      chainId: '80002',
    });

    expect(provider.getNetwork).toHaveBeenCalledOnce();
    expect(connect).toHaveBeenCalledWith(obligationRegistry, provider);
    expect(ownerOf).toHaveBeenCalledWith(tokenId);
    expect(result).toEqual({ minted: true, address: obligationRegistry });
  });
});
