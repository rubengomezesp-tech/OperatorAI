/**
 * 🏷️ AUTO-CLASSIFY DOCUMENTS
 *
 * Clasificación rápida basada en filename + mime + size.
 * NO requiere LLM (instant, free).
 *
 * Returns category + suggested importance + is_brand_asset flag.
 *
 * Strategy:
 *   1. Image files → likely brand asset (logo) → category 'brand', importance 5
 *   2. Filename hints → match patterns
 *   3. Default → 'other', importance 3
 */

export type DocumentCategory = 'brand' | 'business' | 'customers' | 'content' | 'other';

export interface ClassificationResult {
  category: DocumentCategory;
  subcategory: string | null;
  is_brand_asset: boolean;
  importance: 1 | 2 | 3 | 4 | 5;
  reason: string;
}

interface ClassifyInput {
  filename: string;
  mimeType: string;
  /** Optional: explicit category from user (UI dropdown) — overrides auto */
  userCategory?: DocumentCategory;
}

// ─── Pattern dictionaries ────────────────────────────────────────
const BRAND_PATTERNS = [
  // brand-book / guidelines
  { rx: /brand[\s_-]?(book|guide|guidelines|manual|kit|identity|system)/i, sub: 'brand-book', importance: 5 as const },
  // logo
  { rx: /\b(logo|logotype|isotipo|isotype|logomark)\b/i, sub: 'logo', importance: 5 as const },
  // colors / palette
  { rx: /\b(palette|paleta|colors?|color[\s_-]?guide)\b/i, sub: 'palette', importance: 4 as const },
  // typography
  { rx: /\b(font|tipograf[ií]a|typography|typeface)\b/i, sub: 'typography', importance: 4 as const },
  // mood / vibe
  { rx: /\b(moodboard|mood[\s_-]?board|vibe|aesthetic)\b/i, sub: 'moodboard', importance: 3 as const },
];

const BUSINESS_PATTERNS = [
  { rx: /\b(pitch|deck|presentation|presentaci[oó]n)\b/i, sub: 'pitch-deck', importance: 4 as const },
  { rx: /\b(business[\s_-]?plan|plan[\s_-]?de[\s_-]?negocios?)\b/i, sub: 'business-plan', importance: 4 as const },
  { rx: /\b(strategy|estrategia|roadmap|plan)\b/i, sub: 'strategy', importance: 4 as const },
  { rx: /\b(financials?|finanzas|p&l|revenue|ingresos)\b/i, sub: 'financials', importance: 3 as const },
  { rx: /\b(market[\s_-]?research|investigaci[oó]n[\s_-]?de[\s_-]?mercado)\b/i, sub: 'market-research', importance: 3 as const },
  { rx: /\b(competitor|competencia|swot|analisis|analysis)\b/i, sub: 'analysis', importance: 3 as const },
];

const CUSTOMER_PATTERNS = [
  { rx: /\b(persona|personas|icp|ideal[\s_-]?customer)\b/i, sub: 'persona', importance: 5 as const },
  { rx: /\b(customer|cliente|usuario|user)[\s_-]?(profile|perfil|research)/i, sub: 'profile', importance: 4 as const },
  { rx: /\b(testimonial|testimonio|review|rese[ñn]a|case[\s_-]?study|caso)/i, sub: 'testimonial', importance: 3 as const },
  { rx: /\b(survey|encuesta|interview|entrevista)\b/i, sub: 'research', importance: 3 as const },
  { rx: /\b(audience|audiencia|target|p[uú]blico)\b/i, sub: 'audience', importance: 4 as const },
];

const CONTENT_PATTERNS = [
  { rx: /\b(template|plantilla|formato)\b/i, sub: 'template', importance: 3 as const },
  { rx: /\b(copy|text|texto|tone|tono|voice|voz)[\s_-]?(guide|gu[ií]a)?/i, sub: 'voice-tone', importance: 4 as const },
  { rx: /\b(blog|article|art[ií]culo|post)\b/i, sub: 'blog', importance: 2 as const },
  { rx: /\b(ad|ads|anuncio|campaign|campa[ñn]a)\b/i, sub: 'ad-example', importance: 3 as const },
  { rx: /\b(email|mail|newsletter)\b/i, sub: 'email-template', importance: 3 as const },
  { rx: /\b(social|instagram|twitter|tiktok|linkedin)[\s_-]?(post|content)?/i, sub: 'social-template', importance: 3 as const },
  { rx: /\b(faq|qa|q&a)\b/i, sub: 'faq', importance: 3 as const },
];

// ─── Main classifier ────────────────────────────────────────────
export function autoClassifyDocument(input: ClassifyInput): ClassificationResult {
  // 1. User explicitly set category via UI → respect it
  if (input.userCategory) {
    return {
      category: input.userCategory,
      subcategory: null,
      is_brand_asset: input.userCategory === 'brand',
      importance: input.userCategory === 'brand' ? 4 : 3,
      reason: 'user_override',
    };
  }

  const filename = input.filename.toLowerCase();
  const mime = input.mimeType.toLowerCase();

  // 2. Image files → likely brand asset (logo, mockup, photo)
  if (mime.startsWith('image/')) {
    // SVG / vector → almost certainly logo
    if (mime === 'image/svg+xml') {
      return {
        category: 'brand',
        subcategory: 'logo',
        is_brand_asset: true,
        importance: 5,
        reason: 'svg_image_detected',
      };
    }
    // Filename suggests logo → high confidence brand
    if (/logo|brand|mark/i.test(filename)) {
      return {
        category: 'brand',
        subcategory: 'logo',
        is_brand_asset: true,
        importance: 5,
        reason: 'image_filename_brand',
      };
    }
    // Generic image → brand by default (could be moodboard, asset)
    return {
      category: 'brand',
      subcategory: 'asset',
      is_brand_asset: true,
      importance: 4,
      reason: 'generic_image_assumed_brand',
    };
  }

  // 3. Pattern matching by category (priority: brand > customers > business > content)
  for (const pat of BRAND_PATTERNS) {
    if (pat.rx.test(filename)) {
      return {
        category: 'brand',
        subcategory: pat.sub,
        is_brand_asset: true,
        importance: pat.importance,
        reason: `pattern_match:${pat.sub}`,
      };
    }
  }

  for (const pat of CUSTOMER_PATTERNS) {
    if (pat.rx.test(filename)) {
      return {
        category: 'customers',
        subcategory: pat.sub,
        is_brand_asset: false,
        importance: pat.importance,
        reason: `pattern_match:${pat.sub}`,
      };
    }
  }

  for (const pat of BUSINESS_PATTERNS) {
    if (pat.rx.test(filename)) {
      return {
        category: 'business',
        subcategory: pat.sub,
        is_brand_asset: false,
        importance: pat.importance,
        reason: `pattern_match:${pat.sub}`,
      };
    }
  }

  for (const pat of CONTENT_PATTERNS) {
    if (pat.rx.test(filename)) {
      return {
        category: 'content',
        subcategory: pat.sub,
        is_brand_asset: false,
        importance: pat.importance,
        reason: `pattern_match:${pat.sub}`,
      };
    }
  }

  // 4. Default fallback
  return {
    category: 'other',
    subcategory: null,
    is_brand_asset: false,
    importance: 3,
    reason: 'no_match_default',
  };
}
