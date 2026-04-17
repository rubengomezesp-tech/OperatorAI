import Link from 'next/link';
import { Plug, Brain, CreditCard, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const sections = [
  {
    href: '/settings/integrations',
    label: 'Integrations',
    description: 'Connect Gmail, Calendar, Notion, Slack, Drive and more.',
    icon: Plug,
  },
  {
    href: '/settings/memory',
    label: 'Memory & Voice',
    description: 'What Operator knows about you. Your voice fingerprint.',
    icon: Brain,
  },
  {
    href: '/settings/billing',
    label: 'Billing',
    description: 'Plan, invoices, payment method.',
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[860px] w-full mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
        <h1 className="font-display text-[32px]">Settings</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">
          Manage your workspace, integrations, and account.
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-2 hover:border-gold/40 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
                <Icon className="h-4.5 w-4.5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[16px] group-hover:text-gold transition-colors">
                  {s.label}
                </div>
                <div className="text-[12.5px] text-fg-muted mt-0.5">{s.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
