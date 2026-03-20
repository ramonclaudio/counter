import { Resend, vOnEmailEventArgs } from '@convex-dev/resend';
import { components, internal } from './_generated/api';
import { ActionCtx, internalMutation } from './_generated/server';
import { resetPasswordTemplate, otpVerificationTemplate } from './emailTemplates';

const resendApiKey = () => process.env.RESEND_API_KEY ?? '';
const resendFromEmail = () => process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
const resendWebhookSecret = () => process.env.RESEND_WEBHOOK_SECRET;
const isTestMode = () => process.env.RESEND_TEST_MODE === 'true';

export const resend: Resend = new Resend(components.resend, {
  testMode: isTestMode(),
  webhookSecret: resendWebhookSecret(),
  onEmailEvent: internal.email.handleEmailEvent,
});

const APP_NAME = 'Counter';

const sendEmail = async (ctx: ActionCtx, options: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}) => {
  const { to, subject, html, idempotencyKey } = options;
  const entityRefId = idempotencyKey ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    return await resend.sendEmail(ctx, {
      from: `${APP_NAME} <${resendFromEmail()}>`,
      to,
      subject,
      html,
      headers: [{ name: 'X-Entity-Ref-ID', value: entityRefId }],
    });
  } catch (error) {
    console.error('[Email] Failed:', { subject, error: error instanceof Error ? error.message : 'Unknown' });
    throw new Error('Failed to send email. Please try again later.');
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendResetPassword = async (ctx: ActionCtx, { to, url }: { to: string; url: string }) => {
  if (!EMAIL_REGEX.test(to)) throw new Error('Invalid email address');
  const timeBucket = Math.floor(Date.now() / 60000);
  await sendEmail(ctx, {
    to,
    subject: 'Reset your password',
    html: resetPasswordTemplate(url),
    idempotencyKey: `reset-password-${encodeURIComponent(to)}-${timeBucket}`,
  });
};

export const sendOTPVerification = async (ctx: ActionCtx, { to, otp }: { to: string; otp: string }) => {
  if (!EMAIL_REGEX.test(to)) throw new Error('Invalid email address');
  await sendEmail(ctx, { to, subject: 'Your verification code', html: otpVerificationTemplate(otp) });
};

export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (_ctx, { id, event }) => {
    console.log(`[Email] Event ${event.type} for email ${id}`);
    if (event.type === 'email.bounced') console.warn('[Email] Bounce:', { emailId: id });
    if (event.type === 'email.complained') console.error('[Email] Spam complaint:', { emailId: id });
    if (event.type === 'email.failed') console.error('[Email] Failed:', { emailId: id });
  },
});
