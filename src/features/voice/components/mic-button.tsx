'use client';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '../hooks/use-voice-recorder';

interface Props {
  onTranscript: (text: string) => void;
  language?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function MicButton({ onTranscript, language, disabled, size = 'md' }: Props) {
  const { state, level, start, stop } = useVoiceRecorder({
    onTranscript,
    onError: (msg) => toast.error(msg),
    language,
  });

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing' || state === 'requesting';

  const sizeCls = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconCls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const handleClick = () => {
    if (isRecording) stop();
    else if (state === 'idle') start();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
      className={cn(
        'relative shrink-0 rounded-full flex items-center justify-center transition-all',
        sizeCls,
        isRecording
          ? 'bg-gold/20 text-gold border border-gold/50 scale-110'
          : isProcessing
            ? 'bg-surface-2 text-fg-muted border border-border'
            : 'bg-surface-2 text-fg-muted hover:text-gold hover:bg-gold/10 border border-border hover:border-gold/40',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {isRecording && (
        <span
          className="absolute inset-0 rounded-full border-2 border-gold pointer-events-none"
          style={{
            transform: 'scale(' + (1 + level * 0.3) + ')',
            opacity: 0.4 + level * 0.4,
            transition: 'transform 80ms linear, opacity 80ms linear',
          }}
        />
      )}
      {isProcessing ? (
        <Loader2 className={cn(iconCls, 'animate-spin')} />
      ) : isRecording ? (
        <Square className={iconCls} fill="currentColor" />
      ) : (
        <Mic className={iconCls} />
      )}
    </button>
  );
}
