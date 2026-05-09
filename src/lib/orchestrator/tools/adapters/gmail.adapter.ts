/**
 * 📧 GMAIL ADAPTER — Leer + Enviar emails
 * 
 * Usa Gmail API oficial vía googleapis SDK.
 * Requiere OAuth previo (ver auth/oauth-google.ts).
 */

import { z } from 'zod';
import { google } from 'googleapis';
import { registerAdapter } from '../tools-registry';
import { withErrorHandling } from '../helpers/error-handler';
import { getAuthenticatedClient } from '../auth/oauth-google';
import type { AdapterDefinition } from '../types';

// ─── SEND EMAIL ──────────────────────────────────────────────────
const SendEmailInputSchema = z.object({
  to: z.string().email('Debe ser un email válido'),
  subject: z.string().min(1, 'El asunto no puede estar vacío'),
  body: z.string().min(1, 'El body no puede estar vacío'),
  is_html: z.boolean().default(false),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

interface SendEmailOutput {
  messageId: string;
  threadId: string;
  to: string;
  subject: string;
}

const sendEmailAdapter: AdapterDefinition<SendEmailInput, SendEmailOutput> = {
  name: 'send_email',
  description:
    'Envía un email vía Gmail. Requiere destinatario (to), asunto (subject) y body. Soporta HTML, CC y BCC. Úsalo cuando el usuario pide mandar info, confirmar, notificar, o seguir conversaciones por email.',
  inputSchema: SendEmailInputSchema,
  requiresConfirmation: true, // Acción destructiva → pedir confirmación
  isAvailable: () =>
    Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  execute: async (input, ctx) =>
    withErrorHandling(async () => {
      const userId = ctx.userId;
      if (!userId) throw new Error('userId requerido para enviar emails');

      const auth = await getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error(
          'Usuario no ha autorizado Gmail. Visita /api/auth/google para conectar.',
        );
      }

      const gmail = google.gmail({ version: 'v1', auth });

      // Construir email RFC 2822
      const headers = [
        `To: ${input.to}`,
        input.cc?.length ? `Cc: ${input.cc.join(', ')}` : '',
        input.bcc?.length ? `Bcc: ${input.bcc.join(', ')}` : '',
        `Subject: ${input.subject}`,
        'MIME-Version: 1.0',
        `Content-Type: ${input.is_html ? 'text/html' : 'text/plain'}; charset=utf-8`,
      ]
        .filter(Boolean)
        .join('\r\n');

      const rawMessage = `${headers}\r\n\r\n${input.body}`;
      const encoded = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encoded },
      });

      return {
        messageId: result.data.id || '',
        threadId: result.data.threadId || '',
        to: input.to,
        subject: input.subject,
      };
    }),
};

registerAdapter(sendEmailAdapter);

// ─── READ EMAILS ─────────────────────────────────────────────────
const ReadEmailsInputSchema = z.object({
  query: z.string().optional().default(''),
  max_results: z.number().int().min(1).max(20).default(5),
  unread_only: z.boolean().default(false),
});

type ReadEmailsInput = z.infer<typeof ReadEmailsInputSchema>;

interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

interface ReadEmailsOutput {
  emails: EmailSummary[];
  total: number;
}

const readEmailsAdapter: AdapterDefinition<ReadEmailsInput, ReadEmailsOutput> = {
  name: 'read_emails',
  description:
    'Lee emails recientes del inbox del usuario. Soporta query estilo Gmail (ej: "from:juan@x.com", "is:unread", "subject:invoice"). Devuelve top N emails con resumen.',
  inputSchema: ReadEmailsInputSchema,
  isAvailable: () =>
    Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  execute: async (input, ctx) =>
    withErrorHandling(async () => {
      const userId = ctx.userId;
      if (!userId) throw new Error('userId requerido para leer emails');

      const auth = await getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error(
          'Usuario no ha autorizado Gmail. Visita /api/auth/google para conectar.',
        );
      }

      const gmail = google.gmail({ version: 'v1', auth });
      const fullQuery = [
        input.query,
        input.unread_only ? 'is:unread' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const list = await gmail.users.messages.list({
        userId: 'me',
        q: fullQuery,
        maxResults: input.max_results,
      });

      const messages = list.data.messages || [];
      const emails: EmailSummary[] = [];

      for (const msg of messages) {
        if (!msg.id) continue;
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });
        const headers = detail.data.payload?.headers || [];
        const getHeader = (n: string) =>
          headers.find((h) => h.name?.toLowerCase() === n.toLowerCase())?.value || '';

        emails.push({
          id: detail.data.id || '',
          threadId: detail.data.threadId || '',
          from: getHeader('From'),
          subject: getHeader('Subject'),
          snippet: detail.data.snippet || '',
          date: getHeader('Date'),
          unread: (detail.data.labelIds || []).includes('UNREAD'),
        });
      }

      return {
        emails,
        total: emails.length,
      };
    }),
};

registerAdapter(readEmailsAdapter);

export { sendEmailAdapter, readEmailsAdapter };
