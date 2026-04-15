import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { learnVoiceFromUser } from '@/features/memory/server/learn-voice';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { fingerprint, sampleCount } = await learnVoiceFromUser({ svc, orgId, userId: user.id });
  if (!fingerprint) {
    return NextResponse.json({
      ok: false,
      reason: 'not_enough_samples',
      sampleCount,
      needed: 10,
    });
  }

  await svc
    .from('voice_fingerprints')
    .upsert({
      org_id: orgId,
      user_id: user.id,
      tone_summary: fingerprint.tone_summary,
      sentence_length: fingerprint.sentence_length,
      vocabulary_style: fingerprint.vocabulary_style,
      preferred_phrases: fingerprint.preferred_phrases,
      avoided_phrases: fingerprint.avoided_phrases,
      structural_preferences: fingerprint.structural_preferences,
      sample_count: sampleCount,
      last_analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'org_id,user_id' });

  return NextResponse.json({ ok: true, fingerprint, sampleCount });
}

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data } = await svc
    .from('voice_fingerprints')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();
  return NextResponse.json({ fingerprint: data ?? null });
}
