export type ErrorCode =
  | 'unauthorized' | 'forbidden' | 'not_found' | 'invalid_input'
  | 'rate_limited' | 'quota_exceeded' | 'entitlement_missing'
  | 'provider_error' | 'provider_timeout' | 'provider_unavailable'
  | 'storage_error' | 'internal' | 'conflict';

interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = 'AppError';
    this.code = opts.code;
    this.status = opts.status ?? statusFromCode(opts.code);
    this.details = opts.details;
    if (opts.cause) (this as { cause?: unknown }).cause = opts.cause;
  }

  toJSON() {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

function statusFromCode(code: ErrorCode): number {
  switch (code) {
    case 'unauthorized': return 401;
    case 'forbidden': return 403;
    case 'not_found': return 404;
    case 'invalid_input': return 400;
    case 'conflict': return 409;
    case 'rate_limited':
    case 'quota_exceeded': return 429;
    case 'entitlement_missing': return 402;
    case 'provider_timeout':
    case 'provider_unavailable': return 503;
    case 'provider_error': return 502;
    default: return 500;
  }
}

export const unauthorized = (m = 'Unauthorized') => new AppError({ code: 'unauthorized', message: m });
export const forbidden = (m = 'Forbidden') => new AppError({ code: 'forbidden', message: m });
export const notFound = (r = 'Resource') => new AppError({ code: 'not_found', message: r + ' not found' });
export const invalid = (m: string, d?: Record<string, unknown>) =>
  new AppError({ code: 'invalid_input', message: m, details: d });
export const conflict = (m: string) => new AppError({ code: 'conflict', message: m });
