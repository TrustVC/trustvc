import { describe, expect, it, vi, beforeEach } from 'vitest';
import { constants } from 'ethers';
import { OpenAttestationEthereumTokenRegistryStatusCode } from '@tradetrust-tt/tt-verify';
import { isTokenMintedOnObligationRegistry } from '../../verify/fragments/document-status/obligationRecords/utils';

const mockOwnerOf = vi.fn();
const mockActive = vi.fn();
const mockIsHoldingToken = vi.fn();
const mockGetObligationEscrowAddress = vi.fn();

vi.mock('@tradetrust-tt/token-registry-v5/contracts', () => ({
  TrustVCToken__factory: {
    connect: vi.fn(() => ({
      ownerOf: mockOwnerOf,
    })),
  },
  ObligationEscrow__factory: {
    connect: vi.fn(() => ({
      active: mockActive,
      isHoldingToken: mockIsHoldingToken,
    })),
  },
}));

vi.mock('../../core/endorsement-chain/obligation', () => ({
  getObligationEscrowAddress: (...args: unknown[]) => mockGetObligationEscrowAddress(...args),
}));

describe('isTokenMintedOnObligationRegistry', () => {
  const obligationRegistryAddress = '0xRegistry';
  const tokenId = '0x1';
  const provider = {
    getNetwork: vi.fn().mockResolvedValue({ chainId: 80002 }),
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetObligationEscrowAddress.mockResolvedValue('0xEscrow');
    mockOwnerOf.mockResolvedValue('0xEscrow');
    mockActive.mockResolvedValue(true);
    mockIsHoldingToken.mockResolvedValue(true);
  });

  it('returns minted when owner is set and title is live', async () => {
    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistryAddress,
      tokenId,
      provider,
      chainId: 80002,
    });

    expect(result).toEqual({ minted: true, address: obligationRegistryAddress });
  });

  it('returns not minted when title is inactive or not holding', async () => {
    mockIsHoldingToken.mockResolvedValue(false);

    const result = await isTokenMintedOnObligationRegistry({
      obligationRegistryAddress,
      tokenId,
      provider,
      chainId: 80002,
    });

    expect(result.minted).toBe(false);
    expect(result).toMatchObject({
      reason: {
        code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
        message: expect.stringContaining('title is not active'),
      },
    });
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
});
