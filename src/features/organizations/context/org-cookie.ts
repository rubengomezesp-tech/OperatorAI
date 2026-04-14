const COOKIE = 'operator.org_id';

export function setOrgCookie(orgId: string) {
  if (typeof document === 'undefined') return;
  document.cookie = COOKIE + '=' + orgId + '; path=/; max-age=' + (60 * 60 * 24 * 365) + '; samesite=lax';
}

export function getCurrentOrgId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
