'use client';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function BillingSuccessPage() {
  const { locale } = useI18n();
  return (
    <div className="px-6 lg:px-10 py-20 max-w-[520px] mx-auto text-center space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-gold/15 border border-gold/30 mx-auto flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-gold" />
      </div>
      <h1 className="font-display text-[32px]">
        {locale === 'es' ? '¡Bienvenido a Pro!' : 'Welcome to Pro!'}
      </h1>
      <p className="text-[14px] text-fg-muted leading-relaxed">
        {locale === 'es'
          ? 'Tu suscripción está activa. Ya tienes acceso a todas las funciones de tu plan. Empieza a crear.'
          : 'Your subscription is active. You now have access to all features in your plan. Start creating.'}
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/dashboard"
          className="h-10 px-5 rounded-md gold-grad text-bg text-[13.5px] font-medium flex items-center hover:brightness-110 transition"
        >
          {locale === 'es' ? 'Ir al dashboard' : 'Go to dashboard'}
        </Link>
        <Link
          href="/billing"
          className="h-10 px-5 rounded-md border border-border bg-surface-2 text-[13.5px] text-fg-muted flex items-center hover:border-gold/40 transition"
        >
          {locale === 'es' ? 'Ver mi plan' : 'View my plan'}
        </Link>
      </div>
    </div>
  );
}
