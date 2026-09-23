import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  FREE_TIER_BLOCK_RANGE_RE,
  FREE_TIER_MAX_CHUNK_SIZE,
  GET_LOGS_MAX_CONCURRENCY,
  INITIAL_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  RANGE_TOO_LARGE_ERROR_RE,
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_ERROR_RE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';

// Result/response overflow — shrink window; do not treat as free-tier.
const RESULT_OVERFLOW_RE = /query returned more than|10,?000 results|response size|exceeds limit/i;

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

export function isLogsRetryableError(err: unknown): boolean {
  const message = errorMessage(err);
  return RATE_LIMIT_ERROR_RE.test(message) || RANGE_TOO_LARGE_ERROR_RE.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Non-getLogs RPCs (getBlockNumber, ownerOf, …) still get a short rate-limit retry.
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

// ethers v5 filters resolve topics sync; v6 DeferredTopicFilter needs getTopicFilter().
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

interface ScanLogsBackwardResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
  foundMint: boolean;
  /** True when the scan stopped early due to a rate-limit / hard failure. */
  truncated: boolean;
}

interface AdaptiveScanState {
  chunkSize: number;
  maxChunkSize: number;
}

interface BlockWindow {
  fromBlock: number;
  toBlock: number;
}

/**
 * Shared gate for parallel getLogs: caps in-flight calls and dials down to 1 after a 429.
 * Resets concurrency after a successful call once the cooldown clears.
 */
class GetLogsRateGate {
  private inFlight = 0;
  private readonly waiters: Array<() => void> = [];
  private concurrencyCap = GET_LOGS_MAX_CONCURRENCY;
  private cooldownUntil = 0;

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForCooldown();
    await this.acquire();
    try {
      const result = await fn();
      // Recover capacity after a clean success (paid path only uses parallel).
      if (this.concurrencyCap < GET_LOGS_MAX_CONCURRENCY && Date.now() >= this.cooldownUntil) {
        this.concurrencyCap = GET_LOGS_MAX_CONCURRENCY;
      }
      return result;
    } catch (err) {
      if (RATE_LIMIT_ERROR_RE.test(errorMessage(err))) {
        this.concurrencyCap = 1;
        this.cooldownUntil = Date.now() + RATE_LIMIT_BASE_DELAY_MS;
      }
      throw err;
    } finally {
      this.release();
    }
  }

  private async waitForCooldown(): Promise<void> {
    const waitMs = this.cooldownUntil - Date.now();
    if (waitMs > 0) await sleep(waitMs);
  }

  private acquire(): Promise<void> {
    if (this.inFlight < this.concurrencyCap) {
      this.inFlight += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.inFlight += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.inFlight -= 1;
    while (this.waiters.length > 0 && this.inFlight < this.concurrencyCap) {
      const next = this.waiters.shift();
      if (next) next();
    }
  }
}

const getLogsGate = new GetLogsRateGate();

// Ladder: free-tier → hard jump to 10; already ≤10 → /4 (floor MIN); overflow / generic → /4.
function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  if (FREE_TIER_BLOCK_RANGE_RE.test(message)) {
    if (state.chunkSize > FREE_TIER_MAX_CHUNK_SIZE) {
      state.maxChunkSize = FREE_TIER_MAX_CHUNK_SIZE;
      state.chunkSize = FREE_TIER_MAX_CHUNK_SIZE;
      return;
    }
    // Already at free-tier width — further reduce so retries make progress.
    state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
    state.maxChunkSize = Math.min(state.maxChunkSize, state.chunkSize);
    return;
  }

  if (RESULT_OVERFLOW_RE.test(message)) {
    state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
    state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
    return;
  }

  // Unknown provider range cap.
  if (state.chunkSize > INITIAL_CHUNK_SIZE) {
    state.chunkSize = INITIAL_CHUNK_SIZE;
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

// Single place for getLogs rate-limit retries.
// Free-tier (≤10 blocks): never retry a 429 — hard-fail so the scan stops.
async function getLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  useRateGate = false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const runAttempt = async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logs = (await provider.getLogs({ address, fromBlock, toBlock, topics })) as any[];
        return logs;
      } catch (err) {
        const message = errorMessage(err);
        if (!RATE_LIMIT_ERROR_RE.test(message)) {
          throw err;
        }

        // Free-tier 10-block windows: retrying a 429 cannot finish a deep chain.
        if (isFreeTierScan(state) || attempt >= RATE_LIMIT_MAX_RETRIES) {
          throw err;
        }
        const delayMs = RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt;
        await sleep(delayMs);
      }
    }
  };

  return useRateGate ? getLogsGate.run(runAttempt) : runAttempt();
}

/**
 * Fetch one window; on range-too-large, subdivide sequentially (no extra parallelism).
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Window start
 * @param {number} toBlock - Window end
 * @param {AdaptiveScanState} state - Shared adaptive chunk state
 * @param {any[]} [topics] - Optional topic filter
 * @param {boolean} useRateGate - When true, acquire the shared concurrency gate
 * @returns {Promise<any[]>} Logs in this window, oldest first
 */
