import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { firecrawlApiKey } from './env';
import { FIRECRAWL_SEARCH_LIMIT, INTEL_CARD_TYPES } from './constants';

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

export type IntelCard = {
  id: string;
  type: string;
  title: string;
  value: string;
  fullValue?: string;
  highlights?: string[];
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  prices?: string[];
  siteName?: string;
  faviconUrl?: string;
  date?: string;
};

// Match $XX+ or $X,XXX patterns (min 2 digits to avoid noise)
const PRICE_REGEX = /\$\d{2,3}(?:,\d{3})*(?:\.\d{2})?/g;

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

const SCRAPE_OPTIONS = {
  formats: ['markdown'],
  onlyMainContent: true,
};

async function firecrawlSearch(body: Record<string, unknown>): Promise<FirecrawlResponse> {
  const res = await fetch(FIRECRAWL_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

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
  console.log('[Firecrawl] Success:', (json.data.web?.length ?? 0), 'web,', (json.data.news?.length ?? 0), 'news results');
  return json;
}

function webResultToCard(result: FirecrawlWebResult, type: string): IntelCard {
  const description = result.description ?? '';
  const ogDesc = result.metadata?.ogDescription ?? '';
  const markdown = result.markdown ?? '';
  const prices = extractPrices(`${description} ${markdown}`);
  const hostname = getHostname(result.url);
  const shortValue = ogDesc || description || markdown.slice(0, 200);
  const fullValue = (description && markdown)
    ? `${description}\n\n${markdown.slice(0, 400)}`
    : markdown.slice(0, 600) || description;

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
  const shortValue = snippet || markdown.slice(0, 200);
  const fullValue = markdown.slice(0, 600) || snippet;

  return {
    id: `warning-${simpleHash(result.url)}`,
    type: INTEL_CARD_TYPES.WARNING,
    title: result.title ?? 'News',
    value: shortValue,
    fullValue: fullValue.length > shortValue.length ? fullValue : undefined,
    highlights: extractHighlights(markdown),
    source: hostname,
    sourceUrl: result.url,
    imageUrl: result.imageUrl ?? extractOgImage(result.metadata),
    prices: [],
    siteName: result.metadata?.ogSiteName ?? undefined,
    faviconUrl: getFaviconUrl(hostname),
    date: result.date,
  };
}

export const searchMarket = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, { query }): Promise<IntelCard[]> => {
    try {
      const response = await firecrawlSearch({
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        sources: [{ type: 'web' }],
        scrapeOptions: SCRAPE_OPTIONS,
      });
      const results = response.data.web ?? [];
      return results.map((r) => webResultToCard(r, INTEL_CARD_TYPES.PRICE));
    } catch {
      return [];
    }
  },
});

export const searchNews = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, { query }): Promise<IntelCard[]> => {
    try {
      const response = await firecrawlSearch({
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        sources: [{ type: 'news' }],
        scrapeOptions: SCRAPE_OPTIONS,
      });
      const newsResults = response.data.news ?? [];
      if (newsResults.length > 0) {
        return newsResults.map(newsResultToCard);
      }
      // Fallback to web search with time filter if no news results
      const webResponse = await firecrawlSearch({
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        sources: [{ type: 'web', tbs: 'qdr:m' }],
        scrapeOptions: SCRAPE_OPTIONS,
      });
      const webResults = webResponse.data.web ?? [];
      return webResults.map((r) => webResultToCard(r, INTEL_CARD_TYPES.WARNING));
    } catch {
      return [];
    }
  },
});

export const searchAlternatives = internalAction({
  args: { query: v.string(), location: v.optional(v.string()) },
  handler: async (_ctx, { query, location }): Promise<IntelCard[]> => {
    try {
      const body: Record<string, unknown> = {
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        sources: [{ type: 'web', location: location ?? undefined }],
        scrapeOptions: SCRAPE_OPTIONS,
      };
      if (location) body.location = location;

      const response = await firecrawlSearch(body);
      const results = response.data.web ?? [];
      return results.map((r) => webResultToCard(r, INTEL_CARD_TYPES.ALTERNATIVE));
    } catch {
      return [];
    }
  },
});
