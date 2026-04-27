'use client';

/**
 * Glow — Radial gold glow background effect
 *
 * Use to add a soft luminous accent behind a hero element.
 * Position absolutely via parent or pass className.
 *
 * Examples:
 *   <div className="relative">
 *     <Glow size="lg" />
 *     <h1>Hero title</h1>
 *   </div>
 */

import { cn } from '@/lib/utils';

interface GlowProps {
  /** size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** color hex of the glow (default: gold) */
  color?: string;
  /** position offset class (default: centered) */
  className?: string;
  /** intensity 0..1 (default: 0.12) */
  intensity?: number;
}

const SIZES = {
  sm: 'h-40 w-40',
  md: 'h-64 w-64',
  lg: 'h-96 w-[500px]',
  xl: 'h-[400px] w-[700px]',
};

export function Glow({
  size = 'md',
  color = '#D4AF37',
  className,
  intensity = 0.12,
}: GlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute pointer-events-none rounded-full blur-3xl',
        SIZES[size],
        className,
      )}
      style={{
        background: color,
        opacity: intensity,
        zIndex: 0,
      }}
    />
  );
}
