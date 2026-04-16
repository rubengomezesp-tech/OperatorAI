'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';
import { AppleButton } from '@/components/auth/apple-button';
import { LanguageToggle, useI18n } from '@/lib/i18n';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<null | 'google' | 'apple'>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t('auth.check_email'));
    router.push('/login');
  }

  async function signUpWith(provider: 'google' | 'apple') {
    setOauth(provider);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/auth/callback' },
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
            <h1 className="font-display text-[28px]">
              {t('auth.create_account_title')}
            </h1>
            <p className="text-[13.5px] text-fg-muted mt-1">
              {t('auth.sign_up_subtitle')}
            </p>
          </div>
          <LanguageToggle />
        </div>

        <div className="space-y-2.5">
          <AppleButton
            onClick={() => signUpWith('apple')}
            loading={oauth === 'apple'}
            disabled={!!oauth}
            label={t('auth.continue_with_apple')}
          />

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => signUpWith('google')}
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
            <Label htmlFor="name">{t('auth.full_name')}</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {t('auth.create_account_btn')}
          </Button>
        </form>

        <div className="text-center text-[13px] text-fg-muted">
          {t('auth.already_have_account')}{' '}
          <Link href="/login" className="text-gold hover:underline">
            {t('auth.sign_in')}
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
