import { ConvexError, v } from 'convex/values';
import { doc } from 'convex-helpers/validators';
import { authQuery, authMutation } from './functions';
import { leverageValidator, nullable } from './constants';
import schema from './schema';

const sessionDoc = doc(schema, 'sessions');

const leverageItem = v.object({
  _id: v.id('sessionLeverage'),
  _creationTime: v.number(),
  sessionId: v.id('sessions'),
  userId: v.string(),
  type: v.string(),
  title: v.string(),
  value: v.string(),
  source: v.string(),
  createdAt: v.number(),
});

export const createSession = authMutation({
  args: {
    item: v.string(),
    conversationId: v.optional(v.string()),
  },
  returns: v.id('sessions'),
  handler: async (ctx, { item, conversationId }) => {
    return ctx.db.insert('sessions', {
      userId: ctx.user,
      item,
      conversationId,
      createdAt: Date.now(),
    });
  },
});

export const addLeverage = authMutation({
  args: {
    sessionId: v.id('sessions'),
    leverage: leverageValidator,
  },
  returns: v.id('sessionLeverage'),
  handler: async (ctx, { sessionId, leverage }) => {
    const session = await ctx.db.get('sessions', sessionId);
    if (!session) throw new ConvexError({ code: 'NOT_FOUND', message: 'Session not found' });
    return ctx.db.insert('sessionLeverage', {
      sessionId,
      userId: ctx.user,
      ...leverage,
      createdAt: Date.now(),
    });
  },
});

export const getSession = authQuery({
  args: { sessionId: v.id('sessions') },
  returns: nullable(v.object({
    ...sessionDoc.fields,
    leverage: v.array(leverageItem),
  })),
  handler: async (ctx, { sessionId }) => {
    if (!ctx.user) return null;
    const session = await ctx.db.get('sessions', sessionId);
    if (!session) return null;
    const leverage = await ctx.db
      .query('sessionLeverage')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .take(100);
    return { ...session, leverage };
  },
});

export const listSessions = authQuery({
  args: {},
  returns: v.array(sessionDoc),
  handler: async (ctx) => {
    if (!ctx.user) return [];
    return ctx.db
      .query('sessions')
      .withIndex('by_userId', (q) => q.eq('userId', ctx.user!))
      .order('desc')
      .take(50);
  },
});
