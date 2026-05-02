'use client';
import { useState, useCallback, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkPreview } from './link-preview';

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
          href={typeof props.src === 'string' ? props.src : URL.createObjectURL(props.src)}
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
  a: (props) => {
    const { href, children } = props;
    if (!href) return <a {...props} />;
    // If the visible text equals the href, treat as bare URL → preview card
    const text = Array.isArray(children) ? children.join('') : String(children ?? '');
    const isBareUrl = text === href || text === decodeURIComponent(href);
    if (isBareUrl && /^https?:\/\//.test(href)) {
      return <LinkPreview url={href} />;
    }
    return <a {...props} target="_blank" rel="noopener noreferrer" className="text-gold underline" />;
  },
};

export function MarkdownBody({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn(
      'prose prose-invert max-w-none',
      'prose-p:my-3.5 prose-p:leading-[1.65] prose-p:text-fg-soft prose-p:text-[15px]',
      'prose-headings:font-display prose-headings:text-fg prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3',
      'prose-h1:text-[26px] prose-h1:font-bold prose-h1:leading-tight',
      'prose-h2:text-[21px] prose-h2:font-semibold prose-h2:text-fg',
      'prose-h3:text-[17px] prose-h3:font-semibold prose-h3:text-gold/90 prose-h3:uppercase prose-h3:tracking-wider prose-h3:mt-5',
      'prose-strong:text-fg prose-strong:font-semibold',
      'prose-em:text-fg-soft',
      'prose-a:text-gold prose-a:no-underline hover:prose-a:underline',
      'prose-code:text-gold-soft prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none',
      'prose-pre:bg-[#0d0d0f] prose-pre:border prose-pre:border-gold/15 prose-pre:rounded-xl prose-pre:my-4 prose-pre:p-4 prose-pre:text-[13px] prose-pre:overflow-x-auto prose-pre:shadow-lg prose-pre:shadow-black/20',
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
