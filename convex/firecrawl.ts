import { internalAction } from './_generated/server';
import type { Infer } from 'convex/values';
import { v } from 'convex/values';
import { firecrawlApiKey } from './env';
import { FIRECRAWL_SEARCH_LIMIT, INTEL_CARD_TYPES, type IntelCardType, intelCardValidator } from './constants';

const FIRECRAWL_SEARCH_URL = 'https://api.firecrawl.dev/v2/search';

type FirecrawlMetadata = {
  title?: string;
  description?: string;
  sourceURL?: string;
  ogImage?: string;
  'og:image'?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogSiteName?: string;
  ogUrl?: string;
  statusCode?: number;
  // Firecrawl sometimes returns these under different keys
  image?: string;
  [key: string]: unknown;
};

type FirecrawlWebResult = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
  metadata?: FirecrawlMetadata;
  position?: number;
};

type FirecrawlNewsResult = {
  url: string;
  title?: string;
  snippet?: string;
  date?: string;
  imageUrl?: string;
  markdown?: string;
  metadata?: FirecrawlMetadata;
  position?: number;
};

type FirecrawlResponse = {
  success: boolean;
  data: {
    web?: FirecrawlWebResult[];
    news?: FirecrawlNewsResult[];
  };
  creditsUsed?: number;
};

type IntelCard = Infer<typeof intelCardValidator>;

// Match $XX+ without commas, or $X,XXX+ with commas (min 2 digits to avoid $1/$2 noise)
const PRICE_REGEX = /\$(?:\d{1,3}(?:,\d{3})+|\d{2,})(?:\.\d{2})?/g;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function extractPrices(text: string): string[] {
  const matches = text.match(PRICE_REGEX) ?? [];
  return [...new Set(matches)].filter((p) => p !== '$0' && p !== '$0.00').slice(0, 6);
}

function extractHighlights(markdown: string, limit = 4): string[] {
  if (!markdown) return [];
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
  // Try list items first
  const listItems = lines
    .filter((l) => /^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^[-*\d.]+\s+/, '').trim())
    .filter((l) => l.length >= 15 && l.length <= 150);
  if (listItems.length >= 2) return listItems.slice(0, limit);
  // Fallback: short sentences from prose
  const sentences = markdown
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 120);
  return sentences.slice(0, limit);
}

function extractOgImage(metadata?: FirecrawlMetadata): string | undefined {
  if (!metadata) return undefined;
  const img = metadata.ogImage
    ?? metadata['og:image']
    ?? metadata.image
    ?? (typeof metadata['og:image:url'] === 'string' ? metadata['og:image:url'] : undefined);
  if (!img || !img.startsWith('http')) return undefined;
  return img;
}

function extractImageFromMarkdown(markdown: string): string | undefined {
  const match = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  return match?.[1];
}

function extractDate(metadata?: FirecrawlMetadata): string | undefined {
  if (!metadata) return undefined;
  const keys = [
    'article:published_time',
    'datePublished',
    'og:updated_time',
    'article:modified_time',
    'date',
  ] as const;
  for (const k of keys) {
    const v = metadata[k];
    if (typeof v === 'string' && !isNaN(new Date(v).getTime())) return v;
  }
  return undefined;
}

