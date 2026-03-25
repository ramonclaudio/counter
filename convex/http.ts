import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { authComponent, createAuth } from './auth';
import { resend } from './email';
import { webhookSecret, elevenlabsApiKey, elevenlabsAgentId, elevenlabsWebhookSecret } from './env';
import { SEARCH_TYPES, type SearchType } from './constants';
import { doSearchMarket, doSearchNews, doSearchAlternatives } from './firecrawl';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  path: '/resend-webhook',
  method: 'POST',
  handler: httpAction((ctx, req) => resend.handleResendEventWebhook(ctx, req)),
});

const privacyUrl = 'https://ramonclaudio.com/apps/counter/privacy';
const termsUrl = 'https://ramonclaudio.com/apps/counter/terms';

http.route({
  path: '/reset-password',
  method: 'GET',
  handler: httpAction(async (_ctx, req) => {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') ?? '';
    const appUrl = `counter://reset-password?token=${encodeURIComponent(token)}`;
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecting…</title>
<meta http-equiv="refresh" content="0;url=${appUrl}">
<style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F2F2F7;color:#000000;text-align:center}a{color:#0088FF;font-weight:600}</style>
</head><body>
<div>
<p>Redirecting to Counter…</p>
<p><a href="${appUrl}">Tap here if the app didn't open</a></p>
</div>
<script>window.location.href=${JSON.stringify(appUrl)};</script>
</body></html>`;
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }),
});

http.route({
  path: '/privacy',
  method: 'GET',
  handler: httpAction(async () =>
    new Response(null, { status: 301, headers: { Location: privacyUrl } }),
  ),
});

http.route({
  path: '/terms',
  method: 'GET',
  handler: httpAction(async () =>
    new Response(null, { status: 301, headers: { Location: termsUrl } }),
  ),
});

// ── Helpers ──────────────────────────────────────────────────────────────

function validateWebhookSecret(req: Request): Response | null {
  const auth = req.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${webhookSecret()}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Search endpoints (called by ElevenLabs agent tools) ─────────────────
// Calls plain helper functions directly (no action-from-action overhead).

import type { Infer } from 'convex/values';
import { intelCardValidator } from './constants';

type IntelCard = Infer<typeof intelCardValidator>;
type SearchFn = (query: string, location?: string) => Promise<IntelCard[]>;

function searchRoute(
  searchType: SearchType,
  searchFn: SearchFn,
  getExtra?: (body: Record<string, unknown>) => string | undefined,
) {
  return httpAction(async (ctx, req) => {
    const authError = validateWebhookSecret(req);
    if (authError) return authError;

    const body = (await req.json()) as Record<string, unknown>;
    const query = (body.query as string | undefined)?.trim();
    if (!query) return jsonResponse({ error: 'query is required' }, 400);

    const extra = getExtra?.(body);
    const now = Date.now();

    const cached = await ctx.runQuery(internal.cache.getCached, { query, searchType, extra, now });
    if (cached) return jsonResponse({ results: cached });

    const results = await searchFn(query, extra);
    await ctx.runMutation(internal.cache.setCached, { query, searchType, results });

    return jsonResponse({ results });
  });
}

http.route({
  path: '/searchMarket',
  method: 'POST',
  handler: searchRoute(SEARCH_TYPES.MARKET, doSearchMarket),
});

http.route({
  path: '/searchNews',
  method: 'POST',
  handler: searchRoute(SEARCH_TYPES.NEWS, doSearchNews),
});

http.route({
  path: '/searchAlternatives',
  method: 'POST',
  handler: searchRoute(
    SEARCH_TYPES.ALTERNATIVES,
    doSearchAlternatives,
    (body) => (body.location as string | undefined)?.trim() || undefined,
  ),
});

// ── ElevenLabs post-call webhook ────────────────────────────────────────

type ElevenLabsWebhookBody = {
  type?: string;
  data?: {
    conversation_id?: string;
    agent_id?: string;
    call_duration_secs?: number;
    analysis?: {
      call_successful?: string;
      transcript_summary?: string;
      evaluation_criteria_results?: Record<string, { result: string; rationale: string }>;
      data_collection_results?: Record<string, { value: string | number | boolean | null; rationale: string }>;
    };
  };
};

http.route({
  path: '/elevenlabs-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const sig = req.headers.get('elevenlabs-signature') ?? req.headers.get('authorization');
    const secret = elevenlabsWebhookSecret();
    if (!sig || (!sig.includes(secret) && sig !== `Bearer ${secret}`)) {
      return jsonResponse({ error: 'Invalid signature' }, 401);
    }
    const body = (await req.json()) as ElevenLabsWebhookBody;
    if (body.type !== 'post_call_transcription' || !body.data?.conversation_id) {
      return jsonResponse({ ok: true });
    }
    const d = body.data;
    await ctx.runMutation(internal.conversations.saveWebhookSummary, {
      elevenlabsConversationId: d.conversation_id!,
      summary: d.analysis?.transcript_summary,
      callSuccessful: d.analysis?.call_successful === 'true',
      durationSeconds: d.call_duration_secs,
      evaluationResults: d.analysis?.evaluation_criteria_results,
      collectedData: d.analysis?.data_collection_results,
    });
    return jsonResponse({ ok: true });
  }),
});

// ── ElevenLabs token (called by Expo app) ───────────────────────────────

http.route({
  path: '/getToken',
  method: 'POST',
  handler: httpAction(async (_ctx, req) => {
    const authError = validateWebhookSecret(req);
    if (authError) return authError;

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${elevenlabsAgentId()}`,
        { headers: { 'xi-api-key': elevenlabsApiKey() } },
      );

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`ElevenLabs token error: ${res.status} ${body}`);
        return jsonResponse({ error: 'Failed to get token' }, 502);
      }

      const data = (await res.json()) as { token: string };
      return jsonResponse({ conversationToken: data.token });
    } catch (e) {
      console.error('ElevenLabs token fetch failed:', e);
      return jsonResponse({ error: 'Token service unavailable' }, 503);
    }
  }),
});

export default http;
