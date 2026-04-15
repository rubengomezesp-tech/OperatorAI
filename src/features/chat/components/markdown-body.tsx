'use client';
import { useState, useCallback, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy } from 'lucide-react';
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

const components: Components = {
  pre: (props) => <CodeBlock {...props} />,
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
      className,
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
