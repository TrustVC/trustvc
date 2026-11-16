import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  BLOCK_RANGE_CAP_ERROR_RE,
  FREE_TIER_BLOCK_RANGE_RE,
  FREE_TIER_MAX_CHUNK_SIZE,
  INITIAL_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  QUERY_TIMEOUT_ERROR_RE,
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_ERROR_RE,
  RATE_LIMIT_MAX_RETRIES,
  RESULT_OVERFLOW_ERROR_RE,
} from '../../constants';

type RangeFailure = 'FREE_TIER' | 'RESULT_OVERFLOW' | 'TIMEOUT' | 'RANGE_CAP';

function errorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const parts = [
    anyErr?.message,
    anyErr?.shortMessage,
    anyErr?.error?.message,
    anyErr?.info?.error?.message,
    typeof anyErr?.statusCode === 'number' ? String(anyErr.statusCode) : undefined,
    typeof anyErr?.code === 'number' || typeof anyErr?.code === 'string'
      ? String(anyErr.code)
      : undefined,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  if (parts.length > 0) return parts.join(' ');
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
}

function parseHexBlock(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseInt(value, value.startsWith('0x') || value.startsWith('0X') ? 16 : 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Alchemy/Infura “this block range should work: [0x…, 0x…]”. */
const SUGGESTED_RANGE_RE =
  /(?:block range should work|try with this block range)\s*:\s*\[\s*(0x[0-9a-f]+|\d+)\s*,\s*(0x[0-9a-f]+|\d+)\s*\]/i;

function suggestedSpan(err: unknown): number | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const data = anyErr?.data ?? anyErr?.error?.data ?? anyErr?.info?.error?.data;
  if (data && typeof data === 'object') {
    const from = parseHexBlock(data.from);
    const to = parseHexBlock(data.to);
    if (from !== undefined && to !== undefined && to >= from) return to - from + 1;
  }

  const match = SUGGESTED_RANGE_RE.exec(errorMessage(err));
  if (!match) return undefined;
  const from = parseHexBlock(match[1]);
  const to = parseHexBlock(match[2]);
  if (from === undefined || to === undefined || to < from) return undefined;
  return to - from + 1;
}

function rangeFailure(err: unknown): RangeFailure | undefined {
  const message = errorMessage(err);
  if (FREE_TIER_BLOCK_RANGE_RE.test(message)) return 'FREE_TIER';
  if (RESULT_OVERFLOW_ERROR_RE.test(message)) return 'RESULT_OVERFLOW';
  if (QUERY_TIMEOUT_ERROR_RE.test(message)) return 'TIMEOUT';
  if (BLOCK_RANGE_CAP_ERROR_RE.test(message)) return 'RANGE_CAP';
  return undefined;
}

function isRateLimit(err: unknown): boolean {
  // Range errors win: Infura uses -32005 for overflow, timeout, and rate limits.
  if (rangeFailure(err)) return false;
  return RATE_LIMIT_ERROR_RE.test(errorMessage(err));
}

/**
 * True when the RPC call did not return a real answer (range cap or rate limit).
 * @param {unknown} err - RPC error
 * @returns {boolean} Whether the caller should treat the call as unresolved
 */
export function isLogsRetryableError(err: unknown): boolean {
  return rangeFailure(err) !== undefined || isRateLimit(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRateLimit(err) || attempt >= RATE_LIMIT_MAX_RETRIES) throw err;
      await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

export const getLatestBlockWithRetry = (provider: Provider | ethersV6.Provider): Promise<number> =>
  withRateLimitRetry(() => provider.getBlockNumber());

/**
 * Cache eth_chainId / network detection once before a burst of calls.
 * JsonRpcProvider otherwise may re-detect per request.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @returns {Promise<void>} Resolves when the network is cached, or immediately on failure
 */
export async function warmProviderNetwork(provider: Provider | ethersV6.Provider): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeGetNetwork = (provider as any).getNetwork;
    if (typeof maybeGetNetwork === 'function') {
      await withRateLimitRetry(() => maybeGetNetwork.call(provider));
    }
  } catch {
    // Optional warm-up — ignore failures.
  }
}

/**
 * ethers v5 filters resolve topics sync; v6 DeferredTopicFilter needs getTopicFilter().
 * @param {object} filter - Contract event filter
 * @returns {Promise<Array|undefined>} Topics to pass to eth_getLogs
 */
export async function resolveFilterTopics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | undefined> {
  if (typeof filter?.getTopicFilter === 'function') {
    return filter.getTopicFilter();
  }
  return filter?.topics;
}

function smallerSuggested(current: number, err: unknown): number | undefined {
  const suggested = suggestedSpan(err);
  if (suggested === undefined || suggested < MIN_CHUNK_SIZE || suggested >= current) {
    return undefined;
  }
  return suggested;
}

function startingChunk(err: unknown): number {
  if (rangeFailure(err) === 'FREE_TIER') return FREE_TIER_MAX_CHUNK_SIZE;
  return smallerSuggested(INITIAL_CHUNK_SIZE, err) ?? INITIAL_CHUNK_SIZE;
}

function shrinkChunk(current: number, err: unknown): number {
  const failure = rangeFailure(err);
  let next: number;
  if (failure === 'FREE_TIER') {
    next = current > FREE_TIER_MAX_CHUNK_SIZE ? FREE_TIER_MAX_CHUNK_SIZE : Math.floor(current / 4);
  } else if (failure === 'TIMEOUT') {
    next = Math.floor(current / 2);
  } else {
    next = Math.floor(current / 4);
  }
  const suggested = smallerSuggested(current, err);
  if (suggested !== undefined) next = Math.min(next, suggested);
  return Math.max(next, MIN_CHUNK_SIZE);
}

async function getLogsOnce(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await provider.getLogs({ address, fromBlock, toBlock, topics })) as any[];
}

async function walkChunks(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics: any[] | undefined,
  chunkSize: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = [];
  let cursor = fromBlock;
  let chunk = chunkSize;

  while (cursor <= toBlock) {
    const end = Math.min(cursor + chunk - 1, toBlock);
    try {
      const windowLogs = await withRateLimitRetry(() =>
        getLogsOnce(provider, address, cursor, end, topics),
      );
      logs.push(...windowLogs);
      cursor = end + 1;
    } catch (err) {
      if (!rangeFailure(err)) throw err;
      const next = shrinkChunk(end - cursor + 1, err);
      if (next >= end - cursor + 1) throw err;
      chunk = next;
    }
  }

  return logs;
}

/**
 * eth_getLogs over [fromBlock, toBlock].
 * One call for the whole span. If the provider rejects the range, walk forward
 * in 10,000-block windows (10 on a free-tier error), shrinking a window that
 * itself fails. Any other error is thrown — a partial chain is never returned.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Inclusive start block
 * @param {number} toBlock - Inclusive end block
 * @param {Array} [topics] - Optional eth_getLogs topics
 * @returns {Promise<Array>} Logs in block order
 */
export async function getLogsAdaptive(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  if (toBlock < fromBlock) return [];

  try {
    return await withRateLimitRetry(() =>
      getLogsOnce(provider, address, fromBlock, toBlock, topics),
    );
  } catch (err) {
    if (!rangeFailure(err)) throw err;
    return walkChunks(provider, address, fromBlock, toBlock, topics, startingChunk(err));
  }
}
