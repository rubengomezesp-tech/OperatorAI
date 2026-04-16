import Link from 'next/link';
import { ArrowRight, Rocket, Target, Zap, Sparkles, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'Operator AI — Deploy missions. Not prompts.',
  description: 'The autonomous operations platform for brands. Deploy missions, enforce your brand, track outcomes.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between h-14 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] tracking-tight">Operator</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">AI</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-fg-muted">
            <Link href="/pricing" className="hover:text-gold transition-colors">Pricing</Link>
            <Link href="/changelog" className="hover:text-gold transition-colors">Changelog</Link>
            <Link href="/login" className="hover:text-gold transition-colors">Log in</Link>
          </nav>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md gold-grad text-bg text-[12px] font-medium hover:brightness-110 transition"
          >
            <span>Start 7-day free trial</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 lg:px-8 pt-20 lg:pt-28 pb-20 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full gold-grad opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="relative max-w-[920px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3.5 py-1 text-[11px] uppercase tracking-[0.14em] text-gold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>Operator AI v4.0</span>
          </div>
          <h1 className="font-display text-[52px] lg:text-[80px] leading-[0.98] mb-6">
            Deploy missions.<br />
            <span className="text-gold-grad">Not prompts.</span>
          </h1>
          <p className="text-[16px] lg:text-[18px] text-fg-muted max-w-[620px] mx-auto leading-relaxed mb-10">
            Operator AI is the autonomous operations platform for brands. Define an objective. Deploy a mission.
            Agents orchestrate the work. You review outcomes, not prompts.
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition"
            >
              <span>Start 7-day free trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-md border border-border bg-surface-2 text-fg text-[14px] hover:border-gold/40 transition"
            >
              View pricing
            </Link>
          </div>
          <p className="text-[11.5px] text-fg-subtle uppercase tracking-[0.14em]">
            No card required &middot; Starter from $29/mo
          </p>
        </div>
      </section>

      {/* Compare */}
      <section className="px-5 lg:px-8 pb-20">
        <div className="max-w-[920px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">The shift</div>
            <h2 className="font-display text-[32px] lg:text-[40px] leading-tight">
              From prompts to <span className="text-gold-grad">operations</span>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-6 opacity-80">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">The old way</div>
              <div className="text-[16px] font-display mb-4">Write prompt. Copy. Edit. Repeat.</div>
              <ul className="space-y-2 text-[13px] text-fg-muted">
                <li>&bull; Open 5 AI tools</li>
                <li>&bull; Craft prompts for each</li>
                <li>&bull; Manually copy outputs</li>
                <li>&bull; Check every output for brand consistency</li>
                <li>&bull; No memory of what worked</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full gold-grad opacity-[0.12] blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-gold mb-3">With Operator</div>
                <div className="text-[16px] font-display mb-4">Deploy mission. Review outcomes.</div>
                <ul className="space-y-2 text-[13px] text-fg-muted">
                  <li className="text-fg">&bull; One objective, one click</li>
                  <li className="text-fg">&bull; Agents orchestrate automatically</li>
                  <li className="text-fg">&bull; Brand OS enforces every output</li>
                  <li className="text-fg">&bull; Outcomes tracked, learning applied</li>
                  <li className="text-fg">&bull; You approve. It executes.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core pillars */}
      <section className="px-5 lg:px-8 pb-24">
        <div className="max-w-[1020px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Three pillars</div>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-tight">
              Everything runs on <span className="text-gold-grad">your brand</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Pillar
              icon={Rocket}
              title="Missions"
              description="Deploy autonomous objectives. Agents generate, execute, and track for you."
            />
            <Pillar
              icon={Target}
              title="Brand OS"
              description="Your colors, words, tone &mdash; enforced on every output. On-brand by default."
            />
            <Pillar
              icon={Zap}
              title="Workflows"
              description="Multi-step automations with real integrations. Schedule, trigger, chain."
            />
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="relative px-5 lg:px-8 py-24 border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-[500px] rounded-full gold-grad opacity-[0.05] blur-3xl pointer-events-none" />
        <div className="relative max-w-[720px] mx-auto text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Ready when you are</div>
          <h2 className="font-display text-[40px] lg:text-[56px] leading-tight mb-5">
            Run your brand like a <span className="text-gold-grad">studio</span>.
          </h2>
          <p className="text-[15px] text-fg-muted max-w-[500px] mx-auto mb-8">
            Start free for 7 days. No card required. Cancel anytime. Plans from $29/month.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition"
            >
              <span>Start free trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-md border border-border bg-surface-2 text-fg text-[14px] hover:border-gold/40 transition"
            >
              See plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-5">
        <div className="max-w-[1020px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Operator AI" className="h-6 w-6 rounded" />
            <span className="text-[12px] text-fg-muted">&copy; {new Date().getFullYear()} Operator AI</span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-fg-muted">
            <Link href="/pricing" className="hover:text-gold">Pricing</Link>
            <Link href="/changelog" className="hover:text-gold">Changelog</Link>
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({
  icon: Icon, title, description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 hover:border-gold/40 transition-all">
      <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <h3 className="font-display text-[20px] mb-2">{title}</h3>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{description}</p>
    </div>
  );
}
