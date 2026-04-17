'use client';
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function PushNotificationPrompt() {
  const { locale } = useI18n();
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<string>('default');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPermission(Notification.permission);
    // Show prompt after 10 seconds if not yet decided
    if (Notification.permission === 'default') {
      const timer = setTimeout(() => {
        if (!sessionStorage.getItem('operator.push-dismissed')) {
          setShow(true);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function enable() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        // Register for push
        const reg = await navigator.serviceWorker.ready;
        // For now just show a local notification as confirmation
        reg.showNotification('Operator AI', {
          body: locale === 'es' ? 'Notificaciones activadas ✓' : 'Notifications enabled ✓',
          icon: '/icons/icon-192x192.png',
        });
      }
      setShow(false);
    } catch {
      setShow(false);
    }
  }

  function dismiss() {
    setShow(false);
    sessionStorage.setItem('operator.push-dismissed', '1');
  }

  if (!show || permission !== 'default') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-[340px] animate-fade-in-up">
      <div className="rounded-xl border border-gold/30 bg-surface shadow-[0_20px_60px_-15px_rgb(0_0_0_/_0.5)] p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-10 w-10 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-gold" />
          </div>
          <button onClick={dismiss} className="text-fg-muted hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <div className="font-display text-[16px] mb-1">
            {locale === 'es' ? 'Activa las notificaciones' : 'Enable notifications'}
          </div>
          <p className="text-[12.5px] text-fg-muted leading-relaxed">
            {locale === 'es'
              ? 'Recibe alertas cuando tus imágenes estén listas, tus misiones avancen o necesiten tu aprobación.'
              : 'Get alerts when your images are ready, missions progress, or need your approval.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={enable}
            className="flex-1 h-9 rounded-md gold-grad text-bg text-[13px] font-medium hover:brightness-110 transition"
          >
            {locale === 'es' ? 'Activar' : 'Enable'}
          </button>
          <button
            onClick={dismiss}
            className="h-9 px-3 rounded-md border border-border bg-surface-2 text-[13px] text-fg-muted hover:text-fg transition"
          >
            {locale === 'es' ? 'Ahora no' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
}
