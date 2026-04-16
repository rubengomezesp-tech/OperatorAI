import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Sparkles, Eye, Clock, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

async function fetchShare(slug: string) {
  const h = await headers();
  const host = h.get('host') ?? 'www.operatoraiapp.com';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const url = `${proto}://${host}/api/share/get/${slug}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<{
    title: string;
    visibility: string;
    viewCount: number;
    createdAt: string;
    ownerName: string;
    messages: Message[];
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchShare(slug);
  if (!data) return { title: 'Conversation — Operator AI' };
  return {
    title: `${data.title ?? 'Conversation'} — Operator AI`,
    description: `A shared conversation on Operator AI — the AI studio for your brand.`,
    openGraph: {
      title: data.title ?? 'Conversation',
      description: `Shared by ${data.ownerName} on Operator AI.`,
      images: ['/icons/icon-512.png'],
    },
  };
}

export default async function SharedConversationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchShare(slug);
  if (!data) notFound();

  const date = new Date(data.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-border">
        <div className="max-w-[820px] mx-auto flex items-center justify-between h-14 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] tracking-tight">Operator</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">AI</span>
            </div>
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md gold-grad text-bg text-[12px] font-medium hover:brightness-110 transition"
          >
            <span>Try it free</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[820px] mx-auto px-5 lg:px-8 pt-10 pb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Shared conversation
        </div>
        <h1 className="font-display text-[32px] lg:text-[40px] leading-tight mb-4">
          {data.title ?? 'Untitled conversation'}
        </h1>
        <div className="flex items-center gap-5 text-[12px] text-fg-muted">
          <span>Shared by <span className="text-fg">{data.ownerName}</span></span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            {data.viewCount} {data.viewCount === 1 ? 'view' : 'views'}
          </span>
        </div>
      </section>

      {/* Messages */}
      <section className="max-w-[820px] mx-auto px-5 lg:px-8 pb-16">
        <div className="space-y-5">
          {data.messages.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[13px] text-fg-muted">This conversation has no messages yet.</p>
            </div>
          ) : (
            data.messages.map((m) => {
              if (m.role === 'system') return null;
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center gold-grad">
                      <Sparkles className="h-3.5 w-3.5 text-bg" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-lg px-4 py-3 ${
                    isUser
                      ? 'bg-surface-2 border border-border text-fg'
                      : 'bg-surface border border-border text-fg-soft'
                  }`}>
                    <div className="text-[10px] uppercase tracking-[0.14em] mb-1 text-fg-subtle">
                      {isUser ? data.ownerName : 'Operator AI'}
                    </div>
                    <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                  {isUser && (
                    <div className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center bg-surface-2 border border-border text-[10px] font-medium text-fg-muted">
                      {data.ownerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border bg-surface/40 py-14 px-5 lg:px-8 text-center overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-[500px] rounded-full gold-grad opacity-[0.08] blur-3xl pointer-events-none" />
        <div className="relative max-w-[620px] mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Operator AI</div>
          <h2 className="font-display text-[28px] lg:text-[36px] leading-tight mb-4">
            Run your brand like a <span className="text-gold-grad">studio</span>.
          </h2>
          <p className="text-[14px] text-fg-muted mb-7 max-w-[460px] mx-auto">
            Chat, imagery, video, voice, and workflows — unified under one AI that knows your brand. 7 days free. No card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md gold-grad text-bg text-[13.5px] font-medium hover:brightness-110 transition"
          >
            <span>Get started free</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-5">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <div className="text-[11.5px] text-fg-muted">
            &copy; {new Date().getFullYear()} Operator AI
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[11.5px] text-fg-muted hover:text-gold">Privacy</Link>
            <Link href="/terms" className="text-[11.5px] text-fg-muted hover:text-gold">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
