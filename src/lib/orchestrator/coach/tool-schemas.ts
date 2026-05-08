/**
 * Coach Orchestrator — Tool Schemas (Zod)
 *
 * Schemas canónicos de las 6 tools que el coach puede invocar.
 * Estos schemas son la única fuente de verdad para validación y auto-corrección.
 *
 * Cuando el coach emite un tool_call, este módulo:
 *   1. Verifica que el nombre exista
 *   2. Coerciona valores comunes mal formateados (ej: "square" → "1:1")
 *   3. Valida contra el schema
 *   4. Devuelve datos limpios o errores accionables
 */

import { z } from 'zod';
import type { CoachToolName } from './types';

/* -------------------------------------------------------------------------- */
/*  COERCIONES COMUNES                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Mapa de aliases de aspect_ratio / format que el coach podría inventar
 * a los valores canónicos válidos.
 */
const ASPECT_RATIO_ALIASES: Record<string, string> = {
  // Names
  'square': '1:1',
  'instagram_square': '1:1',
  'instagram-square': '1:1',
  'instagram_post': '1:1',
  'feed': '1:1',
  'post': '1:1',
  'story': '9:16',
  'instagram_story': '9:16',
  'instagram-story': '9:16',
  'reel': '9:16',
  'tiktok': '9:16',
  'vertical': '9:16',
  'portrait': '9:16',
  'landscape': '16:9',
  'wide': '16:9',
  'youtube': '16:9',
  'horizontal': '16:9',
  'instagram_portrait': '4:5',
  'instagram-portrait': '4:5',
  // Numeric variations
  '1x1': '1:1',
  '9x16': '9:16',
  '16x9': '16:9',
  '4x5': '4:5',
  '3x2': '3:2',
};

const PRESET_ALIASES: Record<string, string> = {
  'luxury': 'luxury-minimal',
  'minimal': 'luxury-minimal',
  'aggressive-bold': 'aggressive',
  'bold': 'aggressive',
  'urgent': 'aggressive',
  'clean': 'clean-conversion',
  'professional': 'clean-conversion',
  'product': 'product-demo',
  'demo': 'product-demo',
};

function normalizeAspectRatio(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const lower = value.toLowerCase().trim();
  if (ASPECT_RATIO_ALIASES[lower]) return ASPECT_RATIO_ALIASES[lower];
  // Already canonical?
  if (['1:1', '9:16', '16:9', '4:5', '3:2'].includes(lower)) return lower;
  return undefined;
}

