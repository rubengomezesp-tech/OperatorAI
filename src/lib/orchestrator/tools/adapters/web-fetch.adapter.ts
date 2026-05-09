/**
 * 📄 WEB FETCH ADAPTER — Tavily Extract API
 * 
 * Extrae el contenido limpio de cualquier URL pública.
 * Devuelve el texto/markdown sin HTML, ads, ni navigation.
 * 
 * Útil para: leer artículos, blogs, documentación, productos.
 * Plan gratuito: incluido en Tavily.
 * Docs: https://docs.tavily.com/docs/rest-api/api-reference
 */

import { z } from 'zod';
import { registerAdapter } from '../tools-registry';
import { withErrorHandling } from '../helpers/error-handler';
import { httpRequest } from '../helpers/http-client';
import type { AdapterDefinition } from '../types';

// ─── Input schema ────────────────────────────────────────────────
const WebFetchInputSchema = z.object({
  url: z.string().url('Debe ser una URL válida'),
  extract_depth: z.enum(['basic', 'advanced']).default('basic'),
});

type WebFetchInput = z.infer<typeof WebFetchInputSchema>;

// ─── Output type ─────────────────────────────────────────────────
interface WebFetchOutput {
  url: string;
  content: string;
  raw_length: number;
}

// ─── Adapter definition ──────────────────────────────────────────
const webFetchAdapter: AdapterDefinition<WebFetchInput, WebFetchOutput> = {
  name: 'web_fetch',
  description:
    'Lee y extrae el contenido limpio de una URL pública (artículo, blog, página de producto, etc.). Devuelve el texto principal sin HTML/ads/navigation. Úsalo cuando ya conoces la URL exacta y quieres leer su contenido.',
  inputSchema: WebFetchInputSchema,
  isAvailable: () => Boolean(process.env.TAVILY_API_KEY),
  execute: async (input) =>
    withErrorHandling(async () => {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) throw new Error('TAVILY_API_KEY no configurada');

      const result = await httpRequest<{
        results: Array<{ url: string; raw_content: string }>;
        failed_results: Array<{ url: string; error: string }>;
      }>('https://api.tavily.com/extract', {
        method: 'POST',
        body: {
          api_key: apiKey,
          urls: [input.url],
          extract_depth: input.extract_depth,
        },
        timeoutMs: 30000,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Tavily extract failed');
      }

      const successful = result.data.results?.[0];
      if (!successful) {
        const failed = result.data.failed_results?.[0];
        throw new Error(failed?.error || `No se pudo extraer contenido de ${input.url}`);
      }

      return {
        url: successful.url,
        content: successful.raw_content,
        raw_length: successful.raw_content.length,
      };
    }),
};

// Auto-registro
registerAdapter(webFetchAdapter);

export { webFetchAdapter };
