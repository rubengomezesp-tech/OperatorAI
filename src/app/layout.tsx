import { I18nProvider } from '@/lib/i18n';
import type { Metadata } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { SplashScreen } from '@/components/splash-screen';
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Operator AI" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A863" />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <RootProviders><I18nProvider>{<SplashScreen>{children}</SplashScreen>}</I18nProvider></RootProviders>
      
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
