'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]',
  {
    variants: {
      variant: {
        primary: 'gold-grad text-bg shadow-[0_8px_28px_-8px_rgb(201_168_99_/_0.5)] hover:brightness-110',
        secondary: 'bg-surface-2 text-fg border border-border hover:border-border-strong hover:bg-surface-3',
        outline: 'bg-transparent text-fg border border-border-strong hover:border-gold hover:text-gold',
        ghost: 'bg-transparent text-fg-soft hover:bg-surface-2 hover:text-fg',
        danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4 text-[14px]',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant, size, asChild, loading, leading, trailing, children, disabled, ...rest }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...rest}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : leading}
        {children}
        {!loading && trailing}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
