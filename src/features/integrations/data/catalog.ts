export interface IntegrationProvider {
  id: string;
  composioName: string;
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
    name: 'Linear',
    tagline: 'Track issues, create tickets',
    description: 'Spin up tickets from chat, query backlog, update issue status.',
    category: 'dev',
    scopes: ['Create issues', 'Update issues', 'Query workspace'],
    popularActions: ['Create issue for [bug]', 'Show my open tickets', 'Move [issue] to done'],
    brandColor: '#5E6AD2',
  },
  {
    id: 'hubspot',
    composioName: 'hubspot',
    name: 'HubSpot',
    tagline: 'CRM contacts, deals, notes',
    description: 'Look up contacts, log activities, push notes from conversations into deals.',
    category: 'crm',
    scopes: ['Read contacts', 'Create notes', 'Update deals'],
    popularActions: ['Find contact [name]', 'Log this call', 'Update deal stage'],
    brandColor: '#FF7A59',
  },
  {
    id: 'github',
    composioName: 'github',
    name: 'GitHub',
    tagline: 'Issues, PRs, code search',
    description: 'Reference repos, create issues, summarize PRs, search code across your projects.',
    category: 'dev',
    scopes: ['Read repos', 'Create issues', 'Comment on PRs'],
    popularActions: ['Search code in [repo]', 'Create issue for [bug]', 'Summarize PR #123'],
    brandColor: '#181717',
  },
];

export function findIntegration(id: string): IntegrationProvider | undefined {
  return INTEGRATION_CATALOG.find((p) => p.id === id);
}
