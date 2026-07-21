import { ethers as ethersV6 } from 'ethersV6';
import { Dictionary, groupBy } from 'lodash';
import { Provider } from '@ethersproject/abstract-provider';
import { ObligationTransferBaseEvent, ObligationTransferEventType } from './types';

/** Default max parallel RPC calls for obligation endorsement-chain log / block fetches. */
export const ENDORSEMENT_CHAIN_RPC_CONCURRENCY = 3;

/** Alchemy Free tier eth_getLogs max span. */
export const DEFAULT_ETH_GETLOGS_MAX_BLOCK_RANGE = 10;

/**
 * Tunable RPC / eth_getLogs options for obligation endorsement history.
 * Pass these from the app (e.g. Vite `.env` → options); SDK uses the constants above when omitted.
 */
export type ObligationEndorsementChainRpcOptions = {
  /** Max blocks per eth_getLogs chunk (Alchemy Free = 10). */
  maxBlockRange?: number;
  /** Max parallel RPC workers for chunked getLogs / getBlock. */
  rpcConcurrency?: number;
};

export const resolveObligationEndorsementChainRpcOptions = (
  options?: ObligationEndorsementChainRpcOptions,
): Required<ObligationEndorsementChainRpcOptions> => ({
  maxBlockRange: options?.maxBlockRange ?? DEFAULT_ETH_GETLOGS_MAX_BLOCK_RANGE,
  rpcConcurrency: options?.rpcConcurrency ?? ENDORSEMENT_CHAIN_RPC_CONCURRENCY,
});

/**
 * Maps `items` through an async `fn` with at most `concurrency` in-flight promises.
 * Preserves input order in the result.
 * @param {unknown[]} items - Items to map.
 * @param {Function} fn - Async mapper invoked per item.
 * @param {number} [concurrency] - Max in-flight promises (defaults to endorsement-chain RPC concurrency).
 * @returns {Promise<unknown[]>} Mapped results in input order.
 */
export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number = ENDORSEMENT_CHAIN_RPC_CONCURRENCY,
): Promise<R[]> => {
  if (items.length === 0) return [];
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) return;
      results[current] = await fn(items[current], current);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
};

/**
 * Dedupes eth_getBlock by block number within a single endorsement-chain fetch.
 * @param {Provider | ethersV6.Provider} provider - Ethereum JSON-RPC provider.
 * @returns {(blockNumber: number) => Promise<number>} Cached block-timestamp fetcher.
 */
export const createFetchEventTimeCache = (
  provider: Provider | ethersV6.Provider,
): ((blockNumber: number) => Promise<number>) => {
  const cache = new Map<number, Promise<number>>();
  return (blockNumber: number) => {
    let pending = cache.get(blockNumber);
    if (!pending) {
      pending = fetchObligationEventTime(blockNumber, provider);
      cache.set(blockNumber, pending);
    }
    return pending;
  };
};

export const fetchObligationEventTime = async (
  blockNumber: number,
  provider: Provider | ethersV6.Provider,
): Promise<number> => {
  const msecToSec = 1000;
  const eventTimestamp = (await provider.getBlock(blockNumber))!.timestamp * msecToSec;
  return eventTimestamp;
};

export const isEthGetLogsRangeError = (err: unknown): boolean => {
  // ethers v6 often surfaces only "server response 400 Bad Request" on `.message`
  // while the Free-tier range text lives in `info.responseBody`.
  const parts: string[] = [];
  if (err && typeof err === 'object') {
    const e = err as {
      message?: string;
      shortMessage?: string;
      info?: { responseBody?: string };
      error?: { message?: string };
      data?: { message?: string };
    };
    if (e.message) parts.push(e.message);
    if (e.shortMessage) parts.push(e.shortMessage);
    if (e.info?.responseBody) parts.push(e.info.responseBody);
    if (e.error?.message) parts.push(e.error.message);
    if (e.data?.message) parts.push(e.data.message);
  } else {
    parts.push(String(err));
  }
  return /block range|10 block|Free tier|query returned more than|eth_getLogs|-32600/i.test(
    parts.join(' '),
  );
};

export type GetLogsFilter = {
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topics?: any[];
};

export type GetLogsInBlockRangeOptions = {
  newestFirstUntilHit?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shouldStop?: (chunkLogs: any[]) => boolean;
  /** Parallel workers when fetching all chunks (ignored for newestFirst / shouldStop scans). */
  rpcConcurrency?: number;
};

