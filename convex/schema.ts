import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { migrationsTable } from 'convex-helpers/server/migrations';
import { deprecated } from 'convex-helpers/validators';
import {
  intelCardValidator,
  leverageValidator,
  searchTypeValidator,
  messageRoleValidator,
  sessionModeValidator,
  evaluationResultValidator,
  collectedDataItemValidator,
} from './constants';

export default defineSchema({
  migrations: migrationsTable,

  searchCache: defineTable({
    queryHash: v.string(),
    searchType: searchTypeValidator,
    results: v.array(intelCardValidator),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_queryHash_and_searchType', ['queryHash', 'searchType'])
    .index('by_expiresAt', ['expiresAt']),

  sessions: defineTable({
    userId: v.string(),
    conversationId: v.optional(v.string()),
    item: v.string(),
    // Legacy: embedded leverage array. Use sessionLeverage table instead.
    leverage: deprecated,
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  sessionLeverage: defineTable({
    sessionId: v.id('sessions'),
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    value: v.string(),
    source: v.string(),
    createdAt: v.number(),
  })
    .index('by_sessionId', ['sessionId'])
    .index('by_userId', ['userId']),

  messages: defineTable({
    conversationId: v.id('conversations'),
    userId: v.string(),
    role: messageRoleValidator,
    content: v.string(),
    timestamp: v.number(),
  })
    .index('by_conversationId_and_timestamp', ['conversationId', 'timestamp'])
    .index('by_userId', ['userId']),

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    intelCards: v.array(intelCardValidator),
    messageCount: v.optional(v.number()),
    lastPreview: v.optional(v.string()),
    summary: v.optional(v.string()),
    callSuccessful: v.optional(v.boolean()),
    durationSeconds: v.optional(v.number()),
    elevenlabsConversationId: v.optional(v.string()),
    sessionMode: v.optional(sessionModeValidator),
    evaluationResults: v.optional(
      v.record(v.string(), evaluationResultValidator),
    ),
    collectedData: v.optional(
      v.record(v.string(), collectedDataItemValidator),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Legacy: embedded messages array from pre-normalization. Run extractMessages migration to clear.
    messages: deprecated,
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_updatedAt', ['userId', 'updatedAt'])
    .index('by_elevenlabsConversationId', ['elevenlabsConversationId']),
}, { strictTableNameTypes: true });
