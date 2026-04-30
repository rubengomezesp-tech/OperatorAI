'use client';

/**
 * OperatorBg — Premium avatar background overlay.
 *
 * Reads bgUrl from BrandAssetsContext. If not set, renders nothing
 * (Aurora and bg-mesh remain as the visual backdrop).
 *
 * Variants:
 *   - 'chat': very subtle (10% opacity, heavy blur, dark overlay)
 *   - 'landing': more visible (25% opacity, slight blur)
 *
 * Always:
 *   - Fixed positioning at the bottom (avatar slightly below center)
 *   - Radial dark gradient from edges (focus stays on UI)
 *   - Pointer-events: none (never intercepts clicks)
 *   - z-index very low (always behind content)
 */

import { useBrandAssets } from '@/lib/brand-assets-context';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'chat' | 'landing';
  className?: string;
}

export function OperatorBg({ variant = 'chat', className }: Props) {
  const { bgUrl } = useBrandAssets();

  if (!bgUrl) return null;

  const isLanding = variant === 'landing';

  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 pointer-events-none overflow-hidden',
        className,
      )}
      aria-hidden="true"
    >
      {/* Avatar image — positioned slightly below center */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-center"
        style={{
          height: isLanding ? '95vh' : '90vh',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgUrl}
          alt=""
          className={cn(
            'h-full w-auto max-w-none object-contain object-bottom',
            isLanding
              ? 'opacity-25'
              : 'opacity-10 blur-[2px]',
          )}
          style={{ transform: 'translateY(8%)' }}
        />
      </div>

      {/* Dark overlay — pushes avatar back, focus on UI */}
      <div
        className={cn(
          'absolute inset-0',
          isLanding
            ? 'bg-gradient-to-t from-bg via-bg/60 to-bg/30'
            : 'bg-gradient-to-t from-bg via-bg/85 to-bg/70',
        )}
      />

      {/* Radial vignette — dark from edges, focus center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center 65%, transparent 0%, rgb(var(--bg) / 0.4) 50%, rgb(var(--bg) / 0.85) 100%)',
        }}
      />
    </div>
  );
}
