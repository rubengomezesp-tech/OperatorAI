import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.password',
    ],
    censor: '[REDACTED]',
  },
  base: { service: 'operator-ai' },
});

export type Logger = typeof logger;

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
