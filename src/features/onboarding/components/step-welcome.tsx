'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function StepWelcome({ onNext, email }: { onNext: () => void; email: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="inline-flex items-center justify-center mb-8">
        <div className="relative">
          <div className="absolute inset-0 gold-grad rounded-2xl blur-2xl opacity-40 animate-pulse" />
          <img
            src="/logo.png"
            alt="Operator AI"
            className="relative h-24 w-24 rounded-2xl shadow-2xl"
          />
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-[0.24em] text-gold mb-4">Operator AI</div>
      <h1 className="font-display text-[42px] lg:text-[56px] leading-[1.05] mb-5">
        Welcome to your<br />
        <span className="text-gold-grad">AI studio</span>.
      </h1>
      <p className="text-[15px] text-fg-muted mb-3">
        {email}
      </p>
      <p className="text-[14.5px] text-fg-muted max-w-[460px] mx-auto mb-10 leading-relaxed">
        Let&apos;s set up your studio in 60 seconds. We&apos;ll tailor Operator to your brand, your vibe, and your first question.
      </p>
      <Button size="lg" onClick={onNext} className="min-w-[180px]">
        <span>Begin</span>
      </Button>
      <p className="text-[11.5px] text-fg-subtle mt-6 uppercase tracking-[0.14em]">
        6 quick steps · 7-day free trial active
      </p>
    </div>
  );
}
