import { ConvexError, v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { authMutation, authQuery } from './functions';
import {
  intelCardValidator,
  messageRoleValidator,
  sessionModeValidator,
  evaluationResultValidator,
  collectedDataItemValidator,
  nullable,
} from './constants';

export const createConversation = authMutation({
  args: { title: v.string() },
  returns: v.id('conversations'),
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert('conversations', {
      userId: ctx.user,
      title: args.title,
      intelCards: [],
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = authMutation({
  args: {
    conversationId: v.id('conversations'),
    role: messageRoleValidator,
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conv = await ctx.db.get('conversations', args.conversationId);
    if (!conv) throw new ConvexError({ code: 'NOT_FOUND', message: 'Conversation not found' });
    const now = Date.now();
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      userId: ctx.user,
      role: args.role,
      content: args.content,
      timestamp: now,
    });
    const shouldSetPreview = args.role === 'user' && !conv.lastPreview;
    await ctx.db.patch('conversations', args.conversationId, {
      messageCount: (conv.messageCount ?? 0) + 1,
      ...(shouldSetPreview ? { lastPreview: args.content.slice(0, 80) } : {}),
      updatedAt: now,
    });
  },
});

export const updateIntelCards = authMutation({
  args: {
    conversationId: v.id('conversations'),
    intelCards: v.array(intelCardValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conv = await ctx.db.get('conversations', args.conversationId);
    if (!conv) throw new ConvexError({ code: 'NOT_FOUND', message: 'Conversation not found' });
    await ctx.db.patch('conversations', args.conversationId, {
      intelCards: args.intelCards,
      updatedAt: Date.now(),
    });
  },
});

const listConversationItem = v.object({
  _id: v.id('conversations'),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  messageCount: v.number(),
  preview: nullable(v.string()),
  intelCount: v.number(),
});

export const listConversations = authQuery({
  args: {},
  returns: v.array(listConversationItem),
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const convs = await ctx.db
      .query('conversations')
      .withIndex('by_userId_and_updatedAt', (q) => q.eq('userId', ctx.user!))
      .order('desc')
      .take(50);
    return convs.map((c) => ({
      _id: c._id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messageCount ?? 0,
      preview: c.lastPreview ?? null,
      intelCount: c.intelCards.length,
    }));
  },
});

export const updateTitle = authMutation({
  args: {
    conversationId: v.id('conversations'),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conv = await ctx.db.get('conversations', args.conversationId);
    if (!conv) throw new ConvexError({ code: 'NOT_FOUND', message: 'Conversation not found' });
    await ctx.db.patch('conversations', args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

const messageShape = v.object({
  role: messageRoleValidator,
  content: v.string(),
  timestamp: v.number(),
});

const conversationDetail = v.object({
  _id: v.id('conversations'),
  _creationTime: v.number(),
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
  evaluationResults: v.optional(v.record(v.string(), evaluationResultValidator)),
  collectedData: v.optional(v.record(v.string(), collectedDataItemValidator)),
  createdAt: v.number(),
  updatedAt: v.number(),
  messages: v.array(messageShape),
});

export const getConversation = authQuery({
  args: { conversationId: v.id('conversations') },
  returns: nullable(conversationDetail),
  handler: async (ctx, args) => {
    if (!ctx.user) return null;
    const conv = await ctx.db.get('conversations', args.conversationId);
    if (!conv) return null;
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversationId_and_timestamp', (q) => q.eq('conversationId', args.conversationId))
      .order('asc')
      .take(500);
    return {
      ...conv,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };
  },
});

export const setElevenlabsId = authMutation({
  args: {
    conversationId: v.id('conversations'),
    elevenlabsConversationId: v.string(),
    sessionMode: v.optional(sessionModeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch('conversations', args.conversationId, {
      elevenlabsConversationId: args.elevenlabsConversationId,
      sessionMode: args.sessionMode,
      updatedAt: Date.now(),
    });
  },
});

export const saveWebhookSummary = internalMutation({
  args: {
    elevenlabsConversationId: v.string(),
    summary: v.optional(v.string()),
    callSuccessful: v.optional(v.boolean()),
    durationSeconds: v.optional(v.number()),
    evaluationResults: v.optional(v.record(v.string(), evaluationResultValidator)),
    collectedData: v.optional(v.record(v.string(), collectedDataItemValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conv = await ctx.db
      .query('conversations')
      .withIndex('by_elevenlabsConversationId', (q) =>
        q.eq('elevenlabsConversationId', args.elevenlabsConversationId),
      )
      .first();
    if (!conv) return null;
    await ctx.db.patch('conversations', conv._id, {
      summary: args.summary,
      callSuccessful: args.callSuccessful,
      durationSeconds: args.durationSeconds,
      evaluationResults: args.evaluationResults,
      collectedData: args.collectedData,
      updatedAt: Date.now(),
    });
    return null;
  },
});
