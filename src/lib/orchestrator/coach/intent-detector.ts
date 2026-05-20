/**
 * Coach Orchestrator — Intent Detector
 *
 * Clasifica el mensaje del usuario en uno de los Intents conocidos ANTES
 * de invocar el flujo principal del coach.
 *
 * Por qué existe:
 *   Un modelo 14B fine-tuned acierta mucho más cuando el prompt es pequeño y
 *   enfocado. Si le metemos las 6 tools en el contexto siempre, a veces
 *   inventa o se confunde. Si primero clasificamos el intent y solo después
 *   le inyectamos las tools relevantes (o ninguna), la precisión sube
 *   drásticamente.
 *
 * Estrategia:
 *   1. Clasificación heurística rápida (regex + keywords) → si matchea con
 *      alta confianza, devolvemos ya. 0ms, 0 tokens.
 *   2. Fallback al modelo: prompt minimalista que pide UN intent en JSON.
 *      Temperature 0.1, max_tokens 200. Latencia ~300-800ms.
 *
 * El detector es DETERMINISTA en los casos obvios y delega al modelo solo
 * cuando hay verdadera ambigüedad.
 */

import { COACH_CONFIG, type Intent, type IntentDetection } from './types';
import {
  getOperatorCoachConfig,
  getOperatorCoachHeaders,
} from '@/lib/operator/coach-endpoint';

/* -------------------------------------------------------------------------- */
/*  HEURÍSTICAS DETERMINISTAS                                                  */
/* -------------------------------------------------------------------------- */

const RX_SMALL_TALK = /^(hola|hey|hi|holi|buenas|buen[oa]s?\s+d[íi]as|buen[oa]s?\s+tardes|buen[oa]s?\s+noches|qu[eé]\s+tal|qu[eé]\s+pasa|c[oó]mo\s+(est[áa]s|andas|vas)|saludos|wassup|sup|yo|brother|bro|rey|t[íi]o)(\s+(brother|bro|rey|t[íi]o|colega|amig[oa]|hermano))?[\s.,!?¿¡]*$/i;
const RX_THANKS = /^(gracias|thanks|thank you|mil gracias|muchas gracias|thx|ty)\b[\s.,!?¿¡]*$/i;

const RX_AD_INTENT = /\b(an[uú]nci[oa]s?|publicidad|publicitari[oa]s?|advertisement|ad|ads|campa[ñn]a|spot|cre[áa]tividad|copy|reels?|tiktoks?|stor(?:y|ies))\b/i;
const RX_AD_VERBS = /\b(crea(?:me)?|hacer?|h[áa]z(?:me)?|gen[ée]rame|gen[ée]rame?|dise[ñn]ar?|dise[ñn][áa]me|prepara(?:me)?|monta(?:me)?|saca(?:me)?|construye(?:me)?|construye)\b/i;

const RX_IMAGE_INTENT = /\b(imagen|image|imagenes|im[áa]genes|foto(?:graf[íi]a)?|render|ilustraci[óo]n|illustration|picture|pic|wallpaper|fondo|background)\b/i;
const RX_IMAGE_EDIT = /\b(edit(?:a|ar|al?o)?|modifica(?:r|lo|la)?|cambia(?:r|le|lo|la)?|transform(?:a|ar)?|retoca(?:r)?|corregir|ajustar?|mejorar?|update|fix)\b/i;

const RX_VIDEO_INTENT = /\b(v[íi]deos?|video|clip|animaci[óo]n|animation|reel(?:\s|s)|spot\s+v[íi]deo|filmaci[óo]n)\b/i;

const RX_KNOWLEDGE = /\b(documento|documentos|pdf|pdfs|knowledge|conocimiento|seg[úu]n (mis|mi|los)|en (mis|mi|los) (documentos|archivos|pdf|pdfs)|busca en|search in|qu[eé] dec[íi]a|qu[eé] dice (mi|el))\b/i;

const RX_FILE_ANALYSIS = /\b(analiz(?:a|ar|al?o|el?o|alos)|an[áa]lisis|csv|excel|hoja de c[áa]lculo|spreadsheet|datos del archivo)\b/i;

