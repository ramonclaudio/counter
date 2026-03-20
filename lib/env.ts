const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;

if (!convexUrl) throw new Error('Missing required env var: EXPO_PUBLIC_CONVEX_URL');
if (!convexSiteUrl) throw new Error('Missing required env var: EXPO_PUBLIC_CONVEX_SITE_URL');
if (!siteUrl) throw new Error('Missing required env var: EXPO_PUBLIC_SITE_URL');

export const env = {
  convexUrl,
  convexSiteUrl,
  siteUrl,
  revenuecatAppleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
} as const;
