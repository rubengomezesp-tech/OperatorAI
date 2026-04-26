/**
 * Research Dossier Engine
 *
 * Before the Brain plans a campaign, we research:
 *   1. The user's product (what is it really? competitors? positioning?)
 *   2. Visual aesthetic references for the vertical + angle
 *   3. Recent trends in the category
 *
 * Output is a structured dossier that the Brain receives as context.
 *
 * Strategy:
 *   - Use OpenAI's web_search via Responses API (we already have OPENAI_API_KEY)
 *   - Synthesize with Claude Sonnet 4.5 (we already have it)
 *   - Cache result in draft.intake_data for 24h
 *
 * NO new API keys required.
 */

import 'server-only';
import { serverEnv } from '@/lib/env';
import type { VerticalSlug, CampaignTypeSlug, AngleSlug } from '../types';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface ResearchDossier {
  /** Real facts about the product (extracted from web) */
  productFacts: string[];
  /** Notable competitors discovered */
  competitorSignals: string[];
  /** Visual aesthetic descriptions to feed image model */
  visualReferences: string[];
  /** Trending angles or topics in the vertical */
  trendingTopics: string[];
  /** Source URLs used (for transparency / debug) */
  sources: string[];
  /** Free-text synthesis (1-2 paragraphs) */
  synthesis: string;
  /** Did we hit network? (false = used fallback) */
  fromLiveSearch: boolean;
  /** Total time spent (ms) */
  durationMs: number;
}

export interface ResearchDossierInput {
  productName: string;
  productDescription: string;
  audienceDescription?: string;
  vertical: VerticalSlug;
  campaignType: CampaignTypeSlug;
  primaryAngle: AngleSlug;
}

// ────────────────────────────────────────────────────────────────
// Public entry point
// ────────────────────────────────────────────────────────────────

export async function buildResearchDossier(
  input: ResearchDossierInput,
): Promise<ResearchDossier> {
  const t0 = Date.now();

  // Step 1: web search (best-effort)
  let webResults: WebSearchResult | null = null;
  try {
    webResults = await searchWeb(input);
  } catch (err) {
    console.warn('[research-dossier] web search failed', {
      error: (err as Error).message,
    });
  }

  // Step 2: synthesize via Claude (or fallback to deterministic)
  let synthesis = '';
  if (webResults && webResults.summary) {
    synthesis = webResults.summary;
  } else {
    synthesis = buildFallbackSynthesis(input);
  }

  // Step 3: extract structured facts
  const productFacts = webResults?.productFacts ?? deriveProductFacts(input);
  const competitorSignals =
    webResults?.competitorSignals ?? deriveCompetitors(input);
  const visualReferences = buildVisualReferences(input);
  const trendingTopics = webResults?.trendingTopics ?? [];
  const sources = webResults?.sources ?? [];

  return {
    productFacts,
    competitorSignals,
    visualReferences,
    trendingTopics,
    sources,
    synthesis,
    fromLiveSearch: !!webResults,
    durationMs: Date.now() - t0,
  };
}

// ────────────────────────────────────────────────────────────────
// Web search via OpenAI Responses API
// ────────────────────────────────────────────────────────────────

interface WebSearchResult {
  summary: string;
  productFacts: string[];
  competitorSignals: string[];
  trendingTopics: string[];
  sources: string[];
}

async function searchWeb(
  input: ResearchDossierInput,
): Promise<WebSearchResult | null> {
  const apiKey = serverEnv.OPENAI_API_KEY;
  if (!apiKey) return null;

  // Single comprehensive query — cheap and effective
  const query = [
    `Research for marketing campaign:`,
    `Product/Service: ${input.productName} — ${input.productDescription}`,
    input.audienceDescription ? `Audience: ${input.audienceDescription}` : '',
    `Industry vertical: ${input.vertical}`,
    `Campaign goal: ${input.campaignType}`,
    ``,
    `Find: 1) what this product actually does (real facts), 2) 2-3 notable competitors,`,
    `3) recent trends in this category. Return concise bullet points.`,
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: query,
        tools: [{ type: 'web_search_preview' }],
        max_output_tokens: 1500,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn('[research-dossier] OpenAI Responses API error', {
        status: res.status,
        body: (await res.text()).slice(0, 200),
      });
      return null;
    }

    const body = await res.json();

    // The response shape is: body.output[]: items with { type: 'message', content: [{ type:'output_text', text }] }
    // We extract text + collect URL annotations as sources
    const textParts: string[] = [];
    const sources: string[] = [];

    if (Array.isArray(body.output)) {
      for (const item of body.output) {
        if (item.type === 'message' && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === 'output_text') {
              if (typeof c.text === 'string') textParts.push(c.text);
              if (Array.isArray(c.annotations)) {
                for (const a of c.annotations) {
                  if (a.type === 'url_citation' && a.url) sources.push(a.url);
                }
              }
            }
          }
        }
      }
    }

    const summary = textParts.join('\n').trim();
    if (!summary) return null;

    // Lightweight extraction: split by bullet/line patterns
    const lines = summary
      .split(/\n+/)
      .map((l) => l.replace(/^[•\-*\d.)\s]+/, '').trim())
      .filter((l) => l.length > 10 && l.length < 300);

    const productFacts: string[] = [];
    const competitorSignals: string[] = [];
    const trendingTopics: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes('competitor') ||
        lower.includes('alternative') ||
        lower.includes('vs ')
      ) {
        competitorSignals.push(line);
      } else if (
        lower.includes('trend') ||
        lower.includes('rising') ||
        lower.includes('popular')
      ) {
        trendingTopics.push(line);
      } else {
        productFacts.push(line);
      }
    }

    return {
      summary,
      productFacts: productFacts.slice(0, 5),
      competitorSignals: competitorSignals.slice(0, 4),
      trendingTopics: trendingTopics.slice(0, 4),
      sources: Array.from(new Set(sources)).slice(0, 6),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[research-dossier] fetch error', {
      error: (err as Error).message,
    });
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// Visual references (vertical-aware, deterministic)
// ────────────────────────────────────────────────────────────────

