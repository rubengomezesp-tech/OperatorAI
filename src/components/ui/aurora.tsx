'use client';

/**
 * Aurora — Animated gradient mesh background
 *
 * Premium tech feel — subtle moving gradient that suggests
 * "AI is alive" without being distracting.
 *
 * Usage:
 *   <section className="relative overflow-hidden">
 *     <Aurora />
 *     <div className="relative z-10">Content</div>
 *   </section>
 */

import { cn } from '@/lib/utils';

interface AuroraProps {
  className?: string;
  /** Intensity preset — affects opacity */
  intensity?: 'subtle' | 'medium' | 'strong';
}

const INTENSITY = {
  subtle: 'opacity-[0.08]',
  medium: 'opacity-[0.16]',
  strong: 'opacity-[0.28]',
};

export function Aurora({ className, intensity = 'medium' }: AuroraProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className,
      )}
    >
      {/* Glow blob 1 — gold, top-left, slow movement */}
      <div
        className={cn(
          'absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full blur-3xl animate-aurora-1',
          INTENSITY[intensity],
        )}
        style={{ background: '#D4AF37' }}
      />
      {/* Glow blob 2 — deep gold, bottom-right, opposite phase */}
      <div
        className={cn(
          'absolute bottom-[-25%] right-[-15%] h-[600px] w-[600px] rounded-full blur-3xl animate-aurora-2',
          INTENSITY[intensity],
        )}
        style={{ background: '#9C7F3F' }}
      />
      {/* Glow blob 3 — soft, center, slow */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full blur-3xl animate-aurora-3',
          INTENSITY[intensity],
        )}
        style={{ background: '#E4CB8F' }}
      />
    </div>
  );
}
