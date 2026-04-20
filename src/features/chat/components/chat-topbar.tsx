'use client';
import { ModelSelector } from './model-selector';
import { ShareButton } from './share-button';
import { useI18n } from '@/lib/i18n';

export function ChatTopbar({ title, conversationId }: { title?: string | null; conversationId?: string | null }) {
  const { locale } = useI18n();
  return (
    <div className="flex items-center justify-between px-4 py-2.5 flex-1 min-w-0">
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] truncate">
          {title || (locale === 'es' ? 'Nueva conversacion' : 'New conversation')}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {conversationId && <ShareButton conversationId={conversationId} />}
        <ModelSelector />
      </div>
    </div>
  );
}
