import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  BLOCK_RANGE_CAP_ERROR_RE,
  FREE_TIER_BLOCK_RANGE_RE,
  FREE_TIER_MAX_CHUNK_SIZE,
  GET_LOGS_MAX_CONCURRENCY,
  INITIAL_CHUNK_SIZE,
  LARGE_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  QUERY_TIMEOUT_ERROR_RE,
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_ERROR_RE,
  RATE_LIMIT_MAX_RETRIES,
  RESULT_OVERFLOW_ERROR_RE,
} from '../../constants';

export type GetLogsFailureClass =
  | 'FREE_TIER'
  | 'RESULT_OVERFLOW'
  | 'TIMEOUT'
  | 'RANGE_CAP'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export type LogsCapability =
  | { mode: 'free'; maxSpan: number; parallel: false }
  | { mode: 'block_capped'; maxSpan: number; parallel: true }
  | { mode: 'result_capped'; maxSpan: number; parallel: true };

export type GetLogsFailure = {
  class: GetLogsFailureClass;
  /** Provider-suggested inclusive span size, when present. */
  suggestedSpan?: number;
};

interface AdaptiveScanState {
  chunkSize: number;
  maxChunkSize: number;
}

interface BlockWindow {
  fromBlock: number;
  toBlock: number;
}

interface ScanLogsBackwardResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
  foundMint: boolean;
  /** True when the scan stopped early due to a rate-limit / hard failure. */
  truncated: boolean;
}

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

/** Alchemy/Infura “this block range should work: [0x…, 0x…]” (phrase-anchored). */
const SUGGESTED_RANGE_RE =
  /(?:block range should work|try with this block range)\s*:\s*\[\s*(0x[0-9a-f]+|\d+)\s*,\s*(0x[0-9a-f]+|\d+)\s*\]/i;

// Infura error.data.{from,to} or Alchemy/Infura suggested `[from, to]` in the message.
function parseSuggestedRange(err: unknown): { from: number; to: number } | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const data = anyErr?.data ?? anyErr?.error?.data ?? anyErr?.info?.error?.data;
  if (data && typeof data === 'object') {
    const from = parseHexBlock(data.from);
    const to = parseHexBlock(data.to);
    if (from !== undefined && to !== undefined && to >= from) {
      return { from, to };
    }
  }

  const match = SUGGESTED_RANGE_RE.exec(errorMessage(err));
  if (!match) return undefined;
  const from = parseHexBlock(match[1]);
  const to = parseHexBlock(match[2]);
  if (from === undefined || to === undefined || to < from) return undefined;
  return { from, to };
}

/**
 * Classify a getLogs failure. Message content wins over bare RPC codes
 * (Infura uses -32005 for overflow, timeout, and rate limits).
 * @param {unknown} err - RPC error from provider.getLogs
 * @returns {GetLogsFailure} Failure class plus optional suggested span
 */
export function classifyGetLogsFailure(err: unknown): GetLogsFailure {
  const message = errorMessage(err);
  const suggested = parseSuggestedRange(err);
  const suggestedSpan = suggested ? suggested.to - suggested.from + 1 : undefined;

  if (FREE_TIER_BLOCK_RANGE_RE.test(message)) {
    return { class: 'FREE_TIER', suggestedSpan };
  }
  if (RESULT_OVERFLOW_ERROR_RE.test(message)) {
    return { class: 'RESULT_OVERFLOW', suggestedSpan };
  }
  if (QUERY_TIMEOUT_ERROR_RE.test(message)) {
    return { class: 'TIMEOUT', suggestedSpan };
  }
  // Rate-limit message before bare -32005 (RATE_LIMIT_ERROR_RE also matches -32005).
  if (
    /rate[\s-]?limit|too many requests|could not coalesce/i.test(message) ||
    /(?:^|[^0-9A-Za-z+-])429(?![0-9A-Za-z])/.test(message)
  ) {
    return { class: 'RATE_LIMIT', suggestedSpan };
  }
  if (BLOCK_RANGE_CAP_ERROR_RE.test(message)) {
    return { class: 'RANGE_CAP', suggestedSpan };
  }
  if (RATE_LIMIT_ERROR_RE.test(message)) {
    return { class: 'RATE_LIMIT', suggestedSpan };
  }
  return { class: 'UNKNOWN', suggestedSpan };
}

