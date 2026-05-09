/**
 * 🎨 LAYOUT ARCHETYPES — Catálogo de estructuras visuales modernas
 * 
 * Reemplaza los presets abstractos ("luxury-minimal", "aggressive") 
 * por 14 archetypes COMPOSITIVOS concretos basados en cómo las top 
 * brands estructuran sus ads.
 * 
 * Cada archetype define:
 *   - Layout description (texto literal al prompt gpt-image-2)
 *   - Composition rules (cómo distribuir elementos)
 *   - Typography character (carácter tipográfico, no font name)
 *   - Palette directive (cómo aplicar colores)
 *   - Lighting + Camera directives
 *   - Best/forbidden verticals + emotional angles
 * 
 * Basado en research del 8-may-2026: Apple, Nike, Spotify, Linear, 
 * Vercel, Notion, Tesla, Red Bull, Stripe, Figma.
 * 
 * @author OperatorAI + Claude (Sprint 2)
 */

export type ArchetypeId =
  | 'hero-typographic-apple'
  | 'full-bleed-cinematic'
  | 'split-screen-comparison'
  | 'editorial-magazine'
  | 'spotify-duotone-diagonal'
  | 'brutalist-text-hero'
  | 'bento-grid-modular'
  | 'vercel-blueprint-dark'
  | 'type-collage-mixed-media'
  | 'surreal-sculptural-product'
  | 'documentary-honest'
  | 'data-viz-hero-stat'
  | 'y2k-liquid-chrome'
  | 'testimonial-quote-product'
  | 'brand-system-document'
  | 'premium-saas-announcement';

export interface LayoutArchetype {
  id: ArchetypeId;
  name: string;
  /** Texto literal que va al prompt como "LAYOUT ARCHETYPE: ..." */
  promptDirective: string;
  /** Reglas de composición específicas */
  compositionRules: string[];
  /** Carácter tipográfico (NO nombres de fonts) */
  typographyCharacter: string;
  /** Cómo aplicar la paleta */
  paletteDirective: string;
  /** Dirección de iluminación */
  lightingDirective: string;
  /** Dirección de cámara/lente */
  cameraDirective: string;
  /** Verticales donde funciona bien */
  bestForVerticals: string[];
  /** Verticales donde NO funciona */
  forbiddenForVerticals: string[];
  /** Campaign types ideales */
  bestForCampaignTypes: string[];
  /** Patterns que ESTE archetype debe evitar (anti-template específico) */
  forbidPatterns: string[];
}

// ═══ EL CATÁLOGO DE 14 ARCHETYPES ═══

