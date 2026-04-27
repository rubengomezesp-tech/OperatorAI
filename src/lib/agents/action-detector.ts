/**
 * Action Detector — Pure heuristic intent classification.
 */

const ES_GENERATION_TRIGGERS = [
  'genera', 'generar', 'créame', 'crea', 'crear',
  'lánzame', 'lanzar', 'lanzamiento',
  'haz', 'haceme', 'hazme',
  'necesito una campaña', 'necesito campaña',
  'necesito un anuncio', 'quiero una campaña', 'quiero campaña',
  'quiero un anuncio', 'quiero anuncios',
  'quiero promocionar', 'quiero promo',
  'campaña completa', 'anuncios para',
  'promo para', 'promoción para',
];

const EN_GENERATION_TRIGGERS = [
  'create a campaign', 'create ads', 'create an ad',
  'generate a campaign', 'generate ads', 'generate an ad',
  'launch a campaign', 'launch ads',
  'build a campaign', 'build ads',
  'i want a campaign', 'i need a campaign',
  'i need ads', 'i want ads',
  'make me a campaign', 'make ads for', 'make an ad',
  'i want to promote', 'i want to launch',
  'campaign for',
];

const STRATEGY_ONLY_INDICATORS = [
  'qué piensas', 'qué opinas', 'cuál es mejor',
  'qué hooks', 'ideas para', 'sugiéreme',
  'consejos', 'estrategia', 'cómo lo harías',
  'qué recomiendas',
  'what do you think', 'which is better',
  'what hooks', 'ideas for', 'suggest',
  'advice', 'strategy', 'how would you', 'recommend',
];

export function detectsCampaignGenerationIntent(text: string): boolean {
  if (!text || text.length < 10) return false;
  const lower = text.toLowerCase();

  const isStrategyOnly = STRATEGY_ONLY_INDICATORS.some((ind) => lower.includes(ind));
  if (isStrategyOnly) return false;

  const hasEsTrigger = ES_GENERATION_TRIGGERS.some((trig) => lower.includes(trig));
  const hasEnTrigger = EN_GENERATION_TRIGGERS.some((trig) => lower.includes(trig));

  return hasEsTrigger || hasEnTrigger;
}

export function detectLocale(text: string): 'en' | 'es' {
  if (!text) return 'en';
  const lower = text.toLowerCase();
  const spanishMarkers = [
    'á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡',
    'qué', 'cómo', 'dónde', 'cuándo',
    'porque', 'también', 'estoy', 'quiero',
    'necesito', 'gracias', 'hola',
  ];
  const matchCount = spanishMarkers.filter((m) => lower.includes(m)).length;
  return matchCount >= 2 ? 'es' : 'en';
}
