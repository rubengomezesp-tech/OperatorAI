'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('operator.splash') === '1') {
      setVisible(false);
      return;
    }
    const t1 = setTimeout(() => setFadeOut(true), 1800);
    const t2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('operator.splash', '1');
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return <>{children}</>;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg transition-opacity duration-600',
          fadeOut ? 'opacity-0' : 'opacity-100',
        )}
      >
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full gold-grad opacity-[0.08] blur-3xl" />

        {/* Logo */}
        <div className="relative animate-fade-in-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Operator AI"
            className="h-20 w-20 rounded-2xl shadow-[0_0_60px_-10px_rgb(201_168_99_/_0.3)]"
          />
        </div>

        {/* Text */}
        <div className="relative mt-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <span className="font-display text-[28px] tracking-tight">Operator</span>
          <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/20">AI</span>
        </div>

        {/* Tagline */}
        <div className="relative mt-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <p className="text-[13px] text-fg-muted">Deploy missions. Not prompts.</p>
        </div>

        {/* Loading bar */}
        <div className="relative mt-8 w-32 h-[2px] rounded-full bg-border overflow-hidden animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="h-full gold-grad rounded-full animate-loading-bar" />
        </div>
      </div>
      <div className={cn(fadeOut ? 'opacity-100' : 'opacity-0', 'transition-opacity duration-300')}>
        {children}
      </div>
    </>
  );
}
