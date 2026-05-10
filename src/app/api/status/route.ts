import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🩺 STATUS CHECK ENDPOINT
 *
 * Pinga servicios externos críticos para Operator AI.
 * Devuelve estado por servicio + estado global.
 *
 * Usado por:
 *   - Página pública /status
 *   - Health checks externos (uptime monitor)
 */

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  latencyMs?: number;
  error?: string;
}

async function checkService(
  name: string,
  fn: () => Promise<boolean>,
  timeoutMs = 5000,
): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const ok = await Promise.race([
      fn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);
    return {
      name,
      status: ok ? 'operational' : 'degraded',
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      name,
      status: 'down',
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'unknown',
    };
  }
}

async function checkSupabase(): Promise<boolean> {
  const url = serverEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
  });
  return res.ok || res.status === 404; // 404 ok (root no existe pero responde)
}

async function checkStripe(): Promise<boolean> {
  const res = await fetch('https://api.stripe.com/healthcheck');
  return res.ok;
}

async function checkAnthropic(): Promise<boolean> {
  // Solo verificamos que el endpoint responde (sin auth real)
  const res = await fetch('https://api.anthropic.com/');
  return res.status < 500;
}

async function checkOpenAI(): Promise<boolean> {
  const res = await fetch('https://api.openai.com/');
  return res.status < 500;
}

async function checkComposio(): Promise<boolean> {
  const res = await fetch('https://backend.composio.dev/');
  return res.status < 500;
}

async function checkReplicate(): Promise<boolean> {
  const res = await fetch('https://api.replicate.com/');
  return res.status < 500;
}

async function checkResend(): Promise<boolean> {
  const res = await fetch('https://api.resend.com/');
  return res.status < 500;
}

export async function GET() {
  const checks = await Promise.all([
    checkService('Supabase (DB)', checkSupabase),
    checkService('Stripe (Billing)', checkStripe),
    checkService('Anthropic (Claude)', checkAnthropic),
    checkService('OpenAI (GPT)', checkOpenAI),
    checkService('Composio (Integrations)', checkComposio),
    checkService('Replicate (Image/Video)', checkReplicate),
    checkService('Resend (Email)', checkResend),
  ]);

  const downCount = checks.filter((c) => c.status === 'down').length;
  const degradedCount = checks.filter((c) => c.status === 'degraded').length;

  let globalStatus: 'operational' | 'degraded' | 'major_outage';
  if (downCount === 0 && degradedCount === 0) {
    globalStatus = 'operational';
  } else if (downCount >= 3) {
    globalStatus = 'major_outage';
  } else {
    globalStatus = 'degraded';
  }

  return NextResponse.json({
    status: globalStatus,
    timestamp: new Date().toISOString(),
    services: checks,
  });
}
