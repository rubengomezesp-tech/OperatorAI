import { KnowledgeView } from '@/features/knowledge/components/knowledge-view';

export default function KnowledgePage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Business brain</div>
        <h1 className="font-display text-[32px]">Knowledge</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
          Upload your brand manual, briefs, SOPs, catalogs, or any document. Your assistant searches them in every conversation and cites sources with [n].
        </p>
      </div>
      <KnowledgeView />
    </div>
  );
}
