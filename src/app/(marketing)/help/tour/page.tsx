import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { PRODUCT_TOURS } from '@/lib/help/tours';

export const metadata: Metadata = {
  title: 'Product tours — Operator AI',
  description: 'Interactive tours for every feature of Operator AI.',
};

export default function ToursIndexPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted hover:text-gold transition-colors mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Help center
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            Operator AI · Product tours
          </div>
          <h1 className="font-display text-[36px] mb-3">Aprende cada feature en 2-3 min</h1>
          <p className="text-[15px] text-fg-muted max-w-xl">
            Tours interactivos paso-a-paso. Cada uno te enseña a sacar máximo partido de una parte concreta del producto. Sin pop-ups, sin presión — los abres cuando quieras.
          </p>
        </div>

        {/* Tours grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {PRODUCT_TOURS.map((tour) => {
            const Icon = tour.icon;
            return (
              <Link
                key={tour.id}
                href={`/help/tour/${tour.slug}`}
                className="block rounded-xl border border-border bg-surface-2 hover:border-gold/40 hover:bg-surface-3 transition-all p-5 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `${tour.accentColor}1A`,
                      border: `1px solid ${tour.accentColor}40`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: tour.accentColor }} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold transition-colors mt-2" />
                </div>

                <h3 className="font-display text-[17px] text-fg mb-1 group-hover:text-gold transition-colors">
                  {tour.title}
                </h3>
                <p className="text-[13.5px] text-fg-muted leading-relaxed mb-4">
                  {tour.subtitle}
                </p>

                <div className="flex items-center gap-3 text-[11.5px] text-fg-subtle">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tour.duration}
                  </span>
                  <span>·</span>
                  <span>{tour.steps.length} pasos</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 rounded-xl border border-border bg-surface-2/40 px-6 py-5 text-center">
          <p className="text-[13px] text-fg-muted">
            ¿No encuentras lo que buscas?{' '}
            <Link href="/help" className="text-gold hover:underline">
              Browse help articles →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
