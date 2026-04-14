import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { raised?: boolean }>(
  ({ className, raised = true, ...rest }, ref) => (
    <div ref={ref} className={cn(raised ? 'surface-raised' : 'surface', className)} {...rest} />
  ),
);
Card.displayName = 'Card';

export function CardHeader({
  title, subtitle, action,
}: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 pb-4 pt-5">
      <div className="min-w-0">
        <h3 className="text-[15px] font-medium tracking-tight text-fg">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
