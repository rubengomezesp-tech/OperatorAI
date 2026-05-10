/**
 * 🐛 SENTRY SERVER CONFIG
 * Tracking de errores en API routes y server-side.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  environment: process.env.NODE_ENV,

  // Filtros
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Sentry server] would report:', hint.originalException);
      return null;
    }
    return event;
  },
});
