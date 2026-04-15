'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { INDUSTRY_OPTIONS } from '../data/constants';
import { cn } from '@/lib/utils';

interface Props {
  value: string | null;
  onChange: (next: string | null) => void;
}

export function IndustrySelect({ value, onChange }: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={cn(
          'h-10 w-full px-3.5 rounded-md border bg-surface-2 text-left',
          'flex items-center justify-between',
          'transition-colors focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15',
          value ? 'text-fg border-border' : 'text-fg-subtle border-border',
        )}>
          <span>{value || 'Select industry...'}</span>
          <ChevronDown className="h-4 w-4 text-fg-subtle" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[320px] overflow-auto rounded-md border border-border bg-surface p-1.5 shadow-xl z-50"
        >
          {INDUSTRY_OPTIONS.map((opt) => (
            <DropdownMenu.Item
              key={opt}
              onSelect={() => onChange(opt)}
              className={cn(
                'px-2.5 h-8 rounded-md flex items-center cursor-pointer outline-none text-[13px]',
                opt === value ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              {opt}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
