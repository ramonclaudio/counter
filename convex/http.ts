import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { authComponent, createAuth } from './auth';
import { resend } from './email';
import { revenuecat } from './revenuecat';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  path: '/resend-webhook',
  method: 'POST',
  handler: httpAction((ctx, req) => resend.handleResendEventWebhook(ctx, req)),
});

http.route({
  path: '/revenuecat/webhook',
  method: 'POST',
  handler: revenuecat.httpHandler(),
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
<p>Redirecting to DreamSeeker…</p>
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

export default http;
