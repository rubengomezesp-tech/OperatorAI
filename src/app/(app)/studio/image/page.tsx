import { ImageStudioView } from '@/features/image-studio/components/image-studio-view';

export default function ImageStudioPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1200px] w-full mx-auto space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Editorial imagery</div>
        <h1 className="font-display text-[32px]">Image Studio</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
          Flux 1.1 Pro with preset-driven visual direction. Write a brief, pick a preset, let the prompt enhancer do the rest.
        </p>
      </div>
      <ImageStudioView />
    </div>
  );
}
