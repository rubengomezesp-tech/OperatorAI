'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const tx: Record<string, Record<string, string>> = {
  tagline: {
    en: 'Your AI marketing operator. One conversation replaces an entire creative team.',
    es: 'Tu operador AI de marketing. Una conversación reemplaza un equipo creativo entero.',
  },
  product: { en: 'Product', es: 'Producto' },
  pricing: { en: 'Pricing', es: 'Precios' },
  login: { en: 'Log in', es: 'Entrar' },
  signup: { en: 'Get started', es: 'Empezar' },
  legal: { en: 'Legal', es: 'Legal' },
  privacy: { en: 'Privacy', es: 'Privacidad' },
  terms: { en: 'Terms', es: 'Términos' },
  cookies: { en: 'Cookies', es: 'Cookies' },
  delete_data: { en: 'Delete data', es: 'Borrar datos' },
  support: { en: 'Support', es: 'Soporte' },
  rights: {
    en: 'All rights reserved.',
    es: 'Todos los derechos reservados.',
  },
  made: {
    en: 'Made with intention.',
    es: 'Hecho con intención.',
  },
};

export function Footer() {
  const { locale } = useI18n();
  const t = (k: string) => tx[k]?.[locale] ?? tx[k]?.en ?? k;
  const year = new Date().getFullYear();

  const productLinks = [
    { href: '/pricing', label: t('pricing') },
    { href: '/login', label: t('login') },
    { href: '/signup', label: t('signup') },
  ];

  const legalLinks = [
    { href: '/privacy', label: t('privacy') },
    { href: '/terms', label: t('terms') },
    { href: '/cookies', label: t('cookies') },
    { href: '/delete-data', label: t('delete_data') },
    { href: '/support', label: t('support') },
  ];

  return (
    <footer className="relative border-t border-border bg-bg/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-fg hover:opacity-80 transition-opacity mb-3"
            >
              <div className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-bg" />
              </div>
              <span className="font-display text-[16px] tracking-tight">Operator</span>
            </Link>
            <p className="text-[12.5px] text-fg-muted leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">
              {t('product')}
            </h4>
            <ul className="space-y-2">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12.5px] text-fg-muted hover:text-gold transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">
              {t('legal')}
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12.5px] text-fg-muted hover:text-gold transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
          <div className="text-[11px] text-fg-subtle">
            &copy; {year} Operator AI. {t('rights')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            <span>{t('made')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
