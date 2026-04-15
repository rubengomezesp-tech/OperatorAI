import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[480px] w-full text-center">
        <div className="h-14 w-14 rounded-full gold-grad mx-auto mb-6 flex items-center justify-center">
          <Check className="h-6 w-6 text-bg" strokeWidth={3} />
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-2">Welcome aboard</div>
        <h1 className="font-display text-[34px] leading-[1.1] mb-4">
          Your subscription is <span className="text-gold-grad">live</span>
        </h1>
        <p className="text-[14px] text-fg-muted mb-8">
          Your plan is active. Head to your dashboard and start creating.
        </p>
        <Link href="/dashboard">
          <Button size="md">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
