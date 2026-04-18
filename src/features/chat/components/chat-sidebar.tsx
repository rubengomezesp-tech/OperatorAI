'use client';
import { useState } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { ChatHistory } from './chat-history';
import { cn } from '@/lib/utils';

export function ChatSidebar({ currentId, onSelect }: { currentId?: string | null; onSelect?: (id: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      'hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-200 shrink-0',
      collapsed ? 'w-0 overflow-hidden' : 'w-[260px]',
    )}>
      <div className="flex items-center justify-end p-2 border-b border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 rounded-md hover:bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg transition-colors"
        >
          {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>
      {!collapsed && <ChatHistory currentId={currentId} onSelect={onSelect} />}
    </div>
  );
}
