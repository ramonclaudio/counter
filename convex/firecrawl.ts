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
  favicon?: string;
  statusCode?: number;
};

type FirecrawlResult = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
  metadata?: FirecrawlMetadata;
};

type FirecrawlResponse = {
  success: boolean;
  data: {
    web?: FirecrawlResult[];
    news?: FirecrawlResult[];
    images?: Array<{ imageUrl: string; url: string; title?: string }>;
  };
};

export type IntelCard = {
  id: string;
  type: string;
  title: string;
  value: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  prices?: string[];
  siteName?: string;
  faviconUrl?: string;
};

// Match $X,XXX or $X,XXX.XX with at least 2 digits
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

function extractOgImage(metadata?: FirecrawlMetadata): string | undefined {
  if (!metadata) return undefined;
  const img = metadata.ogImage ?? metadata['og:image'];
  if (!img || img.length < 10) return undefined;
  return img;
}

function getFaviconUrl(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
}

const SCRAPE_OPTIONS = { formats: ['markdown'], onlyMainContent: true };

async function firecrawlSearch(body: Record<string, unknown>): Promise<FirecrawlResult[]> {
  const res = await fetch(FIRECRAWL_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as FirecrawlResponse;
  if (!json.success || !json.data) return [];
  // v2 nests results under data.web / data.news
  return json.data.web ?? json.data.news ?? [];
}

function toIntelCard(result: FirecrawlResult, type: string): IntelCard {
  const description = result.description ?? '';
  const markdown = result.markdown ?? '';
  const combinedText = `${description} ${markdown}`;
  const prices = extractPrices(combinedText);
  const imageUrl = extractOgImage(result.metadata);

  let hostname: string;
  try {
    hostname = new URL(result.url).hostname;
  } catch {
    hostname = 'unknown';
  }

  const siteName = result.metadata?.ogSiteName ?? undefined;

  return {
    id: `${type}-${simpleHash(result.url)}`,
    type,
    title: result.metadata?.ogTitle ?? result.title ?? 'Result',
    value: description || markdown.slice(0, 300),
    source: hostname,
    sourceUrl: result.url,
    imageUrl,
    prices,
    siteName,
    faviconUrl: getFaviconUrl(hostname),
  };
}

export const searchMarket = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, { query }): Promise<IntelCard[]> => {
    try {
      const results = await firecrawlSearch({
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        scrapeOptions: SCRAPE_OPTIONS,
      });
      return results.map((r) => toIntelCard(r, INTEL_CARD_TYPES.PRICE));
    } catch {
      return [];
    }
  },
});

export const searchNews = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, { query }): Promise<IntelCard[]> => {
    try {
      const results = await firecrawlSearch({
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        tbs: 'qdr:m',
        scrapeOptions: SCRAPE_OPTIONS,
      });
      return results.map((r) => toIntelCard(r, INTEL_CARD_TYPES.WARNING));
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
        scrapeOptions: SCRAPE_OPTIONS,
      };
      if (location) body.location = location;

      const results = await firecrawlSearch(body);
      return results.map((r) => toIntelCard(r, INTEL_CARD_TYPES.ALTERNATIVE));
    } catch {
      return [];
    }
  },
});
