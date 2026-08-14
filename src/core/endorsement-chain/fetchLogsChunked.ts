import { ethers as ethersV6 } from 'ethersV6';
import { Provider } from '@ethersproject/abstract-provider';
import {
  DEFAULT_MAX_BLOCKS_TO_SCAN,
  FREE_TIER_MAX_CHUNK_SIZE,
  FREE_TIER_MAX_DURATION_MS,
  FREE_TIER_MAX_REQUESTS,
  INFURA_FREE_TIER_RANGE_RE,
  INITIAL_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  RANGE_TOO_LARGE_ERROR_RE,
  RATE_LIMIT_BASE_DELAY_MS,
  RATE_LIMIT_ERROR_RE,
  RATE_LIMIT_MAX_RETRIES,
} from '../../constants';

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

interface ScanLogsBackwardResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
  foundMint: boolean;
  truncated: boolean;
}

interface AdaptiveScanState {
  chunkSize: number;
  maxChunkSize: number;
  requestsUsed: number;
  deadlineAt: number;
}

function shrinkForRangeLimit(state: AdaptiveScanState, message: string): void {
  if (INFURA_FREE_TIER_RANGE_RE.test(message)) {
    state.maxChunkSize = Math.min(state.maxChunkSize, FREE_TIER_MAX_CHUNK_SIZE);
  }
  state.chunkSize = Math.max(Math.floor(state.chunkSize / 4), MIN_CHUNK_SIZE);
  state.chunkSize = Math.min(state.chunkSize, state.maxChunkSize);
}

function isBudgetExhausted(state: AdaptiveScanState): boolean {
  return Date.now() >= state.deadlineAt || state.requestsUsed >= FREE_TIER_MAX_REQUESTS;
}

async function getLogsRange(
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlock: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  for (let attempt = 0; ; attempt++) {
    if (isBudgetExhausted(state)) {
      throw new Error('RPC scan budget exhausted');
    }
    state.requestsUsed += 1;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await provider.getLogs({ address, fromBlock, toBlock })) as any[];
    } catch (err) {
      if (RATE_LIMIT_ERROR_RE.test(errorMessage(err)) && attempt < RATE_LIMIT_MAX_RETRIES) {
        await sleep(
          Math.max(
            0,
            Math.min(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt, state.deadlineAt - Date.now()),
          ),
        );
        continue;
      }
      throw err;
    }
  }
}

// Keep mint and any same-tx companion logs that precede it (e.g. StatusInitialized).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findMintSliceStart(logs: any[], isMintLog: (log: any) => boolean): number {
  let mintIndex = -1;
  for (let i = 0; i < logs.length; i++) {
    if (isMintLog(logs[i])) {
      mintIndex = i;
      break;
    }
  }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function truncatedScanResult(chunkGroups: any[][]): ScanLogsBackwardResult {
  return { logs: flattenOldestFirst(chunkGroups), foundMint: false, truncated: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mintScanResult(chunkGroups: any[][]): ScanLogsBackwardResult {
  return { logs: flattenOldestFirst(chunkGroups), foundMint: true, truncated: false };
}

function tryCollectMintSlice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkLogs: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: ((log: any) => boolean) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkGroups: any[][],
): boolean {
  if (!isMintLog) return false;
  const start = findMintSliceStart(chunkLogs, isMintLog);
  if (start < 0) return false;
  chunkGroups.push(chunkLogs.slice(start));
  return true;
}

type ScanChunkErrorOutcome = 'truncated' | 'retry';

function handleScanChunkError(err: unknown, state: AdaptiveScanState): ScanChunkErrorOutcome {
  if (err instanceof Error && err.message === 'RPC scan budget exhausted') {
    return 'truncated';
  }
  const message = errorMessage(err);
  if (RANGE_TOO_LARGE_ERROR_RE.test(message) && state.chunkSize > MIN_CHUNK_SIZE) {
    shrinkForRangeLimit(state, message);
    return 'retry';
  }
  throw err;
}

type ScanStepResult =
  | { kind: 'done'; result: ScanLogsBackwardResult }
  | { kind: 'retry' }
  | { kind: 'advance'; nextCursor: number };

async function scanOneChunkBackward(
  provider: Provider | ethersV6.Provider,
  address: string,
  cursor: number,
  effectiveFloor: number,
  state: AdaptiveScanState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog: ((log: any) => boolean) | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunkGroups: any[][],
): Promise<ScanStepResult> {
  if (isBudgetExhausted(state)) {
    return { kind: 'done', result: truncatedScanResult(chunkGroups) };
  }

  const chunkStart = Math.max(cursor - state.chunkSize + 1, effectiveFloor);
  try {
    const chunkLogs = await getLogsRange(provider, address, chunkStart, cursor, state);
    if (tryCollectMintSlice(chunkLogs, isMintLog, chunkGroups)) {
      return { kind: 'done', result: mintScanResult(chunkGroups) };
    }
    chunkGroups.push(chunkLogs);
  } catch (err) {
    const outcome = handleScanChunkError(err, state);
    if (outcome === 'truncated') {
      return { kind: 'done', result: truncatedScanResult(chunkGroups) };
    }
    return { kind: 'retry' };
  }

  return { kind: 'advance', nextCursor: chunkStart - 1 };
}

/**
 * Adaptive backward eth_getLogs scanner.
 * Starts with a large window, shrinks on provider range limits (including Infura's 10-block
 * free-tier cap), retries rate limits, and stops early when isMintLog matches.
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @param {string} address - Contract address to scan
 * @param {number} fromBlock - Latest block to start from
 * @param {number} toBlockFloor - Earliest block to stop at
 * @param {(log: any) => boolean} [isMintLog] - Optional mint detector to stop early
 * @param {number} [maxBlocksToScan] - Max blocks to walk back from fromBlock
 * @returns {Promise<ScanLogsBackwardResult>} Logs oldest→newest plus mint/truncation flags
 */
export const scanLogsBackward = async (
  provider: Provider | ethersV6.Provider,
  address: string,
  fromBlock: number,
  toBlockFloor: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isMintLog?: (log: any) => boolean,
  maxBlocksToScan: number = DEFAULT_MAX_BLOCKS_TO_SCAN,
): Promise<ScanLogsBackwardResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chunkGroups: any[][] = [];
  const state: AdaptiveScanState = {
    chunkSize: Math.min(INITIAL_CHUNK_SIZE, MAX_CHUNK_SIZE),
    maxChunkSize: MAX_CHUNK_SIZE,
    requestsUsed: 0,
    deadlineAt: Date.now() + FREE_TIER_MAX_DURATION_MS,
  };
  const budgetFloor = Math.max(0, fromBlock - maxBlocksToScan);
  const effectiveFloor = Math.max(toBlockFloor, budgetFloor);
  const budgetRaisedFloor = effectiveFloor > toBlockFloor;
  let cursor = fromBlock;

  while (cursor >= effectiveFloor) {
    const step = await scanOneChunkBackward(
      provider,
      address,
      cursor,
      effectiveFloor,
      state,
      isMintLog,
      chunkGroups,
    );
    if (step.kind === 'done') return step.result;
    if (step.kind === 'retry') continue;
    cursor = step.nextCursor;
  }

  return {
    logs: flattenOldestFirst(chunkGroups),
    foundMint: false,
    truncated: Boolean(isMintLog) && budgetRaisedFloor,
  };
};
