import 'server-only';

export type CompanyIntelMethod = 'firecrawl' | 'scraper' | 'hybrid';

export interface CompanyIntelPage {
  url: string;
  title?: string;
  description?: string;
  text: string;
  markdown?: string;
  method: CompanyIntelMethod;
  score: number;
}

export interface CompanyIntelDocDraft {
  title: string;
  filename: string;
  category: 'brand' | 'business' | 'customers' | 'content' | 'other';
  subcategory: string;
  isBrandAsset: boolean;
  importance: 1 | 2 | 3 | 4 | 5;
  content: string;
}

export interface CompanyIntelResult {
  sourceUrl: string;
  hostname: string;
  method: CompanyIntelMethod;
  firecrawlEnabled: boolean;
  pages: CompanyIntelPage[];
  documents: CompanyIntelDocDraft[];
  warnings: string[];
}

interface BuildCompanyIntelInput {
  url: string;
  maxPages?: number;
}

const DEFAULT_MAX_PAGES = 8;
const MAX_PAGES = 14;
const MAX_CHARS_PER_PAGE = 24_000;

const POSITIVE_PATH_HINTS = [
  { rx: /^\/?$/i, score: 100 },
  { rx: /(about|company|empresa|nosotros|quienes|historia|mission|mision|vision)/i, score: 42 },
  { rx: /(services|servicios|solutions|soluciones|products|producto|features|how-it-works|como-funciona)/i, score: 40 },
  { rx: /(pricing|precios|planes|tarifas)/i, score: 32 },
  { rx: /(customers|clientes|casos|case-studies|testimonials|testimonios)/i, score: 30 },
  { rx: /(faq|help|ayuda|support|soporte|preguntas)/i, score: 28 },
  { rx: /(contact|contacto|demo|book|agenda)/i, score: 20 },
  { rx: /(blog|resources|recursos|guides|guias)/i, score: 14 },
];

const NEGATIVE_PATH_HINTS = [
  /(login|signin|signup|register|dashboard|account|admin|wp-admin|checkout|cart)/i,
  /(privacy|privacidad|legal|terms|terminos|cookies|policy|policies)/i,
  /\.(png|jpe?g|gif|webp|svg|ico|mp4|mov|zip|rar|css|js|woff2?|ttf)$/i,
];

export async function buildCompanyIntelligence(input: BuildCompanyIntelInput): Promise<CompanyIntelResult> {
  const sourceUrl = normalizeUrl(input.url);
  const url = new URL(sourceUrl);
  const maxPages = Math.min(Math.max(input.maxPages ?? DEFAULT_MAX_PAGES, 3), MAX_PAGES);
  const firecrawlEnabled = Boolean(process.env.FIRECRAWL_API_KEY);
  const warnings: string[] = [];

  let urls: string[] = [];
  let mapUsedFirecrawl = false;

  if (firecrawlEnabled) {
    try {
      urls = await mapWithFirecrawl(sourceUrl);
      mapUsedFirecrawl = true;
    } catch (err) {
      warnings.push(`Firecrawl map failed: ${errorMessage(err)}`);
    }
  }

  if (urls.length === 0) {
    urls = await discoverLinksWithScraper(sourceUrl);
  }

  const rankedUrls = rankUrls(urls, url.origin).slice(0, maxPages);
  const pages: CompanyIntelPage[] = [];
  let scrapeUsedFirecrawl = false;

  for (const pageUrl of rankedUrls) {
    try {
      const page = firecrawlEnabled
        ? await scrapeWithFirecrawl(pageUrl).catch(async (err) => {
            warnings.push(`Firecrawl scrape failed for ${pageUrl}: ${errorMessage(err)}`);
            return scrapeWithBasicFetcher(pageUrl);
          })
        : await scrapeWithBasicFetcher(pageUrl);

      if (page.text.trim().length >= 120) {
        pages.push(page);
        if (page.method === 'firecrawl') scrapeUsedFirecrawl = true;
      }
    } catch (err) {
      warnings.push(`Skipped ${pageUrl}: ${errorMessage(err)}`);
    }
  }

  if (pages.length === 0) {
    throw new Error('No useful website content could be extracted.');
  }

  const method: CompanyIntelMethod = scrapeUsedFirecrawl && !mapUsedFirecrawl
    ? 'hybrid'
    : scrapeUsedFirecrawl || mapUsedFirecrawl
      ? 'firecrawl'
      : 'scraper';

  const documents = buildDocumentDrafts({
    sourceUrl,
    hostname: url.hostname,
    pages,
    method,
  });

  if (!firecrawlEnabled) {
    warnings.push('FIRECRAWL_API_KEY is not set, so the free basic scraper was used.');
  }

  return {
    sourceUrl,
    hostname: url.hostname,
    method,
    firecrawlEnabled,
    pages,
    documents,
    warnings,
  };
}