function buildVisualReferences(input: ResearchDossierInput): string[] {
  const refs: string[] = [];
  const v = input.vertical;
  const a = input.primaryAngle;

  // Vertical aesthetic anchors
  const verticalRefs: Record<string, string[]> = {
    'fashion-apparel': [
      'Vogue editorial — clean studio shots with confident posture',
      'AllSaints campaign — moody urban texture, considered shadows',
      'COS minimalism — neutral palette, geometric framing',
    ],
    'fitness-wellness': [
      'Lululemon — golden hour, breath state, premium athleisure',
      'Nike Training — kinetic motion, sweat textures',
      'Glossier wellness — pastel calm, skincare-meets-fitness',
    ],
    'tech-saas-app': [
      'Linear / Vercel — dark gradient, glass UI, considered typography space',
      'Stripe — premium product hero shots, soft natural light',
      'Apple keynote — high-key clean studio, single product focus',
    ],
    'ecommerce-physical': [
      'Aesop — earth tones, apothecary props, considered styling',
      'Made.in — kitchen lifestyle, real-use shots, premium materials',
      'Glossier — pastel pop, skin-led photography',
    ],
    'services-coaching': [
      'Headspace — soft pastels, breathing rhythm visuals',
      'MasterClass — warm-lit portrait, instructor in element',
      'BetterUp — corporate-but-human, golden hour',
    ],
    'beauty-cosmetics': [
      'Fenty Beauty — bold confident skin tones',
      'Glossier — dewy skin macro shots',
      'Charlotte Tilbury — cinematic golden hour glamour',
    ],
    'food-beverage': [
      'Bon Appétit — overhead 45° natural-light food shots',
      'Sweetgreen — fresh-lit ingredient close-ups',
      'Erewhon — premium wellness food aesthetic',
    ],
    'education-online': [
      'MasterClass dark cinematic instructor frame',
      'Skillshare bright workspace lifestyle',
      'Duolingo playful illustrated style',
    ],
    'real-estate': [
      'Architectural Digest — wide-angle golden hour interiors',
      'Compass — drone-led property storytelling',
      'Sotheby\'s — luxury moody hero shots',
    ],
    automotive: [
      'BMW — kinetic motion blur with sharp subject',
      'Tesla — minimal product hero against gradient',
      'Porsche — dramatic studio lighting on metal',
    ],
    'travel-hospitality': [
      'Airbnb Plus — golden hour interiors',
      'Aman Resorts — moody luxury landscape',
      'Lonely Planet — authentic local moments',
    ],
    'home-decor': [
      'Magnolia Home — warm domestic natural light',
      'West Elm — curated lifestyle styling',
      'Schoolhouse — considered single-piece hero',
    ],
    'health-medical': [
      'Hims/Hers — soft modern clinical aesthetic',
      'Calm — pastel breathing visual',
      'Ro Health — clean confident patient portraits',
    ],
    pets: [
      'BarkBox — joyful eye-level pet portraits',
      'Chewy — pet-owner bond moments',
      'The Farmers Dog — premium pet lifestyle',
    ],
    'jewelry-luxury': [
      'Cartier — black velvet macro with single point light',
      'Tiffany — iconic blue with sharp specular highlights',
      'Mejuri — modern minimal jewelry on skin',
    ],
    'finance-fintech': [
      'Robinhood — clean dark UI hero',
      'Stripe — premium financial confidence',
      'Wealthfront — calming green data visualization',
    ],
    other: [
      'Kinfolk magazine — considered editorial composition',
      'Apple — minimal premium product hero',
      'Patagonia — authentic environmental storytelling',
    ],
  };

  const verticalAnchors = verticalRefs[v] ?? verticalRefs.other;
  refs.push(...verticalAnchors);

  // Angle-specific overlay
  const angleOverlay: Record<string, string> = {
    luxury: 'Cinematic depth-of-field, premium materials, restrained color',
    authority: 'Editorial portrait framing, expert in element, confident gaze',
    'pain-point': 'Tension before relief — subject in conflict moment',
    desire: 'Aspirational outcome state — subject having achieved the goal',
    'social-proof': 'Group dynamic energy — multiple subjects in shared moment',
    viral: 'Scroll-stopping unexpected composition or color contrast',
    urgency: 'Kinetic motion, time-pressured framing, action mid-stride',
    curiosity: 'Mystery framing, partially revealed subject, intriguing angle',
    conversion: 'Clear before/after or product-in-use clarity',
  };

  if (angleOverlay[a]) refs.push(angleOverlay[a]);

  return refs.slice(0, 5);
}

// ────────────────────────────────────────────────────────────────
// Fallbacks (when web search unavailable)
// ────────────────────────────────────────────────────────────────

function deriveProductFacts(input: ResearchDossierInput): string[] {
  return [
    `${input.productName} positioned as ${input.vertical} solution`,
    input.productDescription,
  ].filter(Boolean);
}

function deriveCompetitors(_input: ResearchDossierInput): string[] {
  return [];
}

function buildFallbackSynthesis(input: ResearchDossierInput): string {
  return [
    `${input.productName} operates in the ${input.vertical} vertical`,
    `with a ${input.campaignType} campaign objective.`,
    `Primary strategic angle: ${input.primaryAngle}.`,
    input.audienceDescription
      ? `Target audience: ${input.audienceDescription}`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}