const RX_CODING_TASK = /\b(repo|repositorio|github|gitup|commit|branch|pull\s*request|pr\b|c[oó]digo|codebase|terminal|consola|codex|build|deploy|vercel|typescript|eslint|test|tests|bug|error|stacktrace|runtime|archivo|fichero|carpeta|src\/|package\.json|supabase|sql|migraci[oó]n)\b/i;
const RX_CODING_VERB = /\b(conecta(?:rte)?|conectar|revisa(?:r)?|mir(?:a|ar)|inspecciona(?:r)?|analiza(?:r)?|arregla(?:r)?|fix|corrige(?:r)?|implementa(?:r)?|edita(?:r)?|lee(?:r)?|busca(?:r)?|ejecuta(?:r)?|corre(?:r)?|deploy(?:ar)?|sube(?:r)?|commitea(?:r)?)\b/i;

const RX_BRAND_QUERY = /\b(mi marca|mi brand|mi logo|mi paleta|mis colores|mi tipograf[íi]a|brand[\s-]?os|brand assets|qu[eé] colores tengo|c[uó]m(?:o|al)? es mi marca)\b/i;

const RX_META = /\b(qu[eé] eres|qui[eé]n eres|qu[eé] (puedes|sabes) hacer|para qu[eé] sirves|c[óo]mo te llamas|cu[áa]les son tus (capacidades|habilidades|funciones)|operator\s?ai|c[óo]mo funcionas)\b/i;

const RX_BUSINESS_ADVICE = /\b(c[óo]mo (vender|conseguir|aumentar|escalar|crecer|monetizar)|estrategia|consejo|recomendaci[óo]n|qu[eé] piensas|qu[eé] opinas|c[óo]mo enfoc(?:ar|o)|qu[eé] (deber[íi]a|tengo que) hacer|c[óo]mo cierro|objeci[óo]n|cierre)\b/i;

/**
 * Heurística determinista. Devuelve null si no hay match claro.
 */
function detectByHeuristics(message: string): IntentDetection | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  // Mensajes muy cortos sin contenido útil → small talk
  if (trimmed.length < 20 && (RX_SMALL_TALK.test(trimmed) || RX_THANKS.test(trimmed))) {
    return {
      intent: 'small_talk',
      confidence: 0.98,
      reasoning: 'Mensaje corto identificado como saludo/agradecimiento',
    };
  }

  // META — pregunta sobre el agente mismo
  if (RX_META.test(trimmed)) {
    return {
      intent: 'meta',
      confidence: 0.92,
      reasoning: 'Pregunta sobre OperatorAI / capacidades del agente',
    };
  }

  const hasAdIntent = RX_AD_INTENT.test(trimmed);
  const hasImageIntent = RX_IMAGE_INTENT.test(trimmed);
  const hasVideoIntent = RX_VIDEO_INTENT.test(trimmed);
  const hasVerb = RX_AD_VERBS.test(trimmed);
  const hasEdit = RX_IMAGE_EDIT.test(trimmed);

  // CODING_TASK — repo/código/terminal
  if (RX_CODING_TASK.test(trimmed) && (RX_CODING_VERB.test(trimmed) || /\b(repo|github|codex|terminal)\b/i.test(trimmed))) {
    return {
      intent: 'coding_task',
      confidence: 0.93,
      reasoning: 'Detectada petición sobre repo/código/terminal',
    };
  }

  // CREATE_AD — anuncio finalizado (tiene prioridad sobre image cuando hay verbos)
  if (hasAdIntent && hasVerb) {
    return {
      intent: 'create_ad',
      confidence: 0.95,
      reasoning: 'Detectada intención de crear anuncio publicitario',
    };
  }

  // VIDEO — generar vídeo
  if (hasVideoIntent && hasVerb) {
    return {
      intent: 'video',
      confidence: 0.93,
      reasoning: 'Detectada intención de generar vídeo',
    };
  }

  // IMAGE_EDIT — editar imagen existente
  if (hasImageIntent && hasEdit) {
    return {
      intent: 'image_edit',
      confidence: 0.9,
      reasoning: 'Detectada intención de editar imagen',
    };
  }

  // IMAGE_ONLY — generar imagen sin texto/CTA
  if (hasImageIntent && hasVerb && !hasAdIntent) {
    return {
      intent: 'image_only',
      confidence: 0.88,
      reasoning: 'Detectada intención de generar imagen pura',
    };
  }

  // FILE_ANALYSIS
  if (RX_FILE_ANALYSIS.test(trimmed)) {
    return {
      intent: 'file_analysis',
      confidence: 0.85,
      reasoning: 'Detectada intención de analizar archivo de datos',
    };
  }

  // KNOWLEDGE_QUERY
  if (RX_KNOWLEDGE.test(trimmed)) {
    return {
      intent: 'knowledge_query',
      confidence: 0.85,
      reasoning: 'Detectada referencia a documentos del usuario',
    };
  }

  // BRAND_QUERY
  if (RX_BRAND_QUERY.test(trimmed)) {
    return {
      intent: 'brand_query',
      confidence: 0.85,
      reasoning: 'Detectada pregunta sobre la marca del usuario',
    };
  }

  // BUSINESS_ADVICE — preguntas sobre estrategia/negocio
  if (RX_BUSINESS_ADVICE.test(trimmed)) {
    return {
      intent: 'business_advice',
      confidence: 0.8,
      reasoning: 'Detectada pregunta de consejo de negocio/marketing',
    };
  }

  // Sin match claro → delegamos al modelo
  return null;
}

