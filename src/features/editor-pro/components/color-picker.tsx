'use client';

/**
 * Color Picker Pro
 *
 * Combines:
 *   - Brand kit colors (passed in)
 *   - Common safe colors (white/black for text)
 *   - HTML5 color picker for custom
 *   - WCAG contrast indicator vs background hex (if provided)
 */

import { useEffect, useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Optional brand kit colors to pin at top */
  brandColors?: string[];
  /** Optional background hex for contrast checking */
  backgroundHex?: string;
}

const SAFE_COLORS = [
  '#FFFFFF',
  '#000000',
  '#F5F5F5',
  '#1A1A1A',
  '#D4AF37', // gold
  '#0A0A0B',
  '#FF3B30',
  '#34C759',
];

// Contrast calculation per WCAG
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const lum1 = relativeLuminance(rgb1);
  const lum2 = relativeLuminance(rgb2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

export function ColorPicker({
  value,
  onChange,
  brandColors,
  backgroundHex,
}: ColorPickerProps) {
  const [contrast, setContrast] = useState<number | null>(null);

  useEffect(() => {
    if (backgroundHex && value.startsWith('#')) {
      setContrast(contrastRatio(value, backgroundHex));
    } else {
      setContrast(null);
    }
  }, [value, backgroundHex]);

  const contrastVerdict =
    contrast === null
      ? null
      : contrast >= 7
      ? { label: 'AAA', color: 'text-green-400' }
      : contrast >= 4.5
      ? { label: 'AA', color: 'text-emerald-400' }
      : contrast >= 3
      ? { label: 'AA Large', color: 'text-yellow-400' }
      : { label: 'Fail', color: 'text-red-400' };

  return (
    <div className="space-y-2">
      {/* Brand colors */}
      {brandColors && brandColors.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-1">
            Brand
          </div>
          <div className="flex flex-wrap gap-1">
            {brandColors.map((c, i) => (
              <button
                key={`brand-${i}`}
                onClick={() => onChange(c)}
                className={`w-7 h-7 rounded border-2 transition-all ${
                  value.toLowerCase() === c.toLowerCase()
                    ? 'border-gold scale-110'
                    : 'border-border hover:border-fg-muted'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Safe colors */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-1">
          Standard
        </div>
        <div className="flex flex-wrap gap-1">
          {SAFE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={`w-7 h-7 rounded border-2 transition-all ${
                value.toLowerCase() === c.toLowerCase()
                  ? 'border-gold scale-110'
                  : 'border-border hover:border-fg-muted'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Custom + current */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded cursor-pointer border border-border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith('#') && v.length <= 7) onChange(v);
          }}
          className="flex-1 px-2 py-1.5 rounded bg-surface-3 border border-border text-[12px] text-fg font-mono"
        />
      </div>

      {/* Contrast indicator */}
      {contrast !== null && contrastVerdict && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-fg-muted">
            Contrast: {contrast.toFixed(2)}:1
          </span>
          <span className={`font-medium ${contrastVerdict.color}`}>
            {contrastVerdict.label}
          </span>
        </div>
      )}
    </div>
  );
}
