import { internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { CACHE_TTL_MS } from './constants';

function hashQuery(query: string, searchType: string): string {
  // Simple deterministic hash for cache key
  let h = 0;
  const s = `${searchType}:${query.toLowerCase().trim()}`;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `${h >>> 0}`;
}

export const getCached = internalQuery({
  args: { query: v.string(), searchType: v.string() },
  handler: async (ctx, { query, searchType }) => {
    const queryHash = hashQuery(query, searchType);
    const entry = await ctx.db
      .query('searchCache')
      .withIndex('by_hash_type', (q) => q.eq('queryHash', queryHash).eq('searchType', searchType))
      .first();

    if (!entry) return null;
    if (entry.expiresAt < Date.now()) return null;
    return entry.results;
  },
});

export const setCached = internalMutation({
  args: { query: v.string(), searchType: v.string(), results: v.any() },
  handler: async (ctx, { query, searchType, results }) => {
    const queryHash = hashQuery(query, searchType);
    const now = Date.now();

    // Overwrite existing entry if present
    const existing = await ctx.db
      .query('searchCache')
      .withIndex('by_hash_type', (q) => q.eq('queryHash', queryHash).eq('searchType', searchType))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { results, expiresAt: now + CACHE_TTL_MS });
    } else {
      await ctx.db.insert('searchCache', {
        queryHash,
        searchType,
        results,
        expiresAt: now + CACHE_TTL_MS,
        createdAt: now,
      });
    }
  },
});

export { hashQuery };
