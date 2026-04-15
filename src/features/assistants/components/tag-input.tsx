'use client';
import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, suggestions, maxTags = 20, className }: Props) {
  const [input, setInput] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag) || value.length >= maxTags) return;
    onChange([...value, tag]);
    setInput('');
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1]);
    }
  }

  const filteredSuggestions = suggestions
    ?.filter((s) => !value.includes(s))
    .filter((s) => !input || s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 6);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-border bg-surface-2 min-h-[44px] focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15 transition-colors">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-surface-3 border border-border text-[12.5px] text-fg"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-fg-subtle hover:text-fg"
              aria-label={'Remove ' + t}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input && add(input)}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[140px] bg-transparent border-0 outline-none text-[13.5px] text-fg placeholder:text-fg-subtle"
        />
      </div>
      {filteredSuggestions && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="h-7 px-2.5 rounded-md border border-border bg-surface-2 hover:border-gold/50 hover:text-gold text-[12px] text-fg-muted transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
