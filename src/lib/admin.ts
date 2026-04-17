import 'server-only';

const ADMIN_EMAILS = [
  'rubengomezesp@gmail.com',
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if user has lifetime access (no billing required)
 */
export function hasLifetimeAccess(email: string | null | undefined): boolean {
  return isAdmin(email);
}