function normalizePreset(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const lower = value.toLowerCase().trim();
  if (PRESET_ALIASES[lower]) return PRESET_ALIASES[lower];
  if (['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo'].includes(lower)) return lower;
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  SCHEMAS                                                                    */
/* -------------------------------------------------------------------------- */

/** create_ad — pipeline completo de anuncio */
export const CreateAdSchema = z.object({
  user_prompt: z.string().min(3, 'user_prompt debe tener al menos 3 caracteres'),
  formats: z
    .array(z.enum(['1:1', '9:16', '4:5', '16:9']))
    .min(1)
    .max(4)
    .default(['1:1']),
  preset_override: z
    .enum(['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo'])
    .optional(),
});

/** image — generación o edición de imagen */
export const ImageSchema = z.object({
  prompt: z.string().min(10, 'prompt debe tener al menos 10 caracteres descriptivos'),
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:5', '3:2']).default('1:1'),
  num_images: z.number().int().min(1).max(4).default(1),
  reference_image_url: z.string().url().optional(),
});

/** video — generación de vídeo corto */
export const VideoSchema = z.object({
  prompt: z.string().min(10, 'prompt debe tener al menos 10 caracteres'),
  duration: z.union([z.literal(4), z.literal(8)]).default(4),
});

/** knowledge_search — búsqueda en docs del usuario */
export const KnowledgeSearchSchema = z.object({
  query: z.string().min(2, 'query no puede estar vacío'),
});

/** file_analysis — análisis de CSV/Excel/JSON */
export const FileAnalysisSchema = z.object({
  file_id: z.string().min(1),
  question: z.string().min(2),
});

/** get_brand_assets — sin argumentos */
export const GetBrandAssetsSchema = z.object({}).default({});

/* -------------------------------------------------------------------------- */
/*  ALIAS DE NOMBRES DE TOOLS                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Si el coach inventa un nombre de tool, lo mapeamos al canónico.
 * Si no hay mapeo posible → error explícito.
 */
const TOOL_NAME_ALIASES: Record<string, CoachToolName> = {
  'create_ad': 'create_ad',
  'createad': 'create_ad',
  'create-ad': 'create_ad',
  'make_ad': 'create_ad',
  'generate_ad': 'create_ad',
  'ad': 'create_ad',
  'advertisement': 'create_ad',
  'compose_ad': 'create_ad',  // compose_ad está oculto → mapea a create_ad
  'composeAd': 'create_ad',

  'image': 'image',
  'generate_image': 'image',
  'create_image': 'image',
  'make_image': 'image',
  'photo': 'image',
  'illustration': 'image',

  'video': 'video',
  'generate_video': 'video',
  'create_video': 'video',
  'make_video': 'video',
  'clip': 'video',

  'knowledge_search': 'knowledge_search',
  'knowledgeSearch': 'knowledge_search',
  'search_knowledge': 'knowledge_search',
  'search_docs': 'knowledge_search',
  'rag_search': 'knowledge_search',

  'file_analysis': 'file_analysis',
  'fileAnalysis': 'file_analysis',
  'analyze_file': 'file_analysis',
  'analyse_file': 'file_analysis',

  'get_brand_assets': 'get_brand_assets',
  'getBrandAssets': 'get_brand_assets',
  'brand_assets': 'get_brand_assets',
  'get_brand': 'get_brand_assets',
  'brand_info': 'get_brand_assets',
};

export function resolveToolName(rawName: string): CoachToolName | null {
  const cleaned = rawName.toLowerCase().trim().replace(/['"]/g, '');
  return TOOL_NAME_ALIASES[cleaned] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  PRE-COERCIÓN DE ARGUMENTOS                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Normaliza argumentos antes de pasarlos al schema.
 * Aplica los aliases conocidos para que valores comunes mal formateados
 * pasen la validación sin error.
 */
export function preCoerceArgs(
  toolName: CoachToolName,
  args: Record<string, unknown>,
): { coerced: Record<string, unknown>; corrections: string[] } {
  const out = { ...args };
  const corrections: string[] = [];

  switch (toolName) {
    case 'create_ad': {
      // formats puede venir como string en lugar de array
      if (typeof out.formats === 'string') {
        const norm = normalizeAspectRatio(out.formats);
        if (norm) {
          out.formats = [norm];
          corrections.push(`formats string "${args.formats}" → ["${norm}"]`);
        }
      }
      // formats como array de aliases
      if (Array.isArray(out.formats)) {
        const original = out.formats as unknown[];
        const normalized = original
          .map((f) => normalizeAspectRatio(f))
          .filter((f): f is string => Boolean(f));
        if (normalized.length !== original.length || normalized.some((n, i) => n !== original[i])) {
          corrections.push(`formats normalizados: ${JSON.stringify(original)} → ${JSON.stringify(normalized)}`);
          out.formats = normalized;
        }
      }
      // El coach podría llamar al campo "preset" en vez de "preset_override"
      if (out.preset && !out.preset_override) {
        out.preset_override = out.preset;
        delete out.preset;
        corrections.push(`renombrado "preset" → "preset_override"`);
      }
      // Normalizar valor del preset
      if (typeof out.preset_override === 'string') {
        const norm = normalizePreset(out.preset_override);
        if (norm && norm !== out.preset_override) {
          corrections.push(`preset_override "${out.preset_override}" → "${norm}"`);
          out.preset_override = norm;
        }
      }
      // Algunos coachs ponen "prompt" en vez de "user_prompt"
      if (out.prompt && !out.user_prompt) {
        out.user_prompt = out.prompt;
        delete out.prompt;
        corrections.push(`renombrado "prompt" → "user_prompt"`);
      }
      break;
    }

    case 'image': {
      // aspect_ratio aliases
      if (typeof out.aspect_ratio === 'string') {
        const norm = normalizeAspectRatio(out.aspect_ratio);
        if (norm && norm !== out.aspect_ratio) {
          corrections.push(`aspect_ratio "${out.aspect_ratio}" → "${norm}"`);
          out.aspect_ratio = norm;
        }
      }
      // Algunos coachs pasan "format" en vez de "aspect_ratio"
      if (out.format && !out.aspect_ratio) {
        const norm = normalizeAspectRatio(out.format);
        if (norm) {
          out.aspect_ratio = norm;
          delete out.format;
          corrections.push(`renombrado "format" → "aspect_ratio" con valor normalizado`);
        }
      }
      // num_images como string
      if (typeof out.num_images === 'string') {
        const n = parseInt(out.num_images as string, 10);
        if (Number.isFinite(n)) {
          out.num_images = n;
          corrections.push(`num_images convertido de string a number`);
        }
      }
      // reference_url o image_url → reference_image_url
      const altRefKeys = ['reference_url', 'image_url', 'ref_url', 'reference'];
      for (const key of altRefKeys) {
        if (out[key] && !out.reference_image_url) {
          out.reference_image_url = out[key];
          delete out[key];
          corrections.push(`renombrado "${key}" → "reference_image_url"`);
          break;
        }
      }
      break;
    }

    case 'video': {
      // duration como string
      if (typeof out.duration === 'string') {
        const n = parseInt(out.duration as string, 10);
        if (Number.isFinite(n)) {
          out.duration = n;
          corrections.push(`duration convertido de string a number`);
        }
      }
      // Si duration no es 4 o 8, ajustar
      if (typeof out.duration === 'number' && out.duration !== 4 && out.duration !== 8) {
        const closest = out.duration <= 6 ? 4 : 8;
        corrections.push(`duration ${out.duration} → ${closest} (valor permitido)`);
        out.duration = closest;
      }
      break;
    }

    case 'knowledge_search': {
      if (out.q && !out.query) {
        out.query = out.q;
        delete out.q;
        corrections.push(`renombrado "q" → "query"`);
      }
      break;
    }

    case 'file_analysis': {
      if (out.fileId && !out.file_id) {
        out.file_id = out.fileId;
        delete out.fileId;
        corrections.push(`renombrado "fileId" → "file_id"`);
      }
      break;
    }

    case 'get_brand_assets': {
      // No tiene argumentos; limpiamos cualquier basura
      break;
    }
  }

  return { coerced: out, corrections };
}

/* -------------------------------------------------------------------------- */
/*  VALIDACIÓN PRINCIPAL                                                       */
/* -------------------------------------------------------------------------- */

const SCHEMA_BY_TOOL: Record<CoachToolName, z.ZodSchema> = {
  create_ad: CreateAdSchema,
  image: ImageSchema,
  video: VideoSchema,
  knowledge_search: KnowledgeSearchSchema,
  file_analysis: FileAnalysisSchema,
  get_brand_assets: GetBrandAssetsSchema,
};

export function validateToolArgs(
  toolName: CoachToolName,
  rawArgs: Record<string, unknown>,
):
  | { ok: true; data: Record<string, unknown>; corrections: string[] }
  | { ok: false; error: string; missingFields?: string[] } {
  const { coerced, corrections } = preCoerceArgs(toolName, rawArgs);
  const schema = SCHEMA_BY_TOOL[toolName];

  const result = schema.safeParse(coerced);
  if (result.success) {
    return { ok: true, data: result.data as Record<string, unknown>, corrections };
  }

  // Extraer info útil del error de Zod
  const issues = result.error.issues;
  const missingFields = issues
    .filter((i) => i.code === 'invalid_type' && i.received === 'undefined')
    .map((i) => i.path.join('.'));

  const errorSummary = issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');

  return {
    ok: false,
    error: errorSummary,
    missingFields: missingFields.length ? missingFields : undefined,
  };
}
