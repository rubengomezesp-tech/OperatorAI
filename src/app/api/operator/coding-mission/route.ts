import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isAdmin } from '@/lib/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getOperatorCoachConfig,
  getOperatorCoachHeaders,
  getOperatorCoachPublicConfig,
  probeOperatorCoach,
} from '@/lib/operator/coach-endpoint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const PermissionsSchema = z.object({
  readRepo: z.boolean().default(true),
  searchCode: z.boolean().default(true),
  gitStatus: z.boolean().default(true),
  gitDiff: z.boolean().default(true),
  terminal: z.boolean().default(false),
  writeFiles: z.boolean().default(false),
  commit: z.boolean().default(false),
}).default({});

const ModelSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[A-Za-z0-9._:/-]+$/);

const BodySchema = z.object({
  task: z.string().min(3).max(5_000),
  mode: z.enum(['plan', 'dry-run', 'run']).default('dry-run'),
  model: ModelSchema.optional(),
  maxFiles: z.number().int().min(20).max(300).default(120),
  maxMatches: z.number().int().min(10).max(120).default(40),
  permissions: PermissionsSchema,
});

interface CodingBridgeResponse {
  ok?: boolean;
  runtime?: string;
  workspace?: string;
  mode?: string;
  summary?: string;
  text?: string;
  model?: string;
  error?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OperatorModelOption {
  id: string;
  label?: string;
  version?: string;
  available?: boolean;
  trained?: boolean;
  fused?: boolean;
  active?: boolean;
  status?: string;
  counts?: {
    train?: number;
    valid?: number;
    extracts?: number;
    audios?: number;
    texts?: number;
  };
}

interface OperatorModelsResponse {
  ok?: boolean;
  activeModel?: string;
  latestModel?: string;
  versionsDir?: string;
  models?: OperatorModelOption[];
}

const HTML_MOCKUP_RE = /\b(mockup|maqueta|prototipo|prototype|wireframe|html|visualizar|preview|vista previa)\b/i;

async function requireAdminUser() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'unauthorized' };
  if (!isAdmin(user.email)) return { ok: false as const, status: 403, error: 'admin_required' };
  return { ok: true as const, user };
}

