const baseStyles = {
  container: 'font-family: sans-serif; max-width: 600px; margin: 0 auto;',
  button:
    'display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;',
  muted: 'color: #8E8E93; font-size: 14px;',
  small: 'color: #8E8E93; font-size: 12px;',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const resetPasswordTemplate = (url: string): string => {
  const safeUrl = escapeHtml(url);
  return `
<div style="${baseStyles.container}">
  <h2>Reset your password</h2>
  <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
  <a href="${safeUrl}" style="${baseStyles.button}">
    Reset Password
  </a>
  <p style="${baseStyles.muted}">If you didn't request this, you can safely ignore this email.</p>
  <p style="${baseStyles.small}">Or copy this link: ${safeUrl}</p>
</div>
`;
};

export const otpVerificationTemplate = (otp: string): string => {
  const safeOtp = escapeHtml(otp);
  return `
<div style="${baseStyles.container}">
  <h2>Verify your email</h2>
  <p>Enter the following code to verify your email address:</p>
  <div style="text-align: center; margin: 24px 0;">
    <span style="font-family: monospace; font-size: 32px; letter-spacing: 8px; font-weight: bold;">${safeOtp}</span>
  </div>
  <p style="${baseStyles.muted}">This code expires in 5 minutes.</p>
  <p style="${baseStyles.small}">If you didn't create an account, you can safely ignore this email.</p>
</div>
`;
};
