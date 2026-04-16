'use client';
import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, Globe, Link as LinkIcon, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  conversationId: string;
}

type Visibility = 'private' | 'link' | 'public';

export function ShareButton({ conversationId }: Props) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('link');
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function createOrUpdate(vis: Visibility) {
    setLoading(true);
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, visibility: vis }),
      });
      if (!res.ok) throw new Error('Failed');
      const body = await res.json();
      setSlug(body.slug);
      setVisibility(vis);
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/c/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  }

  async function revoke() {
    if (!slug) return;
    if (!confirm('Revoke this share? The link will stop working.')) return;
    setLoading(true);
    try {
      await fetch('/api/share/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      setSlug(null);
      setVisibility('private');
      toast.success('Share revoked');
    } catch {
      toast.error('Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open && !slug) createOrUpdate('link'); }}
        className={cn(
          'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] transition border',
          open
            ? 'bg-gold/10 border-gold/50 text-gold'
            : 'bg-surface-2 border-border text-fg-muted hover:text-gold hover:border-gold/40'
        )}
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>Share</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[340px] surface-raised rounded-lg border border-border shadow-2xl overflow-hidden z-50 animate-fadeIn">
          <div className="p-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-[0.14em] text-gold mb-2">Share conversation</div>
            <div className="text-[12.5px] text-fg-muted">Anyone with this link can view this conversation.</div>
          </div>

          <div className="p-3 space-y-1.5">
            <VisibilityOption
              active={visibility === 'private'}
              icon={Lock}
              label="Private"
              desc="Only you can see this"
              onClick={() => revoke()}
              disabled={!slug}
            />
            <VisibilityOption
              active={visibility === 'link'}
              icon={LinkIcon}
              label="Anyone with link"
              desc="Viewable by anyone with the URL"
              onClick={() => createOrUpdate('link')}
            />
            <VisibilityOption
              active={visibility === 'public'}
              icon={Globe}
              label="Public"
              desc="Indexable, discoverable"
              onClick={() => createOrUpdate('public')}
            />
          </div>

          {slug && (
            <div className="p-3 border-t border-border bg-surface/40">
              <div className="flex items-center gap-2">
                <div className="flex-1 text-[11.5px] font-mono text-fg-muted truncate rounded-md border border-border bg-surface-2 px-2.5 py-2">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/c/{slug}
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-8 w-8 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition flex items-center justify-center shrink-0"
                  aria-label="Copy link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={revoke}
                disabled={loading}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-7 rounded-md text-[11.5px] text-fg-muted hover:text-danger transition"
              >
                <Trash2 className="h-3 w-3" />
                <span>Revoke link</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VisibilityOption({
  active, icon: Icon, label, desc, onClick, disabled,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-start gap-3 p-2.5 rounded-md text-left transition',
        active ? 'bg-gold/10' : 'hover:bg-surface-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', active ? 'text-gold' : 'text-fg-muted')} />
      <div className="flex-1">
        <div className={cn('text-[12.5px] font-medium', active ? 'text-gold' : 'text-fg')}>
          {label}
        </div>
        <div className="text-[11px] text-fg-muted mt-0.5">{desc}</div>
      </div>
      {active && <Check className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />}
    </button>
  );
}
