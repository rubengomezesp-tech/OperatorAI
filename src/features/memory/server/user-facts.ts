/**
 * User Facts — Memoria conversacional
 *
 * Sistema de extracción + persistencia de hechos sobre el usuario.
 * El extractor corre en background tras cada mensaje y guarda hechos nuevos.
 * El inyector busca hechos relevantes y los añade al system prompt en futuras conversaciones.
 */
import 'server-only';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

export type UserFactCategory =
  | 'business'
  | 'audience'
  | 'product'
  | 'goals'
  | 'preferences'
  | 'brand_voice'
  | 'team'
  | 'metrics'
  | 'history'
  | 'context';

export interface UserFact {
  id: string;
  fact: string;
  category: UserFactCategory;
  confidence: number;
  created_at: string;
}

const EXTRACTOR_SYSTEM_PROMPT = `Eres un extractor de hechos de marketing. Tu único trabajo es identificar hechos NUEVOS Y CONCRETOS que el usuario revela sobre su negocio, audiencia, productos, objetivos o preferencias.

REGLAS DURAS:
1. Solo extrae hechos OBJETIVOS Y ACCIONABLES (no opiniones del momento, no preguntas, no peticiones).
2. Cada hecho debe ser una frase auto-contenida en 3ª persona ("El usuario..." / "Su negocio..." / "Su audiencia...").
3. NUNCA extraigas hechos de mensajes que sean solo preguntas o saludos.
4. Si el mensaje no revela ningún hecho nuevo, devuelve array vacío.
5. Máximo 5 hechos por mensaje, prioriza los más importantes.
6. Categoriza cada hecho con UNA de estas categorías:
   - business: industry, modelo de negocio, tamaño empresa
   - audience: cliente ideal, segmento, edad, ubicación
   - product: productos/servicios concretos que vende
   - goals: objetivos a corto/medio/largo plazo
   - preferences: preferencias estilísticas, de tono, plataforma favorita
   - brand_voice: voz de marca, valores
   - team: equipo, recursos, herramientas
   - metrics: KPIs, números importantes mencionados
   - history: campañas pasadas, qué funcionó/no funcionó
   - context: otro contexto relevante

FORMATO DE SALIDA (JSON estricto):
{
  "facts": [
    { "fact": "...", "category": "...", "confidence": 0.0-1.0 }
  ]
}

EJEMPLOS:
Mensaje: "Hola, ¿cómo estás?"
Output: {"facts": []}

Mensaje: "Vendo zapatillas de running para mujeres de 25-40 años en España"
Output: {"facts": [
  {"fact": "Su negocio vende zapatillas de running", "category": "product", "confidence": 0.95},
  {"fact": "Su audiencia objetivo son mujeres de 25-40 años", "category": "audience", "confidence": 0.95},
  {"fact": "Opera en España", "category": "business", "confidence": 0.9}
]}

Mensaje: "Mi última campaña en Instagram tuvo un CTR del 3% pero no convirtió"
Output: {"facts": [
  {"fact": "Su última campaña en Instagram alcanzó 3% CTR", "category": "metrics", "confidence": 0.9},
  {"fact": "Sus campañas en Instagram tienen problemas de conversión", "category": "history", "confidence": 0.85}
]}`;

interface ExtractedFact {
  fact: string;
  category: UserFactCategory;
  confidence: number;
}

/**
 * Extrae hechos de un mensaje del usuario usando GPT-4o-mini (rápido + barato).
 */
