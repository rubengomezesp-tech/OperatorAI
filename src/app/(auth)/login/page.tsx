'use client';

/**
 * Login V3 — Split layout, premium feel
 * Left: form
 * Right: hero with Aurora + value prop (hidden on mobile)
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useI18n, LanguageToggle } from '@/lib/i18n';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Aurora } from '@/components/ui/aurora';
import { fadeUp, staggerContainer } from '@/lib/motion';

const tx: Record<string, Record<string, string>> = {
  back: { en: '← Home', es: '← Inicio' },
  h1: { en: 'Welcome back.', es: 'Bienvenido de vuelta.' },
  sub: { en: 'Pick up where you left off.', es: 'Continúa donde lo dejaste.' },
  email: { en: 'Email', es: 'Email' },
  password: { en: 'Password', es: 'Contraseña' },
  submit: { en: 'Log in', es: 'Entrar' },
  loading: { en: 'Signing in...', es: 'Entrando...' },
  no_account: { en: "Don't have an account?", es: '¿No tienes cuenta?' },
  signup_link: { en: 'Sign up', es: 'Crear cuenta' },
  forgot: { en: 'Forgot password?', es: '¿Olvidaste la contraseña?' },
  err_generic: { en: 'Could not sign in. Try again.', es: 'No pudimos iniciar sesión. Intenta de nuevo.' },
  hero_h2: { en: 'Your AI agency, ready when you are.', es: 'Tu agencia AI, lista cuando lo estés.' },
  hero_p: { en: 'One conversation replaces an entire creative team.', es: 'Una conversación reemplaza un equipo creativo entero.' },
};

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const t = (k: string) => tx[k]?.[locale] ?? tx[k]?.en ?? k;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw new Error(err.message);
      router.push('/chat');
      router.refresh();
    } catch (err) {
      setError(t('err_generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-vvh flex bg-bg">
      {/* Left: form */}
      <div className="w-full lg:w-1/2 relative flex flex-col px-6 sm:px-12 py-8 pb-32">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-[13.5px] text-fg-muted hover:text-fg transition-colors">
            {t('back')}
          </Link>
          <LanguageToggle />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
        >
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-md gold-grad flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-bg" />
              </div>
              <span className="font-display text-[19px] tracking-tight">Operator</span>
            </div>
            <h1 className="font-display text-[36px] sm:text-[44px] leading-[1.05] tracking-tight mb-2">
              {t('h1')}
            </h1>
            <p className="text-[14.5px] text-fg-muted">{t('sub')}</p>
          </motion.div>

          <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-fg-subtle mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 h-11 rounded-md bg-surface-2 border border-border focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20 text-[14px] text-fg transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] uppercase tracking-wider text-fg-subtle mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 h-11 rounded-md bg-surface-2 border border-border focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20 text-[14px] text-fg transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-[12.5px] text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-md gold-grad text-bg font-medium text-[14px] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_6px_24px_-6px_rgb(201_168_99_/_0.4)]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  {t('submit')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </motion.form>

          <motion.div variants={fadeUp} className="mt-6 flex items-center justify-between text-[13px]">
            <Link href="/forgot-password" className="text-fg-muted hover:text-fg transition-colors">
              {t('forgot')}
            </Link>
            <span className="text-fg-muted">
              {t('no_account')}{' '}
              <Link href="/signup" className="text-gold hover:text-gold/80 transition-colors font-medium">
                {t('signup_link')}
              </Link>
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Right: hero (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-l border-border">
        <Aurora intensity="strong" />
        <div className="relative z-10 flex flex-col justify-center px-12 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-4">
              Operator AI
            </div>
            <h2 className="font-display text-[36px] leading-[1.1] tracking-tight mb-4">
              {t('hero_h2')}
            </h2>
            <p className="text-[14.5px] text-fg-muted leading-relaxed">{t('hero_p')}</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
