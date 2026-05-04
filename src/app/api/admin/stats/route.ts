import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const range = url.searchParams.get('range') || '7d';
  const days = range === '30d' ? 30 : range === '90d' ? 90 : 7;

  try {
    const svc = createSupabaseServiceClient();
    
    // Users
    const { count: totalUsers } = await (svc as any)
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: newToday } = await (svc as any)
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    const { count: newThisWeek } = await (svc as any)
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

    // Conversations
    const { count: totalChats } = await (svc as any)
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: chatsToday } = await (svc as any)
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    // Images
    const { count: totalImages } = await (svc as any)
      .from('generated_images')
      .select('*', { count: 'exact', head: true });

    const { count: imagesToday } = await (svc as any)
      .from('generated_images')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    // Subscriptions
    let activeSubs = 0, trialingSubs = 0;
    try {
      const { count: a } = await (svc as any).from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: t } = await (svc as any).from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing');
      activeSubs = a || 0;
      trialingSubs = t || 0;
    } catch {}

    // Daily data for charts
    const daily: Array<{ day: string; users: number; chats: number; images: number; revenue: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date.getTime() + 86400000).toISOString();
      
      daily.push({
        day: dateStr.slice(5),
        users: 0,
        chats: 0,
        images: 0,
        revenue: 0,
      });
    }
    
    // Try to fill daily data
    try {
      const sinceDate = new Date(Date.now() - days * 86400000).toISOString();
      const { data: dailyUsers } = await (svc as any)
        .from('users')
        .select('created_at')
        .gte('created_at', sinceDate);
      
      if (dailyUsers) {
        for (const u of dailyUsers) {
          const day = u.created_at?.split('T')[0]?.slice(5);
          const entry = daily.find(d => d.day === day);
          if (entry) entry.users++;
        }
      }

      const { data: dailyChats } = await (svc as any)
        .from('conversations')
        .select('created_at')
        .gte('created_at', sinceDate);
      
      if (dailyChats) {
        for (const c of dailyChats) {
          const day = c.created_at?.split('T')[0]?.slice(5);
          const entry = daily.find(d => d.day === day);
          if (entry) entry.chats++;
        }
      }

      const { data: dailyImages } = await (svc as any)
        .from('generated_images')
        .select('created_at')
        .gte('created_at', sinceDate);
      
      if (dailyImages) {
        for (const img of dailyImages) {
          const day = img.created_at?.split('T')[0]?.slice(5);
          const entry = daily.find(d => d.day === day);
          if (entry) entry.images++;
        }
      }
    } catch {}

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers || 0,
          newToday: newToday || 0,
          newThisWeek: newThisWeek || 0,
          active24h: 0,
        },
        revenue: {
          mrr: (activeSubs || 0) * 29,
          today: 0,
          thisMonth: 0,
        },
        usage: {
          chats: totalChats || 0,
          chatsToday: chatsToday || 0,
          images: totalImages || 0,
          imagesToday: imagesToday || 0,
          ads: (totalImages || 0),
          adsToday: imagesToday || 0,
        },
        subscriptions: {
          total: (activeSubs || 0) + (trialingSubs || 0),
          active: activeSubs || 0,
          trialing: trialingSubs || 0,
        },
        daily,
      },
    });
  } catch (err) {
    console.error('[admin/stats] Error:', err);
    return NextResponse.json({
      stats: {
        users: { total: 0, newToday: 0, newThisWeek: 0, active24h: 0 },
        revenue: { mrr: 0, today: 0, thisMonth: 0 },
        usage: { chats: 0, chatsToday: 0, images: 0, imagesToday: 0, ads: 0, adsToday: 0 },
        subscriptions: { total: 0, active: 0, trialing: 0 },
        daily: [],
      },
    });
  }
}
