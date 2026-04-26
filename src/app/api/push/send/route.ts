/**
 * DEPRECATED ENDPOINT — /api/push/send
 *
 * This endpoint was previously used as a server-to-server call from
 * src/lib/push.ts. It has been replaced by direct function calls to
 * sendPushNotification() from '@/lib/push'.
 *
 * This stub remains to:
 * 1. Reject any leftover external callers (security)
 * 2. Allow safe future removal once we confirm nothing uses it
 *
 * Migration:
 *   import { sendPushNotification } from '@/lib/push';
 *   await sendPushNotification({ userId, title, body, url });
 *
 * TODO: Remove this file in a future cleanup once we verify no
 * external code depends on the endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This endpoint has been deprecated.',
      migration: "Use sendPushNotification() from '@/lib/push' directly in server code.",
    },
    { status: 410 } // 410 Gone — endpoint deliberately removed
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated.' },
    { status: 410 }
  );
}
