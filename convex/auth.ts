import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { expo } from '@better-auth/expo';
import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';
import { env } from './env';

export const authComponent = createClient<DataModel>(components.betterAuth);
const ONE_MINUTE = 60;
const ONE_HOUR = 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const SEVEN_DAYS = ONE_DAY * 7;

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth({
  baseURL: env.convexSiteUrl || undefined,
  trustedOrigins: [
    'counter://',
    env.siteUrl,
    ...(process.env.NODE_ENV === 'development' ? ['exp://', 'http://localhost:8081'] : []),
  ],
  database: authComponent.adapter(ctx),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
  },
  session: { expiresIn: SEVEN_DAYS, updateAge: ONE_DAY, cookieCache: { enabled: true, maxAge: ONE_MINUTE * 5 } },
  rateLimit: {
    enabled: true,
    window: ONE_MINUTE,
    max: 10,
    customRules: {
      '/sign-in/email': { window: ONE_MINUTE * 15, max: 5 },
      '/sign-up/email': { window: ONE_HOUR, max: 3 },
      '/forgot-password': { window: ONE_HOUR, max: 3 },
      '/reset-password': { window: ONE_MINUTE * 15, max: 5 },
      '/change-password': { window: ONE_MINUTE * 15, max: 5 },
    },
  },
  plugins: [
    expo(),
    convex({ authConfig }),
    crossDomain({ siteUrl: env.siteUrl }),
  ],
} satisfies BetterAuthOptions);

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    return user;
  },
});
