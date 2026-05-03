'use client';
import { useI18n } from '@/lib/i18n';

export function ChatTopbar({ title }: { title?: string | null; conversationId?: string | null }) {
  const { locale } = useI18n();
  return (
    <div className="flex items-center px-4 py-2.5 flex-1 min-w-0">
      <div className="min-w-0 flex-1 text-center">
        <div className="font-display text-[15px] truncate text-fg-muted">
          {title || (locale === 'es' ? 'Nueva conversación' : 'New conversation')}
        </div>
      </div>
    </div>
  );
}
