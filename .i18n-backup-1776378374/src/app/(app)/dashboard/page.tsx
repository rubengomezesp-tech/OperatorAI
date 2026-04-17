import Link from 'next/link';
import { Rocket, MessageSquare, Sparkles, Zap, Target, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative px-6 lg:px-10 pt-10 lg:pt-14 pb-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full gold-grad opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="relative max-w-[960px] mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Operator AI</div>
          <h1 className="font-display text-[40px] lg:text-[52px] leading-[1.02] mb-4">
            Deploy missions. <span className="text-gold-grad">Not prompts.</span>
          </h1>
          <p className="text-[15px] text-fg-muted max-w-[540px] leading-relaxed mb-8">
            Your autonomous operations platform. Tell Operator what you want achieved &mdash; it orchestrates the work.
          </p>
        </div>
      </section>

      {/* Missions — hero tile */}
      <section className="px-6 lg:px-10 pb-6">
        <div className="max-w-[960px] mx-auto">
          <Link
            href="/missions"
            className="group block relative rounded-2xl border border-gold/30 bg-gradient-to-br from-surface via-surface-2 to-bg p-8 lg:p-10 overflow-hidden hover:border-gold/60 transition-all"
          >
            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full gold-grad opacity-[0.10] blur-3xl pointer-events-none group-hover:opacity-[0.18] transition-opacity" />
            <div className="relative flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-gold bg-gold/10 border border-gold/20 rounded px-2 py-0.5 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  <span>New paradigm</span>
                </div>
                <h2 className="font-display text-[28px] lg:text-[34px] leading-tight mb-2.5">
                  Your first <span className="text-gold-grad">Mission</span>.
                </h2>
                <p className="text-[14px] text-fg-muted leading-relaxed max-w-[440px] mb-5">
                  Define an objective. Operator deploys agents, generates content, runs the workflow, and tracks outcomes. You approve. It executes.
                </p>
                <div className="inline-flex items-center gap-2 h-9 px-4 rounded-md gold-grad text-bg text-[13px] font-medium group-hover:brightness-110 transition">
                  <Rocket className="h-3.5 w-3.5" />
                  <span>Deploy a Mission</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>
              <div className="hidden lg:flex shrink-0 h-28 w-28 rounded-2xl border border-gold/30 bg-gold/5 items-center justify-center">
                <Rocket className="h-12 w-12 text-gold" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Core modules — 4 tiles */}
      <section className="px-6 lg:px-10 pb-12">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Core modules</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ModuleTile
              href="/chat"
              icon={MessageSquare}
              label="Chat"
              description="Talk to your brand AI. Ask, generate, execute &mdash; in one conversation."
              kbd="G+C"
            />
            <ModuleTile
              href="/studio/image"
              icon={Sparkles}
              label="Studio"
              description="Imagery and video, on-brand by default. Imagen 4, Flux 2 Pro, Veo 3.1."
              kbd="G+I"
            />
            <ModuleTile
              href="/workflows"
              icon={Zap}
              label="Workflows"
              description="Multi-step automations. Chain agents, integrations, and schedules."
              kbd="G+W"
            />
            <ModuleTile
              href="/brand-os"
              icon={Target}
              label="Brand OS"
              description="The rules your brand runs on. Colors, tone, words. Enforced on every output."
              kbd="G+B"
              isNew
            />
          </div>
        </div>
      </section>

      {/* Secondary — quick access */}
      <section className="px-6 lg:px-10 pb-16">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Also here</div>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/projects', label: 'Projects' },
              { href: '/knowledge', label: 'Knowledge' },
              { href: '/files', label: 'Files' },
              { href: '/voice', label: 'Voice' },
              { href: '/assistants', label: 'Agents' },
              { href: '/settings/integrations', label: 'Integrations' },
              { href: '/settings/memory', label: 'Memory' },
              { href: '/settings/billing', label: 'Billing' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 transition"
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleTile({
  href, icon: Icon, label, description, kbd, isNew,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  kbd?: string;
  isNew?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-border bg-surface p-5 hover:border-gold/40 hover:bg-surface-2 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-[17px] group-hover:text-gold transition-colors">{label}</span>
            {isNew && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold text-bg font-bold uppercase tracking-[0.1em]">New</span>
            )}
          </div>
          <p className="text-[12.5px] text-fg-muted leading-relaxed">{description}</p>
        </div>
        {kbd && (
          <div className="hidden lg:flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {kbd.split('+').map((k, i) => (
              <kbd
                key={i}
                className="min-w-[18px] h-5 px-1 rounded bg-surface-3 border border-border text-[9.5px] font-mono text-fg-subtle flex items-center justify-center"
              >
                {k}
              </kbd>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