/* -------------------------------------------------------------------------- */
/*  FALLBACK AL MODELO (cuando heurísticas no deciden)                        */
/* -------------------------------------------------------------------------- */

const INTENT_CLASSIFIER_PROMPT = `Eres un clasificador de intenciones para OperatorAI. Tu única tarea: leer el mensaje del usuario y devolver UN JSON con el intent que mejor lo describe. Nada más.

Intents posibles (elige UNO):
- small_talk: saludo, conversación trivial, agradecimiento
- business_advice: pregunta sobre negocio, marketing, mentalidad, estrategia (sin pedir nada ejecutable)
- create_ad: pide crear anuncio/publicidad/ad/campaña terminada
- image_only: pide generar foto, imagen, ilustración o render SIN texto/CTA
- image_edit: pide editar/modificar una imagen existente o adjuntada
- video: pide generar vídeo, clip o animación
- knowledge_query: pregunta sobre documentos/PDFs subidos por el usuario
- file_analysis: pide analizar datos de un archivo CSV/Excel/JSON
- coding_task: pide revisar, conectar, arreglar, analizar o ejecutar algo en un repo/código/GitHub/terminal
- brand_query: pregunta sobre su marca, logo, colores, tipografía
- meta: pregunta qué eres, qué puedes hacer, capacidades de OperatorAI
- ambiguous: imposible de determinar — necesita aclaración

Devuelve EXACTAMENTE este JSON, sin texto adicional:
{"intent":"<uno_de_arriba>","confidence":<0.0-1.0>,"reasoning":"<una frase corta>","clarification":"<si ambiguous, pregunta concreta para resolver>"}

Si NO es ambiguous, omite el campo "clarification".`;

interface ClassifierResponse {
  intent: Intent;
  confidence: number;
  reasoning: string;
  clarification?: string;
}

