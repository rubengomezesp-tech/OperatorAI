/**
 * 🐛 SENTRY CLIENT CONFIG
 * Tracking de errores en el browser.
 * Ejecutado en cada page load.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring (10% sample en prod)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay (10% normal, 100% en errores)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Ambiente
  environment: process.env.NODE_ENV,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filtros
  beforeSend(event, hint) {
    // No reportar errores en local dev
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Sentry] would report:', hint.originalException);
      return null;
    }
    return event;
  },

  // Ignore common noise
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
    'AbortError',
  ],
});
