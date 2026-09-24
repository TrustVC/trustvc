import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FREE_TIER_MAX_CHUNK_SIZE,
  GET_LOGS_MAX_CONCURRENCY,
  INITIAL_CHUNK_SIZE,
  LARGE_CHUNK_SIZE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';
import {
  classifyGetLogsFailure,
  learnCapabilityFromProbeError,
  scanAfterProbeFailure,
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

describe('classifyGetLogsFailure / learnCapabilityFromProbeError', () => {
  it('classifies free-tier and learns sequential maxSpan 10', () => {
    const err = new Error(
      'Log response size exceeded. You can make eth_getLogs requests with up to a 10 block range on the Free tier plan. Upgrade to PAYG for greater limits.',
    );
    expect(classifyGetLogsFailure(err).class).toBe('FREE_TIER');
    expect(learnCapabilityFromProbeError(err)).toEqual({
      mode: 'free',
      maxSpan: FREE_TIER_MAX_CHUNK_SIZE,
      parallel: false,
    });
  });

  it('classifies result overflow separately from free-tier', () => {
    const err = Object.assign(new Error('query returned more than 10000 results'), {
      code: -32005,
    });
    expect(classifyGetLogsFailure(err).class).toBe('RESULT_OVERFLOW');
    expect(learnCapabilityFromProbeError(err).mode).toBe('result_capped');
  });

  it('classifies timeout and learns large result_capped windows', () => {
    const err = Object.assign(new Error('query timeout exceeded'), { code: -32005 });
    expect(classifyGetLogsFailure(err).class).toBe('TIMEOUT');
    const cap = learnCapabilityFromProbeError(err);
    expect(cap.mode).toBe('result_capped');
    expect(cap.maxSpan).toBe(LARGE_CHUNK_SIZE);
    expect(cap.parallel).toBe(true);
  });

  it('parses Infura suggested range from error.data', () => {
    const err = Object.assign(new Error('query returned more than 10000 results'), {
      code: -32005,
      data: { from: '0x1000', to: '0x14FF', limit: 10000 },
    });
    const failure = classifyGetLogsFailure(err);
    expect(failure.class).toBe('RESULT_OVERFLOW');
    expect(failure.suggestedSpan).toBe(0x14ff - 0x1000 + 1);
  });

  it('parses Alchemy suggested range from message', () => {
    const err = new Error(
      'Log response size exceeded. Based on your parameters and the response size limit, this block range should work: [0x0, 0x270f]',
    );
    // Free-tier fingerprint wins when "10 block" is absent; this message is RANGE via suggested.
    // Without free-tier wording this is overflow/response size → RESULT_OVERFLOW.
    expect(classifyGetLogsFailure(err).class).toBe('RESULT_OVERFLOW');
    expect(classifyGetLogsFailure(err).suggestedSpan).toBe(0x270f - 0x0 + 1);
  });
});

describe('scanLogsBackward tier ladder', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('jumps from large-first window to 10 on a free-tier block-range error', async () => {
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

    // Floor low enough that the first attempt covers the full [90k, 100k] span.
    await scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    expect(windows[0]).toBeGreaterThan(FREE_TIER_MAX_CHUNK_SIZE);
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

    // One failed large window (free-tier shrink) + one 10-block 429 → stop with no further retries.
    expect(getLogsCalls).toBe(2);
    expect(result.truncated).toBe(true);
    expect(result.foundMint).toBe(false);
  });

  it('shrinks on result overflow without jumping to free-tier 10', async () => {
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      if (size > 5_000) {
        throw new Error('query returned more than 10000 results');
      }
      return [];
    });

    await scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    expect(windows[0]).toBeGreaterThan(5_000);
    // /4 from the attempted span (full 10_001 → 2500).
    expect(windows[1]).toBe(2_500);
    expect(windows[1]).toBeGreaterThan(FREE_TIER_MAX_CHUNK_SIZE);
  });

  it('bisects on query timeout without jumping to free-tier 10', async () => {
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      if (size > 5_000) {
        throw new Error('query timeout exceeded');
      }
      return [];
    });

    await scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    expect(windows[0]).toBe(10_001);
    // Bisect: floor(10001/2) = 5000.
    expect(windows[1]).toBe(5_000);
    expect(windows[1]).toBeGreaterThan(FREE_TIER_MAX_CHUNK_SIZE);
  });

  it('uses Infura suggested span when present on overflow', async () => {
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      if (size > 2_000) {
        throw Object.assign(new Error('query returned more than 10000 results'), {
          code: -32005,
          data: { from: '0x0', to: '0x7CF', limit: 10000 }, // 0x7CF+1 = 2000
        });
      }
      return [];
    });

    await scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    expect(windows[0]).toBeGreaterThan(2_000);
    expect(windows[1]).toBe(2_000);
  });

  it('retries rate limits at a paid window before giving up', async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const provider = mockProvider(async () => {
      attempts += 1;
      throw Object.assign(new Error('Too Many Requests'), { code: 429 });
    });

    const resultPromise = scanLogsBackward(provider as never, '0xabc', 100_000, 90_000);

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(attempts).toBe(RATE_LIMIT_MAX_RETRIES + 1);
    expect(result.truncated).toBe(true);
  });
});

