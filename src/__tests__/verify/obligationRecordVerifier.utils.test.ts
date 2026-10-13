import { describe, expect, it, vi, beforeEach } from 'vitest';
import { constants } from 'ethers';
import { OpenAttestationEthereumTokenRegistryStatusCode } from '@tradetrust-tt/tt-verify';
import { isTokenMintedOnObligationRegistry } from '../../verify/fragments/document-status/obligationRecords/utils';

const mockOwnerOf = vi.fn();

vi.mock('@tradetrust-tt/token-registry-v5/contracts', () => ({
  TrustVCToken__factory: {
    connect: vi.fn(() => ({
      ownerOf: mockOwnerOf,
    })),
  },
}));

describe('isTokenMintedOnObligationRegistry', () => {
  const obligationRegistryAddress = '0xRegistry';
  const tokenId = '0x1';
  const provider = {
    getNetwork: vi.fn().mockResolvedValue({ chainId: 80002 }),
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerOf.mockResolvedValue('0xEscrow');
  });

  it('returns minted when owner is set (active title)', async () => {
    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistryAddress,
      tokenId,
      provider,
      chainId: 80002,
    });

    expect(result).toEqual({ minted: true, address: obligationRegistryAddress });
  });

  it('returns minted when owner is burn address (shredded, same as classic ETR)', async () => {
    mockOwnerOf.mockResolvedValue('0x000000000000000000000000000000000000dEaD');

    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistryAddress,
      tokenId,
      provider,
      chainId: 80002,
    });

    expect(result).toEqual({ minted: true, address: obligationRegistryAddress });
  });

  it('returns not minted when owner is zero address', async () => {
    mockOwnerOf.mockResolvedValue(constants.AddressZero);

    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistryAddress,
      tokenId,
      provider,
      chainId: 80002,
    });

    expect(result.minted).toBe(false);
  });

  it('maps ownerOf absence revert to DOCUMENT_NOT_MINTED via decodeError', async () => {
    mockOwnerOf.mockRejectedValue({
      message: 'owner query for nonexistent token',
      code: 'CALL_EXCEPTION',
    });

    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistryAddress,
      tokenId,
      provider,
      chainId: 80002,
    });

    expect(result).toMatchObject({
      minted: false,
      reason: {
        code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
        message: 'Document has not been issued under token registry',
      },
    });
  });
});
