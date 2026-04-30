'use client';
import type { UiMessage } from '@/lib/chat/types';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, X, ChevronLeft, ChevronRight, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { ImageTile } from './tool-result';
import { MessageActions } from './message-actions';
import { ActionCard } from './action-card';
import { cn } from '@/lib/utils';
import { ToolResult } from './tool-result';
import { useBrandAssets } from '@/lib/brand-assets-context';

const IMAGE_URL_REGEX = /https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|avif)(?:\?[^\s)]*)?/gi;
const REPLICATE_URL_REGEX = /https?:\/\/(?:replicate\.delivery|pbxt\.replicate\.com|[^\s)]+\.supabase\.co\/storage\/v1\/object\/public)[^\s)]+/gi;


const PROPOSAL_TRIGGERS = [
  'campaña completa',
  'puedo construir la campaña',
  'puedo generar la campaña',
  'puedo construir todo',
  'puedo armar todo',
  '~5 minutos',
  '~5 min',
  'full campaign',
  'i can build the full campaign',
  'i can generate',
  '~5 minutes',
];

function agentProposesCampaign(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROPOSAL_TRIGGERS.some((trig) => lower.includes(trig));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolParts?: import('@/lib/chat/types').ToolPart[];
}

interface Props {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
  previousUserContent?: string;
  userAvatarUrl?: string | null;
  userInitial?: string;
}

function extractImageUrls(text: string): string[] {
  const imgMatches = text.match(IMAGE_URL_REGEX) || [];
  const repMatches = text.match(REPLICATE_URL_REGEX) || [];
  const all = [...new Set([...imgMatches, ...repMatches])];
  return all.filter(u => !u.includes('.js') && !u.includes('.css'));
}

function stripImageUrls(text: string): string {
  let cleaned = text;
  const urls = extractImageUrls(text);
  for (const url of urls) {
    // Remove markdown image syntax ![...](...) and plain URLs
    cleaned = cleaned.replace(new RegExp(`!\\[.*?\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), '');
    cleaned = cleaned.replace(url, '');
  }
  // Clean up leftover empty lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

export function MessageBubble({ message, isLastAssistant, onRegenerate, regenDisabled, previousUserContent, userAvatarUrl, userInitial = 'U' }: Props) {
  const { avatarUrl } = useBrandAssets();
  const isUser = message.role === 'user';
  const imageUrls = useMemo(() => extractImageUrls(message.content), [message.content]);
  const cleanContent = useMemo(() => imageUrls.length > 0 ? stripImageUrls(message.content) : message.content, [message.content, imageUrls]);

  return (
    <div className={cn('group flex gap-3 py-5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          userAvatarUrl ? (
            <div className="h-7 w-7 rounded-full overflow-hidden bg-gold/10 border border-gold/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-[11px] font-medium text-gold uppercase">
              {userInitial}
            </div>
          )
        ) : avatarUrl ? (
          <div className="h-7 w-7 rounded-full overflow-hidden bg-bg/40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Operator" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full gold-grad flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Content column */}
      <div className={cn('flex-1 min-w-0 space-y-3', isUser ? 'flex flex-col items-end' : '')}>
        {/* Tool invocations (image gen, video, file analysis...) */}
        {!isUser && message.toolParts && message.toolParts.length > 0 && (
          <div className="space-y-2">
            {message.toolParts.map((part) => (
              <ToolResult key={part.id} part={part} />
            ))}
          </div>
        )}

        {/* Text content — flat, no card */}
        {cleanContent && (
          <div className={cn(
            'prose prose-sm prose-invert max-w-none text-[15.5px] leading-[1.7] text-fg',
            isUser ? 'text-right' : '',
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
          </div>
        )}

        {/* Premium Campaign CTA */}
        {!isUser && cleanContent && agentProposesCampaign(cleanContent) && (
          <ActionCard contextPrompt={previousUserContent} />
        )}

        {/* Image gallery */}
        {imageUrls.length > 0 && (
          <ImageGallery urls={imageUrls} />
        )}

        {/* User attachment images */}
        {isUser && (message as any).attachmentUrls && (message as any).attachmentUrls.length > 0 && (
          <div className={cn(
            'grid gap-1.5 rounded-lg overflow-hidden',
            (message as any).attachmentUrls.length === 1 ? 'grid-cols-1 max-w-[280px]' :
            (message as any).attachmentUrls.length === 2 ? 'grid-cols-2 max-w-[320px]' :
            'grid-cols-3 max-w-[400px]',
          )}>
            {(message as any).attachmentUrls.map((url: string, i: number) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-auto rounded-lg object-cover max-h-[200px]"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Actions (assistant only) */}
        {!isUser && (
          <MessageActions
            content={message.content}
            messageId={message.id}
            onRegenerate={isLastAssistant ? onRegenerate : undefined}
            disabled={regenDisabled}
          />
        )}
      </div>
    </div>
  );
}

function ImageGallery({ urls }: { urls: string[] }) {
  const count = urls.length;

  return (
    <div className={cn(
      'grid gap-2',
      count === 1 ? 'grid-cols-1 max-w-md' :
      count === 2 ? 'grid-cols-2' :
      'grid-cols-1 sm:grid-cols-2',
    )}>
      {urls.map((url, i) => (
        <ImageTile key={url + i} url={url} />
      ))}
    </div>
  );
}
