'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  async function onApple() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  }

  async function onGoogle() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback?next=' + encodeURIComponent(next) },
    });
    if (error) toast.error(error.message);
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h1 className="font-display text-[28px]">Welcome back</h1>
          <p className="text-[13.5px] text-fg-muted mt-1">Sign in to Operator AI.</p>
        </div>

        <Button variant="secondary" size="lg" className="w-full" onClick={onGoogle}>
          Continue with Google
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={onApple}>
          Continue with Apple
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label
              htmlFor="password"
              hint={<Link href="/forgot-password" className="text-fg-subtle hover:text-gold">Forgot?</Link>}
            >
              Password
            </Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
        </form>

        <div className="text-center text-[13px] text-fg-muted">
          New here? <Link href="/signup" className="text-gold hover:underline">Create an account</Link>
        
      <div className="mt-4 flex justify-center gap-4 text-[10.5px] text-fg-subtle">
        <a href="/privacy" className="hover:text-gold transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-gold transition-colors">Terms</a>
        <a href="/support" className="hover:text-gold transition-colors">Support</a>
      </div>
</div>
      </CardBody>
    </Card>
  );
}