function isRateLimitOnly(err: unknown): boolean {
  return classifyGetLogsFailure(err).class === 'RATE_LIMIT';
}

function isShrinkableFailure(err: unknown): boolean {
  const cls = classifyGetLogsFailure(err).class;
  return (
    cls === 'FREE_TIER' || cls === 'RESULT_OVERFLOW' || cls === 'TIMEOUT' || cls === 'RANGE_CAP'
  );
}

/**
 * Map a probe/queryFilter failure to the scan strategy for the rest of this call.
 * @param {unknown} err - Probe or queryFilter error
 * @returns {LogsCapability} Scan-local capability (free / block_capped / result_capped)
 */
export function learnCapabilityFromProbeError(err: unknown): LogsCapability {
  const failure = classifyGetLogsFailure(err);

  if (failure.class === 'FREE_TIER') {
    return { mode: 'free', maxSpan: FREE_TIER_MAX_CHUNK_SIZE, parallel: false };
  }

  if (failure.class === 'RANGE_CAP') {
    const maxSpan = Math.min(
      failure.suggestedSpan && failure.suggestedSpan > 0
        ? failure.suggestedSpan
        : INITIAL_CHUNK_SIZE,
      INITIAL_CHUNK_SIZE,
    );
    return {
      mode: 'block_capped',
      maxSpan: Math.max(maxSpan, FREE_TIER_MAX_CHUNK_SIZE),
      parallel: true,
    };
  }

  // TIMEOUT / RESULT_OVERFLOW / RATE_LIMIT / UNKNOWN: large-first (sparse escrows).
  const maxSpan =
    failure.suggestedSpan && failure.suggestedSpan > FREE_TIER_MAX_CHUNK_SIZE
      ? failure.suggestedSpan
      : LARGE_CHUNK_SIZE;
  return { mode: 'result_capped', maxSpan, parallel: true };
}

export function isLogsRetryableError(err: unknown): boolean {
  return classifyGetLogsFailure(err).class !== 'UNKNOWN';
}

