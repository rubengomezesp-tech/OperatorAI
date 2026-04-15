import { ConversationsRail } from '@/features/chat/components/conversations-rail';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-56px)]">
      <ConversationsRail />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
