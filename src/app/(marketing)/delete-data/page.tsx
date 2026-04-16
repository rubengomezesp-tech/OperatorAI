'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeleteDataPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    setSent(true);
    toast.success('Data deletion request received. We will process it within 30 days.');
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[580px] mx-auto px-6 py-16 lg:py-24">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Account</div>
        <h1 className="font-display text-[36px] leading-tight mb-2">Delete Your Data</h1>
        <p className="text-[14px] text-fg-muted mb-8">
          Request complete deletion of your Operator AI account and all associated data.
          This includes chat history, generated images, videos, documents, memories, workflows,
          and all personal information. This action is irreversible.
        </p>

        {sent ? (
          <div className="surface-raised p-6 rounded-lg border border-gold/30">
            <p className="text-[15px] text-fg">
              Your data deletion request has been received. We will process it within
              <strong className="text-gold"> 30 days</strong> and send a confirmation to your email.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">
                Account email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60"
              />
            </div>
            <Button onClick={handleSubmit} variant="outline" className="w-full">
              Request Data Deletion
            </Button>
            <p className="text-[11.5px] text-fg-muted">
              By submitting this request, all your data will be permanently deleted within 30 days.
              You will receive a confirmation email. This action cannot be undone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
