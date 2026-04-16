import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MissionNewForm } from '@/features/missions/components/new-form';

export default function NewMissionPage() {
  return (
    <div className="px-6 lg:px-10 py-10 max-w-[720px] w-full mx-auto">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-gold transition mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Back to Missions</span>
      </Link>
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">New Mission</div>
      <h1 className="font-display text-[34px] leading-tight mb-3">Deploy a mission</h1>
      <p className="text-[14px] text-fg-muted mb-8">
        Describe what you want achieved. Operator will orchestrate the steps.
      </p>
      <MissionNewForm />
    </div>
  );
}
