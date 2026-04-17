'use client';
import Link from 'next/link';
import { ImageIcon, Video, Sparkles } from 'lucide-react';

export default function StudioPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[960px] mx-auto space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
        <h1 className="font-display text-[32px]">Studio</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Create on-brand visuals in seconds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/studio/image"
          className="group relative rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
              <ImageIcon className="h-7 w-7 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-[20px] group-hover:text-gold transition-colors">Image Studio</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold uppercase tracking-[0.12em]">Flux 2 Pro</span>
              </div>
              <p className="text-[13px] text-fg-muted leading-relaxed">
                Generate editorial-grade imagery from text prompts. Product shots, lifestyle, abstract, minimal — with presets and aspect ratios.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-gold font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Create image</span>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/studio/video"
          className="group relative rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
              <Video className="h-7 w-7 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-[20px] group-hover:text-gold transition-colors">Video Studio</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold uppercase tracking-[0.12em]">Veo 3.1</span>
              </div>
              <p className="text-[13px] text-fg-muted leading-relaxed">
                Generate cinematic AI video from a single prompt. 4 or 8 seconds, any aspect ratio. Takes about 60–90 seconds to render.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-gold font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Create video</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-surface-2/30 p-5 text-center">
        <p className="text-[13px] text-fg-muted">
          You can also generate images and videos directly from <Link href="/chat" className="text-gold hover:underline">Chat</Link> — just ask the agent.
        </p>
      </div>
    </div>
  );
}
