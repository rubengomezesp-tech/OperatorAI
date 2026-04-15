'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PLANS } from '@/features/billing/data/plans';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(planId: 'starter' | 'pro' | 'studio' | 'agency') {
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push('/signup?next=/pricing'); return; }
        throw new Error(body?.error ?? 'Could not start checkout');
      }
      if (body.url) window.location.href = body.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] py-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Pricing</div>
          <h1 className="font-display text-[48px] leading-[1.05] mb-4">
            Operator AI is <span className="text-gold-grad">priced to pay off</span> in a week
          </h1>
          <p className="text-[15px] text-fg-muted max-w-[560px] mx-auto">
            Three plans, all models included, all features included. Cancel anytime.
            <span className="block mt-2 text-fg-subtle">7-day free trial, no card required.</span>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1080px] mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border p-7 flex flex-col',
                plan.highlight
                  ? 'border-gold/50 bg-gold/5 shadow-2xl shadow-gold/10'
                  : 'border-border bg-surface',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 px-2.5 rounded-full gold-grad text-[10px] uppercase tracking-[0.14em] text-bg font-semibold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Most popular
                </div>
              )}
              <div className="mb-5">
                <h3 className="font-display text-[22px] mb-1">{plan.name}</h3>
                <p className="text-[12.5px] text-fg-muted">{plan.tagline}</p>
              </div>
              <div className="mb-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[44px] leading-none">{plan.priceDisplay}</span>
                  <span className="text-[13px] text-fg-muted">/month</span>
                </div>
              </div>
              <Button
                size="md"
                variant={plan.highlight ? 'primary' : 'outline'}
                onClick={() => startCheckout(plan.id)}
                loading={loading === plan.id}
                className="w-full mb-5"
              >
                <span>{plan.cta}</span>
              </Button>
              <div className="space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-[13px]">
                    <Check className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', plan.highlight ? 'text-gold' : 'text-fg-soft')} />
                    <span className={plan.highlight ? 'text-fg' : 'text-fg-soft'}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <p className="text-[13px] text-fg-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
