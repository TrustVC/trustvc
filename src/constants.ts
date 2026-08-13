export const DEFAULT_KEY = '4d5a4e3f2f6d2b0a1f2e9b8f8a3c7a0b8d4f5c2e7b1a1c3f2e7b8c2d5a4f7e3e';

export const INFURA_FREE_TIER_RANGE_RE =
  /free tier plan|10\s*block difference|block range should work:\s*\[0x0,\s*0x9\]|Upgrade to PAYG|-32600/i;

export const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|too large|block range|10,?000 results|response size|-32012|-32600|10\s*block|free tier|block difference|Upgrade to PAYG|exceeds limit/i;

export const RATE_LIMIT_ERROR_RE = /429|rate-?limit|too many requests|could not coalesce|-32005/i;

export const INITIAL_CHUNK_SIZE = 10_000;
export const FREE_TIER_MAX_CHUNK_SIZE = 10;
export const MIN_CHUNK_SIZE = 1;
export const MAX_CHUNK_SIZE = 50_000;
export const DEFAULT_MAX_BLOCKS_TO_SCAN = 200_000;
export const FREE_TIER_MAX_REQUESTS = 5_000;
export const FREE_TIER_MAX_DURATION_MS = 60_000;
export const RATE_LIMIT_MAX_RETRIES = 3;
export const RATE_LIMIT_BASE_DELAY_MS = 500;
