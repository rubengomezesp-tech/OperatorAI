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

const BodySchema = z.object({
  task: z.string().min(3).max(5_000),
  mode: z.enum(['plan', 'dry-run', 'run']).default('dry-run'),
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
  error?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

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

async function buildCodingAnalysis(input: {
  task: string;
  bridgeText: string;
}): Promise<string | null> {
  const config = getOperatorCoachConfig();
  try {
    const response = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: getOperatorCoachHeaders(config),
      body: JSON.stringify({
        model: config.model,
        temperature: 0.15,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: [
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

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const [bridge, probe] = await Promise.all([
    bridgeHealth(),
    probeOperatorCoach(),
  ]);
  const config = getOperatorCoachPublicConfig();

  return NextResponse.json({
    ok: true,
    bridgeAvailable: bridge.ok,
    modelAvailable: probe.ok,
    model: config.model,
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

  try {
    const response = await fetch(`${config.url}/v1/coding-mission`, {
      method: 'POST',
      headers: getOperatorCoachHeaders(config),
      body: JSON.stringify({
        task: parsed.data.task,
        mode: safeMode,
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
    });

    return NextResponse.json({
      ok: true,
      data: {
        runtime: body.runtime ?? 'operator-local-codex-bridge',
        workspace: body.workspace ?? null,
        mode: body.mode ?? safeMode,
        summary: body.summary ?? 'Coding runtime completed.',
        analysis,
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
