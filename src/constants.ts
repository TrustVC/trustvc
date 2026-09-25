export const DEFAULT_KEY = '4d5a4e3f2f6d2b0a1f2e9b8f8a3c7a0b8d4f5c2e7b1a1c3f2e7b8c2d5a4f7e3e';

// Match JSON-RPC / HTTP codes as standalone tokens (not inside block numbers, gas, chain IDs).
const rpcCode = (code: string): string => `(?:^|[^0-9A-Za-z+-])${code}(?![0-9A-Za-z])`;

/** Free-tier eth_getLogs block-range fingerprints (Infura + Alchemy). Not bare -32600. */
export const FREE_TIER_BLOCK_RANGE_RE = new RegExp(
  [
    'free tier',
    String.raw`10\s*block`,
    'block difference',
    String.raw`block range should work:\s*\[0x0,\s*0x9\]`,
    'Upgrade to PAYG',
  ].join('|'),
  'i',
);

/** Infura-style query duration exceeded — shrink by bisect, not free-tier jump. */
export const QUERY_TIMEOUT_ERROR_RE = new RegExp(
  ['query timeout', 'timeout exceeded', 'request timed out', 'context deadline'].join('|'),
  'i',
);

/** Result/response count overflow — shrink window; not free-tier. */
export const RESULT_OVERFLOW_ERROR_RE = new RegExp(
  ['query returned more than', '10,?000 results', 'response size', 'exceeds limit'].join('|'),
  'i',
);

/**
 * Explicit block-range caps (Alchemy “other chains” / “10k blocks”).
 * Not free-tier and not log-count overflow.
 */
export const BLOCK_RANGE_CAP_ERROR_RE = new RegExp(
  [
    'block range',
    '10,?000 block',
    String.raw`up to a \d+\s*block`,
    'blocks? (?:limit|range)',
    String.raw`range (?:is|of) (?:at most )?\d+`,
    rpcCode('-32012'),
  ].join('|'),
  'i',
);

export const RATE_LIMIT_ERROR_RE = new RegExp(
  [
    String.raw`rate[\s-]?limit`,
    'too many requests',
    'could not coalesce',
    rpcCode('429'),
    rpcCode('-32005'),
  ].join('|'),
  'i',
);

/**
 * Paid block-range fallback (Alchemy “other chains” / explicit 10k block caps).
 * Not the default start for Infura-like result/time caps — those use LARGE_CHUNK_SIZE.
 */
export const INITIAL_CHUNK_SIZE = 10_000;
/**
 * Post-probe start when free is ruled out and the error is not an explicit block-range cap
 * (sparse escrows: few logs → much wider than 10k blocks is safe until timeout/overflow).
 */
export const LARGE_CHUNK_SIZE = 1_000_000;
/** Free-tier max eth_getLogs block span (Infura / Alchemy free). */
export const FREE_TIER_MAX_CHUNK_SIZE = 10;
export const MIN_CHUNK_SIZE = 1;
export const RATE_LIMIT_MAX_RETRIES = 3;
export const RATE_LIMIT_BASE_DELAY_MS = 500;
/** Max in-flight eth_getLogs during parallel forward scans (non-free tiers). */
export const GET_LOGS_MAX_CONCURRENCY = 10;
