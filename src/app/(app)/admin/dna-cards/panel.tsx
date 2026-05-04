'use client';

import { useState } from 'react';
import {
  Palette, Lightbulb, Camera, EyeOff, Eye, ChevronDown, ChevronRight,
  Type, Layers, Zap, Sparkles, Shield, Target, PenLine, Save, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Tipos (duplicados localmente para el panel) ───
const PRESETS = [
  { id: 'luxury-minimal', label: 'Luxury Minimal', icon: Sparkles, desc: 'Aesop, Bottega Veneta, Hermès' },
  { id: 'luxury-editorial', label: 'Luxury Editorial', icon: PenLine, desc: 'Vogue, i-D, Acne Studios' },
  { id: 'aggressive-bold', label: 'Aggressive Bold', icon: Zap, desc: 'Nike, Liquid Death, Off-White' },
  { id: 'aggressive-sport', label: 'Aggressive Sport', icon: Target, desc: 'Gymshark, Red Bull, Peloton' },
  { id: 'clean-conversion', label: 'Clean Conversion', icon: Shield, desc: 'Stripe, Notion, Linear' },
  { id: 'product-demo', label: 'Product Demo', icon: Layers, desc: 'Apple, Tesla, Dyson' },
  { id: 'tech-futuristic', label: 'Tech Futuristic', icon: Camera, desc: 'Blade Runner, OpenAI, TRON' },
  { id: 'storytelling-warm', label: 'Storytelling Warm', icon: Palette, desc: 'Airbnb, Patagonia, Headspace' },
];

// Datos mock de las DNA Cards (se cargarían desde API)
const DNA_DATA: Record<string, any> = {
  'luxury-minimal': {
    references: ['Aesop packaging 2020-2024', 'Bottega Veneta brand identity', 'Hermès quiet luxury campaigns', 'Apple iPhone product pages', 'Le Labo apothecary style'],
    lighting: ['soft diffused window light from one side', '2-point studio softbox with deep shadows', 'natural overcast daylight', 'minimal rim light separating subject from black backdrop'],
    camera: ['medium format 80mm at f/4', 'phase one digital back, sharp center, soft edges', 'macro detail shot with shallow depth', 'tilt-shift selective focus on product'],
    texture: ['matte paper finish, no gloss', 'fine natural film grain', 'subtle paper texture in negative space', 'velvety shadows, no clipping'],
    composition: ['generous negative space (60%+ of frame)', 'off-center subject placed on intersection', 'single hero element, no clutter', 'asymmetric balance with breathing room', 'product as sculpture, not as merchandise'],
    forbidden: ['neon colors', 'harsh contrast', 'stock-photo smiles', 'bright cyan or magenta', 'gradient backgrounds', 'centered logo with tagline below', 'multiple products', 'corporate clipart icons'],
    typography: ['Didot or Bodoni display + Helvetica Neue body', 'GT Sectra + Söhne', 'Editorial New + Inter', 'serif display 80-120pt + sans body 14pt'],
    palettes: ['#F5F1EC + #1A1814 + #C9A876', '#FAF8F3 + #2B2825 + #8B7355', '#E8E4DC + #1F1F1F + #B8956A'],
    mood: ['quiet', 'restrained', 'sophisticated', 'tactile', 'considered', 'enduring'],
    verticals: { 'fashion-luxury': true, 'beauty-skincare': true, 'food-cpg': true, 'saas-b2b': true, 'real-estate': true, 'coaching-business': true },
  },
  'aggressive-bold': {
    references: ['Nike "Just Do It"', 'Liquid Death', 'Off-White', 'Vetements', 'Supreme'],
    lighting: ['high contrast hard light, deep shadows', 'single hard light from above', 'colored gel lighting (red, blue)', 'flash strobe frozen action'],
    camera: ['wide angle 24mm with slight distortion', 'low angle hero shot looking up', 'extreme close-up filling frame', 'dutch tilt 5-15°'],
    texture: ['high clarity, sharp every detail', 'punch contrast, blacks crushed', 'halftone print texture overlay', 'screen-printed poster look'],
    composition: ['massive typography taking 40-60% of frame', 'centered hero subject, full-bleed', 'diagonal energy lines', 'single dominant element'],
    forbidden: ['soft pastels', 'cursive typography', 'gentle lighting', 'minimalist negative space', 'apologetic copy'],
    typography: ['Druk Wide Bold + monospace caption', 'Helvetica Black 200pt + tiny caps', 'condensed all-caps display + tracking 0'],
    palettes: ['pure black + electric red + white', 'safety yellow + black', 'racing red + white + chrome'],
    mood: ['unapologetic', 'urgent', 'visceral', 'kinetic', 'confrontational', 'alive'],
    verticals: { 'fitness-apparel': true, 'fitness-app': true, 'fashion-streetwear': true, 'crypto-web3': true, 'tech-app': true },
  },
  'storytelling-warm': {
    references: ['Airbnb belong anywhere', 'Patagonia documentary', 'Toast restaurant', 'Headspace', 'Calm app'],
    lighting: ['golden hour warm sunlight', 'firelight or candle glow', 'soft window light at dawn/dusk', 'warm tungsten interior'],
    camera: ['35mm documentary style at f/2.8', 'environmental portrait', 'candid moment, slight motion ok', 'wide angle storytelling'],
    texture: ['natural film grain (Portra 400)', 'warm color cast in shadows', 'soft skin retouch', 'natural environmental textures'],
    composition: ['human subject in warm environment', 'shared moment between people', 'hands as compositional element', 'narrative implied'],
    forbidden: ['sterile studio backgrounds', 'cold blue tones', 'perfectly retouched skin', 'aggressive geometric design'],
    typography: ['humanist serif + warm sans (Tiempos + Aktiv Grotesk)', 'rounded sans + script accent', 'editorial serif body + bold display'],
    palettes: ['warm beige + terracotta + forest green', 'cream + ochre + dusty rose', 'sand + sage + warm white'],
    mood: ['warm', 'human', 'genuine', 'belonging', 'lived-in', 'considered', 'kind'],
    verticals: { 'food-restaurant': true, 'coaching-personal': true, 'real-estate': true, 'health-wellness': true, 'education-online': true },
  },
};

const SECTION_ICONS: Record<string, any> = {
  references: Lightbulb,
  lighting: Lightbulb,
  camera: Camera,
  texture: Layers,
  composition: Target,
  forbidden: EyeOff,
  typography: Type,
  palettes: Palette,
  mood: Sparkles,
};

const SECTION_LABELS: Record<string, string> = {
  references: 'References',
  lighting: 'Lighting',
  camera: 'Camera & Lens',
  texture: 'Texture & Finish',
  composition: 'Composition',
  forbidden: 'Forbidden',
  typography: 'Typography',
  palettes: 'Color Palettes',
  mood: 'Mood Keywords',
};

export function DnaCardsPanel() {
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [enabledPresets, setEnabledPresets] = useState<Set<string>>(
    new Set(PRESETS.map(p => p.id))
  );

  function togglePreset(id: string) {
    setEnabledPresets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    toast.success(enabledPresets.has(id) ? 'Preset disabled' : 'Preset enabled');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">DNA Cards</h2>
        <p className="text-[13px] text-fg-muted">
          Creative presets that define visual identity, references, and constraints for ad generation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Presets" value={PRESETS.length} color="text-gold" />
        <StatBox label="Active" value={enabledPresets.size} color="text-green-400" />
        <StatBox label="References" value="40+" color="text-blue-400" />
        <StatBox label="Verticals" value="20" color="text-purple-400" />
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isExpanded = expandedPreset === preset.id;
          const isEnabled = enabledPresets.has(preset.id);
          const dna = DNA_DATA[preset.id];

          return (
            <div
              key={preset.id}
              className={cn(
                'rounded-xl border transition-all',
                isExpanded ? 'border-gold/30 bg-surface-2' : 'border-border bg-surface-2 hover:border-gold/20',
                !isEnabled && 'opacity-50'
              )}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedPreset(isExpanded ? null : preset.id)}
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  isEnabled ? 'bg-gold/10' : 'bg-surface-3'
                )}>
                  <Icon className={cn('h-5 w-5', isEnabled ? 'text-gold' : 'text-fg-subtle')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-display text-fg">{preset.label}</span>
                    {!isEnabled && (
                      <span className="text-[9px] uppercase bg-surface-3 px-1.5 py-0.5 rounded text-fg-subtle">Disabled</span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-fg-muted truncate">{preset.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePreset(preset.id); }}
                    className={cn(
                      'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                      isEnabled ? 'bg-gold/10 text-gold hover:bg-gold/20' : 'bg-surface-3 text-fg-subtle hover:bg-surface-3'
                    )}
                    title={isEnabled ? 'Disable' : 'Enable'}
                  >
                    {isEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-fg-muted" /> : <ChevronRight className="h-4 w-4 text-fg-muted" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && dna && (
                <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                  {Object.entries(SECTION_ICONS).map(([key, SectionIcon]) => {
                    const items = dna[key];
                    if (!items || items.length === 0) return null;
                    const isSectionExpanded = expandedSection === `${preset.id}-${key}`;

                    return (
                      <div key={key}>
                        <button
                          onClick={() => setExpandedSection(isSectionExpanded ? null : `${preset.id}-${key}`)}
                          className="w-full flex items-center gap-2 py-1.5 text-[12px] text-fg-muted hover:text-fg transition-colors"
                        >
                          <SectionIcon className="h-3.5 w-3.5" />
                          <span className="font-medium">{SECTION_LABELS[key]}</span>
                          <span className="text-[10px] opacity-50">({items.length})</span>
                          {isSectionExpanded ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
                        </button>
                        {isSectionExpanded && (
                          <div className="ml-5 space-y-1 mb-2">
                            {Array.isArray(items) && items.map((item: string, i: number) => (
                              <div key={i} className="text-[11.5px] text-fg-soft flex items-start gap-2 py-0.5">
                                <span className="text-fg-subtle mt-0.5">•</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Verticals */}
                  {dna.verticals && (
                    <div className="pt-2 border-t border-border mt-2">
                      <div className="text-[11px] text-fg-subtle font-medium mb-1.5">Vertical adaptations:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(dna.verticals).map((v) => (
                          <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="p-4 rounded-lg border border-border bg-surface-2">
        <h3 className="text-[13px] font-medium text-fg mb-2">How DNA Cards work</h3>
        <p className="text-[12px] text-fg-muted leading-relaxed">
          DNA Cards are the creative engine of Operator AI. Each preset defines a complete visual identity system:
          references from iconic brands, lighting and camera directions, composition rules, forbidden elements,
          typography pairings, and color palettes. When generating ads, the DNA randomizer picks a framework,
          preset, and emotional angle, then pulls specific instructions from the DNA card to create unique,
          agency-quality output every time.
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface-2 text-center">
      <div className={cn('text-[22px] font-display tracking-tight', color)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-fg-subtle mt-1">{label}</div>
    </div>
  );
}