async function fetchWindowAdaptive(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics: any[] | undefined,
  useRateGate: boolean,
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
      const chunkLogs = await getLogsRange(
        provider,
        address,
        cursor,
        chunkEnd,
        local,
        topics,
        useRateGate,
      );
      logs.push(...chunkLogs);
      cursor = chunkEnd + 1;
      // Propagate learned free-tier / smaller cap to the shared state.
      state.chunkSize = Math.min(state.chunkSize, local.chunkSize);
      state.maxChunkSize = Math.min(state.maxChunkSize, local.maxChunkSize);
    } catch (err) {
      const message = errorMessage(err);
      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && local.chunkSize > MIN_CHUNK_SIZE) {
        shrinkForRangeLimit(local, message);
        shrinkForRangeLimit(state, message);
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
 * Backward eth_getLogs scanner: start at 10k, jump to 10 on free-tier,
 * /4 on result overflow; hard-stop on 429 while at ≤10 blocks.
 * Walks until mint, floor, or a hard failure — no time/request budget.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @param {any[]} [topics] - Optional topic filter (e.g. to scan only one tokenId's events)
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
): Promise<ScanLogsBackwardResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  const state: AdaptiveScanState = {
    chunkSize: INITIAL_CHUNK_SIZE,
    maxChunkSize: INITIAL_CHUNK_SIZE,
  };
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
      const message = errorMessage(err);

      if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
        shrinkForRangeLimit(state, message);
        continue; // retry same cursor with smaller window
      }

      // Rate limit: paid path already exhausted getLogsRange retries; free-tier never retries.
      // Either way, stop — do not outer-loop retry the same 429.
      if (RATE_LIMIT_ERROR_RE.test(message)) {
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
 * Learns the tier on the first window (sequential), then:
 * - free-tier (≤10): stays sequential (parallel would trip 429s)
 * - paid: remaining windows in parallel, capped at GET_LOGS_MAX_CONCURRENCY;
 *   dials to 1 in-flight after any 429 and backs off before retrying.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Earliest block (inclusive)
 * @param {number} toBlock - Latest block (inclusive)
 * @param {any[]} [topics] - Optional topic filter
 * @param {object} [options] - Forward-scan options
 * @param {boolean} [options.assumePaidTier] - When true (probe already hit 10k cap), parallelize all windows immediately
 * @returns {Promise<any[]>} Logs oldest→newest
 */
export const scanLogsForward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[],
  options?: { assumePaidTier?: boolean },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> => {
  if (toBlock < fromBlock) return [];

  await warmProviderNetwork(provider);

  const state: AdaptiveScanState = {
    chunkSize: INITIAL_CHUNK_SIZE,
    maxChunkSize: INITIAL_CHUNK_SIZE,
  };

  // Probe already proved paid 10k cap — skip sequential learn, parallelize every window.
  if (options?.assumePaidTier) {
    const windows = buildWindows(fromBlock, toBlock, state.chunkSize);
    const chunkGroups = await mapPool(windows, GET_LOGS_MAX_CONCURRENCY, async (window) =>
      fetchWindowAdaptive(
        provider,
        address,
        window.fromBlock,
        window.toBlock,
        { chunkSize: state.chunkSize, maxChunkSize: state.maxChunkSize },
        topics,
        true,
      ),
    );
    const logs = chunkGroups.flat();
    return logs;
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
    false,
  );

  if (firstEnd >= toBlock) {
    return firstLogs;
  }

  const remainingFrom = firstEnd + 1;

  // Free-tier: keep walking sequentially — parallel 10-block windows hammer rate limits.
  if (isFreeTierScan(state)) {
    const rest = await fetchWindowAdaptive(
      provider,
      address,
      remainingFrom,
      toBlock,
      state,
      topics,
      false,
    );
    const logs = [...firstLogs, ...rest];
    return logs;
  }

  const windows = buildWindows(remainingFrom, toBlock, state.chunkSize);

  const chunkGroups = await mapPool(windows, GET_LOGS_MAX_CONCURRENCY, async (window) =>
    fetchWindowAdaptive(
      provider,
      address,
      window.fromBlock,
      window.toBlock,
      // Per-window local copy so parallel shrinks don't race; free-tier already excluded.
      { chunkSize: state.chunkSize, maxChunkSize: state.maxChunkSize },
      topics,
      true,
    ),
  );

  const logs = [...firstLogs, ...chunkGroups.flat()];
  return logs;
};

/**
 * One getLogs over the full span. Succeeds on enterprise/unlimited;
 * fails with a range error on paid 10k / free-tier — callers then chunk.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address
 * @param {number} fromBlock - Start block
 * @param {number} toBlock - End block
 * @param {any[]} [topics] - Optional topic filter (preferred when scanning one event type)
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
  /** Thrown when the scan stopped early (e.g. rate-limit) before finding mint. */
  notFoundOnFailureMessage: string;
  notFoundMessage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[];
}

function rethrowMintScanFailure(err: unknown, notFoundOnFailureMessage: string): never {
  if (RATE_LIMIT_ERROR_RE.test(errorMessage(err))) {
    throw new Error(notFoundOnFailureMessage);
  }
  throw err;
}

