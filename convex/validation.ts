export function requireText(text: string, maxLength: number, fieldName: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) throw new Error(`${fieldName} cannot be empty`);
  if (trimmed.length > maxLength) throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
  return trimmed;
}

export function checkLength(text: string | undefined, maxLength: number, fieldName: string): void {
  if (text && text.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
  }
}

export function validateTags(tags: string[], maxCount: number, maxTagLength: number): string[] {
  if (tags.length > maxCount) throw new Error(`Cannot have more than ${maxCount} tags`);
  const cleaned = tags.map((t) => t.trim()).filter((t) => t.length > 0);
  for (const tag of cleaned) {
    if (tag.length > maxTagLength) throw new Error(`Tag cannot exceed ${maxTagLength} characters`);
  }
  return cleaned;
}

export function validatePushToken(token: string): void {
  if (token.length > 200) throw new Error('Invalid token');
  if (!token.startsWith('ExponentPushToken[')) throw new Error('Invalid token format');
}

export function sanitizeActions(actions: string[], maxCount: number, maxTextLength: number): string[] {
  if (actions.length > maxCount) throw new Error('Too many initial actions');
  return actions
    .map((text) => text.trim())
    .filter((text) => text.length > 0 && text.length <= maxTextLength);
}

const MIN_FOCUS_DURATION = 1;
const MAX_FOCUS_DURATION = 28800;

export function validateFocusDuration(seconds: number): { valid: boolean; error?: string } {
  if (seconds < MIN_FOCUS_DURATION) return { valid: false, error: 'Session must be at least 1 second' };
  if (seconds > MAX_FOCUS_DURATION) return { valid: false, error: 'Session cannot exceed 8 hours' };
  return { valid: true };
}

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 128;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters` };
  }
  return { valid: true };
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters` };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true };
}

export function sanitizeDisplayText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
}