export async function extractFactsFromMessage(
  userMessage: string,
): Promise<ExtractedFact[]> {
  if (!userMessage || userMessage.trim().length < 15) return [];

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        { role: 'user', content: userMessage.slice(0, 4000) },
      ],
    });

    const content = res.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { facts?: ExtractedFact[] };
    if (!parsed.facts || !Array.isArray(parsed.facts)) return [];

    return parsed.facts
      .filter((f) => f.fact && f.category && typeof f.confidence === 'number')
      .filter((f) => f.confidence >= 0.7)
      .slice(0, 5);
  } catch (err) {
    console.warn('[user-facts] extraction failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Comprueba similitud sencilla entre dos textos (Jaccard de tokens normalizados).
 * Sirve para evitar duplicados al guardar hechos nuevos.
 */
function similarity(a: string, b: string): number {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
  const setA = new Set(norm(a));
  const setB = new Set(norm(b));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Guarda hechos nuevos, ignorando los que son muy similares a los existentes.
 */
export async function saveNewFacts(
  svc: SupabaseClient,
  userId: string,
  orgId: string | null,
  newFacts: ExtractedFact[],
  meta?: { conversationId?: string; messageId?: string },
): Promise<number> {
  if (newFacts.length === 0) return 0;

  // Cargar hechos activos existentes para deduplicar
  const { data: existing } = await svc
    .from('user_facts')
    .select('fact, category')
    .eq('user_id', userId)
    .eq('active', true)
    .limit(200);

  const existingArr = (existing as Array<{ fact: string; category: string }> | null) ?? [];

  const toInsert: Array<Record<string, unknown>> = [];
  for (const f of newFacts) {
    // Skip si hay un hecho muy parecido en la misma categoría
    const isDuplicate = existingArr.some(
      (e) => e.category === f.category && similarity(e.fact, f.fact) >= 0.55,
    );
    if (isDuplicate) continue;

    toInsert.push({
      user_id: userId,
      org_id: orgId,
      fact: f.fact,
      category: f.category,
      confidence: f.confidence,
      source_conversation_id: meta?.conversationId,
      source_message_id: meta?.messageId,
      active: true,
    });
  }

  if (toInsert.length === 0) return 0;

  const { error } = await svc.from('user_facts').insert(toInsert as never);
  if (error) {
    console.warn('[user-facts] insert failed:', error.message);
    return 0;
  }
  return toInsert.length;
}

/**
 * Carga hechos relevantes del usuario para inyectar en el system prompt.
 * Devuelve los más recientes de cada categoría, máx 25 hechos totales.
 */
export async function loadUserFacts(
  svc: SupabaseClient,
  userId: string,
): Promise<UserFact[]> {
  const { data } = await svc
    .from('user_facts')
    .select('id, fact, category, confidence, created_at')
    .eq('user_id', userId)
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  const all = data as UserFact[];

  // Diversidad: limitar a 4 por categoría, máximo 25 totales
  const byCategory = new Map<string, UserFact[]>();
  for (const fact of all) {
    const list = byCategory.get(fact.category) ?? [];
    if (list.length < 4) {
      list.push(fact);
      byCategory.set(fact.category, list);
    }
  }
  const balanced: UserFact[] = [];
  for (const list of byCategory.values()) balanced.push(...list);
  return balanced.slice(0, 25);
}

/**
 * Construye el bloque de system prompt con los hechos del usuario.
 */
export function buildFactsBlock(facts: UserFact[]): string | null {
  if (facts.length === 0) return null;

  const byCategory = new Map<string, UserFact[]>();
  for (const f of facts) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }

  const labels: Record<string, string> = {
    business: 'NEGOCIO',
    audience: 'AUDIENCIA',
    product: 'PRODUCTOS/SERVICIOS',
    goals: 'OBJETIVOS',
    preferences: 'PREFERENCIAS',
    brand_voice: 'VOZ DE MARCA',
    team: 'EQUIPO',
    metrics: 'MÉTRICAS',
    history: 'HISTORIA',
    context: 'CONTEXTO',
  };

  const lines: string[] = [
    '<user_memory>',
    'Lo que ya conozco del usuario por conversaciones anteriores. NO le pidas estos datos otra vez. Úsalos para personalizar cada respuesta:',
    '',
  ];

  for (const [cat, list] of byCategory.entries()) {
    if (list.length === 0) continue;
    lines.push(`[${labels[cat] ?? cat.toUpperCase()}]`);
    for (const f of list) lines.push('- ' + f.fact);
    lines.push('');
  }

  lines.push('</user_memory>');
  return lines.join('\n');
}
