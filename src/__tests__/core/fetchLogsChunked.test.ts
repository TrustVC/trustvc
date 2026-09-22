import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FREE_TIER_MAX_CHUNK_SIZE,
  GET_LOGS_MAX_CONCURRENCY,
  INITIAL_CHUNK_SIZE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';
import {
  scanForMintEvent,
  scanLogsBackward,
  scanLogsForward,
} from '../../core/endorsement-chain/fetchLogsChunked';

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
    getNetwork: vi.fn(async () => ({ chainId: 1 })),
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

describe('scanLogsForward', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks floor→latest in adaptive 10k windows (first sequential, rest parallel)', async () => {
    const windows: GetLogsCall[] = [];
    const provider = mockProvider(async (filter) => {
      windows.push({ fromBlock: filter.fromBlock, toBlock: filter.toBlock });
      return [{ blockNumber: filter.fromBlock }];
    });

    const logs = await scanLogsForward(provider as never, '0xabc', 1_000, 25_000);

    expect([...windows].sort((a, b) => a.fromBlock - b.fromBlock)).toEqual([
      { fromBlock: 1_000, toBlock: 10_999 },
      { fromBlock: 11_000, toBlock: 20_999 },
      { fromBlock: 21_000, toBlock: 25_000 },
    ]);
    expect(logs).toHaveLength(3);
    // Oldest→newest regardless of parallel completion order.
    expect(logs.map((l) => (l as { blockNumber: number }).blockNumber)).toEqual([
      1_000, 11_000, 21_000,
    ]);
  });

  it('parallelizes all windows immediately when assumePaidTier is set', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const provider = mockProvider(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 15));
      inFlight -= 1;
      return [];
    });

    await scanLogsForward(provider as never, '0xabc', 0, 50_000, undefined, {
      assumePaidTier: true,
    });

    expect(maxInFlight).toBeGreaterThan(1);
    expect(maxInFlight).toBeLessThanOrEqual(GET_LOGS_MAX_CONCURRENCY);
  });

  it('never exceeds GET_LOGS_MAX_CONCURRENCY in-flight getLogs', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const provider = mockProvider(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 20));
      inFlight -= 1;
      return [];
    });

    // 1 sequential + remaining parallel windows → peak should be ≤ concurrency cap.
    await scanLogsForward(provider as never, '0xabc', 0, 60_000);

    expect(maxInFlight).toBeLessThanOrEqual(GET_LOGS_MAX_CONCURRENCY);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it('shrinks then continues on result-overflow errors', async () => {
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      if (size > 5_000) {
        throw new Error('query returned more than 10000 results');
      }
      return [];
    });

    // Span wide enough that the first attempt is a full 10k window.
    await scanLogsForward(provider as never, '0xabc', 0, 20_000);

    expect(windows[0]).toBe(INITIAL_CHUNK_SIZE);
    expect(windows[1]).toBe(2_500);
    expect(windows.slice(1).every((s) => s <= 2_500)).toBe(true);
  });

  it('stays sequential on free-tier after the first window learns the 10-block cap', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      if (size > FREE_TIER_MAX_CHUNK_SIZE) {
        throw new Error('free tier plan: 10 block difference');
      }
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return [];
    });

    await scanLogsForward(provider as never, '0xabc', 0, 50);

    expect(maxInFlight).toBe(1);
  });
});

describe('scanForMintEvent paid parallel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds mint below tip and returns oldest→newest through tip', async () => {
    const mintBlock = 5_000;
    const provider = mockProvider(async (filter) => {
      if (filter.fromBlock <= mintBlock && filter.toBlock >= mintBlock) {
        return [
          {
            blockNumber: mintBlock,
            transactionHash: '0xmint',
            isMint: true,
          },
        ];
      }
      if (filter.fromBlock > mintBlock) {
        return [{ blockNumber: filter.fromBlock, transactionHash: '0xlater', isMint: false }];
      }
      return [];
    });

    const logs = await scanForMintEvent(provider as never, '0xabc', 0, 25_000, {
      isMintLog: (log) => Boolean(log.isMint),
      notFoundOnFailureMessage: 'fail',
      notFoundMessage: 'missing',
    });

    expect(logs[0]).toMatchObject({ blockNumber: mintBlock, isMint: true });
    expect(logs[logs.length - 1].blockNumber).toBeGreaterThanOrEqual(mintBlock);
  });
});