async function bridgeHealth() {
  const config = getOperatorCoachConfig();
  try {
    const response = await fetch(`${config.url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(4_000),
      cache: 'no-store',
    });
    if (!response.ok) return { ok: false, message: `Bridge returned ${response.status}` };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Bridge unavailable',
    };
  }
}

async function fetchOperatorModels(): Promise<OperatorModelsResponse | null> {
  const config = getOperatorCoachConfig();
  try {
    const response = await fetch(`${config.url}/v1/operator-models`, {
      method: 'GET',
      headers: getOperatorCoachHeaders(config),
      signal: AbortSignal.timeout(Math.min(config.timeoutMs, 12_000)),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const body = (await response.json().catch(() => ({}))) as OperatorModelsResponse;
    return body.ok === false ? null : body;
  } catch {
    return null;
  }
}

function isCreationMission(task: string): boolean {
  return /diseñ|disen|design|ui|ux|pantalla|layout|landing|feature|funci[oó]n|crear|crea|añad|anad|implementar|panel|bot[oó]n|formulario|componente/i
    .test(task);
}

function wantsHtmlMockup(task: string): boolean {
  return HTML_MOCKUP_RE.test(task)
    || /ver\s+antes|para\s+verlo|como\s+se\s+veria|cómo\s+se\s+vería/i.test(task);
}

function cleanHtmlMockup(value: string): string {
  return value
    .trim()
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function buildCodingAnalysis(input: {
  task: string;
  bridgeText: string;
  model: string;
}): Promise<string | null> {
  const config = getOperatorCoachConfig();
  const creationMission = isCreationMission(input.task);
  try {
    const response = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: getOperatorCoachHeaders(config),
      body: JSON.stringify({
        model: input.model,
        temperature: creationMission ? 0.22 : 0.15,
        max_tokens: creationMission ? 1200 : 900,
        messages: [
          {
            role: 'system',
            content: creationMission
              ? [
                  'Eres Operator Codex, un product engineer senior con buen ojo de diseño UI/UX y frontend.',
                  'Tu trabajo es transformar la inspeccion del repo en una propuesta concreta de diseño o feature.',
                  'Respeta el sistema visual existente, rutas existentes y arquitectura local antes de inventar.',
                  'No digas que escribiste archivos. En esta fase solo puedes proponer cambios y patch plan.',
                  'Si falta contexto del usuario, dilo como preguntas concretas, pero aun asi avanza con una suposicion razonable.',
                  'Formato:',
                  '1. Estado en una frase.',
                  '2. Diseño/experiencia propuesta.',
                  '3. Archivos probables a editar o crear.',
                  '4. Plan de implementacion en pasos pequeños.',
                  '5. Contexto que el usuario puede darte para mejorar el resultado.',
                  '6. Siguiente accion recomendada.',
                ].join('\n')
              : [
                  'Eres Operator Codex, un reviewer senior de repos.',
                  'Convierte la inspección técnica en una respuesta breve, accionable y en español.',
                  'No inventes acceso de escritura. Si solo hay modo lectura, dilo con naturalidad.',
                  'Formato: 1 frase de estado, luego Top 5 mejoras con prioridad, y una siguiente acción recomendada.',
                ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Misión del usuario:\n${input.task}`,
              '',
              `Salida del runtime:\n${input.bridgeText.slice(0, 16_000)}`,
            ].join('\n'),
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const body = await response.json().catch(() => ({})) as ChatCompletionResponse;
    return body.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function buildHtmlMockup(input: {
  task: string;
  bridgeText: string;
  model: string;
}): Promise<string | null> {
  const config = getOperatorCoachConfig();

  try {
    const response = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: getOperatorCoachHeaders(config),
      body: JSON.stringify({
        model: input.model,
        temperature: 0.28,
        max_tokens: 3600,
        messages: [
          {
            role: 'system',
            content: [
              'Eres Operator Codex en modo UI prototyper.',
              'Generas una maqueta HTML visual para que Ruben pueda verla antes de implementar.',
              'Devuelve SOLO un documento HTML completo. Sin markdown, sin explicaciones y sin fences ```.',
              'Usa CSS inline dentro de <style>. No uses JavaScript, scripts externos, paquetes externos, tracking ni formularios reales.',
              'Debe ser responsive, pulido, con textos reales en espanol y estados visibles cuando aplique.',
              'Si el usuario no da marca, usa una estetica sobria compatible con OperatorAI: fondo oscuro, dorado suave, tarjetas discretas y alta legibilidad.',
              'Representa la idea de producto con fidelidad: layout, navegacion, estados, botones y jerarquia visual.',
              'No copies literalmente interfaces propietarias; inspirate en patrones de producto modernos.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Mision de UI:\n${input.task}`,
              '',
              'Contexto del repo para respetar arquitectura/estilo:',
              input.bridgeText.slice(0, 10_000),
              '',
              'Entrega ahora solo el HTML completo.',
            ].join('\n'),
          },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const body = await response.json().catch(() => ({})) as ChatCompletionResponse;
    const html = cleanHtmlMockup(body.choices?.[0]?.message?.content ?? '');
    if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) return null;
    return html.slice(0, 80_000);
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const [bridge, probe] = await Promise.all([
    bridgeHealth(),
    probeOperatorCoach(),
  ]);
  const config = getOperatorCoachPublicConfig();
  const catalog = bridge.ok ? await fetchOperatorModels() : null;
  const listedModels = catalog?.models?.length
    ? catalog.models
    : probe.models?.map((id) => ({
        id,
        label: id,
        available: true,
        trained: id.includes('operator-qwen14b'),
        fused: id.includes('operator-qwen14b'),
        active: id === config.model,
        status: 'ready',
      }));

  return NextResponse.json({
    ok: true,
    bridgeAvailable: bridge.ok,
    modelAvailable: probe.ok,
    model: config.model,
    activeModel: catalog?.activeModel ?? config.model,
    latestModel: catalog?.latestModel ?? config.model,
    models: listedModels ?? [],
    versionsDir: catalog?.versionsDir ?? null,
    endpoint: config.url,
    hasApiKey: config.hasApiKey,
    diagnostic: {
      bridge: bridge.ok ? null : bridge.message,
      modelStage: probe.errorStage ?? null,
      modelMessage: probe.errorMessage ?? null,
    },
    safety: {
      writesDefault: false,
      terminalDefault: false,
      runMode: 'locked',
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const config = getOperatorCoachConfig();
  const safeMode = parsed.data.mode === 'run' ? 'dry-run' : parsed.data.mode;
  const selectedModel = parsed.data.model || config.model;

  try {
    const response = await fetch(`${config.url}/v1/coding-mission`, {
      method: 'POST',
      headers: getOperatorCoachHeaders(config),
      body: JSON.stringify({
        task: parsed.data.task,
        mode: safeMode,
        model: selectedModel,
        maxFiles: parsed.data.maxFiles,
        maxMatches: parsed.data.maxMatches,
        permissions: {
          ...parsed.data.permissions,
          terminal: false,
          writeFiles: false,
          commit: false,
        },
        userId: auth.user.id,
      }),
      signal: AbortSignal.timeout(Math.max(config.timeoutMs, 45_000)),
      cache: 'no-store',
    });

    const body = await response.json().catch(() => ({})) as CodingBridgeResponse;
    if (!response.ok || body.ok === false) {
      return NextResponse.json(
        { ok: false, error: body.error ?? `coding_bridge_failed_${response.status}` },
        { status: response.ok ? 502 : response.status },
      );
    }

    const analysis = await buildCodingAnalysis({
      task: parsed.data.task,
      bridgeText: body.text ?? body.summary ?? '',
      model: selectedModel,
    });
    const mockupHtml = wantsHtmlMockup(parsed.data.task)
      ? await buildHtmlMockup({
          task: parsed.data.task,
          bridgeText: body.text ?? body.summary ?? '',
          model: selectedModel,
        })
      : null;

    return NextResponse.json({
      ok: true,
      data: {
        runtime: body.runtime ?? 'operator-local-codex-bridge',
        workspace: body.workspace ?? null,
        model: body.model ?? selectedModel,
        mode: body.mode ?? safeMode,
        summary: body.summary ?? 'Coding runtime completed.',
        analysis,
        mockupHtml,
        mockupTitle: mockupHtml ? 'Mockup HTML' : null,
        text: body.text ?? '',
        requestedMode: parsed.data.mode,
        permissions: {
          ...parsed.data.permissions,
          terminal: false,
          writeFiles: false,
          commit: false,
        },
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'coding_bridge_unavailable',
        message: error instanceof Error ? error.message : 'Coding bridge unavailable',
      },
      { status: 503 },
    );
  }
}
