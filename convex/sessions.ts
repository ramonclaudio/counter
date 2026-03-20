import { v } from 'convex/values';
import { authQuery, authMutation } from './functions';

export const createSession = authMutation({
  args: {
    item: v.string(),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, { item, conversationId }) => {
    return ctx.db.insert('sessions', {
      userId: ctx.user,
      item,
      conversationId,
      leverage: [],
      createdAt: Date.now(),
    });
  },
});

export const addLeverage = authMutation({
  args: {
    sessionId: v.id('sessions'),
    leverage: v.object({
      type: v.string(),
      title: v.string(),
      value: v.string(),
      source: v.string(),
    }),
  },
  handler: async (ctx, { sessionId, leverage }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error('Session not found');
    await ctx.db.patch(sessionId, {
      leverage: [...session.leverage, leverage],
    });
  },
});

export const getSession = authQuery({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    if (!ctx.user) return null;
    return ctx.db.get(sessionId);
  },
});

export const listSessions = authQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    return ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', ctx.user!))
      .order('desc')
      .collect();
  },
});