function stateFromCapability(capability?: LogsCapability): AdaptiveScanState {
  if (!capability) {
    return { chunkSize: LARGE_CHUNK_SIZE, maxChunkSize: LARGE_CHUNK_SIZE };
  }
  if (capability.mode === 'free') {
    return {
      chunkSize: FREE_TIER_MAX_CHUNK_SIZE,
      maxChunkSize: FREE_TIER_MAX_CHUNK_SIZE,
    };
  }
  return {
    chunkSize: capability.maxSpan,
    maxChunkSize: capability.maxSpan,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!RATE_LIMIT_ERROR_RE.test(errorMessage(err)) || attempt >= RATE_LIMIT_MAX_RETRIES) {
        throw err;
      }
      await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

export const getLatestBlockWithRetry = (provider: Provider | ethersV6.Provider): Promise<number> =>
  withRateLimitRetry(() => provider.getBlockNumber());

/**
 * Cache eth_chainId / network detection once before a burst of getLogs.
 * JsonRpcProvider otherwise may re-detect per parallel request.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @returns {Promise<void>}
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
 * @param {any} filter - Contract event filter
 * @returns {Promise<any[] | undefined>} Resolved topics
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

// FREE → 10; TIMEOUT → bisect; OVERFLOW → /4 or suggested; RANGE_CAP → clamp to 10k then /4.
function shrinkForRangeLimit(state: AdaptiveScanState, err: unknown): void {
  const failure = classifyGetLogsFailure(err);
  const suggested =
    failure.suggestedSpan && failure.suggestedSpan >= MIN_CHUNK_SIZE
      ? failure.suggestedSpan
      : undefined;

  if (failure.class === 'FREE_TIER') {
    if (state.chunkSize > FREE_TIER_MAX_CHUNK_SIZE) {
      state.maxChunkSize = FREE_TIER_MAX_CHUNK_SIZE;
      state.chunkSize = FREE_TIER_MAX_CHUNK_SIZE;
      return;
    }
    state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
    state.maxChunkSize = Math.min(state.maxChunkSize, state.chunkSize);
    return;
  }

  if (suggested !== undefined && suggested < state.chunkSize) {
    state.chunkSize = suggested;
    state.maxChunkSize = Math.min(state.maxChunkSize, suggested);
    return;
  }

  if (failure.class === 'TIMEOUT') {
    state.chunkSize = Math.max(Math.floor(state.chunkSize / 2), MIN_CHUNK_SIZE);
    state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
    return;
  }

  if (failure.class === 'RESULT_OVERFLOW') {
    state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
    state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
    return;
  }

  // RANGE_CAP / UNKNOWN: clamp to paid block window, then /4.
  if (state.chunkSize > INITIAL_CHUNK_SIZE) {
    state.chunkSize = INITIAL_CHUNK_SIZE;
    state.maxChunkSize = Math.min(state.maxChunkSize, INITIAL_CHUNK_SIZE);
    return;
  }
  state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
  state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
}

function isFreeTierScan(state: AdaptiveScanState): boolean {
  return state.chunkSize <= FREE_TIER_MAX_CHUNK_SIZE;
}

function buildWindows(fromBlock: number, toBlock: number, chunkSize: number): BlockWindow[] {
  const windows: BlockWindow[] = [];
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const end = Math.min(cursor + chunkSize - 1, toBlock);
    windows.push({ fromBlock: cursor, toBlock: end });
    cursor = end + 1;
  }
  return windows;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async (): Promise<void> => {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  };

  const poolSize = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: poolSize }, () => runWorker()));
  return results;
}

// Single getLogs with rate-limit retries. Free-tier (≤10 blocks): never retry a 429.
async function getLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await provider.getLogs({ address, fromBlock, toBlock, topics })) as any[];
    } catch (err) {
      if (!isRateLimitOnly(err)) throw err;
      if (isFreeTierScan(state) || attempt >= RATE_LIMIT_MAX_RETRIES) throw err;
      await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

// Fetch one window; on range-too-large, subdivide sequentially (no extra parallelism).
async function fetchWindowAdaptive(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics: any[] | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = [];
  let cursor = fromBlock;
  const local: AdaptiveScanState = {
    chunkSize: Math.min(state.chunkSize, Math.max(1, toBlock - fromBlock + 1)),
    maxChunkSize: state.maxChunkSize,
  };

  while (cursor <= toBlock) {
    const chunkEnd = Math.min(cursor + local.chunkSize - 1, toBlock);
    try {
      const chunkLogs = await getLogsRange(provider, address, cursor, chunkEnd, local, topics);
      logs.push(...chunkLogs);
      cursor = chunkEnd + 1;
      state.chunkSize = Math.min(state.chunkSize, local.chunkSize);
      state.maxChunkSize = Math.min(state.maxChunkSize, local.maxChunkSize);
    } catch (err) {
      const attemptedSize = chunkEnd - cursor + 1;
      if (isShrinkableFailure(err) && attemptedSize > MIN_CHUNK_SIZE) {
        local.chunkSize = Math.min(local.chunkSize, attemptedSize);
        state.chunkSize = Math.min(state.chunkSize, attemptedSize);
        shrinkForRangeLimit(local, err);
        shrinkForRangeLimit(state, err);
        continue;
      }
      throw err;
    }
  }

  return logs;
}

// Keep mint and any same-tx companion logs that precede it (e.g. StatusInitialized).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMintSliceStart(logs: any[], isMintLog: (log: any) => boolean): number {
  const mintIndex = logs.findIndex(isMintLog);
  if (mintIndex < 0) return -1;

  const txHash = logs[mintIndex].transactionHash;
  let start = mintIndex;
  while (start > 0 && logs[start - 1].transactionHash === txHash) {
    start -= 1;
  }
  return start;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenOldestFirst(chunkGroups: any[][]): any[] {
  return chunkGroups.toReversed().flat();
}

/**
 * Backward eth_getLogs: large-first (or capability), jump to 10 on free-tier,
 * bisect on timeout, /4 on overflow; hard-stop on 429 while at ≤10 blocks.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @param {any[]} [topics] - Optional topic filter
 * @param {object} [options] - Backward-scan options
 * @param {LogsCapability} [options.capability] - Learned from probe/queryFilter failure
 * @returns {Promise<ScanLogsBackwardResult>} Logs oldest→newest plus mint/truncation flags
 */
export const scanLogsBackward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  options?: { capability?: LogsCapability },
): Promise<ScanLogsBackwardResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  const state = stateFromCapability(options?.capability);
  const effectiveFloor = Math.max(0, toBlockFloor);
  let cursor = fromBlock;

  while (cursor >= effectiveFloor) {
    const chunkStart = Math.max(cursor - state.chunkSize + 1, effectiveFloor);
    try {
      const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor, state, topics);

      if (isMintLog) {
        const start = findMintSliceStart(chunkLogs, isMintLog);
        if (start >= 0) {
          chunkGroups.push(chunkLogs.slice(start));
          return { logs: flattenOldestFirst(chunkGroups), foundMint: true, truncated: false };
        }
      }
      chunkGroups.push(chunkLogs);
      cursor = chunkStart - 1;
    } catch (err) {
      const attemptedSize = cursor - chunkStart + 1;

      if (isShrinkableFailure(err) && attemptedSize > MIN_CHUNK_SIZE) {
        state.chunkSize = Math.min(state.chunkSize, attemptedSize);
        shrinkForRangeLimit(state, err);
        continue;
      }

      if (isRateLimitOnly(err)) {
        return { logs: flattenOldestFirst(chunkGroups), foundMint: false, truncated: true };
      }

      throw err;
    }
  }

  return {
    logs: flattenOldestFirst(chunkGroups),
    foundMint: false,
    truncated: false,
  };
};

