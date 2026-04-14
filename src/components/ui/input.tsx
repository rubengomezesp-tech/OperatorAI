'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-surface-2 px-3.5 text-[14px] text-fg placeholder:text-fg-subtle',
        'transition-colors focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15',
        'disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

export const Label = ({
  children, hint, htmlFor, className,
}: {
  children: React.ReactNode; hint?: React.ReactNode; htmlFor?: string; className?: string;
}) => (
  <label htmlFor={htmlFor} className={cn('mb-2 flex items-center justify-between', className)}>
    <span className="text-[12px] uppercase tracking-[0.12em] text-fg-muted">{children}</span>
    {hint && <span className="text-[11px] text-fg-subtle">{hint}</span>}
  </label>
);
