'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  /** Which slot to fetch: 'home' | 'login' | 'topbar' | 'logo' (default operator) */
  slot?: 'home' | 'login' | 'topbar' | 'logo' | 'footer';
  /** Size in px for the icon fallback box */
  size?: number;
  className?: string;
}

const SLOT_TO_KEY: Record<string, string> = {
  home: 'logo-home',
  login: 'logo-login',
  topbar: 'logo-topbar',
  logo: 'logo-operator',
  footer: 'logo-footer',
};

export function BrandLogo({ slot = 'logo', size = 36, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const key = SLOT_TO_KEY[slot] ?? 'logo-operator';
    fetch(`/api/brand-assets/public?key=${key}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.url) setUrl(d.url);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slot]);

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="Logo" style={{ height: size, width: 'auto' }} className={className} />;
  }

  // Fallback: gold square with sparkles (cuando no hay logo subido todavía)
  return (
    <div
      className={'rounded-md gold-grad flex items-center justify-center ' + (className ?? '')}
      style={{ height: size, width: size }}
      aria-label="Operator"
    >
      <Sparkles className="text-bg" style={{ height: size * 0.45, width: size * 0.45 }} />
    </div>
  );
}
