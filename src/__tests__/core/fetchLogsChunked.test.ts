import { describe, expect, it, vi } from 'vitest';
import { FREE_TIER_MAX_CHUNK_SIZE, INITIAL_CHUNK_SIZE } from '../../constants';
import { getLogsAdaptive } from '../../core/endorsement-chain/fetchLogsChunked';

const ADDRESS = '0xabc';

const rangeError = () => new Error('eth_getLogs block range is limited to 10000 blocks');
const freeTierError = () =>
  new Error('Under the free tier plan, eth_getLogs is limited to a 10 block range');
const timeoutError = () => new Error('query timeout exceeded');

function providerReturning(handler: (from: number, to: number) => unknown) {
  const calls: Array<[number, number]> = [];
  const provider = {
    getLogs: vi.fn(async (filter: { fromBlock: number; toBlock: number }) => {
      calls.push([filter.fromBlock, filter.toBlock]);
      const result = handler(filter.fromBlock, filter.toBlock);
      if (result instanceof Error) throw result;
      return result;
    }),
  };
  return { provider, calls };
}

describe('getLogsAdaptive', () => {
  it('returns the full span from a single call when the provider accepts it', async () => {
    const logs = [{ blockNumber: 5 }];
    const { provider, calls } = providerReturning(() => logs);

    await expect(getLogsAdaptive(provider as never, ADDRESS, 0, 50_000)).resolves.toEqual(logs);
    expect(calls).toEqual([[0, 50_000]]);
  });

  it('walks forward in 10,000-block windows after a range error', async () => {
    const { provider, calls } = providerReturning((from, to) => {
      if (to - from + 1 > INITIAL_CHUNK_SIZE) throw rangeError();
      return [{ blockNumber: from }];
    });

    const logs = await getLogsAdaptive(provider as never, ADDRESS, 0, 25_000);
    expect(logs.map((log) => log.blockNumber)).toEqual([0, 10_000, 20_000]);
    expect(calls).toEqual([
      [0, 25_000],
      [0, 9_999],
      [10_000, 19_999],
      [20_000, 25_000],
    ]);
  });

  it('starts at 10-block windows when the full span hits a free-tier limit', async () => {
    const { provider, calls } = providerReturning((from, to) => {
      if (to - from + 1 > FREE_TIER_MAX_CHUNK_SIZE) throw freeTierError();
      return [{ blockNumber: from }];
    });

    const logs = await getLogsAdaptive(provider as never, ADDRESS, 100, 119);
    expect(logs).toHaveLength(2);
    expect(calls).toEqual([
      [100, 119],
      [100, 109],
      [110, 119],
    ]);
  });

  it('shrinks a failed 10,000-block window and continues from the same cursor', async () => {
    const { provider, calls } = providerReturning((from, to) => {
      const size = to - from + 1;
      if (from === 0 && to === 20_000) throw rangeError();
      if (size === INITIAL_CHUNK_SIZE) throw timeoutError();
      return [{ blockNumber: from }];
    });

    const logs = await getLogsAdaptive(provider as never, ADDRESS, 0, 20_000);
    expect(logs.map((log) => log.blockNumber)).toEqual([0, 5_000, 10_000, 15_000, 20_000]);
    expect(calls).toEqual([
      [0, 20_000],
      [0, 9_999],
      [0, 4_999],
      [5_000, 9_999],
      [10_000, 14_999],
      [15_000, 19_999],
      [20_000, 20_000],
    ]);
  });

  it('throws a non-range error and does not return a partial chain', async () => {
    const { provider, calls } = providerReturning((from) => {
      if (from === 0) throw new Error('execution reverted');
      return [{ blockNumber: from }];
    });

    await expect(getLogsAdaptive(provider as never, ADDRESS, 0, 30_000)).rejects.toThrow(
      'execution reverted',
    );
    expect(calls).toEqual([[0, 30_000]]);
  });

  it('retries a rate limit on the full span, then throws', async () => {
    vi.useFakeTimers();
    const { provider, calls } = providerReturning(() => new Error('429 too many requests'));

    const pending = getLogsAdaptive(provider as never, ADDRESS, 0, 100);
    const assertion = expect(pending).rejects.toThrow('429 too many requests');
    await vi.runAllTimersAsync();
    await assertion;
    expect(calls).toHaveLength(4);
    vi.useRealTimers();
  });
});
