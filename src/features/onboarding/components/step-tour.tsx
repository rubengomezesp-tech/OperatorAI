'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, ImageIcon, Video, Mic, Zap, FileSpreadsheet, FolderOpen, Search } from 'lucide-react';
import type { OnboardingData } from './wizard';

const tools = [
  { label: 'Creative Agent', icon: MessageSquare, desc: 'Chat with your brand AI' },
  { label: 'Image Studio', icon: ImageIcon, desc: 'Editorial imagery' },
  { label: 'Video Studio', icon: Video, desc: 'Cinematic AI video' },
  { label: 'Voice Mode', icon: Mic, desc: 'Push-to-talk' },
  { label: 'Workflows', icon: Zap, desc: 'Multi-step automations' },
  { label: 'Files & Analysis', icon: FileSpreadsheet, desc: 'Insights from data' },
  { label: 'Projects', icon: FolderOpen, desc: 'Brand workspaces' },
  { label: 'Knowledge', icon: Search, desc: 'Searchable docs' },
];

export function StepTour({
  data, onComplete, onBack,
}: { data: OnboardingData; onComplete: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const name = data.full_name?.split(' ')[0] || 'there';

  async function handleFinish() {
    setLoading(true);
    onComplete({});
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Step 5 of 5</div>
        <h2 className="font-display text-[36px] lg:text-[44px] leading-tight mb-3">
          You're all set, <span className="text-gold-grad">{name}</span>.
        </h2>
        <p className="text-[14.5px] text-fg-muted max-w-[440px] mx-auto">
          Your studio is ready. Here's what you can do next.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-md border border-border bg-surface p-3.5 text-center">
              <Icon className="h-4 w-4 text-gold mx-auto mb-2" />
              <div className="text-[12.5px] font-medium">{t.label}</div>
              <div className="text-[10.5px] text-fg-subtle mt-0.5 leading-tight">{t.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button size="lg" onClick={handleFinish} loading={loading}>
          Enter studio
        </Button>
      </div>
    </div>
  );
}
