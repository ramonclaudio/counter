import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { requireActionCtx } from '@convex-dev/better-auth/utils';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { username, emailOTP } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { components } from './_generated/api';
import { DataModel, Id } from './_generated/dataModel';
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
  user: { changeEmail: { enabled: true, updateEmailWithoutVerification: false } },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    // @ts-expect-error — customSyntheticUser exists at runtime but is missing from types in this version
    customSyntheticUser: ({ coreFields, additionalFields, id }: {
      coreFields: Record<string, unknown>;
      additionalFields: Record<string, unknown>;
      id: string;
    }) => ({
      ...coreFields,
      username: additionalFields.username ?? null,
      displayUsername: additionalFields.displayUsername ?? null,
      ...additionalFields,
      id,
    }),
    sendResetPassword: async ({ user, url }) => {
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
      '/sign-in/username': { window: ONE_MINUTE * 15, max: 5 },
      '/sign-up/email': { window: ONE_HOUR, max: 3 },
      '/forgot-password': { window: ONE_HOUR, max: 3 },
      '/reset-password': { window: ONE_MINUTE * 15, max: 5 },
      '/change-password': { window: ONE_MINUTE * 15, max: 5 },
      '/email-otp/send-verification-otp': { window: ONE_MINUTE * 5, max: 3 },
      '/email-otp/verify-email': { window: ONE_MINUTE * 15, max: 5 },
    },
  },
  plugins: [
    expo(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
      usernameValidator: (u) => /^[a-zA-Z0-9_-]+$/.test(u),
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp }) {
        await sendOTPVerification(requireActionCtx(ctx), { to: email, otp });
      },
    }),
    convex({ authConfig }),
    crossDomain({ siteUrl: env.siteUrl }),
  ],
} satisfies BetterAuthOptions);

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const community = {
      displayName: profile?.displayName ?? null,
      bio: profile?.bio ?? null,
      isPublic: profile?.isPublic ?? false,
    };

    let image: string | null = null;
    let imageStorageId: string | null = null;
    if (profile?.avatarStorageId) {
      imageStorageId = profile.avatarStorageId;
      try {
        image = await ctx.storage.getUrl(profile.avatarStorageId) ?? null;
      } catch {
        image = null;
      }
    }

    let bannerUrl: string | null = null;
    const bannerStorageId = profile?.bannerStorageId ?? null;
    if (bannerStorageId) {
      try {
        bannerUrl = await ctx.storage.getUrl(bannerStorageId) ?? null;
      } catch {
      }
    }

    return { ...user, ...community, image, imageStorageId, bannerUrl, bannerStorageId };
  },
});
