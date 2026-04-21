'use client';
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function PushNotificationPrompt() {
  const { locale } = useI18n();
  const es = locale === 'es';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem('operator.push-dismissed')) return;
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  async function enable() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setShow(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setShow(false);
      localStorage.setItem('operator.push-enabled', '1');
    } catch (e) {
      console.error('[push-subscribe]', e);
      setShow(false);
    }
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem('operator.push-dismissed', '1');
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] animate-fade-in-up">
      <div className="rounded-xl border border-gold/20 bg-surface shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[14px] mb-1">
              {es ? 'Activar notificaciones' : 'Enable notifications'}
            </div>
            <p className="text-[12px] text-fg-muted leading-relaxed mb-3">
              {es
                ? 'Recibe avisos cuando tus imagenes y videos esten listos, incluso si cierras la app.'
                : 'Get notified when your images and videos are ready, even if you close the app.'}
            </p>
            <div className="flex gap-2">
              <button onClick={enable} className="h-8 px-4 rounded-lg gold-grad text-bg text-[12px] font-medium hover:brightness-110 transition">
                {es ? 'Activar' : 'Enable'}
              </button>
              <button onClick={dismiss} className="h-8 px-4 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg transition-colors">
                {es ? 'Ahora no' : 'Not now'}
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-fg-subtle hover:text-fg shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
