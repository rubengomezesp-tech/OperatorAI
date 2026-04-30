import React from 'react';

interface PresetStyles {
  vignette: string;
  textColor: string;
  subtextColor: string;
  ctaBg: string;
  ctaText: string;
}

function getStylesForPreset(preset: string): PresetStyles {
  switch (preset) {
    case 'luxury-minimal':
      return {
        vignette: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%)',
        textColor: '#FFFFFF',
        subtextColor: '#D4AF37',
        ctaBg: '#D4AF37',
        ctaText: '#000000',
      };
    case 'aggressive':
      return {
        vignette: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
        textColor: '#FFFFFF',
        subtextColor: '#FFD700',
        ctaBg: '#FFD700',
        ctaText: '#000000',
      };
    case 'clean-conversion':
      return {
        vignette: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.5) 100%)',
        textColor: '#FFFFFF',
        subtextColor: '#E5E7EB',
        ctaBg: '#0F172A',
        ctaText: '#FFFFFF',
      };
    case 'product-demo':
    default:
      return {
        vignette: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
        textColor: '#FFFFFF',
        subtextColor: '#E5E7EB',
        ctaBg: '#3B82F6',
        ctaText: '#FFFFFF',
      };
  }
}

interface LayoutProps {
  baseImageDataUrl: string;
  logoDataUrl?: string;
  copy: { headline: string; subheadline: string; cta: string };
  preset: string;
  width: number;
  height: number;
}

export function AdLayout(props: LayoutProps): React.ReactElement {
  const { baseImageDataUrl, logoDataUrl, copy, preset, width, height } = props;
  const styles = getStylesForPreset(preset);
  const isStory = height > width;
  const isLandscape = width > height;

  // Scale typography by canvas dimension
  const headlineSize = isStory ? 110 : isLandscape ? 80 : 96;
  const subheadlineSize = isStory ? 40 : 36;
  const ctaSize = isStory ? 36 : 30;
  const padding = isStory ? 90 : 70;
  const logoHeight = isStory ? 90 : 70;

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width,
        height,
        fontFamily: 'Headline',
      }}
    >
      {/* Base image full bleed */}
      <img
        src={baseImageDataUrl}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          backgroundImage: styles.vignette,
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          padding,
          justifyContent: 'space-between',
        }}
      >
        {/* Top: logo */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              height={logoHeight}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div style={{ display: 'flex', height: logoHeight }} />
          )}
        </div>

        {/* Center: headline + subheadline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: headlineSize,
              fontWeight: 700,
              color: styles.textColor,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              textTransform: preset === 'luxury-minimal' ? 'none' : 'uppercase',
            }}
          >
            {copy.headline}
          </div>
          {copy.subheadline ? (
            <div
              style={{
                display: 'flex',
                fontSize: subheadlineSize,
                fontWeight: 400,
                color: styles.subtextColor,
                fontFamily: 'Body',
                lineHeight: 1.3,
              }}
            >
              {copy.subheadline}
            </div>
          ) : null}
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div
            style={{
              display: 'flex',
              padding: '24px 48px',
              backgroundColor: styles.ctaBg,
              color: styles.ctaText,
              fontSize: ctaSize,
              fontWeight: 700,
              borderRadius: 999,
              letterSpacing: '0.02em',
            }}
          >
            {copy.cta}
          </div>
        </div>
      </div>
    </div>
  );
}