async function detectByModel(message: string, signal?: AbortSignal): Promise<IntentDetection> {
  const config = getOperatorCoachConfig();
  const res = await fetch(`${config.url}/v1/chat/completions`, {
    method: 'POST',
    headers: getOperatorCoachHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: INTENT_CLASSIFIER_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: COACH_CONFIG.intentTemperature,
      max_tokens: COACH_CONFIG.intentMaxTokens,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    // Si el clasificador falla, devolvemos ambiguous con bajo confidence
    return {
      intent: 'ambiguous',
      confidence: 0.3,
      reasoning: `Classifier HTTP ${res.status} — fallback to ambiguous`,
      suggestedClarification: '¿Puedes contarme un poco más qué quieres conseguir?',
    };
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  const parsed = parseClassifierJson(content);
  if (!parsed) {
    return {
      intent: 'ambiguous',
      confidence: 0.4,
      reasoning: 'Classifier devolvió JSON inválido',
      suggestedClarification: '¿Puedes ser un poco más concreto sobre qué necesitas?',
    };
  }

  return {
    intent: parsed.intent,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    suggestedClarification: parsed.clarification,
  };
}

function parseClassifierJson(raw: string): ClassifierResponse | null {
  const text = raw.trim();
  // Intentar parsear directamente
  try {
    const parsed = JSON.parse(text);
    if (isValidClassifierResponse(parsed)) return parsed;
  } catch {
    /* fallthrough */
  }
  // Extraer el primer bloque JSON que veamos
  const match = text.match(/\{[\s\S]*?\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (isValidClassifierResponse(parsed)) return parsed;
    } catch {
      /* fallthrough */
    }
  }
  return null;
}

const VALID_INTENTS: ReadonlySet<Intent> = new Set([
  'small_talk',
  'business_advice',
  'create_ad',
  'image_only',
  'image_edit',
  'video',
  'knowledge_query',
  'file_analysis',
  'brand_query',
  'meta',
  'ambiguous',
]);

function isValidClassifierResponse(obj: unknown): obj is ClassifierResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.intent === 'string' &&
    VALID_INTENTS.has(o.intent as Intent) &&
    typeof o.confidence === 'number' &&
    typeof o.reasoning === 'string'
  );
}

/* -------------------------------------------------------------------------- */
/*  API PÚBLICA                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Detecta el intent del mensaje del usuario.
 *
 * Estrategia:
 *   1. Heurística determinista (regex). Si match con alta confidence → return.
 *   2. Fallback al modelo (prompt minimalista, ~300-800ms).
 */
export async function detectIntent(
  message: string,
  signal?: AbortSignal,
): Promise<IntentDetection> {
  const heuristic = detectByHeuristics(message);
  if (heuristic && heuristic.confidence >= 0.85) {
    return heuristic;
  }

  // Si la heurística dio algo pero con poca confianza, igual delegamos al modelo
  // para confirmar/refinar
  try {
    return await detectByModel(message, signal);
  } catch (e) {
    // Si el modelo falla (por ejemplo coach offline), devolvemos lo que tenga la heurística
    if (heuristic) return heuristic;
    return {
      intent: 'ambiguous',
      confidence: 0.3,
      reasoning: e instanceof Error ? e.message : 'Intent detection failed',
      suggestedClarification: '¿Puedes contarme un poco más qué quieres conseguir?',
    };
  }
}

/**
 * Determina si un intent requiere ejecutar una tool del coach.
 */
export function intentRequiresTool(intent: Intent): boolean {
  return (
    intent === 'create_ad' ||
    intent === 'image_only' ||
    intent === 'image_edit' ||
    intent === 'video' ||
    intent === 'knowledge_query' ||
    intent === 'file_analysis' ||
    intent === 'coding_task' ||
    intent === 'brand_query'
  );
}

/**
 * Mapea intent → lista de tools que el coach DEBE ver en el system prompt.
 * Esto reduce drásticamente la confusión: si el intent es "image_only",
 * el coach NO ve create_ad ni video → no puede confundirse.
 */
export function toolsForIntent(intent: Intent): import('./types').CoachToolName[] {
  switch (intent) {
    case 'create_ad':
      return ['create_ad', 'get_brand_assets'];
    case 'image_only':
    case 'image_edit':
      return ['image', 'get_brand_assets'];
    case 'video':
      return ['video'];
    case 'knowledge_query':
      return ['knowledge_search'];
    case 'file_analysis':
      return ['file_analysis'];
    case 'coding_task':
      return ['coding_mission'];
    case 'brand_query':
      return ['get_brand_assets'];
    default:
      return [];
  }
}
