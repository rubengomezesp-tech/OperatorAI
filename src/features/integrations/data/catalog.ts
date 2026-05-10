/**
 * 🗂️ INTEGRATION CATALOG v3
 *
 * Cada provider mapea a:
 *   - composioName: identificador de toolkit en Composio
 *   - authConfigEnvVar: nombre de la env var que contiene el auth_config_id (ac_xxxxx)
 *
 * Para añadir un nuevo provider:
 *   1. Crear auth_config en https://app.composio.dev (dashboard)
 *   2. Añadir env var COMPOSIO_AUTH_CONFIG_XXX en .env.local + Vercel
 *   3. Añadir entry aquí con authConfigEnvVar correspondiente
 *   4. Añadir validación en src/lib/env.ts
 */

export interface IntegrationProvider {
  id: string;
  composioName: string;
  /** Nombre de env var con auth_config_id (ac_xxxxx). null = aún no configurado */
  authConfigEnvVar: string | null;
  name: string;
  tagline: string;
  description: string;
  category: 'productivity' | 'communication' | 'storage' | 'crm' | 'dev';
  scopes: string[];
  popularActions: string[];
  brandColor: string;
}

export const INTEGRATION_CATALOG: IntegrationProvider[] = [
  {
    id: 'gmail',
    composioName: 'gmail',
    authConfigEnvVar: 'COMPOSIO_AUTH_CONFIG_GMAIL',
    name: 'Gmail',
    tagline: 'Read, draft, send emails',
    description: 'Let Operator manage your inbox, draft replies in your voice, and search emails by intent.',
    category: 'communication',
    scopes: ['Read emails', 'Send drafts on your behalf', 'Search inbox'],
    popularActions: ['Draft reply to client', 'Summarize unread emails', 'Find email about [topic]'],
    brandColor: '#EA4335',
  },
  {
    id: 'gcal',
    composioName: 'googlecalendar',
    authConfigEnvVar: 'COMPOSIO_AUTH_CONFIG_GCAL',
    name: 'Google Calendar',
    tagline: 'Schedule, find time, brief on meetings',
    description: 'Operator can find slots, create events, and prepare you with context before each meeting.',
    category: 'productivity',
    scopes: ['View events', 'Create new events', 'Update existing events'],
    popularActions: ['Find time with [person]', 'Create event from email', 'Brief me on tomorrow'],
    brandColor: '#4285F4',
  },
  {
    id: 'gdrive',
    composioName: 'googledrive',
    authConfigEnvVar: 'COMPOSIO_AUTH_CONFIG_GDRIVE',
    name: 'Google Drive',
    tagline: 'Search files, get content',
    description: 'Search across your Drive and pull content into conversations as context.',
    category: 'storage',
    scopes: ['Search files', 'Read file content', 'List folders'],
    popularActions: ['Find the [project] brief', 'Summarize [doc]', 'Pull data from [sheet]'],
    brandColor: '#1FA463',
  },
  {
    id: 'notion',
    composioName: 'notion',
    authConfigEnvVar: null, // No auth config created yet
    name: 'Notion',
    tagline: 'Read, create, update pages',
    description: 'Operator works your second brain — drafts pages, queries databases, captures meeting notes.',
    category: 'productivity',
    scopes: ['Read pages', 'Create new pages', 'Update databases'],
    popularActions: ['Save this as a Notion page', 'Query [database]', 'Update project status'],
    brandColor: '#000000',
  },
  {
    id: 'slack',
    composioName: 'slack',
    authConfigEnvVar: 'COMPOSIO_AUTH_CONFIG_SLACK',
    name: 'Slack',
    tagline: 'Send messages, search channels',
    description: 'Drop messages in any channel, search history, summarize threads.',
    category: 'communication',
    scopes: ['Send messages', 'Search messages', 'List channels'],
    popularActions: ['Send to #marketing', 'Summarize #general today', 'Find messages about [topic]'],
    brandColor: '#4A154B',
  },
  {
    id: 'linear',
    composioName: 'linear',
    authConfigEnvVar: null,
    name: 'Linear',
    tagline: 'Track issues, create tickets',
    description: 'Spin up tickets from chat, query backlog, update issue status.',
    category: 'dev',
    scopes: ['Create issues', 'Update issues', 'Query workspace'],
    popularActions: ['Create issue for [bug]', 'Show my open tickets', 'Move [issue] to done'],
    brandColor: '#5E6AD2',
  },
];

export function findIntegration(id: string): IntegrationProvider | undefined {
  return INTEGRATION_CATALOG.find((p) => p.id === id);
}

/**
 * Returns the env var name containing auth_config_id for a provider.
 * null if not configured (provider can't be connected via OAuth yet).
 */
export function getAuthConfigIdForProvider(providerId: string): string | null {
  const provider = findIntegration(providerId);
  return provider?.authConfigEnvVar ?? null;
}

/**
 * Returns true if provider is ready for connection (has auth_config configured).
 */
export function isProviderConnectable(providerId: string): boolean {
  return getAuthConfigIdForProvider(providerId) !== null;
}
