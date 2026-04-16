import Link from 'next/link';

const links = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/delete-data', label: 'Delete Data' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg py-6 px-6">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11.5px] text-fg-muted">
          &copy; {new Date().getFullYear()} Operator AI. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[11.5px] text-fg-muted hover:text-gold transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
