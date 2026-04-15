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

  async function startCheckout(planId: 'starter' | 'pro' | 'studio' | 'agency'cd /Users/macbook/operator-ai
cat > src/components/layout/sidebar.tsx << 'EOFSB'
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Mic,
  FileText, Brain, Sparkles, Plug, CreditCard, Settings,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

type SubItem = { href: string; label: string; icon: LucideIcon };
type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  children?: SubItem[];
};
type Section = { group: string; items: Item[] };

const nav: Section[] = [
  {
    group: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderOpen },
      { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
    ],
  },
  {
    group: 'Studio',
    items: [
      { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
      { href: '/voice', label: 'Voice Mode', icon: Mic },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { href: '/knowledge', label: 'Knowledge', icon: FileText },
      { href: '/settings/memory', label: 'Memory', icon: Brain },
    ],
  },
  {
    group: 'Manage',
    items: [
      { href: '/assistants', label: 'Assistants', icon: Sparkles },
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { href: '/settings/integrations', label: 'Integrations', icon: Plug },
          { href: '/settings/memory', label: 'Memory', icon: Brain },
          { href: '/settings/billing', label: 'Billing', icon: CreditCard },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSettings, setOpenSettings] = useState(
    pathname.startsWith('/settings'),
  );

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-border bg-bg">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-md gold-grad flex items-center justify-center">
            <span className="font-display text-[17px] text-bg leading-none">O</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[17px] tracking-tight">Operator</span>
            <span className="text-[10.5px] uppercase tracking-[0.2em] text-fg-muted mt-1">AI</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((section) => (
          <div key={section.group}>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">
              {section.group}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isSettings = item.href === '/settings';
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    !isSettings &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;

                if (item.children) {
                  const someChildActive = item.children.some((c) =>
                    pathname.startsWith(c.href),
                  );
                  const expanded = openSettings || someChildActive;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => setOpenSettings((v) => !v)}
                        className={cn(
                          'w-full relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
                          someChildActive
                            ? 'bg-surface-2 text-fg'
                            : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                        )}
                      >
                        {someChildActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />
                        )}
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            someChildActive && 'text-gold',
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform',
                            expanded && 'rotate-180',
                          )}
                        />
                      </button>
                      {expanded && (
                        <ul className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                          {item.children.map((c) => {
                            const subActive = pathname === c.href || pathname.startsWith(c.href + '/');
                            const SubIcon = c.icon;
                            return (
                              <li key={c.href}>
                                <Link
                                  href={c.href}
                                  className={cn(
                                    'flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[12.5px] transition-colors',
                                    subActive
                                      ? 'text-gold bg-gold/8'
                                      : 'text-fg-muted hover:text-fg hover:bg-surface-2/40',
                                  )}
                                >
                                  <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{c.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
                        active
                          ? 'bg-surface-2 text-fg'
                          : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />
                      )}
                      <Icon className={cn('h-4 w-4 shrink-0', active && 'text-gold')} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 h-4 text-[9.5px] tracking-[0.12em] uppercase rounded bg-gold/15 text-gold flex items-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="surface-raised p-3.5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-gold mb-1">Plan</div>
          <div className="text-[12.5px] text-fg-muted leading-snug">
            Explore Operator AI.
          </div>
          <Link
            href="/settings/billing"
            className="mt-2 inline-block text-[12px] text-fg hover:text-gold transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </aside>
  );
}
EOFSB
echo "OK sidebar reescrito"
) {
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
