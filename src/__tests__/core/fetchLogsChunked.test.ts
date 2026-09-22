import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FREE_TIER_MAX_CHUNK_SIZE,
  INITIAL_CHUNK_SIZE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';
import { scanLogsBackward } from '../../core/endorsement-chain/fetchLogsChunked';

type GetLogsCall = {
  fromBlock: number;
  toBlock: number;
};

function windowSize(call: GetLogsCall): number {
  return call.toBlock - call.fromBlock + 1;
}

function mockProvider(getLogs: (filter: GetLogsCall) => Promise<unknown[]>) {
  return {
    getLogs: vi.fn(async (filter: GetLogsCall) => getLogs(filter)),
  };
}

describe('scanLogsBackward tier ladder', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('jumps from 10000 to 10 on a free-tier block-range error', async () => {
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      if (size > FREE_TIER_MAX_CHUNK_SIZE) {
        throw new Error(
          'Log response size exceeded. You can make eth_getLogs requests with up to a 10 block range on the Free tier plan. Upgrade to PAYG for greater limits.',
        );
      }
      return [];
    });

    // Floor low enough that the first paid window is a full 10k blocks.
    await scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    expect(windows[0]).toBe(INITIAL_CHUNK_SIZE);
    expect(windows[1]).toBe(FREE_TIER_MAX_CHUNK_SIZE);
    expect(windows.slice(1).every((s) => s <= FREE_TIER_MAX_CHUNK_SIZE)).toBe(true);
  });

  it('hard-stops on 429 while scanning at the free-tier 10-block window', async () => {
    let getLogsCalls = 0;
    const provider = mockProvider(async (filter) => {
      getLogsCalls += 1;
      const size = windowSize(filter);
      if (size > FREE_TIER_MAX_CHUNK_SIZE) {
        throw new Error('free tier plan: 10 block difference');
      }
      throw Object.assign(new Error('Too Many Requests'), { code: 429 });
    });

    const result = await scanLogsBackward(provider as never, '0xabc', 100_000, 0);

    // One failed 10k (free-tier shrink) + one 10-block 429 → stop with no further retries.
    expect(getLogsCalls).toBe(2);
    expect(result.truncated).toBe(true);
    expect(result.foundMint).toBe(false);
  });

  it('shrinks on result overflow without jumping to free-tier 10', async () => {
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      if (size === INITIAL_CHUNK_SIZE) {
        throw new Error('query returned more than 10000 results');
      }
      return [];
    });

    await scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    expect(windows[0]).toBe(INITIAL_CHUNK_SIZE);
    expect(windows[1]).toBe(2_500);
    expect(windows[1]).toBeGreaterThan(FREE_TIER_MAX_CHUNK_SIZE);
  });

  it('retries rate limits at the paid 10000 window before giving up', async () => {
    vi.useFakeTimers();
    let attemptsAt10k = 0;
    const provider = mockProvider(async () => {
      attemptsAt10k += 1;
      throw Object.assign(new Error('Too Many Requests'), { code: 429 });
    });

    const resultPromise = scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(attemptsAt10k).toBe(RATE_LIMIT_MAX_RETRIES + 1);
    expect(result.truncated).toBe(true);
  });
});
