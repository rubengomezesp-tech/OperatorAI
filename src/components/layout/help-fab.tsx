'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  X,
  Mail,
  ChevronRight,
  BookOpen,
  Sparkles,
  Database,
  Layers,
  Plug,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { searchArticles, HELP_ARTICLES } from '@/lib/help/articles';
import { PRODUCT_TOURS } from '@/lib/help/tours';

const TOUR_ICONS: Record<string, LucideIcon> = {
  'message-square': MessageSquare,
  database: Database,
  sparkles: Sparkles,
  layers: Layers,
  plug: Plug,
};

export function HelpFab() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchArticles(query).slice(0, 5);
  }, [query]);

  const topArticles = HELP_ARTICLES.slice(0, 3);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-14 right-0 w-[380px] max-w-[90vw] rounded-xl border border-border bg-surface-2 shadow-2xl overflow-hidden mb-2">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display text-[15px]">Help and guides</h3>
              <p className="text-[11.5px] text-fg-subtle">Search articles, tours, contact us</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-surface-3 text-fg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-4 pt-3 pb-2 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-bg border border-border focus:border-gold/40 outline-none text-[13px] placeholder:text-fg-subtle"
              autoFocus
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto px-2 pb-2">
            {query.trim() && searchResults.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-2 pt-2 pb-1 text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle">
                  Search results ({searchResults.length})
                </div>
                {searchResults.map((article) => (
                  <Link
                    key={article.id}
                    href={`/help/${article.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-md hover:bg-surface-3 transition-colors"
                  >
                    <div className="text-[13px] text-fg mb-0.5">{article.title}</div>
                    <div className="text-[11.5px] text-fg-muted line-clamp-1">{article.excerpt}</div>
                  </Link>
                ))}
              </div>
            )}

            {query.trim() && searchResults.length === 0 && (
              <div className="px-3 py-6 text-center text-[12.5px] text-fg-muted">
                No results found.
              </div>
            )}

            {!query.trim() && (
              <>
                <div className="space-y-0.5">
                  <div className="px-2 pt-2 pb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle">
                    <Sparkles className="h-3 w-3 text-gold" />
                    Product tours
                  </div>
                  {PRODUCT_TOURS.slice(0, 3).map((tour) => {
                    const Icon = TOUR_ICONS[tour.iconKey] ?? Sparkles;
                    return (
                      <Link
                        key={tour.id}
                        href={`/help/tour/${tour.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-surface-3 transition-colors group"
                      >
                        <div
                          className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            background: `${tour.accentColor}1A`,
                            border: `1px solid ${tour.accentColor}30`,
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: tour.accentColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-fg truncate group-hover:text-gold transition-colors">
                            {tour.title}
                          </div>
                          <div className="text-[11px] text-fg-subtle">
                            {tour.duration} - {tour.steps.length} pasos
                          </div>
                        </div>
                        <ChevronRight className="h-3 w-3 text-fg-subtle group-hover:text-gold transition-colors" />
                      </Link>
                    );
                  })}
                  <Link
                    href="/help/tour"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-[12px] text-gold hover:underline"
                  >
                    See all tours
                  </Link>
                </div>

                <div className="space-y-0.5 mt-2 pt-2 border-t border-border">
                  <div className="px-2 pb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle">
                    <BookOpen className="h-3 w-3 text-gold" />
                    Top articles
                  </div>
                  {topArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/help/${article.slug}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 rounded-md hover:bg-surface-3 transition-colors"
                    >
                      <div className="text-[12.5px] text-fg">{article.title}</div>
                    </Link>
                  ))}
                  <Link
                    href="/help"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-[12px] text-gold hover:underline"
                  >
                    Browse all articles
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <a
              href="mailto:hi@operatoraiapp.com"
              className="flex items-center gap-2 text-[12px] text-fg-muted hover:text-gold transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email support</span>
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-12 w-12 rounded-full inline-flex items-center justify-center shadow-2xl transition-all ${
          open
            ? 'bg-gold text-bg rotate-90'
            : 'bg-surface-2 border border-border text-fg-muted hover:bg-gold hover:text-bg hover:border-gold'
        }`}
        aria-label="Help and guides"
        title="Help and guides"
      >
        {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
