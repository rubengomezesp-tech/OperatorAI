import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { checkUsage, incrementUsage } from '@/lib/billing/usage';
import { isChatDisabled, isMaintenanceMode } from '@/lib/admin/maintenance';
import {
  runCoach,
  isCoachAvailable,
  OperatorCoachUnavailableError,
} from '@/lib/operator/coach-service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10_000),
});

const BodySchema = z.object({
  message: z.string().min(1).max(10_000),
  history: z.array(MessageSchema).max(40).optional(),
  knowledge: z.string().max(20_000).optional(),
  memories: z.string().max(8_000).optional(),
  tools: z.string().max(8_000).optional(),
  maxTokens: z.number().int().min(64).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/* -------------------------------------------------------------------------- */
/*  GET — healthcheck                                                          */
/* -------------------------------------------------------------------------- */

export async function GET() {
  const available = await isCoachAvailable();
  return NextResponse.json({
    ok: true,
    coachAvailable: available,
    model: 'operator-qwen14b',
    endpoint: 'http://localhost:1234',
  });
}

/* -------------------------------------------------------------------------- */
/*  POST — invocar coach                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  // 1. Modo mantenimiento global
  if (await isMaintenanceMode()) {
    return NextResponse.json(
      { error: 'maintenance_mode', message: 'Estamos en mantenimiento. Vuelve en unos minutos.' },
      { status: 503 }
    );
  }
  if (await isChatDisabled()) {
    return NextResponse.json(
      { error: 'chat_disabled', message: 'El chat está temporalmente deshabilitado.' },
      { status: 503 }
    );
  }

  // 2. Auth (con SSR para leer cookies de sesión)
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await ssr.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 3. Resolver org del usuario (con SVC, igual que /api/chat)
  const svc = createSupabaseServiceClient();
  let orgContext: { orgId: string; orgName: string };
  try {
    orgContext = await resolveOrgContext(svc, user.id);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'org_resolution_failed',
        message: error instanceof Error ? error.message : 'No se pudo resolver la organización.',
      },
      { status: 400 }
    );
  }

  if (!orgContext?.orgId) {
    return NextResponse.json({ error: 'no_active_org' }, { status: 400 });
  }

  // 4. Billing — verificar límite antes de llamar
  const usageCheck = await checkUsage(orgContext.orgId, 'chat_messages');
  if (!usageCheck.ok) {
    return NextResponse.json(
      {
        error: 'usage_limit_reached',
        message: 'Has alcanzado el límite de mensajes de tu plan.',
        usage: usageCheck,
      },
      { status: 402 }
    );
  }

  // 5. Validación de body
  let body: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    body = BodySchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'invalid_body',
        details: error instanceof Error ? error.message : 'Body inválido.',
      },
      { status: 400 }
    );
  }

  // 6. Llamar al coach
  try {
    const result = await runCoach({
      message: body.message,
      history: body.history,
      knowledge: body.knowledge,
      memories: body.memories,
      tools: body.tools,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      userContext: {
        userName: user.user_metadata?.full_name ?? user.email?.split('@')[0],
        orgName: orgContext.orgName,
      },
    });

    // 7. Incrementar contador de uso (solo si la llamada fue exitosa)
    await incrementUsage(orgContext.orgId, 'chat_messages').catch((err) => {
      console.error('[operator/coach] Error incrementando uso:', err);
    });

    return NextResponse.json({
      ok: true,
      data: {
        text: result.text,
        toolCall: result.toolCall,
        model: result.model,
        elapsedMs: result.elapsedMs,
        usage: result.usage,
      },
    });
  } catch (error) {
    if (error instanceof OperatorCoachUnavailableError) {
      return NextResponse.json(
        {
          error: 'coach_unavailable',
          message: error.message,
        },
        { status: 503 }
      );
    }

    console.error('[operator/coach] Error inesperado:', error);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Error desconocido.',
      },
      { status: 500 }
    );
  }
}
