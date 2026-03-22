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

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      }),
    ),
    intelCards: v.array(v.any()),
    summary: v.optional(v.string()),
    callSuccessful: v.optional(v.boolean()),
    durationSeconds: v.optional(v.number()),
    elevenlabsConversationId: v.optional(v.string()),
    sessionMode: v.optional(v.string()),
    // Post-call analysis from ElevenLabs
    evaluationResults: v.optional(v.any()),
    collectedData: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_elevenlabs_id', ['elevenlabsConversationId']),
});
