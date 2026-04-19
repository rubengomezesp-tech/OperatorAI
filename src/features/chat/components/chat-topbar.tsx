'use client';
import { ModelSelector } from './model-selector';
import { ShareButton } from './share-button';

export function ChatTopbar({ title, conversationId }: { title?: string | null; conversationId?: string | null }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <div className="font-display text-[16px] truncate">
          {title || 'New conversation'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {conversationId && <ShareButton conversationId={conversationId} />}
        <ModelSelector />
      </div>
    </div>
  );
}
