'use client';
import { useState } from 'react';
import { Download, ImageIcon } from 'lucide-react';
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

// Matches URLs that likely point to images (Replicate, Supabase, common CDNs, or ending in image extension)
const IMAGE_URL_REGEX = /https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|avif)(?:\?[^\s)]*)?/gi;
// Matches Replicate delivery URLs which don't have extensions
const REPLICATE_URL_REGEX = /https?:\/\/(?:replicate\.delivery|pbxt\.replicate\.com|[^\s)]+\.supabase\.co\/storage\/v1\/object\/public)[^\s)]+/gi;

/**
 * Extract image URLs from text and return text with URLs stripped
 * so we can render text + images separately.
 */
function extractImages(text: string): { cleanText: string; imageUrls: string[] } {
  const urls = new Set<string>();

  // Grab explicit image URLs
  const imgMatches = text.match(IMAGE_URL_REGEX);
  if (imgMatches) imgMatches.forEach((u) => urls.add(u));

  // Grab Replicate/Supabase storage URLs (they serve images without extension)
  const repMatches = text.match(REPLICATE_URL_REGEX);
  if (repMatches) repMatches.forEach((u) => urls.add(u));

  // Remove markdown image syntax entirely from the text so we don't show "![alt](url)"
  let cleanText = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  // Remove bare download links that only point to images we're already showing
  const imageUrls = Array.from(urls);
  for (const url of imageUrls) {
    // Remove markdown link wrapping the URL: [⬇ Download image](url)
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanText = cleanText.replace(new RegExp('\\[[^\\]]*\\]\\(' + escapedUrl + '\\)', 'g'), '');
    // Remove raw URL mentions
    cleanText = cleanText.replace(new RegExp(escapedUrl, 'g'), '');
  }

  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
  return { cleanText, imageUrls };
}

function ImagePreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  async function handleDownload() {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'operator-ai-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }

  if (errored) {
    return (
      <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 hover:bg-gold/10 transition-colors">
        <ImageIcon className="h-4 w-4 text-gold" />
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-gold font-medium hover:underline">
          View image
        </a>
        <a href={url} download className="text-[11px] text-fg-muted hover:text-gold ml-2">
          Download
        </a>
      </div>
    );
  }

  return (
    <div className="my-3 relative rounded-xl overflow-hidden border border-border bg-surface-2 group max-w-[520px]">
      {!loaded && (
        <div className="aspect-square flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-fg-muted">
            <div className="h-6 w-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <span className="text-[11px]">Loading image…</span>
          </div>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Generated"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={'w-full h-auto block transition-opacity ' + (loaded ? 'opacity-100' : 'opacity-0 absolute inset-0')}
      />
      {loaded && (
        <button
          type="button"
          onClick={handleDownload}
          className="absolute bottom-3 right-3 h-9 px-3 rounded-md bg-black/70 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[12px] font-medium hover:bg-black/90"
          aria-label="Save image"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>
      )}
    </div>
  );
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

  // Extract image URLs from the text and render them as real <img> elements
  const { cleanText, imageUrls } = extractImages(message.content);
  const hasAnyContent = cleanText.length > 0 || imageUrls.length > 0 || toolParts.length > 0;

  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 rounded-md shrink-0 gold-grad flex items-center justify-center mt-1">
        <span className="font-display text-[15px] text-bg leading-none">O</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Render text (with URLs removed) */}
        {cleanText ? (
          <MarkdownBody content={cleanText} />
        ) : !hasAnyContent ? (
          <div className="flex gap-1.5 pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '160ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '320ms' }} />
          </div>
        ) : null}

        {/* Render detected images */}
        {imageUrls.map((url, i) => (
          <ImagePreview key={url + i} url={url} />
        ))}

        {/* Render tool parts (if any) */}
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