function buildDocumentDrafts(input: {
  sourceUrl: string;
  hostname: string;
  pages: CompanyIntelPage[];
  method: CompanyIntelMethod;
}): CompanyIntelDocDraft[] {
  const { sourceUrl, hostname, pages, method } = input;
  const home = pages[0];
  const allText = pages.map((page) => page.text).join('\n');
  const brandName = cleanTitle(home.title) || hostname.replace(/^www\./, '');
  const description = firstDefined(pages.map((page) => page.description)) || selectSentences(allText, { max: 1 })[0] || '';
  const sourceBlock = buildSourceBlock(pages);
  const topSnippets = selectStrongSnippets(allText, 12);
  const offerSnippets = selectKeywordSnippets(allText, SERVICE_KEYWORDS, 16);
  const audienceSnippets = selectKeywordSnippets(allText, AUDIENCE_KEYWORDS, 16);
  const voiceSnippets = selectVoiceSnippets(pages, 18);
  const questionSnippets = selectQuestions(allText, 16);
  const trustSnippets = selectKeywordSnippets(allText, TRUST_KEYWORDS, 12);

  return [
    {
      title: `${brandName} - Company Snapshot`,
      filename: `operator-company-snapshot-${safeName(hostname)}.md`,
      category: 'business',
      subcategory: 'company-snapshot',
      isBrandAsset: false,
      importance: 5,
      content: [
        `# ${brandName} - Company Snapshot`,
        '',
        `Source website: ${sourceUrl}`,
        `Extraction method: ${method}`,
        '',
        '## What the company says',
        description || 'No concise meta description was detected.',
        '',
        '## High-signal website evidence',
        bulletList(topSnippets),
        '',
        '## Source pages',
        sourceBlock,
      ].join('\n'),
    },
    {
      title: `${brandName} - Offers and Services`,
      filename: `operator-offers-services-${safeName(hostname)}.md`,
      category: 'business',
      subcategory: 'offers-services',
      isBrandAsset: false,
      importance: 5,
      content: [
        `# ${brandName} - Offers and Services`,
        '',
        'Use this document to understand what the company sells, promises, and delivers.',
        '',
        '## Detected service and offer signals',
        bulletList(offerSnippets.length ? offerSnippets : topSnippets.slice(0, 8)),
        '',
        '## Source pages',
        sourceBlock,
      ].join('\n'),
    },
    {
      title: `${brandName} - Audience, Problems and Jobs To Be Done`,
      filename: `operator-audience-problems-${safeName(hostname)}.md`,
      category: 'customers',
      subcategory: 'audience-problems',
      isBrandAsset: false,
      importance: 5,
      content: [
        `# ${brandName} - Audience, Problems and Jobs To Be Done`,
        '',
        'Use this document when creating campaigns, landing pages, onboarding copy, sales scripts, and user research prompts.',
        '',
        '## Audience and problem signals',
        bulletList(audienceSnippets.length ? audienceSnippets : topSnippets.slice(0, 8)),
        '',
        '## Trust and risk-reduction signals',
        bulletList(trustSnippets.length ? trustSnippets : selectKeywordSnippets(allText, ['seguro', 'security', 'support', 'soporte'], 8)),
        '',
        '## Source pages',
        sourceBlock,
      ].join('\n'),
    },
    {
      title: `${brandName} - Brand Voice and Messaging`,
      filename: `operator-brand-voice-${safeName(hostname)}.md`,
      category: 'content',
      subcategory: 'brand-voice',
      isBrandAsset: true,
      importance: 5,
      content: [
        `# ${brandName} - Brand Voice and Messaging`,
        '',
        'Use this document to imitate the company voice, preferred wording, and message hierarchy.',
        '',
        '## Website copy examples',
        bulletList(voiceSnippets.length ? voiceSnippets : topSnippets.slice(0, 10)),
        '',
        '## Practical usage guidance for agents',
        '- Prefer claims and wording that are supported by the source snippets above.',
        '- Keep campaigns aligned with the audience and service language already used by the company.',
        '- If the user asks for ads, landing pages, emails, or social posts, pull tone and vocabulary from this document first.',
        '',
        '## Source pages',
        sourceBlock,
      ].join('\n'),
    },
    {
      title: `${brandName} - FAQ, Objections and Sales Angles`,
      filename: `operator-faq-objections-${safeName(hostname)}.md`,
      category: 'content',
      subcategory: 'faq-objections',
      isBrandAsset: false,
      importance: 4,
      content: [
        `# ${brandName} - FAQ, Objections and Sales Angles`,
        '',
        'Use this document when the user needs FAQs, objection handling, sales emails, pitch material, or conversion copy.',
        '',
        '## Detected questions',
        bulletList(questionSnippets.length ? questionSnippets : ['No explicit FAQ questions were detected. Use the source snippets below to draft likely FAQs.']),
        '',
        '## Useful sales and conversion evidence',
        bulletList([...trustSnippets, ...offerSnippets].slice(0, 14)),
        '',
        '## Source pages',
        sourceBlock,
      ].join('\n'),
    },
  ];
}

