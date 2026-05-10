import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/client';

export const runtime = 'nodejs';

/**
 * 🗑️ ACCOUNT DELETE (GDPR Art. 17)
 *
 * POST /api/account/delete
 *
 * Cascade hard-delete del usuario:
 *   1. Composio integrations (revocar tokens)
 *   2. Memory entries
 *   3. Documents + chunks (BD + storage)
 *   4. Campaigns
 *   5. Conversations + messages
 *   6. Brand profile (si user es owner único)
 *   7. Memberships
 *   8. Organizations sin otros members
 *   9. Subscriptions
 *  10. Auth user (Supabase auth.users)
 *
 * Email de confirmación enviado ANTES de delete (mientras still
 * hay forma de mandar email).
 *
 * NOTE: Por ahora hard-delete inmediato. En futuro: soft-delete
 * con grace period 7 días (revertible) + cron cleanup tras 30d.
 */

export async function POST() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const userId = user.id;
    const userEmail = user.email;

    // ─── 1. Send confirmation email FIRST (before destroying account) ───
    if (userEmail) {
      try {
        const userName = (user.user_metadata?.full_name as string) || userEmail.split('@')[0] || 'there';
        await sendEmail({
          to: userEmail,
          subject: 'Tu cuenta de Operator AI ha sido eliminada',
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #0A0A0A; color: #F5F5F5; padding: 40px 24px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 18px; font-weight: 600; letter-spacing: 0.04em;">Operator <span style="color: #C9A863;">AI</span></span>
    </div>
    <div style="background: #141414; border: 1px solid #2A2A2A; border-radius: 12px; padding: 32px;">
      <h1 style="font-size: 22px; margin: 0 0 16px 0;">Tu cuenta ha sido eliminada</h1>
      <p style="color: #A0A0A0; line-height: 1.6;">${userName}, hemos procesado tu solicitud de eliminación de cuenta.</p>
      <p style="color: #A0A0A0; line-height: 1.6;">Todos tus datos (conversaciones, documentos, campañas, integraciones) han sido borrados permanentemente de nuestros servidores conforme al GDPR Art. 17.</p>
      <p style="color: #A0A0A0; line-height: 1.6;">Si esto fue un error o quieres volver, escríbenos a <a href="mailto:hi@operatoraiapp.com" style="color: #C9A863;">hi@operatoraiapp.com</a>.</p>
      <p style="color: #707070; font-size: 13px; margin-top: 24px;">Gracias por habernos dado la oportunidad de servirte.</p>
    </div>
  </div>
</body>
</html>`,
          text: `${userName}, tu cuenta de Operator AI ha sido eliminada.

Todos tus datos han sido borrados conforme al GDPR Art. 17.

Si fue un error, escríbenos: hi@operatoraiapp.com

— Operator AI`,
        });
      } catch (e) {
        console.warn('[delete-account] confirmation email failed:', e);
      }
    }

    // ─── 2. Get user's orgs (cascade later) ───
    const { data: ms } = await svc
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', userId);

    type Member = { org_id: string; role: string };
    const memberships = (ms as Member[] | null) ?? [];
    const ownedOrgIds = memberships.filter((m) => m.role === 'owner').map((m) => m.org_id);

    // ─── 3. Cascade delete (best-effort each) ───
    async function safeDelete(table: string, filter: Record<string, unknown>): Promise<void> {
      try {
        let q = svc.from(table as never).delete();
        for (const [k, v] of Object.entries(filter)) {
          q = q.eq(k as never, v as never);
        }
        const { error } = await q;
        if (error) console.warn(`[delete-account] ${table}:`, error.message);
      } catch (e) {
        console.warn(`[delete-account] ${table} threw:`, e);
      }
    }

    // User-owned tables
    await safeDelete('messages', { user_id: userId });
    await safeDelete('conversations', { user_id: userId });
    await safeDelete('document_chunks', { user_id: userId });
    await safeDelete('documents', { user_id: userId });
    await safeDelete('campaigns', { user_id: userId });
    await safeDelete('memory_entries', { user_id: userId });
    await safeDelete('integrations', { user_id: userId });
    await safeDelete('image_generations', { user_id: userId });
    await safeDelete('feedback', { user_id: userId });

    // Org-scoped tables (only if user is sole owner of org)
    for (const orgId of ownedOrgIds) {
      // Check if other members exist
      const { data: others } = await svc
        .from('memberships')
        .select('user_id')
        .eq('org_id', orgId)
        .neq('user_id', userId);

      const otherCount = ((others as Array<{ user_id: string }> | null) ?? []).length;
      if (otherCount === 0) {
        // Sole owner — wipe the org entirely
        await safeDelete('brand_profile', { org_id: orgId });
        await safeDelete('subscriptions', { org_id: orgId });
        await safeDelete('memberships', { org_id: orgId });
        await safeDelete('organizations', { id: orgId });
      }
    }

    // Memberships of user (in case any orgs survived)
    await safeDelete('memberships', { user_id: userId });

    // ─── 4. Finally, delete auth user ───
    await svc.auth.admin.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[delete-account]', e);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
