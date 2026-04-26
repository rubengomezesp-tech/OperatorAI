/**
 * /api/campaigns/draft
 *
 * Auto-save endpoint for campaign composition.
 * Supports:
 *   GET    /api/campaigns/draft        → most recent draft for user
 *   GET    /api/campaigns/draft?id=X   → specific draft by id
 *   POST   /api/campaigns/draft        → upsert (create or update)
 *   PATCH  /api/campaigns/draft        → mark completed / partial update
 *   DELETE /api/campaigns/draft?id=X   → delete draft
 *
 * Auth: required (Supabase session).
 * RLS: enforced via user_id match on campaigns table.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ────────────────────────────────────────────────────────────────
// GET — load draft (most recent or specific)
// ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const svc = createSupabaseServiceClient();

    if (id) {
      // Specific draft
      const { data, error } = await svc
        .from('campaigns' as never)
        .select('*')
        .eq('id' as never, id as never)
        .eq('user_id' as never, user.id as never)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      return NextResponse.json({ draft: shapeDraft(data) });
    }

    // Most recent draft
    const { data, error } = await svc
      .from('campaigns' as never)
      .select('*')
      .eq('user_id' as never, user.id as never)
      .eq('is_draft' as never, true as never)
      .order('last_edited_at' as never, { ascending: false } as never)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'No draft found' }, { status: 404 });
    }

    return NextResponse.json({ draft: shapeDraft(data) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Unexpected error' },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────
// POST — upsert draft
// ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      intake_patch?: Record<string, unknown>;
      brain_output?: unknown;
      vertical_slug?: string;
      campaign_type_slug?: string;
    };

    const svc = createSupabaseServiceClient();

    // Resolve org context for new drafts
    let orgId: string | null = null;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      orgId = ctx.orgId;
    } catch {
      // Soft-fail: drafts can exist without org if needed
    }

    if (body.id) {
      // ── Update existing draft ────────────────────────────
      const { data: existing, error: fetchErr } = await svc
        .from('campaigns' as never)
        .select('intake_data')
        .eq('id' as never, body.id as never)
        .eq('user_id' as never, user.id as never)
        .single();

      if (fetchErr || !existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      const merged = {
        ...((existing as { intake_data?: Record<string, unknown> })?.intake_data ?? {}),
        ...(body.intake_patch ?? {}),
      };

      const updates: Record<string, unknown> = {
        intake_data: merged,
      };
      if (body.brain_output !== undefined) updates.brain_output = body.brain_output;
      if (body.vertical_slug !== undefined) updates.vertical_slug = body.vertical_slug;
      if (body.campaign_type_slug !== undefined)
        updates.campaign_type_slug = body.campaign_type_slug;

      const { data: updated, error: updErr } = await svc
        .from('campaigns' as never)
        .update(updates as never)
        .eq('id' as never, body.id as never)
        .eq('user_id' as never, user.id as never)
        .select()
        .single();

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({ draft: shapeDraft(updated) });
    }

    // ── Create new draft ──────────────────────────────────
    const insert: Record<string, unknown> = {
      user_id: user.id,
      org_id: orgId,
      is_draft: true,
      intake_data: body.intake_patch ?? {},
      brain_output: body.brain_output ?? null,
      vertical_slug: body.vertical_slug ?? null,
      campaign_type_slug: body.campaign_type_slug ?? null,
    };

    const { data: created, error: insErr } = await svc
      .from('campaigns' as never)
      .insert(insert as never)
      .select()
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ draft: shapeDraft(created) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Unexpected error' },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────
// PATCH — partial update (mark complete, etc)
// ────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      is_draft?: boolean;
      intake_data?: Record<string, unknown>;
      brain_output?: unknown;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();
    const updates: Record<string, unknown> = {};
    if (body.is_draft !== undefined) updates.is_draft = body.is_draft;
    if (body.intake_data !== undefined) updates.intake_data = body.intake_data;
    if (body.brain_output !== undefined) updates.brain_output = body.brain_output;

    const { data: updated, error } = await svc
      .from('campaigns' as never)
      .update(updates as never)
      .eq('id' as never, body.id as never)
      .eq('user_id' as never, user.id as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: shapeDraft(updated) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Unexpected error' },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────
// DELETE — delete draft
// ────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();
    const { error } = await svc
      .from('campaigns' as never)
      .delete()
      .eq('id' as never, id as never)
      .eq('user_id' as never, user.id as never);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Unexpected error' },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

interface CampaignRow {
  id: string;
  intake_data?: Record<string, unknown>;
  brain_output?: unknown;
  vertical_slug?: string | null;
  campaign_type_slug?: string | null;
  is_draft?: boolean;
  last_edited_at?: string;
}

function shapeDraft(row: unknown): unknown {
  const r = row as CampaignRow;
  return {
    id: r.id,
    intake: r.intake_data ?? {},
    brainOutput: r.brain_output ?? null,
    vertical_slug: r.vertical_slug ?? null,
    campaign_type_slug: r.campaign_type_slug ?? null,
    is_draft: r.is_draft ?? true,
    last_edited_at: r.last_edited_at ?? new Date().toISOString(),
  };
}
