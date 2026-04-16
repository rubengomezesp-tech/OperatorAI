import type { Metadata } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { RootProviders } from '@/components/providers/root-providers';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const serif = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Operator AI', template: '%s - Operator AI' },
  description: 'The AI operating layer for businesses.',
  metadataBase: new URL('https://operatorai.app'),
  openGraph: { type: 'website', siteName: 'Operator AI' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable + ' ' + serif.variable + ' ' + mono.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <RootProviders>{children}</RootProviders>
      
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
