import { internalQuery, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { CACHE_TTL_MS, searchTypeValidator, intelCardValidator, nullable } from './constants';

function cacheKey(query: string, searchType: string, extra?: string): string {
  return `${searchType}:${query.toLowerCase().trim()}${extra ? `:${extra}` : ''}`;
}

export const getCached = internalQuery({
  args: {
    query: v.string(),
    searchType: searchTypeValidator,
    extra: v.optional(v.string()),
    now: v.number(),
  },
  returns: nullable(v.array(intelCardValidator)),
  handler: async (ctx, { query, searchType, extra, now }) => {
    const key = cacheKey(query, searchType, extra);
    const entry = await ctx.db
      .query('searchCache')
      .withIndex('by_queryHash_and_searchType', (q) => q.eq('queryHash', key).eq('searchType', searchType))
      .first();
    if (!entry) return null;
    if (entry.expiresAt < now) return null;
    return entry.results;
  },
});

export const setCached = internalMutation({
  args: {
    query: v.string(),
    searchType: searchTypeValidator,
    results: v.array(intelCardValidator),
    extra: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { query, searchType, results, extra }) => {
    const key = cacheKey(query, searchType, extra);
    const now = Date.now();
    const existing = await ctx.db
      .query('searchCache')
      .withIndex('by_queryHash_and_searchType', (q) => q.eq('queryHash', key).eq('searchType', searchType))
      .first();
    if (existing) {
      await ctx.db.patch('searchCache', existing._id, { results, expiresAt: now + CACHE_TTL_MS });
    } else {
      await ctx.db.insert('searchCache', {
        queryHash: key,
        searchType,
        results,
        expiresAt: now + CACHE_TTL_MS,
        createdAt: now,
      });
    }
    return null;
  },
});

const CLEAR_BATCH_SIZE = 100;

export const clearExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('searchCache')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', Date.now()))
      .take(CLEAR_BATCH_SIZE);
    for (const entry of expired) {
      await ctx.db.delete('searchCache', entry._id);
    }
    if (expired.length === CLEAR_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.cache.clearExpired);
    }
    if (expired.length > 0) console.log(`[Cache] Cleared ${expired.length} expired entries`);
    return expired.length;
  },
});