describe('scanLogsForward', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('large-first without capability covers a moderate span in one sequential window', async () => {
    const windows: GetLogsCall[] = [];
    const provider = mockProvider(async (filter) => {
      windows.push({ fromBlock: filter.fromBlock, toBlock: filter.toBlock });
      return [{ blockNumber: filter.fromBlock }];
    });

    const logs = await scanLogsForward(provider as never, '0xabc', 1_000, 25_000);

    expect(windows).toEqual([{ fromBlock: 1_000, toBlock: 25_000 }]);
    expect(logs).toHaveLength(1);
  });

  it('parallelizes immediately for block_capped capability at 10k', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      windows.push(windowSize(filter));
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 15));
      inFlight -= 1;
      return [];
    });

    await scanLogsForward(provider as never, '0xabc', 0, 50_000, undefined, {
      capability: { mode: 'block_capped', maxSpan: INITIAL_CHUNK_SIZE, parallel: true },
    });

    expect(maxInFlight).toBeGreaterThan(1);
    expect(maxInFlight).toBeLessThanOrEqual(GET_LOGS_MAX_CONCURRENCY);
    expect(windows.every((s) => s <= INITIAL_CHUNK_SIZE)).toBe(true);
  });

  it('stays sequential for free capability after probe (no parallel 10k storm)', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      const size = windowSize(filter);
      windows.push(size);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight -= 1;
      return [];
    });

    // Short span so free-tier 10-block walk finishes quickly under the default timeout.
    await scanAfterProbeFailure(
      provider as never,
      '0xabc',
      0,
      50,
      new Error('free tier plan: 10 block difference'),
    );

    expect(maxInFlight).toBe(1);
    expect(windows.every((s) => s <= FREE_TIER_MAX_CHUNK_SIZE)).toBe(true);
    expect(windows.length).toBeGreaterThan(1);
  });

  it('never exceeds GET_LOGS_MAX_CONCURRENCY for block_capped parallel scans', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const provider = mockProvider(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 20));
      inFlight -= 1;
      return [];
    });

    await scanLogsForward(provider as never, '0xabc', 0, 60_000, undefined, {
      capability: { mode: 'block_capped', maxSpan: INITIAL_CHUNK_SIZE, parallel: true },
    });

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

    await scanLogsForward(provider as never, '0xabc', 0, 20_000);

    expect(windows[0]).toBe(20_001);
    expect(windows[1]).toBe(5_000); // /4 from 20001 → 5000
    expect(windows.slice(1).every((s) => s <= 5_000)).toBe(true);
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

    await scanLogsForward(provider as never, '0xabc', 0, 20_000);

    expect(maxInFlight).toBe(1);
  }, 30_000);

  it('result_capped capability parallelizes large windows', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const windows: number[] = [];
    const provider = mockProvider(async (filter) => {
      windows.push(windowSize(filter));
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight -= 1;
      return [];
    });

    await scanLogsForward(provider as never, '0xabc', 0, 2_500_000, undefined, {
      capability: { mode: 'result_capped', maxSpan: LARGE_CHUNK_SIZE, parallel: true },
    });

    expect(maxInFlight).toBeGreaterThan(1);
    expect(windows.some((s) => s > INITIAL_CHUNK_SIZE)).toBe(true);
    expect(windows.every((s) => s <= LARGE_CHUNK_SIZE)).toBe(true);
  });
});

describe('scanForMintEvent paid parallel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds mint in tip window without scanning older blocks', async () => {
    const provider = mockProvider(async (filter) => {
      if (filter.toBlock < 90_000) return [];
      return [
        {
          blockNumber: 95_000,
          transactionHash: '0xmint',
          topics: ['0x'],
          data: '0x',
        },
      ];
    });

    const logs = await scanForMintEvent(provider as never, '0xabc', 0, 100_000, {
      isMintLog: (log) => log.transactionHash === '0xmint',
      notFoundOnFailureMessage: 'fail',
      notFoundMessage: 'missing',
    });

    expect(logs).toHaveLength(1);
    expect((logs[0] as { transactionHash: string }).transactionHash).toBe('0xmint');
  });
});
