import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
              <span className="font-display text-[15px] text-bg leading-none">O</span>
            </span>
            <span className="font-display text-[17px]">Operator AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                <span className="inline-flex items-center gap-2">
                  Get started
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 py-24 w-full">
          <div className="max-w-[720px]">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Operator Studio</div>
            <h1 className="font-display text-[56px] lg:text-[72px] leading-[1.02]">
              The <span className="text-gold-grad">AI operating layer</span>
              <br />for your business.
            </h1>
            <p className="text-[16px] text-fg-muted mt-6 max-w-[520px]">
              Chat, imagery, campaigns, research, voice unified under one assistant that knows your brand, your knowledge, and your customers.
            </p>
            <div className="flex gap-3 mt-8">
              <Link href="/signup">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">See pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
