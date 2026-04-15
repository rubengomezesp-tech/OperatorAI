'use client';
import { Volume2, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTTS } from '../hooks/use-tts';

interface Props {
  text: string;
  voice?: 'alloy' | 'nova' | 'shimmer' | 'echo' | 'fable' | 'onyx';
  className?: string;
}

export function SpeakButton({ text, voice = 'nova', className }: Props) {
  const { state, speak, pause, resume } = useTTS({
    voice,
    onError: (msg) => toast.error(msg),
  });

  const handleClick = () => {
    if (state === 'idle') speak(text);
    else if (state === 'playing') pause();
    else if (state === 'paused') resume();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-[11.5px] text-fg-subtle hover:text-gold transition-colors',
        className,
      )}
      title={state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : 'Listen'}
    >
      {state === 'loading' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === 'playing' ? (
        <Pause className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      <span>
        {state === 'loading' ? 'Loading' :
          state === 'playing' ? 'Pause' :
            state === 'paused' ? 'Resume' :
              'Listen'}
      </span>
    </button>
  );
}
