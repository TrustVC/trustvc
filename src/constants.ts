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

/** Window must shrink: free-tier, generic block-range, or result/response overflow. */
export const RANGE_TOO_LARGE_ERROR_RE = new RegExp(
  [
    'query returned more than',
    'too large',
    'block range',
    '10,?000 results',
    'response size',
    'exceeds limit',
    String.raw`10\s*block`,
    'free tier',
    'block difference',
    'Upgrade to PAYG',
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

/** Paid / default chunk window after unranged 0→latest fails. */
export const INITIAL_CHUNK_SIZE = 10_000;
/** Free-tier max eth_getLogs block span (Infura / Alchemy free). */
export const FREE_TIER_MAX_CHUNK_SIZE = 10;
export const MIN_CHUNK_SIZE = 1;
export const RATE_LIMIT_MAX_RETRIES = 3;
export const RATE_LIMIT_BASE_DELAY_MS = 500;
