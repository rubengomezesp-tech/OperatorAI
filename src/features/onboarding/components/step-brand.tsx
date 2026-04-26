'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OnboardingData } from './wizard';

interface BrandPreview {
  name?: string;
  description?: string;
  logoUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    palette?: Array<{ hex: string; weight: number }>;
  };
  confidence?: number;
  method?: string;
}

export function StepBrand({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [brandName, setBrandName] = useState(data.brand_name ?? '');
  const [description, setDescription] = useState(data.description ?? '');
  const [websiteUrl, setWebsiteUrl] = useState((data as any).website_url ?? '');

  // Auto-detect state
  const [detecting, setDetecting] = useState(false);
  const [preview, setPreview] = useState<BrandPreview | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);

  const canContinue = brandName.trim().length >= 2 && description.trim().length >= 10;

  async function handleAutoDetect() {
    if (!websiteUrl.trim()) return;
    setDetecting(true);
    setDetectError(null);
    setPreview(null);
    try {
      const res = await fetch('/api/brand/extract-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        setDetectError(result.error ?? 'Auto-detect failed');
        return;
      }
      setPreview(result);
      // Auto-fill empty fields
      if (result.name && !brandName.trim()) setBrandName(result.name);
      if (result.description && !description.trim()) setDescription(result.description);
    } catch (err) {
      setDetectError('Network error. Please try again.');
    } finally {
      setDetecting(false);
    }
  }

  function handleContinue() {
    onNext({
      brand_name: brandName.trim(),
      description: description.trim(),
      // Pass extra fields for backend persistence
      website_url: websiteUrl.trim() || undefined,
      detected_logo_url: preview?.logoUrl,
      detected_colors: preview?.colors,
    } as Partial<OnboardingData>);
  }

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 2 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          What&apos;s your <span className="text-gold-grad">brand</span>?
        </h2>
        <p className="text-[14px] text-fg-muted">
          Operator will keep this context in every conversation.
        </p>
      </div>

      {/* AUTO-DETECT SECTION */}
      <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 space-y-3">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-gold/90 block mb-2">
            Have a website? Detect everything in 5s
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourbrand.com"
              className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
              disabled={detecting}
            />
            <Button
              onClick={handleAutoDetect}
              disabled={!websiteUrl.trim() || detecting}
              variant="primary"
            >
              {detecting ? 'Detecting…' : 'Auto-detect'}
            </Button>
          </div>
          {detectError && (
            <p className="text-[12px] text-red-400 mt-1.5">{detectError}</p>
          )}
        </div>

        {/* PREVIEW */}
        {preview && (
          <div className="space-y-3 pt-3 border-t border-gold/20">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-gold/90">
              Detected ({preview.method}, {Math.round((preview.confidence ?? 0) * 100)}% confidence)
            </div>
            <div className="flex items-start gap-3">
              {preview.logoUrl && (
                <img
                  src={preview.logoUrl}
                  alt="Detected logo"
                  className="w-16 h-16 rounded-md object-contain bg-surface-2 border border-border"
                />
              )}
              <div className="flex-1 space-y-2">
                {preview.name && (
                  <div className="text-[14px] text-fg font-medium">{preview.name}</div>
                )}
                {preview.colors?.palette && preview.colors.palette.length > 0 && (
                  <div className="flex gap-1.5">
                    {preview.colors.palette.slice(0, 6).map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-md border border-border"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MANUAL FIELDS (always available) */}
      <div className="space-y-5">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">
            Brand or project name
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Vesper Studio, Maison, Canal"
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">
            Describe it in one sentence
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A boutique branding studio for independent fashion labels in Madrid."
            rows={3}
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <p className="text-[11.5px] text-fg-subtle mt-1.5">
            Be specific — what you do, for whom, and how. Operator uses this as context forever.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
