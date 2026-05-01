'use client';

import { useEffect } from 'react';
import { Loader2, X, Download } from 'lucide-react';
import { useAdStreamGeneration, type AdStreamPayload } from '../hooks/use-ad-stream';
import { cn } from '@/lib/utils';

const STAGE_ORDER = ['analysis', 'brief', 'prompt', 'image', 'finalize', 'done'] as const;

interface AdLiveGeneratorProps {
  payload: AdStreamPayload;
  onComplete?: (url: string, brief: Record<string, unknown> | null) => void;
  onCancel?: () => void;
}

export function AdLiveGenerator({ payload, onComplete, onCancel }: AdLiveGeneratorProps) {
  const { state, generate, reset } = useAdStreamGeneration();

  useEffect(() => {
    generate(payload);
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.stage === 'done' && state.finalUrl && onComplete) {
      onComplete(state.finalUrl, state.brief);
    }
  }, [state.stage, state.finalUrl, state.brief, onComplete]);

  const stageIdx = STAGE_ORDER.indexOf(state.stage as (typeof STAGE_ORDER)[number]);
  const progress = stageIdx >= 0 ? Math.round((stageIdx / (STAGE_ORDER.length - 1)) * 100) : 0;

  const displayImage = state.finalUrl ?? state.partialDataUri;
  const isPartial = !state.finalUrl && state.partialDataUri;

  return (
    <div className="my-3 max-w-[420px] relative">
      {/* Image area */}
      <div
        className={cn(
          'relative w-full rounded-2xl overflow-hidden glass-strong floating border border-gold/15',
          'aspect-[4/5]',
        )}
      >
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt=""
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              isPartial && 'blur-[1px] scale-[1.01]',
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface-3 to-surface-2 animate-shimmer bg-[length:200%_200%]" />
        )}

        {/* Overlay durante generación */}
        {state.stage !== 'done' && state.stage !== 'error' && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/60 to-transparent">
            <div className="flex items-center gap-2 text-white text-[12px] font-medium mb-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              <span>{state.message || 'Procesando…'}</span>
            </div>
            <div className="h-1 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold/70 to-gold rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Done state — controles */}
        {state.stage === 'done' && state.finalUrl && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <a
              href={state.finalUrl}
              download
              className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
              aria-label="Descargar"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Cancel button (durante generación) */}
        {state.stage !== 'done' && state.stage !== 'error' && onCancel && (
          <button
            type="button"
            onClick={() => { reset(); onCancel(); }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center"
            aria-label="Cancelar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Error state */}
      {state.stage === 'error' && (
        <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[12px]">
          {state.error ?? 'Error desconocido'}
        </div>
      )}
    </div>
  );
}
