import { v } from 'convex/values';
import { literals, nullable } from 'convex-helpers/validators';

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

// ── Validators ──────────────────────────────────────────────────────────

export const messageRoleValidator = literals('user', 'assistant');

export const sessionModeValidator = literals('research', 'practice', 'live');

export const searchTypeValidator = literals('market', 'news', 'alternatives');

export const intelCardTypeValidator = literals('price', 'warning', 'alternative', 'leverage');

export const intelCardValidator = v.object({
  id: v.optional(v.string()),
  type: intelCardTypeValidator,
  title: v.string(),
  value: v.string(),
  fullValue: v.optional(v.string()),
  highlights: v.optional(v.array(v.string())),
  source: v.string(),
  sourceUrl: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  prices: v.optional(v.array(v.string())),
  siteName: v.optional(v.string()),
  faviconUrl: v.optional(v.string()),
  date: v.optional(v.string()),
});

export const leverageValidator = v.object({
  type: v.string(),
  title: v.string(),
  value: v.string(),
  source: v.string(),
});

export const evaluationResultValidator = v.object({
  result: v.string(),
  rationale: v.string(),
});

export const collectedDataItemValidator = v.object({
  value: v.union(v.string(), v.number(), v.boolean(), v.null()),
  rationale: v.string(),
});

// Re-export nullable for use in return validators
export { nullable };
