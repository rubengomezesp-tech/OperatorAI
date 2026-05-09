/**
 * 🌐 HTTP CLIENT — Wrapper con retry y timeout
 * 
 * Usado por todos los adapters externos para llamadas HTTP.
 * Centraliza retry policy, timeouts, y error handling.
 */

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export interface HttpResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Cliente HTTP con retry automático y timeout configurable.
 * Por defecto: 1 retry, timeout 30s.
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResult<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 30000,
    retries = 1,
  } = options;

  let lastError: string = 'Unknown error';

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timer);

      const contentType = response.headers.get('content-type') || '';
      let data: T | undefined;

      if (contentType.includes('application/json')) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as unknown as T;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error.message : String(error);
      // No reintentar si fue abort (timeout)
      if (lastError.includes('aborted')) break;
      // Si quedan reintentos, esperar 500ms exponencial
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError,
  };
}