export const ARCHETYPES: Record<ArchetypeId, LayoutArchetype> = {
  // ─── 1. HERO TYPOGRAPHIC APPLE-STYLE ───
  'hero-typographic-apple': {
    id: 'hero-typographic-apple',
    name: 'Hero Typographic (Apple-style)',
    promptDirective:
      'Apple-style minimal poster ad. Single hero element off-center on right two-thirds. Massive negative space (70%+ of frame). Headline 3-5 words anchored top-left. Brand mark small bottom-right. The "less to read, more to feel" approach.',
    compositionRules: [
      'Single focal point — no competing elements',
      'Hero positioned off-center (rule of thirds, right intersection)',
      '70%+ negative space — generous breathing room',
      'Headline anchored top-left, NOT centered',
      'Strict hierarchy: headline >> tagline > brand mark',
    ],
    typographyCharacter:
      'geometric sans-serif, weight 600-700, tight letter-spacing, large scale (headline 5x tagline)',
    paletteDirective:
      'monochrome base (white or near-black) + ONE color accent extracted from product or reference',
    lightingDirective: 'soft diffused studio lighting, no harsh shadows, clean and crisp',
    cameraDirective: 'product photography 50-85mm, sharp focus, minimal depth of field',
    bestForVerticals: ['tech-saas-app', 'hardware', 'fintech', 'consumer-tech', 'luxury-goods'],
    forbiddenForVerticals: ['fashion-fast', 'music', 'gaming'],
    bestForCampaignTypes: ['brand-awareness', 'product-launch'],
    forbidPatterns: [
      'cluttered composition',
      'multiple competing focal points',
      'busy backgrounds',
      'gradient overlays',
    ],
  },

  // ─── 2. FULL-BLEED CINEMATIC (Nike/Tesla) ───
  'full-bleed-cinematic': {
    id: 'full-bleed-cinematic',
    name: 'Full-Bleed Cinematic (Nike/Tesla style)',
    promptDirective:
      'Edge-to-edge cinematic photograph. Subject filling 80% of vertical frame, mid-action or in motion. Dramatic side lighting with deep shadows. Oversized headline overlay diagonal or vertical on side edge. No background panels — full immersive frame.',
    compositionRules: [
      'Subject fills 80% of frame (no white panels)',
      'Off-center — subject occupies right or left two-thirds',
      'Negative dark/cool space reserved for headline overlay',
      'Headline rotated 90° on edge OR positioned at frame corner',
      'Energy: motion blur, dynamic angle, low or high camera',
    ],
    typographyCharacter:
      'heavy condensed sans-serif, oblique italic, weight 800-900, oversized 200pt+, ALL CAPS',
    paletteDirective:
      'high-contrast: deep blacks + cool grays + ONE saturated accent (orange, red, lime)',
    lightingDirective:
      'harsh top rim light + deep shadows below, dramatic chiaroscuro, golden hour or industrial',
    cameraDirective:
      '35mm wide low-angle OR 85mm tight, motion blur on extremities, sharp on torso/face',
    bestForVerticals: ['fitness', 'automotive', 'sports', 'energy-drinks', 'lifestyle-active'],
    forbiddenForVerticals: ['luxury-jewelry', 'beauty-soft', 'baby-products'],
    bestForCampaignTypes: ['brand-awareness', 'product-launch', 'transformation'],
    forbidPatterns: [
      'studio backdrop with negative space',
      'centered symmetric composition',
      'soft pastels',
      'glamour retouching',
    ],
  },

  // ─── 3. SPLIT-SCREEN COMPARISON / BEFORE-AFTER ───
  'split-screen-comparison': {
    id: 'split-screen-comparison',
    name: 'Split Screen / Before-After',
    promptDirective:
      'Split-screen ad with vertical or horizontal 50/50 division. Left/top panel: "before" state — desaturated, lower contrast, cooler. Right/bottom panel: "after" state — vibrant, sharper, warmer. Center divider line. Each side labeled briefly.',
    compositionRules: [
      'Strict 50/50 division (vertical or horizontal)',
      'Center divider line — visible 1-2px contrast line',
      'Same subject framed identically on both sides',
      'Color/mood inverted between panels',
      'Labels: "BEFORE" / "AFTER" or descriptive 2-word tags',
    ],
    typographyCharacter:
      'neutral sans-serif + oversized numerals, weight 700, label position consistent on both panels',
    paletteDirective:
      'duotone split: cool desaturated (left) vs warm saturated (right); OR grayscale vs full color',
    lightingDirective:
      'flat lighting on "before" side; dramatic key light on "after" side',
    cameraDirective: 'identical 50mm framing on both sides — only color/mood differs',
    bestForVerticals: ['fitness', 'productivity-saas', 'beauty', 'coaching', 'home-improvement'],
    forbiddenForVerticals: ['music', 'fashion-luxury'],
    bestForCampaignTypes: ['transformation', 'product-demo', 'social-proof'],
    forbidPatterns: ['single-panel layouts', 'asymmetric composition', 'multiple subjects'],
  },

  // ─── 4. EDITORIAL MAGAZINE SPREAD ───
  'editorial-magazine': {
    id: 'editorial-magazine',
    name: 'Editorial Magazine Spread',
    promptDirective:
      'Editorial fashion magazine spread layout. Right two-thirds: full-bleed lifestyle photograph. Left one-third: matte off-white paper texture with serif headline + 3-column body text + pull quote with drop cap. Asymmetric golden ratio split.',
    compositionRules: [
      'Golden ratio split: photo right 62%, text panel left 38%',
      'Photo full-bleed on right edge',
      'Left panel: matte paper texture background',
      'Drop cap on body text first letter',
      'Pull quote in larger italic serif',
      'Brand kicker at top of left panel (small caps)',
    ],
    typographyCharacter:
      'classical serif (Caslon/Tiempos character) for headline + monospaced sans for kicker + body in 3 columns',
    paletteDirective:
      'cream/off-white base + black text + ONE muted accent extracted from photo (warm tones preferred)',
    lightingDirective:
      'natural soft window light, warm color grade, golden hour quality, subtle film grain',
    cameraDirective: '85mm portrait lens, shallow depth of field, sharp on subject, soft on background',
    bestForVerticals: ['fashion-luxury', 'hospitality', 'food-premium', 'beauty', 'travel-luxury'],
    forbiddenForVerticals: ['tech-saas-app', 'gaming', 'fitness-aggressive'],
    bestForCampaignTypes: ['brand-awareness', 'product-launch', 'storytelling'],
    forbidPatterns: ['centered composition', 'sans-serif-only typography', 'dark mode'],
  },

  // ─── 5. SPOTIFY DUOTONE DIAGONAL ───
  'spotify-duotone-diagonal': {
    id: 'spotify-duotone-diagonal',
    name: 'Spotify Duotone Diagonal',
    promptDirective:
      'Duotone treatment ad in two contrasting colors only (e.g. neon green + black). Photograph rendered in duotone. Oversized typography stacked diagonally cutting across the image. Bold sans-serif weight 900, mobile-first vertical 9:16.',
    compositionRules: [
      'Duotone photograph — strictly 2 colors',
      'Oversized typography stacked diagonally across frame',
      'Type cuts INTO the image (overlapping subject)',
      'Mobile-first vertical orientation',
      'Aggressive scale: typography 30-40% of frame height',
    ],
    typographyCharacter:
      'bold display sans (Circular/Inter Display character), weight 900, oversized 240pt+, tight tracking',
    paletteDirective:
      'strict duotone — pick 2 colors with high contrast (e.g. neon green + black, hot pink + navy, yellow + purple)',
    lightingDirective: 'flat duotone treatment overlaid on any source photo',
    cameraDirective: 'photograph processed via duotone — original lighting irrelevant',
    bestForVerticals: ['music', 'podcasts', 'streaming', 'entertainment', 'lifestyle-bold'],
    forbiddenForVerticals: ['luxury-jewelry', 'fintech-conservative', 'healthcare'],
    bestForCampaignTypes: ['brand-awareness', 'launch', 'social'],
    forbidPatterns: ['full color photography', 'soft pastels', 'serif typography', 'subtle treatments'],
  },

  // ─── 6. BRUTALIST TEXT-HERO ───
  'brutalist-text-hero': {
    id: 'brutalist-text-hero',
    name: 'Brutalist / Brute Force',
    promptDirective:
      'Brutalist ad poster. Stacked oversized typography as hero. Visible grid lines exposed. Black and white base with ONE accent color hit. Default-system-font feel (raw, intentional). Asymmetric, "ugly on purpose", anti-design aesthetic.',
    compositionRules: [
      'Typography IS the hero (no photo or icon as primary)',
      'Stacked text blocks at varying scales',
      'Visible grid lines or column rulers',
      'Asymmetric — never centered',
      'Single accent color hit (1-3% of frame)',
      'Intentional rule-breaks: misaligned blocks, raw kerning',
    ],
    typographyCharacter:
      'default monospace OR Times Roman OR heavy grotesk — feels system-default, raw, unrefined',
    paletteDirective:
      'B/W base (95%) + ONE accent color hit (5%): hot red, electric blue, warning yellow',
    lightingDirective: 'flat 2D — no photographic lighting, pure graphic design',
    cameraDirective: 'flat composition, no depth — typography lives on a 2D plane',
    bestForVerticals: ['indie-saas', 'fashion-edgy', 'art', 'music-experimental', 'fintech-disruptive'],
    forbiddenForVerticals: ['luxury-traditional', 'family-products', 'healthcare'],
    bestForCampaignTypes: ['brand-awareness', 'manifesto', 'launch'],
    forbidPatterns: ['polished design', 'centered hero', 'gradients', 'decorative elements'],
  },

  // ─── 7. BENTO GRID MODULAR (Apple/Notion) ───
  'bento-grid-modular': {
    id: 'bento-grid-modular',
    name: 'Bento Grid Modular (Apple/Notion)',
    promptDirective:
      'Bento grid layout: asymmetric modular cards on dark or light background. ONE large hero card (40-50% of frame) + 3-5 smaller cards with feature icons and short labels. Rounded corners (16-24px), soft shadows, generous padding.',
    compositionRules: [
      'Asymmetric grid: 1 hero card + 3-5 small cards',
      'Hero card: 40-50% of total frame',
      'Small cards: vary in size (avoid uniform grid)',
      'Rounded corners 16-24px',
      'Soft drop shadows for elevation',
      'Each card has icon + 2-3 word label',
      'Generous internal padding within each card',
    ],
    typographyCharacter:
      'clean geometric sans-serif (Inter/SF character) + monospace for data labels, weight 500-600',
    paletteDirective:
      'dark mode base (#0A0A0A) with translucent card surfaces (rgba whites), OR light mode (#FAFAFA) with subtle gray cards',
    lightingDirective: 'flat with subtle vignette, soft shadows from cards, no photographic lighting',
    cameraDirective: 'flat 2D UI composition, no depth of field',
    bestForVerticals: ['tech-saas-app', 'hardware', 'productivity', 'analytics-dashboards', 'fintech'],
    forbiddenForVerticals: ['fashion', 'food-craft', 'lifestyle-bohemian'],
    bestForCampaignTypes: ['feature-launch', 'product-demo', 'capabilities-showcase'],
    forbidPatterns: ['photographic backgrounds', 'gradients', 'organic shapes', 'serif typography'],
  },

  // ─── 8. VERCEL BLUEPRINT DARK (dev tools) ───
  'vercel-blueprint-dark': {
    id: 'vercel-blueprint-dark',
    name: 'Vercel Blueprint Grid (dev tools)',
    promptDirective:
      'Dark mode ad with subtle dot-matrix grid pattern background. Monospace typography. Terminal-style code block as supporting element. Performance metric or large number as hero. Minimal palette — dark base + neon accent.',
    compositionRules: [
      'Subtle grid/dot pattern background (20% opacity)',
      'Hero: oversized number or metric (e.g. "47ms", "+340%")',
      'Supporting: small terminal code block on side',
      'Faint vertical accent line at left or right third',
      'Composition: rule of thirds, hero on left two-thirds',
    ],
    typographyCharacter:
      'monospace (Geist Mono / JetBrains Mono character), weight 600 hero, weight 400 body, tight tracking',
    paletteDirective:
      'pure dark (#0A0A0A) + near-white text (#FAFAFA) + ONE neon accent (cyan #00D9FF, lime #00FF88, magenta #FF00AA)',
    lightingDirective: 'flat, no shadows, screen-glow feel, subtle CRT scanlines at 5%',
    cameraDirective: 'flat 2D digital composition, no depth, no photography',
    bestForVerticals: ['tech-saas-app', 'dev-tools', 'infrastructure', 'fintech-technical', 'analytics'],
    forbiddenForVerticals: ['fashion', 'beauty', 'hospitality', 'lifestyle-warm'],
    bestForCampaignTypes: ['feature-launch', 'developer-acquisition', 'technical-announcement'],
    forbidPatterns: ['warm colors', 'photography', 'serif fonts', 'organic shapes', 'soft gradients'],
  },

  // ─── 9. TYPE COLLAGE MIXED MEDIA ───
  'type-collage-mixed-media': {
    id: 'type-collage-mixed-media',
    name: 'Type Collage / Mixed Media',
    promptDirective:
      'Mixed-media collage poster. Layered scanned paper textures, ripped edges, layered photographs, handwritten annotations over typography, 90s zine aesthetic. Multiple typefaces mixed (serif + sans + handwritten). Anti-AI handcrafted feel.',
    compositionRules: [
      'Multiple layered elements (3-5 visual layers)',
      'Scanned paper textures as backgrounds',
      'Ripped edges and uneven crops',
      'Handwritten annotations over printed type',
      'Photo collage cuts overlapping each other',
      'Intentional imperfection: stains, tape, photocopy artifacts',
    ],
    typographyCharacter:
      'mix of 3-4 typefaces: classical serif + heavy sans + handwritten + monospace, all sizes',
    paletteDirective:
      'warm naturals (cream, terracotta, ochre) + black ink + ONE saturated accent',
    lightingDirective: 'photocopied/scanned feel, slight overexposure, paper texture visible',
    cameraDirective: 'flatbed scanner aesthetic — flat with paper grain texture',
    bestForVerticals: ['fashion-indie', 'music', 'zines', 'gen-z-brands', 'art', 'craft-beer'],
    forbiddenForVerticals: ['fintech-conservative', 'corporate-saas', 'healthcare'],
    bestForCampaignTypes: ['brand-awareness', 'manifesto', 'product-drop'],
    forbidPatterns: ['clean digital aesthetic', 'minimalism', 'corporate polish'],
  },

  // ─── 10. SURREAL SCULPTURAL PRODUCT ───
  'surreal-sculptural-product': {
    id: 'surreal-sculptural-product',
    name: 'Surreal Sculptural (avant-garde)',
    promptDirective:
      'Avant-garde fashion ad. Product positioned as monumental sculpture. Scale exaggerated (product appears massive vs surroundings). Crisp white studio backdrop. Single oversized word as headline. Dreamlike, otherworldly, museum-piece feel.',
    compositionRules: [
      'Product as monumental sculpture (2-3x normal scale)',
      'Crisp seamless studio backdrop (white/cream/single color)',
      'Single oversized word as headline (1-2 words max)',
      'Subject positioned with surreal scale relationship',
      'Negative space dominates 60%+ of frame',
    ],
    typographyCharacter:
      'condensed sans-serif with wide spaced kerning (300-500), weight 400-500, single word focus',
    paletteDirective:
      'minimal: studio white/cream + product color + ONE accent shadow tone',
    lightingDirective: 'studio softbox, multi-point lighting, soft shadows, museum-quality crisp',
    cameraDirective: 'medium format / 80mm, product macro details visible, museum object photography',
    bestForVerticals: ['fashion-luxury', 'beauty-luxury', 'fragrance', 'jewelry', 'art-objects'],
    forbiddenForVerticals: ['food-fast', 'fitness', 'tech-saas-app', 'gaming'],
    bestForCampaignTypes: ['product-launch', 'brand-awareness', 'collection-debut'],
    forbidPatterns: ['lifestyle context', 'multiple products', 'busy backgrounds', 'natural settings'],
  },

  // ─── 11. DOCUMENTARY HONEST ───
  'documentary-honest': {
    id: 'documentary-honest',
    name: 'Documentary 35mm Honest',
    promptDirective:
      'Documentary photograph aesthetic. 35mm film feel with natural light, real skin texture, worn materials. Honest and unposed — no glamour retouching. Subtle grain, slight imperfections. Caption-style typography small at bottom.',
    compositionRules: [
      'Unposed, candid moment — subject not looking at camera',
      'Natural environment, lived-in setting',
      'Caption-style headline small at bottom (not hero text)',
      'Brand mark minimal, bottom corner',
      'Real materials: worn fabric, weathered surfaces, hands at work',
    ],
    typographyCharacter:
      'honest sans (Söhne/IBM Plex character) or monospace for captions, weight 400-500, small scale',
    paletteDirective:
      'natural color palette extracted from environment, slightly desaturated, warm undertones',
    lightingDirective: 'natural light only — window light, golden hour, overcast diffusion',
    cameraDirective: '35mm prime lens, slight grain, slight motion, sharp on hands/details',
    bestForVerticals: ['sustainable', 'food-craft', 'b-corp', 'craft-beer', 'artisanal', 'wellness'],
    forbiddenForVerticals: ['luxury-aspirational', 'tech-flashy', 'gaming'],
    bestForCampaignTypes: ['brand-storytelling', 'social-proof', 'manifesto'],
    forbidPatterns: ['studio backdrops', 'retouched skin', 'oversaturated colors', 'staged poses'],
  },

  // ─── 12. DATA VIZ HERO STAT ───
  'data-viz-hero-stat': {
    id: 'data-viz-hero-stat',
    name: 'Data Visualization Hero Stat',
    promptDirective:
      'Data-driven ad. Oversized statistic as hero (e.g. "+47%", "$2.3M", "10×"). Supporting chart underneath. Clean callouts with arrows. White background. Financial-document/research-paper aesthetic.',
    compositionRules: [
      'Hero stat: oversized number occupying 30-40% of frame',
      'Supporting chart: bar/line/area chart below, simple',
      'Annotations with thin lines pointing to data points',
      'Source/footnote in small monospace at bottom',
      'Strict horizontal hierarchy',
    ],
    typographyCharacter:
      'monospace for numerals + display sans for labels, weight 600 hero, weight 400 captions',
    paletteDirective:
      'pure white background + black text + ONE data accent color (positive=green, alert=red, neutral=blue)',
    lightingDirective: 'flat 2D, no photographic lighting',
    cameraDirective: 'flat 2D infographic composition',
    bestForVerticals: ['fintech', 'analytics', 'b2b-saas', 'healthcare-data', 'consulting'],
    forbiddenForVerticals: ['fashion', 'beauty', 'lifestyle', 'entertainment'],
    bestForCampaignTypes: ['social-proof', 'case-study', 'feature-demo'],
    forbidPatterns: ['photography', 'organic shapes', 'gradients', 'decorative elements'],
  },

  // ─── 13. Y2K LIQUID CHROME ───
  'y2k-liquid-chrome': {
    id: 'y2k-liquid-chrome',
    name: 'Y2K Liquid Chrome',
    promptDirective:
      'Y2K retro-futurist aesthetic. Chrome liquid metal product or text. Holographic gradient background. Bubble typography. Lens flare. 2003 design aesthetic — Studio Aiba meets Matrix Reloaded.',
    compositionRules: [
      'Chrome/liquid metal treatment on hero element',
      'Holographic gradient background (iridescent)',
      'Bubble or balloon typography style',
      'Lens flares and light artifacts',
      'Slight depth: foreground product + atmospheric background',
    ],
    typographyCharacter:
      'display futurist with rounded forms + glitch sans accent, weight 700-900, heavy distortion',
    paletteDirective:
      'iridescent holographic (purple-pink-cyan-silver shifts) + chrome metallic accents',
    lightingDirective: 'studio with rainbow rim lights, lens flare, atmospheric haze',
    cameraDirective: 'close product photography with shallow DOF, atmospheric distortion',
    bestForVerticals: ['music', 'gaming', 'beauty-edgy', 'tech-experimental', 'streetwear'],
    forbiddenForVerticals: ['luxury-traditional', 'corporate-saas', 'healthcare', 'finance'],
    bestForCampaignTypes: ['product-drop', 'brand-awareness', 'launch'],
    forbidPatterns: ['minimalism', 'natural colors', 'serif typography', 'understated design'],
  },

  // ─── 14. TESTIMONIAL QUOTE PRODUCT ───
  'testimonial-quote-product': {
    id: 'testimonial-quote-product',
    name: 'Product + Testimonial Quote',
    promptDirective:
      'Ad layout: product photograph occupying right 40%. Large serif testimonial quote on left ("[quote here]"). Small attribution with name and role below quote. Off-white background. Editorial credibility tone.',
    compositionRules: [
      'Asymmetric split: product 40% right, quote 60% left',
      'Quote in large editorial serif italic',
      'Quote marks oversized as decorative element',
      'Attribution small below quote: "— Name, Role at Company"',
      'Off-white background (not pure white)',
    ],
    typographyCharacter:
      'editorial serif (Caslon/Tiempos) for quote + clean sans for attribution, weight 400 quote, weight 500 attribution',
    paletteDirective:
      'off-white base (#F8F5F0) + black text + ONE warm accent extracted from product',
    lightingDirective: 'soft studio lighting on product, paper-print feel on text panel',
    cameraDirective: '85mm product shot, subtle depth, editorial-quality',
    bestForVerticals: ['saas-bofu', 'services', 'coaching', 'ecommerce-premium', 'professional-services'],
    forbiddenForVerticals: ['gaming', 'fashion-fast', 'music-experimental'],
    bestForCampaignTypes: ['social-proof', 'case-study', 'conversion'],
    forbidPatterns: ['centered hero composition', 'no quote element', 'photo-only layouts'],
  },

  // ─── 15. BRAND SYSTEM DOCUMENT (Pentagram-style brand book) ───
  // Activado cuando el user pide: "explora", "variantes", "opciones",
  // "muestra opciones", "más versiones", "concept exploration", "brand book"
  'brand-system-document': {
    id: 'brand-system-document',
    name: 'Brand System Document (Pentagram-style brand book)',
    promptDirective:
      'Generate a COMPREHENSIVE BRAND SYSTEM EXPLORATION DOCUMENT — NOT a single ad. This is a multi-section editorial spread laid out on a 12-column grid, designed like a Pentagram brand presentation deck or Apple Human Interface Guidelines page. The document MUST contain 6-8 distinct labeled sections arranged in a magazine-spread layout: (1) IDENTITY ANCHOR — large logo + tagline + brand essence sentence, top-left quadrant. (2) CONCEPT EXPLORATION — 3 numbered avatar/character/product variants displayed side-by-side with descriptors below each (e.g. "OPCIÓN 1: Operador Elite — Disciplinado. Estratégico. Imparable."). (3) APPLICATION GRID — 5 icon variations across contexts (Negro+Oro, Oro Plano, Blanco, Blanco sobre Negro, Transparente). (4) PRODUCT MOCKUPS — show 3 realistic device mockups (laptop UI screenshot, mobile phone screen, ad billboard variant) demonstrating how the brand lives in real contexts. (5) COLOR SYSTEM — 5 color swatches as rounded rectangles with HEX codes and color names below (e.g. DORADO #D4AF37, NEGRO #0A0A0A). (6) TYPOGRAPHY STACK — display the brand typeface name in massive scale + list of font families used (e.g. "SORA · ORBITRON · RALEWAY · INTER"). (7) BRAND ESSENCE — 4 small icons in a row with labels (e.g. EJECUCIÓN, INTELIGENCIA, CONTROL, VENTAJA). The overall feel is a high-end Pentagram brand deliverable — editorial density with breathing room, premium gravitas, expert curation. NOT a marketing ad. NOT a single hero shot. This IS a BRAND BOOK PAGE.',
    compositionRules: [
      'MANDATORY: 12-column grid layout with visible structure',
      'MANDATORY: 6-8 distinct labeled sections arranged as magazine spread',
      'Each section header: uppercase, tracking-wide (0.15em), small (8-10pt), brand-color',
      'Sub-labels (descriptors below each variant): regular case, italic, smaller',
      'Subtle hairline separators (0.5px) between sections',
      'Density: high information / high curation, but breathing whitespace between sections (8-12px gutter)',
      'Sections should feel CURATED, not crammed — Pentagram, not infographic',
      'Mockups MUST be realistic isometric or front-perspective device renderings, NOT flat UI mockups',
      'Color swatches: rounded rectangles 80x100px with HEX code below in monospace',
      'NO single hero composition — the WHOLE PAGE is the artwork',
      'Document layout proportions: portrait 4:5 or landscape 16:10 (NOT 1:1 square)',
    ],
    typographyCharacter:
      'editorial sans-serif system (Inter / Sora / Helvetica Neue character) for body, slightly condensed grotesk for section headers, monospace (JetBrains Mono / Geist Mono) for HEX codes and labels, weight 600 for headers, weight 400-500 for body, weight 700 for hero brand mark display',
    paletteDirective:
      'Brand-consistent dual-tone foundation (typically black + brand accent color), with HEX swatches displayed AS PART OF the composition. The color section IS the palette teaching itself.',
    lightingDirective:
      'Studio lit, even, professional brand book aesthetic — flat 2D for the document itself, BUT mockup devices within it use realistic studio lighting with subtle shadows for depth',
    cameraDirective:
      'Flat 2D top-down for the document layout (it\'s a designed page, not a photograph), BUT mockups inside show isometric perspective (15-30° angle) like Apple keynote slides',
    bestForVerticals: [
      'tech-saas-app',
      'consultancy',
      'agency',
      'design-studio',
      'fintech',
      'consumer-tech',
      'professional-services',
      'b2b-saas',
    ],
    forbiddenForVerticals: ['food-fast', 'fitness-aggressive', 'gaming-casual'],
    bestForCampaignTypes: [
      'brand-exploration',
      'identity-round',
      'pitch-deck',
      'brand-book',
      'concept-exploration',
      'brand-awareness',
    ],
    forbidPatterns: [
      'NO single hero image filling the frame',
      'NO isolated product shot as the whole composition',
      'NO ad-style headline-only layout (this is NOT an ad)',
      'MUST have at least 5 distinct labeled sections',
      'MUST show variations/options, not a single answer',
      'MUST include HEX codes for the color section',
      'MUST include realistic device mockups (not flat UI cards)',
      'NO centered single subject — the WHOLE PAGE is the design',
      'NO marketing CTA buttons (this is a brand book, not a landing page)',
    ],
  },

  // ─── 16. PREMIUM SAAS ANNOUNCEMENT (ChatGPT-killer) ───
  // Activado cuando user pide ad/publicidad CON imágenes de referencia (logo, character, app)
  // Plantilla anatómica completa de SaaS premium estilo Apple/Linear/Vercel announcements
  'premium-saas-announcement': {
    id: 'premium-saas-announcement',
    name: 'Premium SaaS Announcement (Apple/Linear announcement style)',
    promptDirective:
      'Generate a PREMIUM SAAS PRODUCT ANNOUNCEMENT poster with the FULL ANATOMICAL STRUCTURE of an Apple/Linear/Vercel product launch ad. The composition is VERTICAL (4:5 or 9:16) and divided into 4 distinct functional zones, each serving a specific narrative purpose. ZONE 1 (top 35% of frame): BRAND LOCKUP TOP-LEFT with logo + brand name + minimal tagline ("DISEÑADO PARA EJECUTAR" style). HEADLINE SPLIT-TYPOGRAPHY in 2 lines with selective emphasis: line 1 in regular weight white ("NO ES SOLO IA."), line 2 in bold accent color ("ES EJECUCIÓN."). SUBHEADING below in 1-2 lines with ONE KEY WORD highlighted in accent color. HERO CHARACTER OR PRODUCT positioned RIGHT 50% with radial gold/brand-accent HALO behind it (gives gravitas and presence). ZONE 2 (middle 30%): FEATURE LIST as 4 stacked rows, each row has: small circular icon (left, in accent color) + bold UPPERCASE 2-3 word feature name + small lowercase 4-6 word description below. The features form a vertical column on the LEFT side. ZONE 3 (right side of middle, overlapping zones 2-3): REALISTIC PRODUCT MOCKUP — a phone or laptop showing the actual app UI with LEGIBLE interface elements (visible buttons, list items, status bar, etc). The mockup has subtle shadow and slight 3D perspective. Optional: a small SECONDARY APP ICON floating to the right of the mockup as a "brand stamp". ZONE 4 (bottom 15%): Two horizontal rows. ROW 1: "DISPONIBLE EN" label + App Store badge + Google Play badge. ROW 2: CTA BANNER as a rounded card containing: small avatar/icon left + 3-WORD COMMAND in uppercase ("DELEGA. AUTOMATIZA. ESCALA.") + small descriptor + ROUNDED BUTTON in solid accent color with arrow ("PRUÉBALO AHORA →"). Below the CTA: thin domain footer in subtle accent color (operatoraiapp.com style). The OVERALL aesthetic is ULTRA-PREMIUM SAAS: deep black background, gold/brand-accent ONLY where it commands attention, generous spacing, museum-quality typography hierarchy, character/product feels heroic and otherworldly with the radial halo effect. Think Linear product launch + Apple keynote slide + Vercel announcement, fused.',
    compositionRules: [
      'MANDATORY: Vertical orientation (4:5 portrait or 9:16 mobile-first)',
      'MANDATORY: 4 distinct functional zones stacked vertically (35% / 30% / 20% / 15%)',
      'ZONE 1 — Brand lockup top-left (logo + tagline minimal)',
      'ZONE 1 — Headline in 2 lines with split-typography emphasis (line 2 in accent color)',
      'ZONE 1 — Hero character/product RIGHT 50% with radial halo behind it',
      'ZONE 2 — Feature list: 4 rows, each with circular icon + uppercase label + lowercase description',
      'ZONE 2 — Icons in subtle accent color circles (NOT filled in solid color)',
      'ZONE 3 — Realistic product mockup (phone or laptop) with VISIBLE legible UI elements',
      'ZONE 3 — Mockup has subtle shadow + slight 3D perspective (NOT flat)',
      'ZONE 3 — Optional secondary app icon floating to the right of mockup',
      'ZONE 4 — Store badges row: "DISPONIBLE EN" + App Store + Google Play (real badge styling)',
      'ZONE 4 — CTA banner rounded card with 3-word command + accent button + arrow',
      'ZONE 4 — Thin domain footer below CTA (subtle, small, accent color)',
      'Halo effect behind hero element MUST be visible (radial gradient from accent color)',
      'Headline emphasis: line 1 regular weight, line 2 bold + accent color (CRITICAL)',
      'Character/product positioning: cropped at chest/torso level, looking forward, heroic',
      'Generous breathing room between zones (32-48px gutters)',
      'High information density BUT curated — feels premium, never cluttered',
    ],
    typographyCharacter:
      'Premium editorial sans-serif system: display sans (Inter/Sora/Helvetica Display character) for headline and feature labels in weight 700-800, regular sans (Inter/SF character) weight 400 for descriptions and body, monospace for technical labels and metrics. Headline scale: massive (line 2 should be 1.2x larger than line 1 for emphasis). Feature labels uppercase with tracking-wide. Tight leading on headline, generous leading on body.',
    paletteDirective:
      'Pure black foundation (#0A0A0A or near-black), ONE dominant brand accent color (typically gold #D4AF37 / #C9A863 or brand-extracted accent) used SELECTIVELY to command attention: headline emphasis word, halo effect, button fill, icon color, accent text. White text for primary copy. Subtle gray (rgba(255,255,255,0.6)) for secondary/descriptive text. Accent color appears in 20-25% of the composition maximum — NEVER overdone. The contrast ratio between black + white + accent creates the "expensive" feeling.',
    lightingDirective:
      'Studio-quality cinematic lighting on hero character/product with rim light from accent color (the halo effect IS the lighting). Subtle volumetric atmosphere/haze around character to enhance the gravitas. Mockup device has soft realistic studio lighting with subtle reflections. Overall composition feels VOLUMETRIC, not flat — depth via lighting, not via gradients.',
    cameraDirective:
      'Hero character: 50-85mm portrait lens, sharp focus, slight low angle for heroic feel. Product mockup: medium format perspective with slight 3D angle (15-25°), realistic device rendering NOT flat UI. Overall composition: flat editorial layout BUT individual elements (character, mockup) have photographic depth.',
    bestForVerticals: [
      'tech-saas-app',
      'consumer-tech',
      'fintech',
      'productivity-saas',
      'b2b-saas',
      'mobile-app',
      'ai-tools',
      'platform-launch',
    ],
    forbiddenForVerticals: [
      'fashion-fast',
      'food-craft',
      'beauty-traditional',
      'lifestyle-bohemian',
      'art',
    ],
    bestForCampaignTypes: [
      'product-launch',
      'app-launch',
      'platform-announcement',
      'feature-release',
      'brand-awareness',
      'conversion',
    ],
    forbidPatterns: [
      'NO single hero image without supporting elements',
      'NO missing brand lockup at top-left',
      'NO flat UI mockup (must have 3D perspective)',
      'NO missing halo effect behind hero character/product',
      'NO missing feature list with icons',
      'NO missing CTA banner with command + button',
      'NO horizontal-only orientation (must be vertical 4:5 or 9:16)',
      'NO accent color overuse (max 25% of composition)',
      'NO low-contrast (must have black + white + accent triangle)',
      'NO generic stock-photo character (must look heroic, otherworldly)',
      'NO missing store badges for app launches',
      'NO missing domain footer at bottom',
    ],
  },
};

// ═══ HELPERS ═══

export function getAllArchetypeIds(): ArchetypeId[] {
  return Object.keys(ARCHETYPES) as ArchetypeId[];
}

export function getArchetype(id: ArchetypeId): LayoutArchetype {
  return ARCHETYPES[id];
}

/** Filtra archetypes válidos para un vertical específico */
export function getArchetypesForVertical(vertical: string): ArchetypeId[] {
  const ids = getAllArchetypeIds();
  return ids.filter((id) => {
    const arch = ARCHETYPES[id];
    if (arch.forbiddenForVerticals.includes(vertical)) return false;
    if (arch.bestForVerticals.includes(vertical)) return true;
    // Verticales no listados explícitamente: el archetype es válido si no está prohibido
    return true;
  });
}

/** Filtra archetypes válidos para un campaign type */
export function getArchetypesForCampaignType(campaignType: string): ArchetypeId[] {
  const ids = getAllArchetypeIds();
  return ids.filter((id) => {
    const arch = ARCHETYPES[id];
    return arch.bestForCampaignTypes.includes(campaignType) || arch.bestForCampaignTypes.length === 0;
  });
}
