export interface WorkflowStep {
  id: string;
  type: 'ai_chat' | 'send_email' | 'send_slack' | 'create_doc' | 'web_search' | 'generate_image' | 'transform' | 'condition';
  label: string;
  labelEs?: string;
  config: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
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
    nameEs: 'Briefing diario de contenido',
    description: 'Every morning at 9am, generate today\u2019s content ideas based on your brand voice and trending topics.',
    descriptionEs: 'Cada ma\u00f1ana a las 9, genera ideas de contenido basadas en tu voz de marca y tendencias.',
    icon: 'Sparkles',
    category: 'content',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 9 * * *', timezone: 'Europe/Madrid' },
    steps: [
      { id: 's1', type: 'web_search', label: 'Search trending topics', labelEs: 'Buscar tendencias', config: { query: 'trending marketing today', count: 5 } },
      { id: 's2', type: 'ai_chat', label: 'Generate 5 post ideas', labelEs: 'Generar 5 ideas de posts', config: { agent: 'creative', prompt: 'Based on the trending topics above, generate 5 social media post ideas for our brand. Match our voice and target audience.' } },
      { id: 's3', type: 'send_email', label: 'Email digest to me', labelEs: 'Enviarme el resumen por email', config: { to: 'self', subject: 'Daily content brief' } },
    ],
  },
  {
    id: 'lead-qualification',
    name: 'Lead qualifier',
    nameEs: 'Clasificador de leads',
    description: 'When a new email arrives from a potential client, classify it and draft a response in your voice.',
    descriptionEs: 'Cuando llega un email de un posible cliente, lo clasifica y redacta una respuesta con tu voz de marca.',
    icon: 'UserCheck',
    category: 'sales',
    triggerType: 'email_received',
    triggerConfig: { from_filter: '*' },
    steps: [
      { id: 's1', type: 'ai_chat', label: 'Classify lead quality', labelEs: 'Clasificar calidad del lead', config: { agent: 'analyst', prompt: 'Classify this email: hot lead / warm lead / cold lead / spam.' } },
      { id: 's2', type: 'condition', label: 'If hot or warm', labelEs: 'Si es caliente o tibio', config: { if: 'output_is_hot_or_warm' } },
      { id: 's3', type: 'ai_chat', label: 'Draft personalized reply', labelEs: 'Redactar respuesta personalizada', config: { agent: 'copy', prompt: 'Draft a warm, personalized reply in our brand voice. Ask 2 qualifying questions.' } },
    ],
  },
  {
    id: 'weekly-competitor-watch',
    name: 'Weekly competitor watch',
    nameEs: 'Vigilancia semanal de competencia',
    description: 'Every Monday, research 3 named competitors\u2014what they posted, launched, and changed.',
    descriptionEs: 'Cada lunes, investiga 3 competidores: qu\u00e9 publicaron, lanzaron y cambiaron.',
    icon: 'Radar',
    category: 'research',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 8 * * 1', timezone: 'Europe/Madrid' },
    steps: [
      { id: 's1', type: 'web_search', label: 'Search competitor 1', labelEs: 'Buscar competidor 1', config: { query: '{{competitor_1}} latest news' } },
      { id: 's2', type: 'web_search', label: 'Search competitor 2', labelEs: 'Buscar competidor 2', config: { query: '{{competitor_2}} latest news' } },
      { id: 's3', type: 'web_search', label: 'Search competitor 3', labelEs: 'Buscar competidor 3', config: { query: '{{competitor_3}} latest news' } },
      { id: 's4', type: 'ai_chat', label: 'Synthesize into report', labelEs: 'Sintetizar en informe', config: { agent: 'research', prompt: 'Write a 200-word weekly competitor report with 3 sections.' } },
      { id: 's5', type: 'send_email', label: 'Email me the report', labelEs: 'Enviarme el informe', config: { to: 'self', subject: 'Weekly competitor watch' } },
    ],
  },
  {
    id: 'instagram-caption-batch',
    name: 'Instagram caption batch',
    nameEs: 'Lote de captions para Instagram',
    description: 'Generate 7 Instagram captions for the week from a theme. Branded voice. Hashtags included.',
    descriptionEs: 'Genera 7 captions de Instagram para la semana. Con tu voz de marca y hashtags.',
    icon: 'Hash',
    category: 'content',
    triggerType: 'manual',
    triggerConfig: {},
    steps: [
      { id: 's1', type: 'ai_chat', label: 'Generate 7 captions', labelEs: 'Generar 7 captions', config: { agent: 'social', prompt: 'Theme: {{theme}}. Generate 7 Instagram captions with hooks and hashtags.' } },
      { id: 's2', type: 'create_doc', label: 'Save to Drive', labelEs: 'Guardar en Drive', config: { filename: 'IG captions {{date}}', folder: 'content' } },
    ],
  },
  {
    id: 'meeting-prep',
    name: 'Meeting prep brief',
    nameEs: 'Briefing pre-reuni\u00f3n',
    description: 'Before any meeting, get a one-page brief on the person and company you\u2019re meeting with.',
    descriptionEs: 'Antes de cualquier reuni\u00f3n, obt\u00e9n un briefing de la persona y empresa con la que te re\u00fanes.',
    icon: 'Briefcase',
    category: 'ops',
    triggerType: 'manual',
    triggerConfig: {},
    steps: [
      { id: 's1', type: 'web_search', label: 'Research person', labelEs: 'Investigar persona', config: { query: '{{person_name}} {{company_name}}' } },
      { id: 's2', type: 'web_search', label: 'Research company', labelEs: 'Investigar empresa', config: { query: '{{company_name}} latest news funding' } },
      { id: 's3', type: 'ai_chat', label: 'Synthesize 1-pager', labelEs: 'Crear resumen de 1 p\u00e1gina', config: { agent: 'research', prompt: 'Build a tactical 1-page meeting brief with talking points and smart questions.' } },
    ],
  },
];

