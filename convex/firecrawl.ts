import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { firecrawlApiKey } from './env';
import { FIRECRAWL_SEARCH_LIMIT, INTEL_CARD_TYPES } from './constants';

const FIRECRAWL_SEARCH_URL = 'https://api.firecrawl.dev/v1/search';

type FirecrawlResult = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
};

type FirecrawlResponse = {
  success: boolean;
  data: FirecrawlResult[];
};

export type IntelCard = {
  type: string;
  title: string;
  value: string;
  source: string;
  sourceUrl?: string;
};

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
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data;
}

function toIntelCard(result: FirecrawlResult, type: string): IntelCard {
  return {
    type,
    title: result.title ?? 'Result',
    value: result.description ?? result.markdown?.slice(0, 300) ?? '',
    source: new URL(result.url).hostname,
    sourceUrl: result.url,
  };
}

export const searchMarket = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, { query }): Promise<IntelCard[]> => {
    try {
      const results = await firecrawlSearch({
        query,
        limit: FIRECRAWL_SEARCH_LIMIT,
        scrapeOptions: { formats: ['markdown'] },
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
        sources: ['news'],
        tbs: 'qdr:m',
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
      };
      if (location) body.location = location;

      const results = await firecrawlSearch(body);
      return results.map((r) => toIntelCard(r, INTEL_CARD_TYPES.ALTERNATIVE));
    } catch {
      return [];
    }
  },
});
