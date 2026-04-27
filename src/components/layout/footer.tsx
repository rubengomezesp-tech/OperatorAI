import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  const productLinks = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/login', label: 'Log in' },
    { href: '/signup', label: 'Get started' },
  ];

  const legalLinks = [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/cookies', label: 'Cookies' },
    { href: '/delete-data', label: 'Delete data' },
  ];

  const supportLinks = [
    { href: '/support', label: 'Support' },
  ];

  return (
    <footer className="relative border-t border-border bg-bg/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand col */}
          <div className="col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-fg hover:opacity-80 transition-opacity mb-3"
            >
              <div className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-bg" />
              </div>
              <span className="font-display text-[16px] tracking-tight">Operator</span>
            </Link>
            <p className="text-[12.5px] text-fg-muted leading-relaxed max-w-xs">
              Your AI marketing operator. One conversation replaces an entire creative team.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">
              Product
            </h4>
            <ul className="space-y-2">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12.5px] text-fg-muted hover:text-gold transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12.5px] text-fg-muted hover:text-gold transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12.5px] text-fg-muted hover:text-gold transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
          <div className="text-[11px] text-fg-subtle">
            &copy; {year} Operator AI. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            <span>Made with intention.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
