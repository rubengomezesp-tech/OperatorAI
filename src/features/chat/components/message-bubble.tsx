'use client';
import { MarkdownBody } from './markdown-body';
import { MessageActions } from './message-actions';
import { ToolResult } from './tool-result';
import type { ToolPart } from './tool-result';

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: 'streaming' | 'complete' | 'failed';
  error?: string;
  toolParts?: ToolPart[];
}

interface Props {
  message: UiMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
}

export function MessageBubble({ message, isLastAssistant, onRegenerate, regenDisabled }: Props) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-surface-2 border border-border rounded-2xl rounded-br-md px-4 py-3 text-[14.5px] text-fg leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  const showActions = message.status === 'complete' && message.content.length > 0;
  const toolParts = message.toolParts ?? [];
  const hasAnyContent = message.content.length > 0 || toolParts.length > 0;

  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 rounded-md shrink-0 gold-grad flex items-center justify-center mt-1">
        <span className="font-display text-[15px] text-bg leading-none">O</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {message.content ? (
          <MarkdownBody content={message.content} />
        ) : toolParts.length === 0 ? (
          <div className="flex gap-1.5 pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '160ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '320ms' }} />
          </div>
        ) : null}

        {toolParts.map((part) => (
          <ToolResult key={part.id} part={part} />
        ))}

        {message.status === 'streaming' && hasAnyContent && (
          <span className="inline-block ml-0.5 w-[2px] h-[1em] bg-gold align-middle animate-pulse" />
        )}
        {message.status === 'failed' && (
          <div className="mt-2 text-[12.5px] text-danger">{message.error ?? 'Request failed'}</div>
        )}
        {showActions && (
          <MessageActions
            content={message.content}
            onRegenerate={isLastAssistant ? onRegenerate : undefined}
            disabled={regenDisabled}
          />
        )}
      </div>
    </div>
  );
}
