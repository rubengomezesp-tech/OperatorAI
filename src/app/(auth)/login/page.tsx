'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';
import { AppleButton } from '@/components/auth/apple-button';
import { LanguageToggle, useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/dashboard';
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<null | 'google' | 'apple'>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    router.push(next);
    router.refresh();
  }

  async function signInWith(provider: 'google' | 'apple') {
    setOauth(provider);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          window.location.origin +
          '/auth/callback?next=' +
          encodeURIComponent(next),
      },
    });
    if (error) {
      setOauth(null);
      toast.error(error.message);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px]">{t('auth.welcome_back')}</h1>
            <p className="text-[13.5px] text-fg-muted mt-1">
              {t('auth.sign_in_subtitle')}
            </p>
          </div>
          <LanguageToggle />
        </div>

        <div className="space-y-2.5">
          <AppleButton
            onClick={() => signInWith('apple')}
            loading={oauth === 'apple'}
            disabled={!!oauth}
            label={t('auth.continue_with_apple')}
          />

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => signInWith('google')}
            loading={oauth === 'google'}
            disabled={!!oauth}
          >
            {t('auth.continue_with_google')}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
            {t('auth.or')}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label
              htmlFor="password"
              hint={
                <Link
                  href="/forgot-password"
                  className="text-fg-subtle hover:text-gold"
                >
                  {t('auth.forgot')}
                </Link>
              }
            >
              {t('auth.password')}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {t('auth.sign_in')}
          </Button>
        </form>

        <div className="text-center text-[13px] text-fg-muted">
          {t('auth.new_here')}{' '}
          <Link href="/signup" className="text-gold hover:underline">
            {t('auth.create_account_link')}
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
