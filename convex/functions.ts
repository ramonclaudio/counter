import { customQuery, customMutation, customCtx } from 'convex-helpers/server/customFunctions';
import { wrapDatabaseReader, wrapDatabaseWriter } from 'convex-helpers/server/rowLevelSecurity';
import { ConvexError } from 'convex/values';
import { query, mutation } from './_generated/server';
import { authComponent } from './auth';
import { rules, type RLSCtx } from './security';

export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    const userId = authUser?._id ?? null;
    const rlsCtx: RLSCtx = { user: userId ?? '' };
    return {
      user: userId,
      db: wrapDatabaseReader(rlsCtx, ctx.db, rules, { defaultPolicy: 'deny' }),
      unsafeDb: ctx.db,
    };
  }),
);

export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new ConvexError({ code: 'UNAUTHORIZED', message: 'Sign in required' });
    const userId = authUser._id;
    const rlsCtx: RLSCtx = { user: userId };
    return {
      user: userId,
      db: wrapDatabaseWriter(rlsCtx, ctx.db, rules, { defaultPolicy: 'deny' }),
      unsafeDb: ctx.db,
    };
  }),
);
