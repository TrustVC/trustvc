import { describe, expect, it, vi } from 'vitest';
import { resolveEscrowScanBounds } from '../../core/endorsement-chain/fetchEscrowTransfer';

describe('resolveEscrowScanBounds', () => {
  it('uses Obligation mintBlock as from and shredBlock as to when shredded', async () => {
    const provider = {
      getCode: vi.fn(),
    };
    const titleEscrowContract = {
      mintBlock: vi.fn(async () => 1_000),
      shredBlock: vi.fn(async () => 5_000),
    };

    const bounds = await resolveEscrowScanBounds(
      provider as never,
      titleEscrowContract as never,
      '0xescrow',
      9_000_000,
    );

    expect(bounds).toEqual({ fromBlock: 1_000, toBlock: 5_000 });
    expect(provider.getCode).not.toHaveBeenCalled();
  });

  it('uses mintBlock → latest when shredBlock is 0 (active obligation)', async () => {
    const provider = { getCode: vi.fn() };
    const titleEscrowContract = {
      mintBlock: vi.fn(async () => 2_000),
      shredBlock: vi.fn(async () => 0),
    };

    const bounds = await resolveEscrowScanBounds(
      provider as never,
      titleEscrowContract as never,
      '0xescrow',
      50_000,
    );

    expect(bounds).toEqual({ fromBlock: 2_000, toBlock: 50_000 });
  });

  it('falls back to creation binary-search when mintBlock is missing (classic V5)', async () => {
    const provider = {
      getCode: vi.fn(async (_addr: string, block: number) => {
        // Code appears from block 8_000 onward.
        return block >= 8_000 ? '0x60016000' : '0x';
      }),
    };
    const titleEscrowContract = {
      mintBlock: vi.fn(async () => {
        throw new Error('missing mintBlock');
      }),
      shredBlock: vi.fn(async () => {
        throw new Error('missing shredBlock');
      }),
    };

    const bounds = await resolveEscrowScanBounds(
      provider as never,
      titleEscrowContract as never,
      '0xescrow',
      16_000,
    );

    expect(bounds.fromBlock).toBe(8_000);
    expect(bounds.toBlock).toBe(16_000);
  });

  it('ignores shredBlock when it is before fromBlock', async () => {
    const provider = { getCode: vi.fn() };
    const titleEscrowContract = {
      mintBlock: vi.fn(async () => 10_000),
      shredBlock: vi.fn(async () => 100), // invalid / stale
    };

    const bounds = await resolveEscrowScanBounds(
      provider as never,
      titleEscrowContract as never,
      '0xescrow',
      20_000,
    );

    expect(bounds).toEqual({ fromBlock: 10_000, toBlock: 20_000 });
  });
});
