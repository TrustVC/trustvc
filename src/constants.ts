export const DEFAULT_KEY = '4d5a4e3f2f6d2b0a1f2e9b8f8a3c7a0b8d4f5c2e7b1a1c3f2e7b8c2d5a4f7e3e';

// Infura Free-tier eth_getLogs: max 10-block window (-32600).
// Example: "Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block difference..."
export const INFURA_FREE_TIER_RANGE_RE =
  /free tier plan|10\s*block difference|block range should work:\s*\[0x0,\s*0x9\]|-32600/i;

// Also shrink for dense windows (result-count / response-size caps).
export const RANGE_TOO_LARGE_ERROR_RE =
  /query returned more than|range.*(too large|exceed)|(too large|exceed).*range|block range|10\s*block|block difference|free tier plan|10,?000 results|response size|log response size|-32600|-32012/i;

export const INFURA_HOST_RE = /infura\.io/i;

// Try paid-tier sized windows first; Free-tier errors snap the cap to 10.
export const INITIAL_CHUNK_SIZE = 10_000;
export const FREE_TIER_MAX_CHUNK_SIZE = 10;
export const MIN_CHUNK_SIZE = 1;
export const MAX_CHUNK_SIZE = 50_000;
// Parallel Free-tier windows once the cap is ≤10 (no adaptive shrink mid-batch).
export const FREE_TIER_CONCURRENCY = 8;
/** Default backward-scan budget when no mint marker is found (blocks from tip). */
export const DEFAULT_MAX_BLOCKS_TO_SCAN = 1_000_000;
