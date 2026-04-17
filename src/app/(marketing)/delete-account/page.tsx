'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/lib/i18n';
import { AlertTriangle } from 'lucide-react';

export default function DeleteAccountPage() {
  const { locale } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would call an API
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-[860px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
          <span className="font-display text-[15px]">Operator AI</span>
        </Link>
        <LanguageToggle />
      </nav>
      <main className="max-w-[520px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h1 className="font-display text-[28px]">
            {locale === 'es' ? 'Eliminar cuenta' : 'Delete Account'}
          </h1>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
            <p className="text-[14px] text-fg-soft">
              {locale === 'es'
                ? 'Hemos recibido tu solicitud. Recibirás un email de confirmación en 24 horas. Todos tus datos serán eliminados en un plazo de 30 días.'
                : 'We have received your request. You will receive a confirmation email within 24 hours. All your data will be deleted within 30 days.'}
            </p>
            <Link href="/" className="inline-block mt-4 text-[13px] text-gold hover:underline">
              {locale === 'es' ? 'Volver al inicio' : 'Back to home'}
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <p className="text-[14px] text-fg-soft leading-relaxed">
              {locale === 'es'
                ? 'Al eliminar tu cuenta, se borrarán permanentemente todos tus datos, incluyendo conversaciones, archivos, proyectos y configuraciones. Esta acción no se puede deshacer.'
                : 'Deleting your account will permanently remove all your data, including conversations, files, projects, and settings. This action cannot be undone.'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[12px] uppercase tracking-[0.12em] text-fg-muted mb-1 block">
                  {locale === 'es' ? 'Confirma tu email' : 'Confirm your email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-md border border-border bg-surface-2 px-3.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-red-400/60 focus:ring-2 focus:ring-red-400/15"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[14px] font-medium hover:bg-red-500/25 transition-colors"
              >
                {locale === 'es' ? 'Solicitar eliminación' : 'Request deletion'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <Link href="/" className="text-[13px] text-gold hover:underline">
            &larr; {locale === 'es' ? 'Volver a la app' : 'Back to app'}
          </Link>
        </div>
      </main>
    </div>
  );
}
