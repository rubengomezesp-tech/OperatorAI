import { I18nProvider } from '@/lib/i18n';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono, Cinzel } from 'next/font/google';
import { SplashScreen } from '@/components/splash-screen';
import { RootProviders } from '@/components/providers/root-providers';
import '@/styles/globals.css';
import { getBrandAssets } from '@/lib/brand-assets-server';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const serif = Playfair_Display({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0a0a0c',
};

export const metadata: Metadata = {
  title: {
    default: 'Operator AI - Your AI Marketing Operator',
    template: '%s | Operator AI',
  },
  description:
    'Your AI creative director, strategist, and designer in one conversation. Generate full marketing campaigns with strategy, copy, and visuals in 5 minutes. 17 industries with real visual DNA.',
  keywords: [
    'AI marketing',
    'campaign generator',
    'AI advertising',
    'marketing AI',
    'creative AI',
    'brand AI',
    'AI ads',
    'ad generator',
    'social media AI',
    'AI copywriter',
  ],
  authors: [{ name: 'Operator AI' }],
  metadataBase: new URL('https://operatoraiapp.com'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      es: '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Operator AI',
    title: 'Operator AI - Your AI Marketing Operator',
    description:
      'Stop creating campaigns. Start launching them. AI agency in your pocket — strategy, copy, and visuals in 5 minutes.',
    url: 'https://operatoraiapp.com',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Operator AI - Your AI Marketing Operator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Operator AI - Your AI Marketing Operator',
    description:
      'Stop creating campaigns. Start launching them. AI agency in your pocket.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrandAssets();
  return (
    <html
      lang="en"
      className={inter.variable + ' ' + serif.variable + ' ' + mono.variable}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Operator AI" />
        <link rel="icon" type="image/png" href={brand.faviconUrl ?? '/icons/icon-192x192.png'} />
        <link rel="apple-touch-icon" href={brand.pwaIconUrl ?? '/icons/icon-180x180.png'} />
        <link rel="apple-touch-icon" sizes="152x152" href={brand.pwaIconUrl ?? '/icons/icon-152x152.png'} />
        <link rel="apple-touch-icon" sizes="167x167" href={brand.pwaIconUrl ?? '/icons/icon-167x167.png'} />
        <link rel="apple-touch-icon" sizes="180x180" href={brand.pwaIconUrl ?? '/icons/icon-180x180.png'} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A863" />
      </head>
      <body className="min-h-screen w-full overflow-x-hidden bg-bg text-fg antialiased">
        <RootProviders>
          <I18nProvider>
            <SplashScreen>{children}</SplashScreen>
          </I18nProvider>
        </RootProviders>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
              {/* Mobile keyboard fix: track visible viewport height */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function setVV(){var vv=window.visualViewport;var h=(vv&&vv.height)||window.innerHeight;var offsetTop=(vv&&vv.offsetTop)||0;var keyboardH=Math.max(0,window.innerHeight-h-offsetTop);var d=document.documentElement.style;d.setProperty('--vvh',Math.round(h)+'px');d.setProperty('--kbh',Math.round(keyboardH)+'px');}setVV();if(window.visualViewport){window.visualViewport.addEventListener('resize',setVV);window.visualViewport.addEventListener('scroll',setVV);}window.addEventListener('resize',setVV);window.addEventListener('orientationchange',setVV);})();`,
          }}
        />
      </body>
    </html>
  );
}
