/**
 * 📧 EMAIL CLIENT — Resend
 *
 * Cliente unificado para emails transaccionales.
 * Lazy init + manejo de errores + logging.
 */

import 'server-only';
import { Resend } from 'resend';

let _client: Resend | null = null;

function getClient(): Resend | null {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — emails disabled');
    return null;
  }
  _client = new Resend(apiKey);
  return _client;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send a transactional email.
 * Best-effort: returns ok:false if Resend not configured.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: `Operator AI <${FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[email] send failed:', msg);
    return { ok: false, error: msg };
  }
}
