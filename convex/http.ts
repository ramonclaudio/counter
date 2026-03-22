import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { authComponent, createAuth } from './auth';
import { resend } from './email';
import { webhookSecret, elevenlabsApiKey, elevenlabsAgentId } from './env';
import { SEARCH_TYPES } from './constants';

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
  handler: httpAction(async () => {
    return new Response(null, { status: 301, headers: { Location: privacyUrl } });
  }),
});

http.route({
  path: '/terms',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(null, { status: 301, headers: { Location: termsUrl } });
  }),
});

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

http.route({
  path: '/searchMarket',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const authError = validateWebhookSecret(req);
    if (authError) return authError;

    const body = (await req.json()) as { query?: string };
    const query = body.query?.trim();
    if (!query) return jsonResponse({ error: 'query is required' }, 400);

    const cached = await ctx.runQuery(internal.cache.getCached, { query, searchType: SEARCH_TYPES.MARKET });
    if (cached) return jsonResponse({ results: cached });

    const results = await ctx.runAction(internal.firecrawl.searchMarket, { query });
    await ctx.runMutation(internal.cache.setCached, { query, searchType: SEARCH_TYPES.MARKET, results });

    return jsonResponse({ results });
  }),
});

http.route({
  path: '/searchNews',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const authError = validateWebhookSecret(req);
    if (authError) return authError;

    const body = (await req.json()) as { query?: string };
    const query = body.query?.trim();
    if (!query) return jsonResponse({ error: 'query is required' }, 400);

    const cached = await ctx.runQuery(internal.cache.getCached, { query, searchType: SEARCH_TYPES.NEWS });
    if (cached) return jsonResponse({ results: cached });

    const results = await ctx.runAction(internal.firecrawl.searchNews, { query });
    await ctx.runMutation(internal.cache.setCached, { query, searchType: SEARCH_TYPES.NEWS, results });

    return jsonResponse({ results });
  }),
});

http.route({
  path: '/searchAlternatives',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const authError = validateWebhookSecret(req);
    if (authError) return authError;

    const body = (await req.json()) as { query?: string; location?: string };
    const query = body.query?.trim();
    if (!query) return jsonResponse({ error: 'query is required' }, 400);

    const cached = await ctx.runQuery(internal.cache.getCached, { query, searchType: SEARCH_TYPES.ALTERNATIVES });
    if (cached) return jsonResponse({ results: cached });

    const results = await ctx.runAction(internal.firecrawl.searchAlternatives, { query, location: body.location });
    await ctx.runMutation(internal.cache.setCached, { query, searchType: SEARCH_TYPES.ALTERNATIVES, results });

    return jsonResponse({ results });
  }),
});

// ElevenLabs post-call webhook: saves transcript summary to conversation record
http.route({
  path: '/elevenlabs-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const body = await req.json() as {
      type?: string;
      data?: {
        conversation_id?: string;
        agent_id?: string;
        call_duration_secs?: number;
        analysis?: {
          call_successful?: string;
          transcript_summary?: string;
        };
      };
    };
    if (body.type !== 'post_call_transcription' || !body.data?.conversation_id) {
      return jsonResponse({ ok: true });
    }
    const d = body.data;
    await ctx.runMutation(internal.conversations.saveWebhookSummary, {
      elevenlabsConversationId: d.conversation_id!,
      summary: d.analysis?.transcript_summary,
      callSuccessful: d.analysis?.call_successful === 'true',
      durationSeconds: d.call_duration_secs,
    });
    return jsonResponse({ ok: true });
  }),
});

http.route({
  path: '/getToken',
  method: 'POST',
  handler: httpAction(async (_ctx, req) => {
    // Called by the Expo app directly (no webhook secret needed, but could add later)
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${elevenlabsAgentId()}`,
      { headers: { 'xi-api-key': elevenlabsApiKey() } },
    );

    if (!res.ok) {
      return jsonResponse({ error: 'Failed to get token' }, 502);
    }

    const data = (await res.json()) as { token: string };
    return jsonResponse({ conversationToken: data.token });
  }),
});

export default http;
