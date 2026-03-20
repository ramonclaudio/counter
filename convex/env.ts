const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const env = {
  convexSiteUrl: optional('CONVEX_SITE_URL', ''),
  siteUrl: optional('SITE_URL', 'counter://'),
} as const;

export const firecrawlApiKey = () => required('FIRECRAWL_API_KEY');
export const elevenlabsApiKey = () => required('ELEVENLABS_API_KEY');
export const elevenlabsAgentId = () => required('ELEVENLABS_AGENT_ID');
export const webhookSecret = () => required('WEBHOOK_SECRET');
