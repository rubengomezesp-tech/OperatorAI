'use client';

/**
 * VariantEditor — thin wrapper around EditorPro
 *
 * The old AI-only modal has been replaced with a full canvas editor.
 * This wrapper keeps the existing call sites working while delegating
 * to the new EditorPro component.
 */

import { EditorPro } from '@/features/editor-pro/components/editor-pro';
import type { VerticalSlug } from '@/features/campaign-brain/types';
import type { AspectRatio } from '@/features/editor-pro/types';

interface VariantEditorProps {
  draftId: string;
  variantId: string;
  initialImageUrl: string;
  briefHeadline?: string;
  briefAngle?: string;
  briefPlatform?: string;
  /** From brain output */
  briefCta?: string;
  vertical?: VerticalSlug;
  /** Brand kit */
  logoUrl?: string;
  brandPrimary?: string;
  /** Aspect ratio */
  initialAspectRatio?: AspectRatio;
  onClose: () => void;
  onSave: (newUrl: string) => void;
}

export function VariantEditor({
  draftId,
  variantId,
  initialImageUrl,
  briefHeadline,
  briefCta,
  vertical,
  logoUrl,
  brandPrimary,
  initialAspectRatio,
  onClose,
  onSave,
}: VariantEditorProps) {
  return (
    <EditorPro
      draftId={draftId}
      variantId={variantId}
      initialImageUrl={initialImageUrl}
      vertical={vertical ?? 'other'}
      briefHeadline={briefHeadline}
      briefCta={briefCta}
      logoUrl={logoUrl}
      brandPrimary={brandPrimary}
      initialAspectRatio={initialAspectRatio ?? '4:5'}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
