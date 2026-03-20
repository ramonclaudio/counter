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
  statusCode?: number;
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

function extractOgImage(metadata?: FirecrawlMetadata): string | undefined {
  if (!metadata) return undefined;
  const img = metadata.ogImage ?? metadata['og:image'];
  if (!img || img.length < 10) return undefined;
  return img;
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

  if (!res.ok) return { success: false, data: {} };

  const json = (await res.json()) as FirecrawlResponse;
  if (!json.success) return { success: false, data: {} };
  return json;
}

function webResultToCard(result: FirecrawlWebResult, type: string): IntelCard {
  const description = result.description ?? '';
  const markdown = result.markdown ?? '';
  const prices = extractPrices(`${description} ${markdown}`);
  const hostname = getHostname(result.url);

  return {
    id: `${type}-${simpleHash(result.url)}`,
    type,
    title: result.metadata?.ogTitle ?? result.title ?? 'Result',
    value: description || markdown.slice(0, 300),
    source: hostname,
    sourceUrl: result.url,
    imageUrl: extractOgImage(result.metadata),
    prices,
    siteName: result.metadata?.ogSiteName ?? undefined,
    faviconUrl: getFaviconUrl(hostname),
  };
}

function newsResultToCard(result: FirecrawlNewsResult): IntelCard {
  const hostname = getHostname(result.url);

  return {
    id: `warning-${simpleHash(result.url)}`,
    type: INTEL_CARD_TYPES.WARNING,
    title: result.title ?? 'News',
    value: result.snippet ?? result.markdown?.slice(0, 300) ?? '',
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
