'use client';
import { LogOut, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function UserMenu({ email, fullName }: { email: string; fullName: string | null }) {
  const router = useRouter();
  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }
  const initials = (fullName || email).slice(0, 2).toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="h-9 w-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[12px] font-medium hover:border-border-strong transition-colors">
          {initials}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="min-w-[220px] rounded-md border border-border bg-surface p-1.5 shadow-xl z-50"
        >
          <div className="px-2.5 py-2 border-b border-border mb-1">
            <div className="text-[13px] font-medium truncate">{fullName || 'Account'}</div>
            <div className="text-[11.5px] text-fg-muted truncate">{email}</div>
          </div>
          <DropdownMenu.Item asChild>
            <Link href="/settings" className="flex items-center gap-2 px-2.5 h-8 rounded-md text-[13px] text-fg-soft hover:bg-surface-2 hover:text-fg cursor-pointer outline-none">
              <UserIcon className="h-3.5 w-3.5" /> Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/settings" className="flex items-center gap-2 px-2.5 h-8 rounded-md text-[13px] text-fg-soft hover:bg-surface-2 hover:text-fg cursor-pointer outline-none">
              <SettingsIcon className="h-3.5 w-3.5" /> Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={signOut}
            className="flex items-center gap-2 px-2.5 h-8 rounded-md text-[13px] text-danger hover:bg-surface-2 cursor-pointer outline-none"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
