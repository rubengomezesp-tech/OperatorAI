'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ChatHistory } from './chat-history';
import { cn } from '@/lib/utils';

export function ChatDrawer({ currentId, onSelect }: { currentId?: string | null; onSelect?: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="h-8 w-8 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg hover:border-gold/40 transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-bg/60 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-surface border-r border-border shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-display text-[15px]">Chats</span>
              <button onClick={() => setOpen(false)} className="text-fg-muted hover:text-fg"><X className="h-4 w-4" /></button>
            </div>
            <ChatHistory
              currentId={currentId}
              onSelect={(id) => { setOpen(false); onSelect?.(id); }}
            />
          </div>
        </div>
      )}
    </>
  );
}