/**
 * Forward eth_getLogs over [fromBlock, toBlock].
 * With capability: apply learned strategy immediately.
 * Without: learn on the first window, then free stays sequential / paid parallelizes.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Earliest block (inclusive)
 * @param {number} toBlock - Latest block (inclusive)
 * @param {any[]} [topics] - Optional topic filter
 * @param {object} [options] - Forward-scan options
 * @param {LogsCapability} [options.capability] - Learned from probe/queryFilter failure
 * @returns {Promise<any[]>} Logs oldest→newest
 */
export const scanLogsForward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  options?: { capability?: LogsCapability },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> => {
  if (toBlock < fromBlock) return [];

  await warmProviderNetwork(provider);

  const capability = options?.capability;
  const state = stateFromCapability(capability);

  if (capability?.parallel) {
    const windows = buildWindows(fromBlock, toBlock, state.chunkSize);
    const chunkGroups = await mapPool(windows, GET_LOGS_MAX_CONCURRENCY, async (window) =>
      fetchWindowAdaptive(
        provider,
        address,
        window.fromBlock,
        window.toBlock,
        { chunkSize: state.chunkSize, maxChunkSize: state.maxChunkSize },
        topics,
      ),
    );
    return chunkGroups.flat();
  }

  if (capability?.mode === 'free') {
    return fetchWindowAdaptive(provider, address, fromBlock, toBlock, state, topics);
  }

  // First window sequential: learn free-tier / overflow before opening parallelism.
  const firstEnd = Math.min(fromBlock + state.chunkSize - 1, toBlock);
  const firstLogs = await fetchWindowAdaptive(
    provider,
    address,
    fromBlock,
    firstEnd,
    state,
    topics,
  );

  if (firstEnd >= toBlock) {
    return firstLogs;
  }

  const remainingFrom = firstEnd + 1;

  if (isFreeTierScan(state)) {
    const rest = await fetchWindowAdaptive(
      provider,
      address,
      remainingFrom,
      toBlock,
      state,
      topics,
    );
    return [...firstLogs, ...rest];
  }

  const windows = buildWindows(remainingFrom, toBlock, state.chunkSize);
  const chunkGroups = await mapPool(windows, GET_LOGS_MAX_CONCURRENCY, async (window) =>
    fetchWindowAdaptive(
      provider,
      address,
      window.fromBlock,
      window.toBlock,
      { chunkSize: state.chunkSize, maxChunkSize: state.maxChunkSize },
      topics,
    ),
  );

  return [...firstLogs, ...chunkGroups.flat()];
};

