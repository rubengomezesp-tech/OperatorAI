/**
 * Push notifications — server-only.
 *
 * Direct function (no HTTP endpoint). Call from any server-side code:
 *   import { sendPushNotification } from '@/lib/push';
 *   await sendPushNotification({ userId, title, body, url });
 *
 * Why direct function instead of /api/push/send:
 * - No public attack surface
 * - No need to validate auth (caller is already server-side)
 * - Faster (no HTTP round-trip)
 * - Standard Next.js pattern for server-only utilities
 */

import 'server-only';
import webpush from 'web-push';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:rubengomezesp@gmail.com';

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface SendPushOptions {
  /** User ID to notify */
  userId: string;
  /** Notification title */
  title: string;
  /** Notification body (optional) */
  body?: string;
  /** URL to open when clicked (optional) */
  url?: string;
  /** Custom icon (optional, defaults to app icon) */
  icon?: string;
}

export interface SendPushResult {
  success: boolean;
  reason?: 'no_subscription' | 'vapid_not_configured' | 'send_failed';
  error?: string;
}

/**
 * Send a push notification to a user.
 * Returns result instead of throwing — caller decides how to handle.
 */
export async function sendPushNotification(
  options: SendPushOptions
): Promise<SendPushResult> {
  const { userId, title, body, url, icon } = options;

  if (!userId || !title) {
    return { success: false, reason: 'send_failed', error: 'userId and title required' };
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[push] VAPID keys not configured — skipping notification');
    return { success: false, reason: 'vapid_not_configured' };
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const svc = createSupabaseServiceClient();
    const { data: sub } = await (svc as any)
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('user_id', userId)
      .single();

    if (!sub?.endpoint) {
      return { success: false, reason: 'no_subscription' };
    }

    const pushSub = { endpoint: sub.endpoint, keys: sub.keys };
    const payload = JSON.stringify({ title, body, url, icon });

    await webpush.sendNotification(pushSub, payload);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[push] send failed', {
      userId,
      title,
      error: message,
    });
    return { success: false, reason: 'send_failed', error: message };
  }
}

// ────────────────────────────────────────────────────────────────
// LEGACY — kept for backwards compatibility
// ────────────────────────────────────────────────────────────────

/**
 * @deprecated Use sendPushNotification() instead.
 * This was previously calling /api/push/send (which is being removed).
 */
export async function notify(
  userId: string,
  title: string,
  body?: string,
  url?: string
): Promise<void> {
  await sendPushNotification({ userId, title, body, url });
}