async function mapWithFirecrawl(url: string): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return [];

  const response = await fetch('https://api.firecrawl.dev/v2/map', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      includeSubdomains: false,
      limit: 80,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 180)}`);
  }

  const data = await response.json();
  const rawLinks = data?.links ?? data?.data?.links ?? data?.data ?? [];
  if (!Array.isArray(rawLinks)) return [];

  return rawLinks
    .map((item) => (typeof item === 'string' ? item : item?.url ?? item?.href))
    .filter((item): item is string => typeof item === 'string');
}

async function scrapeWithFirecrawl(url: string): Promise<CompanyIntelPage> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY is not set');

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'metadata'],
      onlyMainContent: true,
      removeBase64Images: true,
      blockAds: true,
      timeout: 45_000,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 180)}`);
  }

  const body = await response.json();
  const data = body?.data ?? body;
  const markdown = String(data?.markdown ?? '').slice(0, MAX_CHARS_PER_PAGE);
  const metadata = data?.metadata ?? {};
  const text = compactText(markdown || metadata.description || metadata.title || '');

  return {
    url,
    title: metadata.title ?? metadata.ogTitle,
    description: metadata.description ?? metadata.ogDescription,
    markdown,
    text,
    method: 'firecrawl',
    score: scoreUrl(url, new URL(url).origin),
  };
}

async function discoverLinksWithScraper(url: string): Promise<string[]> {
  const html = await fetchHtml(url);
  const origin = new URL(url).origin;
  const links = new Set<string>([url]);

  for (const href of extractAnchorHrefs(html)) {
    const normalized = normalizeDiscoveredUrl(href, url);
    if (!normalized) continue;
    if (!normalized.startsWith(origin)) continue;
    links.add(normalized);
  }

  return Array.from(links);
}

async function scrapeWithBasicFetcher(url: string): Promise<CompanyIntelPage> {
  const html = await fetchHtml(url);
  const title = extractTitle(html);
  const description = extractMetaContent(html, 'description') ?? extractMetaContent(html, 'og:description', 'property');
  const text = htmlToText(html).slice(0, MAX_CHARS_PER_PAGE);

  return {
    url,
    title,
    description,
    text,
    method: 'scraper',
    score: scoreUrl(url, new URL(url).origin),
  };
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OperatorAI-CompanyIntel/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function rankUrls(urls: string[], origin: string): string[] {
  const unique = new Map<string, number>();
  for (const value of urls) {
    const normalized = normalizeDiscoveredUrl(value, origin);
    if (!normalized || !normalized.startsWith(origin)) continue;
    const score = scoreUrl(normalized, origin);
    if (score <= -50) continue;
    unique.set(normalized, Math.max(unique.get(normalized) ?? -999, score));
  }
  if (!unique.has(origin + '/')) unique.set(origin + '/', 100);
  return Array.from(unique.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url);
}

function scoreUrl(url: string, origin: string): number {
  try {
    const parsed = new URL(url, origin);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    let score = 0;

    for (const negative of NEGATIVE_PATH_HINTS) {
      if (negative.test(path)) score -= 120;
    }

    for (const hint of POSITIVE_PATH_HINTS) {
      if (hint.rx.test(path)) score += hint.score;
    }

    const depth = path.split('/').filter(Boolean).length;
    score -= depth * 4;
    if (parsed.search) score -= 15;
    return score;
  } catch {
    return -999;
  }
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  url.hash = '';
  return url.toString();
}

function normalizeDiscoveredUrl(input: string, base: string): string | null {
  try {
    if (!input || input.startsWith('mailto:') || input.startsWith('tel:') || input.startsWith('javascript:')) {
      return null;
    }
    const url = new URL(input, base);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = '';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

function extractAnchorHrefs(html: string): string[] {
  return Array.from(html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["'][^>]*>/gi))
    .map((match) => decodeHtml(match[1]));
}

function extractTitle(html: string): string | undefined {
  const ogTitle = extractMetaContent(html, 'og:title', 'property');
  if (ogTitle) return ogTitle;
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : undefined;
}

function extractMetaContent(html: string, name: string, attr: 'name' | 'property' = 'name'): string | undefined {
  const re = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?${attr}=["']${escapeRegExp(name)}["'][^>]*?content=["']([^"']*)["']`,
    'i',
  );
  const match = html.match(re);
  if (match) return decodeHtml(match[1]).trim();

  const reverse = new RegExp(
    `<meta\\s+(?:[^>]*?\\s)?content=["']([^"']*)["'][^>]*?${attr}=["']${escapeRegExp(name)}["']`,
    'i',
  );
  const reverseMatch = html.match(reverse);
  return reverseMatch ? decodeHtml(reverseMatch[1]).trim() : undefined;
}

function htmlToText(html: string): string {
  return compactText(
    decodeHtml(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<\/(h[1-6]|p|div|section|article|li|br|tr|header|footer|main|nav)>/gi, '\n')
        .replace(/<[^>]+>/g, ' '),
    ),
  );
}

function compactText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && !isBoilerplate(line))
    .join('\n')
    .slice(0, MAX_CHARS_PER_PAGE);
}

function isBoilerplate(line: string): boolean {
  if (line.length < 3) return true;
  if (line.length > 260) return false;
  return /^(menu|close|cerrar|accept|aceptar|cookies?|privacy policy|terms|login|sign in|copyright|all rights reserved)$/i.test(line);
}

function selectStrongSnippets(text: string, max: number): string[] {
  return uniqueStrings(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 35 && line.length <= 220)
      .filter((line) => !/^(home|inicio|menu|contact|contacto|privacy|legal)$/i.test(line))
      .slice(0, 80),
  ).slice(0, max);
}

function selectKeywordSnippets(text: string, keywords: string[], max: number): string[] {
  const rx = new RegExp(`\\b(${keywords.map(escapeRegExp).join('|')})\\b`, 'i');
  return uniqueStrings(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 25 && line.length <= 240 && rx.test(line)),
  ).slice(0, max);
}

function selectVoiceSnippets(pages: CompanyIntelPage[], max: number): string[] {
  const candidates: string[] = [];
  for (const page of pages) {
    if (page.title) candidates.push(cleanTitle(page.title));
    if (page.description) candidates.push(page.description);
    candidates.push(...selectStrongSnippets(page.text, 8));
  }
  return uniqueStrings(candidates.filter(Boolean)).slice(0, max);
}

function selectQuestions(text: string, max: number): string[] {
  return uniqueStrings(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 12 && line.length <= 220)
      .filter((line) => /\?$|^(what|how|why|when|where|can|do|does|is|are|que|qué|como|cómo|por que|por qué|cuanto|cuánto|cuando|cuándo)\b/i.test(line)),
  ).slice(0, max);
}