function getFaviconUrl(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

const EXCLUDE_TAGS = ['nav', 'footer', 'header', 'aside'];

const SCRAPE_OPTIONS = {
  formats: ['markdown'],
  onlyMainContent: true,
  excludeTags: EXCLUDE_TAGS,
  maxAge: 3600000,
  timeout: 15000,
};

const SCRAPE_OPTIONS_LIGHT = {
  formats: ['summary'],
  onlyMainContent: true,
  excludeTags: EXCLUDE_TAGS,
  maxAge: 3600000,
  timeout: 15000,
};

const FETCH_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 2000;

async function firecrawlFetch(body: Record<string, unknown>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(FIRECRAWL_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ignoreInvalidURLs: true, country: 'US', ...body }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function firecrawlSearch(body: Record<string, unknown>): Promise<FirecrawlResponse> {
  let res: Response;
  try {
    res = await firecrawlFetch(body);
  } catch (e) {
    console.error('[Firecrawl] Fetch failed:', (e as Error).message);
    return { success: false, data: {} };
  }

  // Retry once on rate limit
  if (res.status === 429) {
    console.warn(`[Firecrawl] Rate limited, retrying in ${RETRY_DELAY_MS}ms`);
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    try {
      res = await firecrawlFetch(body);
    } catch (e) {
      console.error('[Firecrawl] Retry fetch failed:', (e as Error).message);
      return { success: false, data: {} };
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[Firecrawl] HTTP error:', res.status, text.slice(0, 300));
    return { success: false, data: {} };
  }

  const json = (await res.json()) as FirecrawlResponse;
  if (!json.success) {
    console.error('[Firecrawl] API error:', JSON.stringify(json).slice(0, 300));
    return { success: false, data: {} };
  }
  const web = json.data.web?.length ?? 0;
  const news = json.data.news?.length ?? 0;
  console.log(`[Firecrawl] ${web} web, ${news} news (${json.creditsUsed ?? '?'} credits)`);
  return json;
}

function webResultToCard(result: FirecrawlWebResult, type: IntelCardType): IntelCard {
  const description = result.description ?? '';
  const ogDesc = result.metadata?.ogDescription ?? '';
  const markdown = result.markdown ?? '';
  const prices = extractPrices(`${description} ${markdown}`);
  const hostname = getHostname(result.url);
  const shortValue = ogDesc || description || markdown.slice(0, 200) || result.title || 'No description available';
  const fullValue = (description && markdown)
    ? `${description}\n\n${markdown.slice(0, 400)}`
    : markdown.slice(0, 600) || description || shortValue;

  return {
    id: `${type}-${simpleHash(result.url)}`,
    type,
    title: result.metadata?.ogTitle ?? result.title ?? 'Result',
    value: shortValue,
    fullValue: fullValue.length > shortValue.length ? fullValue : undefined,
    highlights: extractHighlights(markdown),
    source: hostname,
    sourceUrl: result.url,
    imageUrl: extractOgImage(result.metadata) ?? extractImageFromMarkdown(markdown),
    prices,
    siteName: result.metadata?.ogSiteName ?? undefined,
    faviconUrl: getFaviconUrl(hostname),
    date: extractDate(result.metadata),
  };
}

function newsResultToCard(result: FirecrawlNewsResult): IntelCard {
  const hostname = getHostname(result.url);
  const markdown = result.markdown ?? '';
  const snippet = result.snippet ?? '';
  const shortValue = snippet || markdown.slice(0, 200) || result.title || 'No description available';
  const fullValue = markdown.slice(0, 600) || snippet || shortValue;

  return {
    id: `${INTEL_CARD_TYPES.WARNING}-${simpleHash(result.url)}`,
    type: INTEL_CARD_TYPES.WARNING,
    title: result.title ?? 'News',
    value: shortValue,
    fullValue: fullValue.length > shortValue.length ? fullValue : undefined,
    highlights: extractHighlights(markdown),
    source: hostname,
    sourceUrl: result.url,
    imageUrl: result.imageUrl ?? extractOgImage(result.metadata),
    prices: extractPrices(`${snippet} ${markdown}`),
    siteName: result.metadata?.ogSiteName ?? undefined,
    faviconUrl: getFaviconUrl(hostname),
    date: result.date,
  };
}

// ── Plain helpers (callable directly from httpActions without action-from-action overhead) ──

export async function doSearchMarket(query: string): Promise<IntelCard[]> {
  try {
    const response = await firecrawlSearch({
      query,
      limit: FIRECRAWL_SEARCH_LIMIT,
      sources: [{ type: 'web' }],
      scrapeOptions: SCRAPE_OPTIONS,
    });
    return (response.data.web ?? []).map((r) => webResultToCard(r, INTEL_CARD_TYPES.PRICE));
  } catch {
    return [];
  }
}

export async function doSearchNews(query: string): Promise<IntelCard[]> {
  try {
    const response = await firecrawlSearch({
      query,
      limit: FIRECRAWL_SEARCH_LIMIT,
      sources: [{ type: 'news' }, { type: 'web' }],
      tbs: 'qdr:m,sbd:1',
      scrapeOptions: SCRAPE_OPTIONS_LIGHT,
    });
    const newsResults = response.data.news ?? [];
    if (newsResults.length > 0) return newsResults.map(newsResultToCard);
    return (response.data.web ?? []).map((r) => webResultToCard(r, INTEL_CARD_TYPES.WARNING));
  } catch {
    return [];
  }
}

export async function doSearchAlternatives(query: string, location?: string): Promise<IntelCard[]> {
  try {
    const body: Record<string, unknown> = {
      query,
      limit: FIRECRAWL_SEARCH_LIMIT,
      sources: [{ type: 'web' }],
      scrapeOptions: SCRAPE_OPTIONS_LIGHT,
    };
    if (location) body.location = location;
    const response = await firecrawlSearch(body);
    return (response.data.web ?? []).map((r) => webResultToCard(r, INTEL_CARD_TYPES.ALTERNATIVE));
  } catch {
    return [];
  }
}

// ── InternalAction wrappers (for scheduling from mutations) ──

export const searchMarket = internalAction({
  args: { query: v.string() },
  returns: v.array(intelCardValidator),
  handler: async (_ctx, { query }) => doSearchMarket(query),
});

export const searchNews = internalAction({
  args: { query: v.string() },
  returns: v.array(intelCardValidator),
  handler: async (_ctx, { query }) => doSearchNews(query),
});

export const searchAlternatives = internalAction({
  args: { query: v.string(), location: v.optional(v.string()) },
  returns: v.array(intelCardValidator),
  handler: async (_ctx, { query, location }) => doSearchAlternatives(query, location),
});
