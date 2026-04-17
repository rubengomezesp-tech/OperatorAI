'use client';
import { useState, useCallback, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    const el = (props as { 'data-original-ref'?: unknown })['data-original-ref'];
    void el;
    const text = typeof children === 'object' && children && 'props' in children
      ? (children as { props: { children: unknown } }).props.children
      : children;
    const str = typeof text === 'string' ? text : Array.isArray(text) ? text.join('') : String(text ?? '');
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  }, [children, props]);

  return (
    <div className="relative group my-4">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className={cn(
          'absolute top-2.5 right-2.5 h-7 w-7 rounded-md border flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          copied
            ? 'bg-gold/20 border-gold/50 text-gold'
            : 'bg-surface border-border text-fg-muted hover:text-fg hover:border-border-strong',
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function InlineImage(props: ComponentPropsWithoutRef<'img'>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className="block my-3 relative rounded-xl overflow-hidden border border-border bg-surface-2 group max-w-[520px]">
      {!loaded && (
        <span className="absolute inset-0 flex items-center justify-center text-fg-muted text-[12px]">Loading…</span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        alt={props.alt ?? 'Generated image'}
        onLoad={() => setLoaded(true)}
        className="w-full h-auto block rounded-xl"
        loading="lazy"
      />
      {props.src && (
        <a
          href={props.src}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="absolute bottom-2 right-2 h-8 w-8 rounded-md bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80"
          aria-label="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );
}

const components: Components = {
  pre: (props) => <CodeBlock {...props} />,
  img: (props) => <InlineImage {...props} />,
};

export function MarkdownBody({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn(
      'prose prose-invert max-w-none',
      'prose-p:my-3 prose-p:leading-relaxed prose-p:text-fg-soft',
      'prose-headings:font-display prose-headings:text-fg prose-headings:tracking-tight',
      'prose-h1:text-[22px] prose-h2:text-[18px] prose-h3:text-[16px]',
      'prose-strong:text-fg prose-strong:font-semibold',
      'prose-em:text-fg-soft',
      'prose-a:text-gold prose-a:no-underline hover:prose-a:underline',
      'prose-code:text-gold-soft prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none',
      'prose-pre:bg-surface-2 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:my-0',
      'prose-blockquote:border-l-gold/40 prose-blockquote:text-fg-muted prose-blockquote:not-italic',
      'prose-ul:my-3 prose-li:my-1 prose-li:text-fg-soft prose-li:marker:text-gold/60',
      'prose-hr:border-border',
      'prose-table:text-[13.5px]',
      'prose-th:text-fg prose-th:border-border',
      'prose-td:text-fg-soft prose-td:border-border',
      'prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:my-3',
      className,
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
