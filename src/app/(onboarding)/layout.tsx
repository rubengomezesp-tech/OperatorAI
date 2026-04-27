import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Aurora } from '@/components/ui/aurora';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-bg overflow-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Aurora intensity="medium" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-md bg-bg/40">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="h-8 w-8 rounded-md gold-grad flex items-center justify-center shadow-[0_4px_16px_-4px_rgb(201_168_99_/_0.4)]">
              <Sparkles className="h-4 w-4 text-bg" />
            </span>
            <span className="font-display text-[18px] tracking-tight">Operator</span>
          </Link>
          <div className="text-[11.5px] uppercase tracking-[0.18em] text-fg-subtle">
            Setup
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[560px]">
          {children}
        </div>
      </main>
    </div>
  );
}
