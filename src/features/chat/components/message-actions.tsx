'use client';
import { useState } from 'react';
import { RotateCcw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export function MessageActions({ content, onRegenerate, disabled }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <div className="flex items-center gap-1 mt-2 opacity-60 hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={copy}
        className="h-7 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px] text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5"
        aria-label="Copy message"
      >
        {copied ? <Check className="h-3 w-3 text-gold" /> : <Copy className="h-3 w-3" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={disabled}
          className={cn(
            'h-7 px-2 rounded-md border border-transparent text-[11.5px] transition-colors flex items-center gap-1.5',
            disabled
              ? 'text-fg-subtle cursor-not-allowed'
              : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2',
          )}
          aria-label="Regenerate"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Regenerate</span>
        </button>
      )}
    </div>
  );
}
