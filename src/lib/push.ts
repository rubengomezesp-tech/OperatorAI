/** Send push notification to a user */
export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  try {
    await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url: url || '/dashboard' }),
    });
  } catch (e) {
    console.error('[push]', e);
  }
}
