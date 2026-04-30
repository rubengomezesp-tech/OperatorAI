'use client';
import type { UiMessage } from '@/lib/chat/types';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, X, ChevronLeft, ChevronRight, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { MessageActions } from './message-actions';
import { ActionCard } from './action-card';
import { cn } from '@/lib/utils';
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
}

interface Props {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
  previousUserContent?: string;
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

export function MessageBubble({ message, isLastAssistant, onRegenerate, regenDisabled, previousUserContent }: Props) {
  const { avatarUrl } = useBrandAssets();
  const isUser = message.role === 'user';
  const imageUrls = useMemo(() => extractImageUrls(message.content), [message.content]);
  const cleanContent = useMemo(() => imageUrls.length > 0 ? stripImageUrls(message.content) : message.content, [message.content, imageUrls]);

  return (
    <div className={cn('group flex gap-3 py-5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="h-7 w-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-[11px] font-medium text-gold">
            T
          </div>
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
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = urls.length;

  return (
    <>
      {/* Grid */}
      <div className={cn(
        'grid gap-2 rounded-xl overflow-hidden',
        count === 1 ? 'grid-cols-1' :
        count === 2 ? 'grid-cols-2' :
        count === 3 ? 'grid-cols-2' :
        'grid-cols-2',
      )}>
        {urls.map((url, i) => (
          <button
            key={url + i}
            type="button"
            onClick={() => setLightbox(i)}
            className={cn(
              'relative group overflow-hidden rounded-lg border border-border bg-surface-2 hover:border-gold/40 transition-all',
              count === 1 ? 'max-h-[400px]' :
              count === 3 && i === 0 ? 'row-span-2' : '',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover min-h-[120px] max-h-[400px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-bg/0 group-hover:bg-bg/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-md flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-fg-muted hover:text-fg z-10" onClick={() => setLightbox(null)}>
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-fg-muted hover:text-fg z-10" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + count) % count); }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-fg-muted hover:text-fg z-10" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % count); }}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="max-w-[90vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[lightbox]} alt="" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <a
                href={urls[lightbox]}
                download
                className="h-9 px-4 rounded-md bg-surface border border-border text-[13px] text-fg flex items-center gap-2 hover:border-gold/40 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </a>
              {count > 1 && (
                <span className="text-[12px] text-fg-muted">{lightbox + 1} / {count}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