/**
 * After a full-span probe fails, learn capability and scan adaptively forward.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Earliest block (inclusive)
 * @param {number} toBlock - Latest block (inclusive)
 * @param {unknown} probeErr - Error from the failed full-span probe
 * @param {any[]} [topics] - Optional topic filter
 * @returns {Promise<any[]>} Logs oldest→newest
 */
export async function scanAfterProbeFailure(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  probeErr: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  return scanLogsForward(provider, address, fromBlock, toBlock, topics, {
    capability: learnCapabilityFromProbeError(probeErr),
  });
}

/**
 * One getLogs over the full span — succeeds on enterprise; fails so callers can chunk.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Start block
 * @param {number} toBlock - End block
 * @param {any[]} [topics] - Optional topic filter
 * @returns {Promise<void>}
 */
export async function probeLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
): Promise<void> {
  await provider.getLogs({ address, fromBlock, toBlock, topics });
}

export interface ScanForMintEventOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: (log: any) => boolean;
  notFoundOnFailureMessage: string;
  notFoundMessage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[];
  /** Learned from a prior probe/queryFilter failure — skips a doomed large first window. */
  capability?: LogsCapability;
}

/**
 * Scan tip→floor for mint. Tip window first (often enough); then sequential backward
 * with the learned capability. No parallel mint batches — floors should avoid deep hunts.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} scanFloor - Earliest block to stop at (0 if unknown)
 * @param {number} latestBlock - Latest block, already resolved by the caller
 * @param {ScanForMintEventOptions} options - Mint detector, error messages, optional topics
 * @returns {Promise<any[]>} Mint log and same-tx companions through tip, oldest first
 */
export async function scanForMintEvent(
  provider: Provider | ethersV6.Provider,
  address: string,
  scanFloor: number,
  latestBlock: number,
  options: ScanForMintEventOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const { isMintLog, notFoundOnFailureMessage, notFoundMessage, topics, capability } = options;
  const effectiveFloor = Math.max(0, scanFloor);

  await warmProviderNetwork(provider);

  const state = stateFromCapability(capability);
  const tipStart = Math.max(latestBlock - state.chunkSize + 1, effectiveFloor);

  let tipLogs;
  try {
    tipLogs = await fetchWindowAdaptive(provider, address, tipStart, latestBlock, state, topics);
  } catch (err) {
    if (isRateLimitOnly(err)) throw new Error(notFoundOnFailureMessage);
    throw err;
  }

  const tipMint = findMintSliceStart(tipLogs, isMintLog);
  if (tipMint >= 0) {
    return tipLogs.slice(tipMint);
  }
  if (tipStart <= effectiveFloor) {
    throw new Error(notFoundMessage);
  }

  // Continue below tip with learned chunk size (free stays @10; paid keeps large/capped).
  const belowCapability: LogsCapability = isFreeTierScan(state)
    ? { mode: 'free', maxSpan: FREE_TIER_MAX_CHUNK_SIZE, parallel: false }
    : {
        mode: capability?.mode === 'block_capped' ? 'block_capped' : 'result_capped',
        maxSpan: state.chunkSize,
        parallel: true,
      };

  const result = await scanLogsBackward(
    provider,
    address,
    tipStart - 1,
    effectiveFloor,
    isMintLog,
    topics,
    { capability: belowCapability },
  );

  if (!result.foundMint && result.truncated) {
    throw new Error(notFoundOnFailureMessage);
  }
  if (!result.foundMint) {
    throw new Error(notFoundMessage);
  }
  return [...result.logs, ...tipLogs];
}
