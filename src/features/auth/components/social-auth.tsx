'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Provider = 'google' | 'apple';

export function SocialAuth({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const [loading, setLoading] = useState<Provider | null>(null);

  async function handleOAuth(provider: Provider) {
    setLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message);
        setLoading(null);
      }
      // En éxito Supabase redirige automáticamente, no hace falta más
    } catch {
      toast.error(isEs ? 'Error al conectar' : 'Connection failed');
      setLoading(null);
    }
  }

  const continueWith = isEs ? 'Continuar con' : 'Continue with';
  const dividerText = isEs ? 'o' : 'or';

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
        className={cn(
          'w-full h-11 rounded-md border border-border bg-surface-2 hover:bg-surface-3 hover:border-gold/30 transition-all flex items-center justify-center gap-2.5 text-[14px] font-medium text-fg disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <GoogleIcon />
        <span>{loading === 'google' ? '...' : `${continueWith} Google`}</span>
      </button>

      <button
        type="button"
        onClick={() => handleOAuth('apple')}
        disabled={loading !== null}
        className={cn(
          'w-full h-11 rounded-md border border-border bg-surface-2 hover:bg-surface-3 hover:border-gold/30 transition-all flex items-center justify-center gap-2.5 text-[14px] font-medium text-fg disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <AppleIcon />
        <span>{loading === 'apple' ? '...' : `${continueWith} Apple`}</span>
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-bg px-3 text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
            {dividerText}
          </span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 5.04c1.62 0 3.07.56 4.21 1.66l3.15-3.15C17.45 1.71 14.97.7 12 .7 7.39.7 3.4 3.34 1.46 7.16l3.66 2.84C6.05 7.13 8.78 5.04 12 5.04Z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.5-1.13 2.78-2.41 3.63l3.71 2.88c2.17-2 3.42-4.94 3.42-8.75Z"/>
      <path fill="#FBBC05" d="M5.13 14.27c-.27-.78-.43-1.61-.43-2.27 0-.66.16-1.49.42-2.27L1.46 6.89C.53 8.45 0 10.16 0 12c0 1.84.53 3.55 1.46 5.11l3.67-2.84Z"/>
      <path fill="#34A853" d="M12 23.3c3.24 0 5.95-1.07 7.93-2.93l-3.71-2.88c-1.04.7-2.39 1.12-4.22 1.12-3.22 0-5.95-2.09-6.92-4.96l-3.66 2.84C3.4 20.66 7.39 23.3 12 23.3Z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4 fill-fg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.45-2.09-.46-3.24 0-1.44.61-2.2.45-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z"/>
    </svg>
  );
}
