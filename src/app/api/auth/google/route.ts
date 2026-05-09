/**
 * 🔐 GET /api/auth/google
 * 
 * Inicia el OAuth flow con Google.
 * Redirige al usuario a la página de consentimiento.
 * Después de autorizar, Google redirige a /api/auth/google/callback.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUrl, GMAIL_SCOPES, CALENDAR_SCOPES } from '@/lib/orchestrator/tools/auth/oauth-google';

export async function GET(req: NextRequest) {
  try {
    // Pedimos scopes de Gmail + Calendar (futuro)
    const scopes = [...GMAIL_SCOPES, ...CALENDAR_SCOPES];
    const authUrl = getAuthUrl(scopes);

    console.log('[oauth-google] redirecting to consent screen');
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[oauth-google] error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
