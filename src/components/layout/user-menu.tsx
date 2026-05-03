'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, CreditCard, Settings, LogOut, Brain, Plug, Shield, Bell, HelpCircle, Palette, Globe } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface Props {
  email: string;
  fullName: string | null;
}

export function UserMenu({ email, fullName }: Props) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string>('Free');
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isAdmin = email === 'rubengomezesp@gmail.com';

  const initials = (fullName || email || 'U')
    .split(/[\s@.]/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '').join('') || 'U';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch('/api/billing/current').then(r => r.json()).then(d => {
      if (d.planId) setPlan(d.planId.charAt(0).toUpperCase() + d.planId.slice(1));
    }).catch(() => {});
  }, [open]);

  async function handleLogout() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch { toast.error('Logout failed'); }
  }

  const t = (en: string, es: string) => locale === 'es' ? es : en;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'h-9 w-9 rounded-full border border-border flex items-center justify-center text-[11.5px] font-medium uppercase tracking-wider transition-all',
          open ? 'bg-gold/15 border-gold/50 text-gold' : 'bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40',
        )}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[280px] surface-raised rounded-lg border border-border shadow-2xl overflow-hidden z-50 animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-border relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full gold-grad opacity-[0.12] blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="h-11 w-11 rounded-full gold-grad flex items-center justify-center text-bg text-[14px] font-medium shrink-0">{initials}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium truncate">{fullName || email}</div>
                <div className="text-[11px] text-fg-muted truncate">{email}</div>
                <div className="text-[10px] text-gold mt-0.5">Plan {plan}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-1.5">
            <MLink href="/settings/profile" icon={User} onClick={() => setOpen(false)}>{t('Profile', 'Perfil')}</MLink>
            <MLink href="/brand-os" icon={Palette} onClick={() => setOpen(false)}>Brand OS</MLink>
            <MLink href="/billing" icon={CreditCard} onClick={() => setOpen(false)}>{t('Billing', 'Facturación')}</MLink>
            <MLink href="/settings/integrations" icon={Plug} onClick={() => setOpen(false)}>{t('Integrations', 'Integraciones')}</MLink>
            <MLink href="/settings/memory" icon={Brain} onClick={() => setOpen(false)}>{t('Memory', 'Memoria')}</MLink>
            <MLink href="/settings" icon={Settings} onClick={() => setOpen(false)}>{t('Settings', 'Ajustes')}</MLink>
            <MLink href="/support" icon={HelpCircle} onClick={() => setOpen(false)}>{t('Support', 'Soporte')}</MLink>
          </nav>

          {/* Language toggle */}
          <div className="border-t border-border p-1.5">
            <div className="flex items-center justify-between px-3 h-9 text-[13px] text-fg-muted">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4" />
                <span>{locale === 'es' ? 'Idioma' : 'Language'}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setLocale('es')}
                  className={cn(
                    'h-7 px-2 rounded text-[11px] uppercase tracking-wider transition-colors',
                    locale === 'es' ? 'bg-gold text-bg font-medium' : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                  )}
                >ES</button>
                <button
                  onClick={() => setLocale('en')}
                  className={cn(
                    'h-7 px-2 rounded text-[11px] uppercase tracking-wider transition-colors',
                    locale === 'en' ? 'bg-gold text-bg font-medium' : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                  )}
                >EN</button>
              </div>
            </div>
          </div>

          {/* Admin — only for CEO */}
          {isAdmin && (
            <div className="border-t border-border p-1.5">
              <MLink href="/admin" icon={Shield} onClick={() => setOpen(false)}>
                <span className="flex items-center gap-2">Admin <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wider">CEO</span></span>
              </MLink>
            </div>
          )}

          {/* Logout */}
          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('Sign out', 'Cerrar sesión')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MLink({ href, icon: Icon, onClick, children }: { href: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-3 h-9 rounded-md text-[13px] text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors">
      <Icon className="h-3.5 w-3.5" /><span>{children}</span>
    </Link>
  );
}
