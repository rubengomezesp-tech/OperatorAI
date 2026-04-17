'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/lib/i18n';
import { Mail, MessageSquare, FileText } from 'lucide-react';

export default function SupportPage() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-bg text-fg">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-[860px] mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
          <span className="font-display text-[15px]">Operator AI</span>
        </Link>
        <LanguageToggle />
      </nav>
      <main className="max-w-[860px] mx-auto px-6 py-12">
        <h1 className="font-display text-[36px] mb-2">{t('legal.support')}</h1>
        <p className="text-[14px] text-fg-muted mb-8">
          {locale === 'es'
            ? 'Estamos aquí para ayudarte. Elige cómo contactarnos.'
            : 'We are here to help. Choose how to reach us.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="mailto:support@operatorai.app" className="group rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center group-hover:bg-gold/15 transition-colors">
              <Mail className="h-5 w-5 text-gold" />
            </div>
            <div className="font-display text-[16px]">Email</div>
            <div className="text-[12.5px] text-fg-muted">support@operatorai.app</div>
          </a>

          <Link href="/chat" className="group rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center group-hover:bg-gold/15 transition-colors">
              <MessageSquare className="h-5 w-5 text-gold" />
            </div>
            <div className="font-display text-[16px]">{locale === 'es' ? 'Chat con IA' : 'AI Chat'}</div>
            <div className="text-[12.5px] text-fg-muted">{locale === 'es' ? 'Pregunta al agente' : 'Ask the agent'}</div>
          </Link>

          <Link href="/privacy" className="group rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center group-hover:bg-gold/15 transition-colors">
              <FileText className="h-5 w-5 text-gold" />
            </div>
            <div className="font-display text-[16px]">{locale === 'es' ? 'Documentación' : 'Documentation'}</div>
            <div className="text-[12.5px] text-fg-muted">{locale === 'es' ? 'Políticas y términos' : 'Policies and terms'}</div>
          </Link>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="text-[13px] text-gold hover:underline">&larr; {t('legal.back')}</Link>
        </div>
      </main>
    </div>
  );
}
