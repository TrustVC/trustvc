import { describe, expect, it, vi } from 'vitest';
import { scanLogsBackward } from '../../core/endorsement-chain/fetchLogsChunked';

describe('scanLogsBackward', () => {
  it('caps subsequent ranges below a fixed provider limit after range-too-large', async () => {
    const providerLimit = 1000;
    const fromBlock = 10_000;
    const toBlockFloor = 0;
    let overLimitAttempts = 0;

    const getLogs = vi.fn(
      async ({ fromBlock: from, toBlock: to }: { fromBlock: number; toBlock: number }) => {
        const range = to - from + 1;
        if (range > providerLimit) {
          overLimitAttempts++;
          throw new Error('block range is too large');
        }
        return [];
      },
    );

    await scanLogsBackward({ getLogs } as never, '0xabc', fromBlock, toBlockFloor);

    const ranges = getLogs.mock.calls.map(
      ([filter]: [{ fromBlock: number; toBlock: number }]) => filter.toBlock - filter.fromBlock + 1,
    );

    expect(overLimitAttempts).toBe(1);
    expect(ranges[0]).toBeGreaterThan(providerLimit);
    expect(ranges.slice(1).every((range) => range <= providerLimit)).toBe(true);
    // After the first rejection, growth must stay at the reduced cap (INITIAL/4 = 500), not climb
    // back toward providerLimit - 1 via empty-window doubling.
    expect(Math.max(...ranges.slice(1))).toBeLessThanOrEqual(Math.floor(2000 / 4));
  });
});
