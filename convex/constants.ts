export const SEARCH_TYPES = {
  MARKET: 'market',
  NEWS: 'news',
  ALTERNATIVES: 'alternatives',
} as const;

export type SearchType = (typeof SEARCH_TYPES)[keyof typeof SEARCH_TYPES];

export const INTEL_CARD_TYPES = {
  PRICE: 'price',
  WARNING: 'warning',
  ALTERNATIVE: 'alternative',
  LEVERAGE: 'leverage',
} as const;

export type IntelCardType = (typeof INTEL_CARD_TYPES)[keyof typeof INTEL_CARD_TYPES];

export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const FIRECRAWL_SEARCH_LIMIT = 5;
