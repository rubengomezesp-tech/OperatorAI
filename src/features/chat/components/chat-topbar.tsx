'use client';
import { ModelSelector } from './model-selector';

export function ChatTopbar({ title }: { title?: string | null }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="min-w-0">
        <div className="font-display text-[16px] truncate">
          {title || 'New conversation'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModelSelector />
      </div>
    </div>
  );
}
