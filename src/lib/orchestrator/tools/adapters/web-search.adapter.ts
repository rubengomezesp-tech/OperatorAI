/**
 * 🔍 WEB SEARCH ADAPTER — Tavily API
 * 
 * Búsqueda web optimizada para LLMs.
 * Tavily devuelve resultados ya pre-procesados con respuesta directa.
 * 
 * Plan gratuito: 1000 queries/mes
 * Docs: https://docs.tavily.com/docs/rest-api/api-reference
 */

import { z } from 'zod';
import { registerAdapter } from '../tools-registry';
import { withErrorHandling } from '../helpers/error-handler';
import { httpRequest } from '../helpers/http-client';
import type { AdapterDefinition } from '../types';

// ─── Input schema ────────────────────────────────────────────────
const WebSearchInputSchema = z.object({
  query: z.string().min(2, 'query debe tener al menos 2 caracteres'),
  search_depth: z.enum(['basic', 'advanced']).default('basic'),
  max_results: z.number().int().min(1).max(10).default(5),
  include_answer: z.boolean().default(true),
  include_raw_content: z.boolean().default(false),
});

type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

// ─── Output type ─────────────────────────────────────────────────
interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface WebSearchOutput {
  query: string;
  answer?: string;
  results: TavilyResult[];
  resultsCount: number;
}

// ─── Adapter definition ──────────────────────────────────────────
const webSearchAdapter: AdapterDefinition<WebSearchInput, WebSearchOutput> = {
  name: 'web_search',
  description:
    'Busca información actualizada en la web usando Tavily. Devuelve una respuesta directa + top resultados con título, URL y resumen. Úsalo cuando necesites información fresca, datos actuales, noticias, o investigación rápida.',
  inputSchema: WebSearchInputSchema,
  isAvailable: () => Boolean(process.env.TAVILY_API_KEY),
  execute: async (input) =>
    withErrorHandling(async () => {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) throw new Error('TAVILY_API_KEY no configurada');

      const result = await httpRequest<{
        query: string;
        answer?: string;
        results: TavilyResult[];
      }>('https://api.tavily.com/search', {
        method: 'POST',
        body: {
          api_key: apiKey,
          query: input.query,
          search_depth: input.search_depth,
          max_results: input.max_results,
          include_answer: input.include_answer,
          include_raw_content: input.include_raw_content,
        },
        timeoutMs: 25000,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Tavily search failed');
      }

      return {
        query: result.data.query,
        answer: result.data.answer,
        results: result.data.results || [],
        resultsCount: (result.data.results || []).length,
      };
    }),
};

// Auto-registro
registerAdapter(webSearchAdapter);

export { webSearchAdapter };
