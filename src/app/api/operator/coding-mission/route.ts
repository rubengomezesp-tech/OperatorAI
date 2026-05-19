import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { isAdmin } from '@/lib/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CODING_AGENTS } from '@/lib/coding-runtime/agents';
import { isCodingModelAvailable, CodingModelUnavailableError } from '@/lib/coding-runtime/model';
import { runCodingMission } from '@/lib/coding-runtime/orchestrator';
import { getOperatorCoachPublicConfig } from '@/lib/operator/coach-endpoint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BodySchema = z.object({
  task: z.string().min(1).max(20_000),
  mode: z.enum(['plan', 'dry-run', 'run']).optional().default('dry-run'),
  allowWrites: z.boolean().optional().default(false),
  allowTerminal: z.boolean().optional().default(false),
  maxSteps: z.number().int().min(1).max(10).optional(),
  maxToolRounds: z.number().int().min(1).max(8).optional(),
  temperature: z.number().min(0).max(1.2).optional(),
  maxTokens: z.number().int().min(256).max(4096).optional(),
});

async function authorizeCodingRuntime(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== 'production') return null;

  if (process.env.CODING_RUNTIME_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'coding_runtime_disabled' },
      { status: 403 },
    );
  }

  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const blocked = await authorizeCodingRuntime();
  if (blocked) return blocked;

  const modelAvailable = await isCodingModelAvailable();
  const config = getOperatorCoachPublicConfig();
  return NextResponse.json({
    ok: true,
    modelAvailable,
    model: config.model,
    endpoint: config.url,
    hasApiKey: config.hasApiKey,
    modes: ['plan', 'dry-run', 'run'],
    agents: Object.values(CODING_AGENTS).map((agent) => ({
      role: agent.role,
      label: agent.label,
      description: agent.description,
      tools: agent.tools,
    })),
    safety: {
      writesDefault: false,
      terminalDefault: false,
      productionRequires: 'CODING_RUNTIME_ENABLED=true and admin session',
    },
  });
}

export async function POST(req: NextRequest) {
  const blocked = await authorizeCodingRuntime();
  if (blocked) return blocked;

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const allowWrites = body.mode === 'run' && body.allowWrites === true;

  try {
    const result = await runCodingMission(
      {
        task: body.task,
        mode: body.mode,
        allowWrites,
        allowTerminal: body.allowTerminal,
        maxSteps: body.maxSteps,
        maxToolRounds: body.maxToolRounds,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      },
      req.signal,
    );

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof CodingModelUnavailableError) {
      return NextResponse.json(
        {
          error: 'coding_model_unavailable',
          message: error.message,
          hint: 'Start an OpenAI-compatible Qwen server and set OPERATOR_COACH_URL / OPERATOR_COACH_MODEL. LOCAL_OPERATOR_* still works as a backwards-compatible alias.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: 'coding_mission_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
