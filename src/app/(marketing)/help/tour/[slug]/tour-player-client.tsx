'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Database,
  Layers,
  Plug,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { getTourBySlug } from '@/lib/help/tours';

const TOUR_ICONS: Record<string, LucideIcon> = {
  'message-square': MessageSquare,
  database: Database,
  sparkles: Sparkles,
  layers: Layers,
  plug: Plug,
};

interface Props {
  tourSlug: string;
}

export function TourPlayerClient({ tourSlug }: Props) {
  const tour = getTourBySlug(tourSlug);
  const [currentStep, setCurrentStep] = useState(0);

  if (!tour) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-fg-muted">Tour not found</p>
      </div>
    );
  }

  const step = tour.steps[currentStep];
  const isLastStep = currentStep === tour.steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / tour.steps.length) * 100;

  const TourIcon = TOUR_ICONS[tour.iconKey] ?? Sparkles;
  const StepIcon = step.visual?.iconKey ? TOUR_ICONS[step.visual.iconKey] : null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/help/tour"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted hover:text-gold transition-colors mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All tours
        </Link>

        <div className="rounded-xl border border-border bg-surface-2 p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${tour.accentColor}1A`,
                border: `1px solid ${tour.accentColor}40`,
              }}
            >
              <TourIcon className="h-4 w-4" style={{ color: tour.accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-[18px] text-fg">{tour.title}</h1>
              <p className="text-[12.5px] text-fg-muted">
                <Clock className="inline h-3 w-3 mr-1" />
                {tour.duration} · paso {currentStep + 1} de {tour.steps.length}
              </p>
            </div>
          </div>

          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${tour.accentColor}, ${tour.accentColor}CC)`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
          {step.visual && (
            <div
              className="h-48 flex items-center justify-center relative overflow-hidden"
              style={{
                background:
                  step.visual.type === 'gradient'
                    ? `radial-gradient(circle at 50% 50%, ${step.visual.color}20, transparent 70%)`
                    : `linear-gradient(180deg, ${tour.accentColor}0A, transparent)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle, ${tour.accentColor}40 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {StepIcon ? (
                <div
                  className="relative h-20 w-20 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `${tour.accentColor}15`,
                    border: `1px solid ${tour.accentColor}40`,
                  }}
                >
                  <StepIcon className="h-9 w-9" style={{ color: tour.accentColor }} />
                </div>
              ) : (
                <div
                  className="relative font-display text-[64px] opacity-30"
                  style={{ color: tour.accentColor }}
                >
                  {currentStep + 1}
                </div>
              )}
            </div>
          )}

          <div className="px-6 py-6">
            <h2 className="font-display text-[22px] mb-3">{step.title}</h2>
            <p className="text-[14.5px] text-fg-muted leading-relaxed">{step.description}</p>

            {step.tip && (
              <div
                className="mt-5 rounded-lg p-3 flex gap-2.5"
                style={{
                  background: `${tour.accentColor}0D`,
                  border: `1px solid ${tour.accentColor}26`,
                }}
              >
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: tour.accentColor }} />
                <p className="text-[13px] leading-relaxed" style={{ color: tour.accentColor }}>
                  {step.tip}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={isFirstStep}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] text-fg-muted hover:text-fg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>

            <div className="flex gap-1.5">
              {tour.steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? 'w-6' : 'w-1.5 bg-fg-subtle/30 hover:bg-fg-muted'
                  }`}
                  style={i === currentStep ? { background: tour.accentColor } : {}}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {isLastStep ? (
              <Link
                href={tour.ctaPath}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-gold text-bg font-medium hover:brightness-110 transition-all text-[13px]"
              >
                {tour.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(tour.steps.length - 1, s + 1))}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium transition-all"
                style={{ background: tour.accentColor, color: '#0A0A0A' }}
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLastStep && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] text-fg">¡Tour completado!</p>
              <p className="text-[12.5px] text-fg-muted">Pruébalo en producción ahora.</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-[12.5px] text-fg-subtle">
          ¿Dudas? Visita el{' '}
          <Link href="/help" className="text-gold hover:underline">
            Help center
          </Link>{' '}
          o escríbenos a{' '}
          <a href="mailto:hi@operatoraiapp.com" className="text-gold hover:underline">
            hi@operatoraiapp.com
          </a>
        </div>
      </div>
    </div>
  );
}