function selectSentences(text: string, options: { max: number }): string[] {
  return uniqueStrings(
    text
      .replace(/\n+/g, '. ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 35 && sentence.length <= 260),
  ).slice(0, options.max);
}

function buildSourceBlock(pages: CompanyIntelPage[]): string {
  return pages
    .map((page, index) => `${index + 1}. ${page.title ? `${cleanTitle(page.title)} - ` : ''}${page.url}`)
    .join('\n');
}

function bulletList(items: string[]): string {
  if (items.length === 0) return '- No strong snippets detected.';
  return uniqueStrings(items)
    .slice(0, 18)
    .map((item) => `- ${item.replace(/\n/g, ' ').trim()}`)
    .join('\n');
}

function cleanTitle(title?: string): string {
  if (!title) return '';
  return title.split(/[|·]/)[0].replace(/\s+/g, ' ').trim();
}

function firstDefined(values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value?.trim()))?.trim();
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const clean = value.replace(/\s+/g, ' ').trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function safeName(value: string): string {
  return value.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const SERVICE_KEYWORDS = [
  'service',
  'services',
  'servicio',
  'servicios',
  'solution',
  'solutions',
  'solucion',
  'solución',
  'soluciones',
  'platform',
  'plataforma',
  'app',
  'product',
  'producto',
  'plan',
  'plans',
  'care',
  'cuidado',
  'cuidador',
  'cuidadora',
  'cuidadoras',
  'cuidadadores',
  'home care',
  'atencion',
  'atención',
];

const AUDIENCE_KEYWORDS = [
  'for',
  'para',
  'families',
  'familias',
  'customer',
  'customers',
  'cliente',
  'clientes',
  'users',
  'usuarios',
  'mayores',
  'elderly',
  'senior',
  'seniors',
  'mobility',
  'movilidad',
  'disability',
  'dependencia',
  'caregiver',
  'caregivers',
  'cuidador',
  'cuidadora',
  'cuidadoras',
];

const TRUST_KEYWORDS = [
  'secure',
  'security',
  'seguro',
  'seguridad',
  'verified',
  'verificado',
  'trusted',
  'confianza',
  'support',
  'soporte',
  'certified',
  'certificado',
  'privacy',
  'privacidad',
  'quality',
  'calidad',
  'experience',
  'experiencia',
];
