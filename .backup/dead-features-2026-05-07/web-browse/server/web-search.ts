import 'server-only';
import { serverEnv } from '@/lib/env';

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Web search using Brave Search API (free tier 2k queries/month).
 * If BRAVE_API_KEY not configured, gracefully returns empty.
 */
export async function webSearch(query: string, count = 5): Promise<WebResult[]> {
  const key = (serverEnv as unknown as Record<string, string | undefined>).BRAVE_API_KEY;
  if (!key) return [];

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(count));

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': key,
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    type BraveResp = {
      web?: {
        results?: Array<{
          title: string;
          url: string;
          description: string;
        }>;
      };
    };

    const json = (await res.json()) as BraveResp;
    return (json.web?.results ?? []).slice(0, count).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    }));
  } catch {
    return [];
  }
}

/**
 * Format results as a context block for the LLM.
 */
export function formatWebContext(results: WebResult[]): string {
  if (results.length === 0) return '';
  const blocks = results.map((r, i) =>
    '[' + (i + 1) + '] ' + r.title + '\n' +
    'URL: ' + r.url + '\n' +
    r.snippet
  );
  return [
    '<web_search_results>',
    'The user enabled live web search. Use these results to ground your answer with current info.',
    'Cite sources inline using [1], [2] etc. matching the index below.',
    '',
    blocks.join('\n\n'),
    '</web_search_results>',
  ].join('\n');
}

/**
 * Detect if user message wants web search (heuristic).
 */
export function shouldSearch(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = [
    'search', 'busca', 'investiga', 'find', 'last news', 'última',
    'latest', 'reciente', 'today', 'hoy', 'this week', 'esta semana',
    'who is', 'what is happening', 'pasó con', 'what happened',
    'price of', 'precio de', 'cotización', 'stock',
  ];
  return triggers.some((t) => lower.includes(t));
}
