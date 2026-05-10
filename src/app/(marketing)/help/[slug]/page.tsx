import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronLeft, Mail } from 'lucide-react';
import { getArticleBySlug, HELP_CATEGORIES } from '@/lib/help/articles';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Help — Operator AI' };
  return {
    title: `${article.title} — Operator AI Help`,
    description: article.excerpt,
  };
}

/**
 * Renderer simple de markdown ligero.
 * Soporta: ** bold **, [text](url), ## h2, ### h3, listas con -
 */
function renderMarkdown(body: string): React.ReactNode {
  const lines = body.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  function flushList() {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1.5 my-3 text-fg-muted text-[14.5px] leading-relaxed">
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
          ))}
        </ul>,
      );
      currentList = [];
    }
  }

  function inlineMd(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F5F5F5">$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#C9A863;text-decoration:underline">$1</a>')
      .replace(/`([^`]+)`/g, '<code style="background:#1F1F1F;padding:1px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13px">$1</code>');
  }

  for (const line of lines) {
    if (line.startsWith('- ')) {
      currentList.push(line.slice(2));
      continue;
    }
    flushList();

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={elements.length} className="font-display text-[16px] text-gold mt-6 mb-2">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={elements.length} className="font-display text-[20px] mt-8 mb-3">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.trim() === '') {
      // empty line — skip (paragraph breaks handled below)
    } else {
      elements.push(
        <p
          key={elements.length}
          className="text-[14.5px] text-fg-muted leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: inlineMd(line) }}
        />,
      );
    }
  }

  flushList();
  return <>{elements}</>;
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const category = HELP_CATEGORIES.find((c) => c.id === article.category);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted hover:text-gold transition-colors mb-8"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Help center
        </Link>

        {/* Header */}
        <div className="mb-8">
          {category && (
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
              {category.label}
            </div>
          )}
          <h1 className="font-display text-[34px] leading-tight mb-3">{article.title}</h1>
          <p className="text-[15px] text-fg-muted leading-relaxed">{article.excerpt}</p>
        </div>

        {/* Body */}
        <div className="rounded-xl border border-border bg-surface-2 px-6 py-6">
          {renderMarkdown(article.body)}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-fg-muted mb-3">Did this article help?</p>
          <a
            href={`mailto:hi@operatoraiapp.com?subject=Feedback on: ${article.title}`}
            className="inline-flex items-center gap-2 text-[13px] text-gold hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            Send feedback
          </a>
        </div>
      </div>
    </div>
  );
}
