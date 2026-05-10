'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, BookOpen, CreditCard, Plug, Building2, AlertCircle, Mail } from 'lucide-react';
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  searchArticles,
  type HelpCategory,
} from '@/lib/help/articles';

const CATEGORY_ICONS: Record<HelpCategory, React.ReactNode> = {
  'getting-started': <BookOpen className="h-4 w-4" />,
  'billing': <CreditCard className="h-4 w-4" />,
  'integrations': <Plug className="h-4 w-4" />,
  'brands': <Building2 className="h-4 w-4" />,
  'troubleshooting': <AlertCircle className="h-4 w-4" />,
};

export function HelpCenterClient() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (query.trim()) {
      return searchArticles(query);
    }
    if (selectedCategory === 'all') {
      return HELP_ARTICLES;
    }
    return HELP_ARTICLES.filter((a) => a.category === selectedCategory);
  }, [query, selectedCategory]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            Operator AI · Help center
          </div>
          <h1 className="font-display text-[40px] mb-3">How can we help?</h1>
          <p className="text-[15px] text-fg-muted max-w-xl mx-auto">
            Everything you need to know about Operator AI. Search below or browse by category.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full h-12 pl-11 pr-4 rounded-lg bg-surface-2 border border-border focus:border-gold/40 outline-none text-[14px] placeholder:text-fg-subtle"
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Category tabs */}
        {!query.trim() && (
          <div className="flex flex-wrap gap-2 mb-8">
            <CategoryButton
              active={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </CategoryButton>
            {HELP_CATEGORIES.map((cat) => (
              <CategoryButton
                key={cat.id}
                active={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {CATEGORY_ICONS[cat.id]}
                {cat.label}
              </CategoryButton>
            ))}
          </div>
        )}

        {/* Results count when searching */}
        {query.trim() && (
          <div className="mb-6 text-[13px] text-fg-muted">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Articles list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-10 w-10 text-fg-subtle mx-auto mb-3" />
            <p className="text-[14px] text-fg-muted mb-4">
              No articles found. Try different keywords or contact support.
            </p>
            <a
              href="mailto:hi@operatoraiapp.com"
              className="inline-flex items-center gap-2 text-[13px] text-gold hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              hi@operatoraiapp.com
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/help/${article.slug}`}
                className="block rounded-xl border border-border bg-surface-2 hover:border-gold/40 hover:bg-surface-3 transition-all px-5 py-4 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="text-fg-muted">{CATEGORY_ICONS[article.category]}</div>
                      <span className="text-[11px] uppercase tracking-[0.12em] text-fg-subtle">
                        {HELP_CATEGORIES.find((c) => c.id === article.category)?.label}
                      </span>
                    </div>
                    <h3 className="font-display text-[16.5px] text-fg mb-1 group-hover:text-gold transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-[13px] text-fg-muted leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-fg-subtle shrink-0 mt-1 group-hover:text-gold transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-16 rounded-xl border border-border bg-surface-2/50 px-6 py-6 text-center">
          <p className="text-[13.5px] text-fg-muted mb-3">
            Still need help? We respond in less than 24h.
          </p>
          <a
            href="mailto:hi@operatoraiapp.com"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gold text-bg font-medium hover:brightness-110 transition-all text-[13px]"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full text-[12.5px] transition-all ${
        active
          ? 'bg-gold text-bg font-medium'
          : 'bg-surface-2 border border-border text-fg-muted hover:border-fg-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}
