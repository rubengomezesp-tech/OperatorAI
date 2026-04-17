import 'server-only';
const ADMIN_EMAILS = ['rubengomezesp@gmail.com'];
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