interface MintScanSharedArgs {
  provider: Provider | ethersV6.Provider;
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: (log: any) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics: any[] | undefined;
  notFoundOnFailureMessage: string;
  notFoundMessage: string;
}

async function fetchMintTipWindow(
  shared: MintScanSharedArgs,
  tipStart: number,
  latestBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  try {
    return await fetchWindowAdaptive(
      shared.provider,
      shared.address,
      tipStart,
      latestBlock,
      state,
      shared.topics,
      false,
    );
  } catch (err) {
    rethrowMintScanFailure(err, shared.notFoundOnFailureMessage);
  }
}

async function continueMintScanFreeTier(
  shared: MintScanSharedArgs,
  belowTip: number,
  effectiveFloor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tipLogs: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // Continue below the tip window already fetched — do not re-scan tip.
  const result = await scanLogsBackward(
    shared.provider,
    shared.address,
    belowTip,
    effectiveFloor,
    shared.isMintLog,
    shared.topics,
  );
  if (!result.foundMint && result.truncated) {
    throw new Error(shared.notFoundOnFailureMessage);
  }
  if (!result.foundMint) {
    throw new Error(shared.notFoundMessage);
  }
  return [...result.logs, ...tipLogs];
}

async function continueMintScanPaidParallel(
  shared: MintScanSharedArgs,
  effectiveFloor: number,
  belowTip: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tipLogs: any[],
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const olderWindows = buildWindows(effectiveFloor, belowTip, state.chunkSize).reverse();

  // Groups newer→older (tip first). Flatten reversed at the end for oldest→newest.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newerFirstGroups: any[][] = [tipLogs];

  let offset = 0;
  while (offset < olderWindows.length) {
    const batch = olderWindows.slice(offset, offset + GET_LOGS_MAX_CONCURRENCY);
    offset += GET_LOGS_MAX_CONCURRENCY;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let batchLogs: any[][];
    try {
      batchLogs = await mapPool(batch, GET_LOGS_MAX_CONCURRENCY, async (window) =>
        fetchWindowAdaptive(
          shared.provider,
          shared.address,
          window.fromBlock,
          window.toBlock,
          { chunkSize: state.chunkSize, maxChunkSize: state.maxChunkSize },
          shared.topics,
          true,
        ),
      );
    } catch (err) {
      rethrowMintScanFailure(err, shared.notFoundOnFailureMessage);
    }

    // batch is newest→oldest within this page; inspect in that order so we stop at mint.
    for (const chunkLogs of batchLogs) {
      const mintStart = findMintSliceStart(chunkLogs, shared.isMintLog);
      if (mintStart < 0) {
        newerFirstGroups.push(chunkLogs);
        continue;
      }
      const fromMint = chunkLogs.slice(mintStart);
      const newerOldestFirst = newerFirstGroups.toReversed().flat();
      return [...fromMint, ...newerOldestFirst];
    }
  }

  throw new Error(shared.notFoundMessage);
}

/**
 * Scan backward for mint; throw if truncated by failure or genuinely missing.
 * Paid tier: walks tip→floor in parallel batches (GET_LOGS_MAX_CONCURRENCY) so old
 * mints don't serialize hundreds of 10k windows. Free-tier: sequential (scanLogsBackward).
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} scanFloor - Earliest block to stop at (0 if unknown)
 * @param {number} latestBlock - Latest block, already resolved by the caller
 * @param {ScanForMintEventOptions} options - Mint detector, error messages, optional topics
 * @returns {Promise<any[]>} The mint's log and any same-tx companion logs through tip, oldest first
 */
export async function scanForMintEvent(
  provider: Provider | ethersV6.Provider,
  address: string,
  scanFloor: number,
  latestBlock: number,
  options: ScanForMintEventOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const { isMintLog, notFoundOnFailureMessage, notFoundMessage, topics } = options;
  const effectiveFloor = Math.max(0, scanFloor);
  const shared: MintScanSharedArgs = {
    provider,
    address,
    isMintLog,
    topics,
    notFoundOnFailureMessage,
    notFoundMessage,
  };

  await warmProviderNetwork(provider);

  const state: AdaptiveScanState = {
    chunkSize: INITIAL_CHUNK_SIZE,
    maxChunkSize: INITIAL_CHUNK_SIZE,
  };

  // Learn tier on the tip window (sequential). Free-tier → fully sequential backward.
  const tipStart = Math.max(latestBlock - state.chunkSize + 1, effectiveFloor);
  const tipLogs = await fetchMintTipWindow(shared, tipStart, latestBlock, state);

  const tipMint = findMintSliceStart(tipLogs, isMintLog);
  if (tipMint >= 0) {
    return tipLogs.slice(tipMint);
  }
  if (tipStart <= effectiveFloor) {
    throw new Error(notFoundMessage);
  }

  if (isFreeTierScan(state)) {
    return continueMintScanFreeTier(shared, tipStart - 1, effectiveFloor, tipLogs);
  }

  return continueMintScanPaidParallel(shared, effectiveFloor, tipStart - 1, tipLogs, state);
}