/**
 * Fetches logs for a known [fromBlock, toBlock] span.
 * Tries one eth_getLogs first; on Free-tier range errors, chunks by maxBlockRange.
 * @param {Provider | ethersV6.Provider} provider - Ethereum JSON-RPC provider.
 * @param {GetLogsFilter} filter - Address and optional topic filter.
 * @param {number} fromBlock - Start block (inclusive).
 * @param {number} toBlock - End block (inclusive).
 * @param {number} [maxBlockRange] - Max blocks per eth_getLogs chunk.
 * @param {GetLogsInBlockRangeOptions} [options] - Scan direction, early-stop, and concurrency options.
 * @returns {Promise<unknown[]>} Matching event logs across the block range.
 */
export const getLogsInBlockRange = async (
  provider: Provider | ethersV6.Provider,
  filter: GetLogsFilter,
  fromBlock: number,
  toBlock: number,
  maxBlockRange: number = DEFAULT_ETH_GETLOGS_MAX_BLOCK_RANGE,
  options?: GetLogsInBlockRangeOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> => {
  if (toBlock < fromBlock) return [];

  const base = {
    address: filter.address,
    ...(filter.topics ? { topics: filter.topics } : {}),
  };

  try {
    return await provider.getLogs({
      ...base,
      fromBlock,
      toBlock,
    });
  } catch (err) {
    if (!isEthGetLogsRangeError(err)) throw err;
  }

  const range = Math.max(1, maxBlockRange);
  const windows: { start: number; end: number }[] = [];
  for (let start = fromBlock; start <= toBlock; start += range) {
    windows.push({ start, end: Math.min(start + range - 1, toBlock) });
  }

  if (options?.newestFirstUntilHit || options?.shouldStop) {
    for (let i = windows.length - 1; i >= 0; i -= 1) {
      const { start, end } = windows[i];
      const chunk = await provider.getLogs({
        ...base,
        fromBlock: start,
        toBlock: end,
      });
      if (options.shouldStop) {
        if (options.shouldStop(chunk)) return chunk;
        continue;
      }
      if (chunk.length > 0) return chunk;
    }
    return [];
  }

  const concurrency = options?.rpcConcurrency ?? ENDORSEMENT_CHAIN_RPC_CONCURRENCY;
  const chunks = await mapWithConcurrency(
    windows,
    async ({ start, end }) =>
      provider.getLogs({
        ...base,
        fromBlock: start,
        toBlock: end,
      }),
    concurrency,
  );
  return chunks.flat();
};

const getHolderOwner = (
  events: ObligationTransferBaseEvent[],
): { owner: string; holder: string } => {
  let owner = '';
  let holder = '';
  for (const event of events) {
    owner = event.owner || owner;
    holder = event.holder || holder;
  }
  return { owner, holder };
};

const identifyEventTypeFromLogs = (
  groupedEvents: ObligationTransferBaseEvent[],
): ObligationTransferEventType => {
  for (const event of groupedEvents) {
    if (
      [
        'INITIAL',
        'RETURNED_TO_ISSUER',
        'RETURN_TO_ISSUER_ACCEPTED',
        'RETURN_TO_ISSUER_REJECTED',
      ].includes(event.type) ||
      event.type.startsWith('REJECT_') ||
      event.type.startsWith('STATUS_')
    ) {
      return event.type;
    }
  }

  const isTransferHolder = groupedEvents.some((event) => event.type === 'TRANSFER_HOLDER');
  const isTransferBeneficiary = groupedEvents.some(
    (event) => event.type === 'TRANSFER_BENEFICIARY',
  );

  if (isTransferHolder && isTransferBeneficiary) {
    return 'TRANSFER_OWNERS';
  } else if (isTransferHolder) {
    return 'TRANSFER_HOLDER';
  } else if (isTransferBeneficiary) {
    return 'TRANSFER_BENEFICIARY';
  }

  throw new Error('Unable to identify event type');
};

export const mergeObligationTransfers = (
  transferEvents: ObligationTransferBaseEvent[],
): ObligationTransferBaseEvent[] => {
  const groupedEventsDict: Dictionary<ObligationTransferBaseEvent[]> = groupBy(
    transferEvents,
    'transactionHash',
  );
  const transactionHashValues = Object.values(groupedEventsDict);
  return transactionHashValues.flatMap((groupedEvents) => {
    if (groupedEvents.length === 1) return groupedEvents;
    if (groupedEvents.length > 1) {
      const { owner, holder } = getHolderOwner(groupedEvents);
      const type = identifyEventTypeFromLogs(groupedEvents);
      const base = groupedEvents.find((event) => event.type === type) ?? groupedEvents[0];
      return [{ ...base, owner, holder, type }];
    }
    throw new Error('Invalid hash, update your configuration');
  });
};

export const sortObligationLogChain = (
  logChain: ObligationTransferBaseEvent[],
): ObligationTransferBaseEvent[] => {
  return logChain.sort((a, b) => {
    return a.blockNumber - b.blockNumber;
  });
};
