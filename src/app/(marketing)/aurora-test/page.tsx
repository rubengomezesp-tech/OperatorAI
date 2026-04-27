'use client';
import { Aurora } from '@/components/ui/aurora';
import { Glow } from '@/components/ui/glow';
import { AnimatedText } from '@/components/ui/animated-text';
import { Magnetic } from '@/components/ui/magnetic';
import { Button } from '@/components/ui/button';

export default function AuroraTest() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-mesh">
      <Aurora intensity="medium" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-32 text-center">
        <AnimatedText
          text="Operator AI"
          as="h1"
          className="font-display text-6xl text-glow-gold"
        />
        <p className="mt-6 text-fg-muted text-lg">
          The visual upgrade is live.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Magnetic>
            <Button variant="primary" size="lg">Get Started</Button>
          </Magnetic>
          <Magnetic>
            <Button variant="outline" size="lg">Learn More</Button>
          </Magnetic>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-glass border-light rounded-lg p-6 magnetic-hover">
              <div className="h-2 w-12 rounded shimmer-pro mb-3" />
              <div className="h-6 rounded shimmer-pro mb-2" />
              <div className="h-4 rounded shimmer-pro w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
