import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  searchCache: defineTable({
    queryHash: v.string(),
    searchType: v.string(),
    results: v.any(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index('by_hash_type', ['queryHash', 'searchType']),

  sessions: defineTable({
    userId: v.id('user'),
    conversationId: v.optional(v.string()),
    item: v.string(),
    leverage: v.array(
      v.object({
        type: v.string(),
        title: v.string(),
        value: v.string(),
        source: v.string(),
      }),
    ),
    createdAt: v.number(),
  }).index('by_user', ['userId']),
});
