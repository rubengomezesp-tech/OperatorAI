'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
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
      if (res.status === 401) {
        router.push('/login?next=/pricing');
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      if (body.url) window.location.href = body.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Pricing</div>
          <h1 className="font-display text-[44px] lg:text-[56px] leading-[1.05] mb-4">
            One AI <span className="text-gold-grad">operator</span> for every brand.
          </h1>
          <p className="text-[15px] text-fg-muted max-w-[560px] mx-auto">
            Start with a 7-day free trial. No card required. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'rounded-xl border p-6 flex flex-col',
                plan.highlight
                  ? 'border-gold/50 bg-surface-2 shadow-[0_8px_40px_-8px_rgb(201_168_99_/_0.25)]'
                  : 'border-border bg-surface',
              )}
            >
              <div className="mb-2">
                <div className="font-display text-[22px]">{plan.name}</div>
                <div className="text-[12.5px] text-fg-muted mt-0.5">{plan.tagline}</div>
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
          <p className="text-[12.5px] text-fg-muted">
            Need a custom plan or enterprise tier? <a href="mailto:hi@operatorai.app" className="text-gold hover:underline">Talk to us.</a>
          </p>
        </div>
      </div>
    </div>
  );
}