export const TRIGGER_TYPES = [
  { id: 'manual', label: 'Manual', labelEs: 'Manual', description: 'You run it on demand', descriptionEs: 'Lo ejecutas cuando quieras', icon: 'Play' },
  { id: 'schedule', label: 'Schedule', labelEs: 'Programado', description: 'Runs on a recurring schedule', descriptionEs: 'Se ejecuta de forma recurrente', icon: 'Clock' },
  { id: 'webhook', label: 'Webhook', labelEs: 'Webhook', description: 'External event triggers it', descriptionEs: 'Un evento externo lo activa', icon: 'Webhook' },
  { id: 'email_received', label: 'Email received', labelEs: 'Email recibido', description: 'A new email matches the filter', descriptionEs: 'Un nuevo email coincide con el filtro', icon: 'Mail' },
] as const;

export const STEP_TYPES = [
  { id: 'ai_chat', label: 'AI agent task', labelEs: 'Tarea de agente IA', icon: 'Sparkles', color: 'gold' },
  { id: 'web_search', label: 'Web search', labelEs: 'B\u00fasqueda web', icon: 'Search', color: 'blue' },
  { id: 'send_email', label: 'Send email', labelEs: 'Enviar email', icon: 'Mail', color: 'red' },
  { id: 'send_slack', label: 'Send Slack message', labelEs: 'Enviar mensaje Slack', icon: 'MessageSquare', color: 'purple' },
  { id: 'create_doc', label: 'Create document', labelEs: 'Crear documento', icon: 'FileText', color: 'green' },
  { id: 'generate_image', label: 'Generate image', labelEs: 'Generar imagen', icon: 'ImageIcon', color: 'pink' },
  { id: 'condition', label: 'Condition (if/else)', labelEs: 'Condici\u00f3n (si/sino)', icon: 'GitBranch', color: 'gray' },
  { id: 'transform', label: 'Transform data', labelEs: 'Transformar datos', icon: 'Wand2', color: 'cyan' },
] as const;
