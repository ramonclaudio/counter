import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { requireActionCtx } from '@convex-dev/better-auth/utils';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { username, emailOTP } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';
import { sendOTPVerification, sendResetPassword } from './email';
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
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendResetPassword(requireActionCtx(ctx), { to: user.email, url });
    },
  },
  emailVerification: { sendOnSignUp: false },
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
    username(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp }) {
        await sendOTPVerification(requireActionCtx(ctx), { to: email, otp });
      },
    }),
    expo(),
    convex({ authConfig }),
    crossDomain({ siteUrl: env.siteUrl }),
  ],
} satisfies BetterAuthOptions);

// Uses raw query: reads from Better Auth component table, not app tables (no RLS needed)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return (await authComponent.safeGetAuthUser(ctx)) ?? null;
  },
});
