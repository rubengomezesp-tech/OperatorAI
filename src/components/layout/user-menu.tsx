'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, CreditCard, Settings, LogOut, Sparkles, Brain, Plug } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

interface Props {
  email: string;
  fullName: string | null;
}

export function UserMenu({ email, fullName }: Props) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string>('Free');
  const [usage, setUsage] = useState<{ chat: number; images: number; videos: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const initials = (fullName || email || 'U')
    .split(/[\s@.]/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '').join('') || 'U';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Fetch usage + plan summary
    fetch('/api/account/summary')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setPlan(data.plan ?? 'Free');
          setUsage(data.usage ?? null);
        }
      })
      .catch(() => {});
  }, [open]);

  async function handleLogout() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  }

  const planColor =
    plan === 'Agency' ? 'text-purple-300 bg-purple-500/15 border-purple-400/30' :
    plan === 'Studio' ? 'text-amber-200 bg-amber-500/15 border-amber-400/30' :
    plan === 'Pro' ? 'text-gold bg-gold/15 border-gold/30' :
    'text-fg-muted bg-surface-2 border-border';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'h-9 w-9 rounded-full border border-border flex items-center justify-center text-[11.5px] font-medium uppercase tracking-wider transition-all',
          open ? 'bg-gold/15 border-gold/50 text-gold' : 'bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40',
        )}
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] surface-raised rounded-lg border border-border shadow-2xl overflow-hidden z-50 animate-fadeIn">
          <div className="p-4 border-b border-border relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full gold-grad opacity-[0.12] blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="h-12 w-12 rounded-full gold-grad flex items-center justify-center text-bg text-[15px] font-medium shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium truncate">{fullName || 'No name set'}</div>
                <div className="text-[11.5px] text-fg-muted truncate">{email}</div>
              </div>
            </div>
            <div className="relative mt-3 flex items-center justify-between">
              <div className={cn('px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.12em] border', planColor)}>
                Plan {plan}
              </div>
              {plan === 'Free' && (
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="text-[11px] text-gold hover:underline"
                >
                  Upgrade →
                </Link>
              )}
            </div>
          </div>

          {usage && (
            <div className="p-3 border-b border-border bg-surface/40">
              <div className="text-[9.5px] uppercase tracking-[0.14em] text-fg-subtle mb-2">Usage this month</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-[14px] font-display text-fg">{usage.chat}</div>
                  <div className="text-[9.5px] uppercase tracking-[0.1em] text-fg-subtle">Chats</div>
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-display text-fg">{usage.images}</div>
                  <div className="text-[9.5px] uppercase tracking-[0.1em] text-fg-subtle">Images</div>
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-display text-fg">{usage.videos}</div>
                  <div className="text-[9.5px] uppercase tracking-[0.1em] text-fg-subtle">Videos</div>
                </div>
              </div>
            </div>
          )}

          <nav className="p-1.5">
            <DropdownLink href="/settings/profile" icon={User} onClose={() => setOpen(false)}>Profile</DropdownLink>
            <DropdownLink href="/settings/integrations" icon={Plug} onClose={() => setOpen(false)}>Integrations</DropdownLink>
            <DropdownLink href="/settings/memory" icon={Brain} onClose={() => setOpen(false)}>Memory</DropdownLink>
            <DropdownLink href="/settings/billing" icon={CreditCard} onClose={() => setOpen(false)}>Billing</DropdownLink>
            <DropdownLink href="/settings" icon={Settings} onClose={() => setOpen(false)}>All settings</DropdownLink>
          </nav>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-[13px] text-fg-muted hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href, icon: Icon, onClose, children,
}: { href: string; icon: React.ComponentType<{ className?: string }>; onClose: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-3 h-9 rounded-md text-[13px] text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{children}</span>
    </Link>
  );
}
