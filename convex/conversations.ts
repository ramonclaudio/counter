import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { authMutation, authQuery } from './functions';

export const createConversation = authMutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert('conversations', {
      userId: ctx.user,
      title: args.title,
      messages: [],
      intelCards: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = authMutation({
  args: {
    conversationId: v.id('conversations'),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    const now = Date.now();
    await ctx.db.patch(args.conversationId, {
      messages: [...conv.messages, { role: args.role, content: args.content, timestamp: now }],
      updatedAt: now,
    });
  },
});

export const updateIntelCards = authMutation({
  args: {
    conversationId: v.id('conversations'),
    intelCards: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    await ctx.db.patch(args.conversationId, {
      intelCards: args.intelCards,
      updatedAt: Date.now(),
    });
  },
});

export const listConversations = authQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const convs = await ctx.db
      .query('conversations')
      .withIndex('by_user', (q) => q.eq('userId', ctx.user!))
      .collect();
    convs.sort((a, b) => b.updatedAt - a.updatedAt);
    return convs.map((c) => ({
      _id: c._id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
      preview:
        (
          c.messages.find((m: any) => m.role === 'user')?.content as
            | string
            | undefined
        )?.slice(0, 80) ?? null,
      intelCount: c.intelCards.length,
    }));
  },
});

export const updateTitle = authMutation({
  args: {
    conversationId: v.id('conversations'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const getConversation = authQuery({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    if (!ctx.user) return null;
    return ctx.db.get(args.conversationId);
  },
});

export const setElevenlabsId = authMutation({
  args: {
    conversationId: v.id('conversations'),
    elevenlabsConversationId: v.string(),
    sessionMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      elevenlabsConversationId: args.elevenlabsConversationId,
      sessionMode: args.sessionMode,
      updatedAt: Date.now(),
    });
  },
});

// Called by ElevenLabs post-call webhook (no auth, uses elevenlabsConversationId lookup)
export const saveWebhookSummary = internalMutation({
  args: {
    elevenlabsConversationId: v.string(),
    summary: v.optional(v.string()),
    callSuccessful: v.optional(v.boolean()),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db
      .query('conversations')
      .withIndex('by_elevenlabs_id', (q) => q.eq('elevenlabsConversationId', args.elevenlabsConversationId))
      .first();
    if (!conv) return;
    await ctx.db.patch(conv._id, {
      summary: args.summary,
      callSuccessful: args.callSuccessful,
      durationSeconds: args.durationSeconds,
      updatedAt: Date.now(),
    });
  },
});
