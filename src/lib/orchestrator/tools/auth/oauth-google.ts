/**
 * 🔐 OAuth GOOGLE — Flow completo de autenticación
 * 
 * Maneja:
 *   - Generación de URL de consentimiento
 *   - Intercambio de code por tokens
 *   - Refresh de access token cuando expira
 *   - Cliente OAuth2 listo para usar con APIs Google
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { saveTokens, getTokens } from './token-store';

// Scopes que pedimos a Google
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

/**
 * Crea un cliente OAuth2 sin tokens (para iniciar flow).
 */
export function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth no configurado (faltan vars en .env.local)');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Genera la URL de consentimiento que el user debe visitar.
 */
export function getAuthUrl(scopes: string[] = GMAIL_SCOPES): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline', // Para obtener refresh_token
    prompt: 'consent', // Forzar consent siempre (asegura refresh_token)
    scope: scopes,
  });
}

/**
 * Intercambia el authorization code por tokens y los guarda.
 */
export async function exchangeCodeForTokens(
  code: string,
  userId: string,
): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('No se recibió access_token de Google');
  }

  await saveTokens({
    provider: 'google',
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    scope: tokens.scope || undefined,
  });
}

/**
 * Obtiene un cliente OAuth2 listo para usar (con tokens cargados y refresh automático).
 */
export async function getAuthenticatedClient(
  userId: string,
): Promise<OAuth2Client | null> {
  const tokens = await getTokens('google', userId);
  if (!tokens) return null;

  const client = createOAuthClient();
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt?.getTime(),
  });

  // Auto-refresh si expira
  client.on('tokens', async (newTokens) => {
    if (newTokens.access_token) {
      await saveTokens({
        provider: 'google',
        userId,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
        scope: newTokens.scope || tokens.scope,
      });
    }
  });

  return client;
}
