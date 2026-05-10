/**
 * 🔌 COMPOSIO INTEGRATION TOOLS
 *
 * Genera dinámicamente tool specs según las integrations
 * que el user tiene conectadas (status='connected' en BD).
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeTool as composioExecuteTool } from '@/features/integrations/server/composio-client';

interface IntegrationToolDef {
  name: string;
  composioSlug: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// ═══ GMAIL ═══
const GMAIL_TOOLS: IntegrationToolDef[] = [
  {
    name: 'gmail_send_email',
    composioSlug: 'GMAIL_SEND_EMAIL',
    description: 'Send an email through user\'s connected Gmail. Use when user explicitly asks to send/draft/email someone, or after user confirms a previously offered email. ALWAYS confirm with user before sending unless they explicitly authorized auto-send.',
    input_schema: {
      type: 'object',
      properties: {
        recipient_email: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body (plain text or HTML)' },
        is_html: { type: 'boolean', description: 'Whether body is HTML formatted. Default false.' },
        cc: { type: 'array', items: { type: 'string' }, description: 'Optional CC recipients' },
        bcc: { type: 'array', items: { type: 'string' }, description: 'Optional BCC recipients' },
      },
      required: ['recipient_email', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_search_emails',
    composioSlug: 'GMAIL_FETCH_EMAILS',
    description: 'Search and fetch emails from user\'s Gmail. Use to find emails about a topic, from a sender, or with specific keywords. Read-only.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gmail search query (e.g., "from:client@example.com", "subject:invoice", "has:attachment newer_than:7d")' },
        max_results: { type: 'number', description: 'Max emails to return (default 10, max 50)' },
      },
      required: ['query'],
    },
  },
];

// ═══ GOOGLE CALENDAR ═══
const GCAL_TOOLS: IntegrationToolDef[] = [
  {
    name: 'gcal_create_event',
    composioSlug: 'GOOGLECALENDAR_CREATE_EVENT',
    description: 'Create a calendar event in user\'s Google Calendar. Use proactively when user mentions meetings, deadlines, calls, or commitments with dates/times. Always confirm details before creating.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Event title (concise, action-oriented)' },
        description: { type: 'string', description: 'Event description/notes/agenda' },
        start_datetime: { type: 'string', description: 'Start in ISO 8601 (e.g., 2026-05-15T14:00:00)' },
        end_datetime: { type: 'string', description: 'End in ISO 8601' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Optional attendee emails' },
        location: { type: 'string', description: 'Optional location or video link' },
      },
      required: ['summary', 'start_datetime', 'end_datetime'],
    },
  },
  {
    name: 'gcal_list_events',
    composioSlug: 'GOOGLECALENDAR_FIND_EVENT',
    description: 'List upcoming events from user\'s Google Calendar. Use to brief on agenda, find conflicts, see schedule before suggesting meeting times.',
    input_schema: {
      type: 'object',
      properties: {
        time_min: { type: 'string', description: 'Start ISO 8601 (default now)' },
        time_max: { type: 'string', description: 'End ISO 8601 (default 7 days from now)' },
        max_results: { type: 'number', description: 'Max events (default 10)' },
      },
    },
  },
];

// ═══ GOOGLE DRIVE ═══
const GDRIVE_TOOLS: IntegrationToolDef[] = [
  {
    name: 'gdrive_search_files',
    composioSlug: 'GOOGLEDRIVE_FIND_FILE',
    description: 'Search files in user\'s Google Drive. Use when user asks to find a document, brief, deck, sheet, or reference material.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (filename or content keywords)' },
        max_results: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
];

// ═══ SLACK ═══
const SLACK_TOOLS: IntegrationToolDef[] = [
  {
    name: 'slack_send_message',
    composioSlug: 'SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL',
    description: 'Send a message to a Slack channel. Use when user asks to post in #channel, notify team, or share an update via Slack. Always confirm before sending.',
    input_schema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name (e.g., #general) or channel ID' },
        text: { type: 'string', description: 'Message text (Slack markdown supported)' },
      },
      required: ['channel', 'text'],
    },
  },
];

const PROVIDER_TOOLS: Record<string, IntegrationToolDef[]> = {
  gmail: GMAIL_TOOLS,
  gcal: GCAL_TOOLS,
  gdrive: GDRIVE_TOOLS,
  slack: SLACK_TOOLS,
};

const TOOL_NAME_INDEX = new Map<string, { composioSlug: string; provider: string }>();
for (const [provider, tools] of Object.entries(PROVIDER_TOOLS)) {
  for (const t of tools) {
    TOOL_NAME_INDEX.set(t.name, { composioSlug: t.composioSlug, provider });
  }
}

export interface IntegrationToolSpec {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * Returns tool specs for all providers user has CONNECTED.
 */
export async function getIntegrationToolSpecs(
  svc: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<IntegrationToolSpec[]> {
  const { data: rows } = await svc
    .from('integrations')
    .select('provider, status')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('status', 'connected');

  if (!rows || rows.length === 0) return [];

  const connectedProviders = new Set(
    (rows as Array<{ provider: string }>).map((r) => r.provider),
  );

  const specs: IntegrationToolSpec[] = [];
  for (const provider of connectedProviders) {
    const tools = PROVIDER_TOOLS[provider];
    if (!tools) continue;
    for (const t of tools) {
      specs.push({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      });
    }
  }

  return specs;
}

/**
 * Returns true if the given tool name is a Composio integration tool.
 */
export function isIntegrationTool(toolName: string): boolean {
  return TOOL_NAME_INDEX.has(toolName);
}

/**
 * List of providers user has connected (e.g., ['gmail', 'gcal']).
 */
export async function getConnectedProviders(
  svc: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<string[]> {
  const { data: rows } = await svc
    .from('integrations')
    .select('provider')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('status', 'connected');

  if (!rows) return [];
  return (rows as Array<{ provider: string }>).map((r) => r.provider);
}

/**
 * Execute an integration tool through Composio.
 */
export async function executeIntegrationTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: { orgId: string; userId: string; svc: SupabaseClient },
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const meta = TOOL_NAME_INDEX.get(toolName);
  if (!meta) {
    return { ok: false, error: `Unknown integration tool: ${toolName}` };
  }

  const { data: integ } = await ctx.svc
    .from('integrations')
    .select('composio_entity_id, status')
    .eq('org_id', ctx.orgId)
    .eq('user_id', ctx.userId)
    .eq('provider', meta.provider)
    .maybeSingle();

  const row = integ as { composio_entity_id: string | null; status: string } | null;
  if (!row || row.status !== 'connected' || !row.composio_entity_id) {
    return {
      ok: false,
      error: `${meta.provider} is not connected. Ask user to connect it in /settings/integrations.`,
    };
  }

  try {
    const result = await composioExecuteTool({
      userId: row.composio_entity_id,
      toolSlug: meta.composioSlug,
      input,
    });

    if (!result.successful) {
      return { ok: false, error: result.error ?? 'Tool execution failed' };
    }

    // Track last_used_at (fire-and-forget)
    void ctx.svc
      .from('integrations')
      .update({ last_used_at: new Date().toISOString() } as never)
      .eq('org_id', ctx.orgId)
      .eq('user_id', ctx.userId)
      .eq('provider', meta.provider);

    return { ok: true, result: result.data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Composio tool execution failed',
    };
  }
}
