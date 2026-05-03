import 'server-only';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';
import { getStripe } from '@/features/billing/server/stripe-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  error?: string;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const svc = createSupabaseServiceClient();
    const { error } = await svc.from('users').select('id').limit(1);
    if (error) return { name: 'Supabase', status: 'down', error: error.message };
    return { name: 'Supabase', status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { name: 'Supabase', status: 'down', error: String(e) };
  }
}

async function checkOpenAI(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { name: 'OpenAI', status: 'degraded', error: `HTTP ${res.status}` };
    return { name: 'OpenAI', status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { name: 'OpenAI', status: 'down', error: String(e) };
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const stripe = getStripe();
    await stripe.balance.retrieve();
    return { name: 'Stripe', status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { name: 'Stripe', status: 'down', error: String(e) };
  }
}

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [supabase, openai, stripe] = await Promise.all([
    checkSupabase(),
    checkOpenAI(),
    checkStripe(),
  ]);

  return NextResponse.json({
    services: [supabase, openai, stripe],
    checkedAt: new Date().toISOString(),
  });
}
