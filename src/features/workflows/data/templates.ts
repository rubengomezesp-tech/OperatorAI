export interface WorkflowStep {
  id: string;
  type: 'ai_chat' | 'send_email' | 'send_slack' | 'create_doc' | 'web_search' | 'generate_image' | 'transform' | 'condition';
  label: string;
  config: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'sales' | 'ops' | 'research';
  triggerType: 'manual' | 'schedule' | 'webhook' | 'email_received';
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStep[];
  premium?: boolean;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'daily-content-brief',
    name: 'Daily content brief',
    description: 'Every morning at 9am, generate today\u2019s content ideas based on your brand voice and trending topics.',
    icon: 'Sparkles',
    category: 'content',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 9 * * *', timezone: 'Europe/Madrid' },
    steps: [
      {
        id: 's1', type: 'web_search', label: 'Search trending topics',
        config: { query: 'trending marketing today', count: 5 },
      },
      {
        id: 's2', type: 'ai_chat', label: 'Generate 5 post ideas',
        config: {
          agent: 'creative',
          prompt: 'Based on the trending topics above, generate 5 social media post ideas for our brand. Match our voice and target audience. Format: numbered list with hook + body.',
        },
      },
      {
        id: 's3', type: 'send_email', label: 'Email digest to me',
        config: { to: 'self', subject: 'Today\u2019s content brief' },
      },
    ],
  },
  {
    id: 'lead-qualification',
    name: 'Lead qualifier',
    description: 'When a new email arrives from a potential client, classify it and draft a response in your voice.',
    icon: 'UserCheck',
    category: 'sales',
    triggerType: 'email_received',
    triggerConfig: { from_filter: '*' },
    steps: [
      {
        id: 's1', type: 'ai_chat', label: 'Classify lead quality',
        config: {
          agent: 'analyst',
          prompt: 'Classify this email: hot lead / warm lead / cold lead / spam. Return ONLY one word.',
        },
      },
      {
        id: 's2', type: 'condition', label: 'If hot or warm',
        config: { if: 'output_is_hot_or_warm' },
      },
      {
        id: 's3', type: 'ai_chat', label: 'Draft personalized reply',
        config: {
          agent: 'copy',
          prompt: 'Draft a warm, personalized reply in our brand voice. Ask 2 qualifying questions. Keep under 100 words.',
        },
      },
    ],
  },
  {
    id: 'weekly-competitor-watch',
    name: 'Weekly competitor watch',
    description: 'Every Monday, research 3 named competitors—what they posted, what they launched, what changed on their site.',
    icon: 'Radar',
    category: 'research',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 8 * * 1', timezone: 'Europe/Madrid' },
    steps: [
      {
        id: 's1', type: 'web_search', label: 'Search competitor 1',
        config: { query: '{{competitor_1}} latest news this week' },
      },
      {
        id: 's2', type: 'web_search', label: 'Search competitor 2',
        config: { query: '{{competitor_2}} latest news this week' },
      },
      {
        id: 's3', type: 'web_search', label: 'Search competitor 3',
        config: { query: '{{competitor_3}} latest news this week' },
      },
      {
        id: 's4', type: 'ai_chat', label: 'Synthesize into report',
        config: {
          agent: 'research',
          prompt: 'Based on the search results above, write a tactical 200-word weekly competitor report. Format: 3 sections (one per competitor), each with: what they did, why it matters, recommended response.',
        },
      },
      {
        id: 's5', type: 'send_email', label: 'Email me the report',
        config: { to: 'self', subject: 'Weekly competitor watch' },
      },
    ],
  },
  {
    id: 'instagram-caption-batch',
    name: 'Instagram caption batch',
    description: 'Generate 7 Instagram captions for the week from a theme. Branded voice. Hashtags included.',
    icon: 'Hash',
    category: 'content',
    triggerType: 'manual',
    triggerConfig: {},
    steps: [
      {
        id: 's1', type: 'ai_chat', label: 'Generate 7 captions',
        config: {
          agent: 'social',
          prompt: 'Theme: {{theme}}. Generate 7 distinct Instagram captions in our brand voice. Each: hook + body + 5-7 niche hashtags. Format: Day 1, Day 2, etc.',
        },
      },
      {
        id: 's2', type: 'create_doc', label: 'Save to Drive',
        config: { filename: 'IG captions {{date}}', folder: 'content' },
      },
    ],
  },
  {
    id: 'meeting-prep',
    name: 'Meeting prep brief',
    description: 'Before any meeting, get a one-page brief on the person and company you\u2019re meeting with.',
    icon: 'Briefcase',
    category: 'ops',
    triggerType: 'manual',
    triggerConfig: {},
    steps: [
      {
        id: 's1', type: 'web_search', label: 'Research person',
        config: { query: '{{person_name}} {{company_name}}' },
      },
      {
        id: 's2', type: 'web_search', label: 'Research company',
        config: { query: '{{company_name}} latest news funding' },
      },
      {
        id: 's3', type: 'ai_chat', label: 'Synthesize 1-pager',
        config: {
          agent: 'research',
          prompt: 'Build a tactical 1-page meeting brief: who they are, recent moves, 3 talking points, 3 smart questions to ask. 250 words max.',
        },
      },
    ],
  },
];

export const TRIGGER_TYPES = [
  { id: 'manual', label: 'Manual', description: 'You run it on demand', icon: 'Play' },
  { id: 'schedule', label: 'Schedule', description: 'Runs on a recurring schedule', icon: 'Clock' },
  { id: 'webhook', label: 'Webhook', description: 'External event triggers it', icon: 'Webhook' },
  { id: 'email_received', label: 'Email received', description: 'A new email matches the filter', icon: 'Mail' },
] as const;

export const STEP_TYPES = [
  { id: 'ai_chat', label: 'AI agent task', icon: 'Sparkles', color: 'gold' },
  { id: 'web_search', label: 'Web search', icon: 'Search', color: 'blue' },
  { id: 'send_email', label: 'Send email', icon: 'Mail', color: 'red' },
  { id: 'send_slack', label: 'Send Slack message', icon: 'MessageSquare', color: 'purple' },
  { id: 'create_doc', label: 'Create document', icon: 'FileText', color: 'green' },
  { id: 'generate_image', label: 'Generate image', icon: 'ImageIcon', color: 'pink' },
  { id: 'condition', label: 'Condition (if/else)', icon: 'GitBranch', color: 'gray' },
  { id: 'transform', label: 'Transform data', icon: 'Wand2', color: 'cyan' },
] as const;
