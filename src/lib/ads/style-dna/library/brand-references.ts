/**
 * 🏷️ STYLE DNA — Brand References
 *
 * 5 DNAs basados en marcas icónicas con identidad visual codificada.
 * Cada uno captura el spiritual lineage de marcas que definieron categorías.
 *
 * NOTA LEGAL: Estos DNAs NO copian assets de las marcas. Capturan los
 * principios de diseño públicos que cualquier diseñador puede inspirarse.
 * El DNA "Apple" no genera el logo de Apple — genera ESTÉTICA Apple-like.
 *
 * DNAs incluidos:
 *   1. brand-apple-keynote-minimal      — Apple Keynote 2012-2024
 *   2. brand-nike-cinematic-athletic    — Nike Wieden+Kennedy energy
 *   3. brand-pentagram-systematic        — Pentagram brand book methodology
 *   4. brand-yohji-yamamoto-noir         — Yamamoto noir poetic minimalism
 *   5. brand-aesop-apothecary-minimal    — Aesop scientific apothecary
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. APPLE KEYNOTE — Minimalismo de hipoteca tecnológica
// ═══════════════════════════════════════════════════════════════
const BRAND_APPLE_KEYNOTE: StyleDNA = {
  id: 'brand-apple-keynote-minimal',
  name: 'Apple Keynote Minimal',
  tagline: 'A black void. A product. Light from heaven. The future, presented.',
  category: 'brand-reference',
  era: 'minimalist-2010s',
  movement: 'modernism',
  intensity: 'subtle',

  aliases: [
    'apple',
    'apple-keynote',
    'apple-style',
    'apple-design',
    'jony-ive',
    'cupertino-aesthetic',
    'apple-event',
    'apple-presentation',
    'product-launch-apple',
    'estilo apple',
    'estilo cupertino',
    'apple keynote',
    'tipo apple',
    'como apple',
    'jonny ive style',
    'minimal premium tech',
  ],

  archetypeBase: 'hero-typographic-apple',

  promptDirective: `
Aesthetic philosophy: APPLE KEYNOTE (2012-2024 era) — Distilled by Jony Ive's design language and refined through hundreds of product launches. The product is a JEWEL on a void. Negative space is REVERENCE. Typography is so reduced it becomes typographic poetry. This is design as RELIGIOUS ICONOGRAPHY for technology. Every detail removed earns the remaining details their weight.

Typography:
  - Display: SF Pro Display in Light or Ultralight weight (200-300). NEVER bold for hero.
  - Headlines often span multiple lines with deliberate line breaks.
  - Tracking: tight (-0.02em) for SF Pro at large sizes.
  - Color: pure white (#FFFFFF) on black, or pure black (#000000) on white.
  - Hierarchy through SIZE only — three sizes maximum (hero, subhead, fineprint).
  - All sentence-case (NEVER all caps for hero — that's Microsoft).
  - Line breaks are POETIC, not constrained by grid.

Composition (this is the EVERYTHING):
  - Single product OR single text statement, centered or rule-of-thirds positioned.
  - Massive negative space (60-70% of frame).
  - Centered alignment for hero text (asymmetric for products).
  - The product floats on a void — no ground, no horizon, no context.
  - Single focal point. Always.

Color palette (the pure absolutes):
  - Foundation: pure black (#0A0A0A) or pure white (#FAFAFA).
  - Accent: deep space gray (#3D3D3D), aluminum silver gradient.
  - Product takes color spotlight.
  - Optional: brand color of specific product (iPhone red, Apple blue #007AFF).
  - NO gradients except subtle product reflections.
  - Background is ONE TONE. Always.

Lighting (THE Apple signature):
  - Soft top-down studio lighting with subtle key from left or right.
  - Product creates ITS OWN reflection on glossy surface (the floor reflection trick).
  - Rim light to define edges against black background.
  - HDR-quality dynamic range — pure blacks AND pure highlights in same frame.
  - No harsh shadows; products glow softly.

Camera (product photography):
  - 85mm or 100mm macro lens.
  - 3/4 angle showing depth + face.
  - Slight low angle (1-5°) to make products feel HEROIC.
  - Sharp focus throughout product (deep DOF).
  - NEVER tilt-shift, NEVER fish-eye.
  - Shot from product height or slightly below (never from above — that's mundane).

Materials and surfaces:
  - Aluminum (silver, space gray, gold, midnight).
  - Glass (especially the ceramic shield aesthetic).
  - Glossy displays showing wallpapers, never UI clutter.
  - Surfaces look IMPOSSIBLE — too clean, too perfect.

Cultural references:
  - Apple keynote presentations 2012-2024
  - Jony Ive's Designed by Apple in California book
  - Naoto Fukasawa's MUJI work (kindred spirit)
  - Dieter Rams' Braun designs (acknowledged inspiration)
  - Hiroshi Sugimoto's photographic work (similar void aesthetic)
  - Apple's "Designed by Apple in California" 1997 manifesto

Movement aesthetic:
  - STILLNESS. The product is monumental.
  - If motion exists, it's a single object floating gently.

What this style REJECTS:
  - Multiple products in one frame (unless deliberate "family shot").
  - Lifestyle context (no people, no environments — just the object).
  - Decorative typography.
  - Patterns, textures, or "interesting" backgrounds.
  - Stock photography aesthetics.
  - Anything that competes with the product.
  - Bold weights, italics, or condensed type.
  - Gradients beyond product reflections.
`,

  palette: {
    foundation: ['#0A0A0A', '#FAFAFA'],
    primary: ['#FFFFFF', '#000000', '#3D3D3D'],
    accent: ['#007AFF', '#FF3B30'],
    forbidden: ['#FF6EC7', '#FFEB3B'], // Memphis colors (cultural enemies)
  },

  typography: {
    display: ['SF Pro Display', 'SF Pro Text', 'Helvetica Neue Light'],
    body: ['SF Pro Text', 'Helvetica Neue'],
  },

  references: {
    brands: ['Apple', 'iPod nano launches', 'iPhone keynote announcements'],
    artists: ['Jony Ive', 'Naoto Fukasawa', 'Dieter Rams', 'Hiroshi Sugimoto'],
    eras: ['Apple 2012-2024 keynote era', 'Jony Ive design leadership 1998-2019'],
    works: [
      'iPhone 4 keynote (2010)',
      'iPad Pro launches',
      'Mac Studio reveals',
      'Designed by Apple in California (book)',
    ],
  },

  moodKeywords: [
    'reverent',
    'monumental',
    'pristine',
    'aspirational',
    'silent',
    'devotional',
    'pure',
    'refined',
  ],

  pairsWellWith: [
    'design-swiss-international',
    'mood-quiet-contemplation',
    'cinematic-kubrick-symmetric',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-brutalist-architectural',
    'design-y2k-chrome-millennium',
  ],
  bestForVerticals: [
    'tech-saas',
    'consumer-electronics',
    'luxury-jewelry',
    'beauty-clean',
    'finance-premium',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'fashion-streetwear-loud'],
};

// ═══════════════════════════════════════════════════════════════
// 2. NIKE CINEMATIC ATHLETIC — Wieden+Kennedy energy
// ═══════════════════════════════════════════════════════════════
const BRAND_NIKE_CINEMATIC: StyleDNA = {
  id: 'brand-nike-cinematic-athletic',
  name: 'Nike Cinematic Athletic',
  tagline: 'Sweat. Drama. Triumph. The athlete in heroic light.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'cinematic-naturalism',
  intensity: 'bold',

  aliases: [
    'nike',
    'nike-style',
    'nike-aesthetic',
    'wieden-kennedy',
    'wieden-and-kennedy',
    'just-do-it',
    'athletic-cinematic',
    'sports-cinematic',
    'epic-athletic',
    'estilo nike',
    'tipo nike',
    'como nike',
    'épico atlético',
    'cinematográfico atlético',
    'vibras nike',
    'energía atlética',
  ],

  archetypeBase: 'full-bleed-cinematic',

  promptDirective: `
Aesthetic philosophy: NIKE WIEDEN+KENNEDY — The agency that defined sports advertising for 40 years. This is HEROIC athleticism captured cinematically. Every shot dignifies the athlete as warrior-poet. Sweat is sacred. Effort is beautiful. The body in motion is the subject. NOT generic sports photography — this is HUMAN STRUGGLE elevated to mythology.

Typography:
  - Display: Heavy condensed sans-serif (Druk Heavy, Compacta, Nike's custom Trade Gothic Condensed).
  - All-caps for hero copy. Always.
  - Letters CONDENSED (75-85% width) — feels athletic, fast.
  - Tracking: TIGHT (-0.03em).
  - Hero copy is SHORT and PUNCHY: "JUST DO IT", "BREATHE", "FIND YOUR GREATNESS".
  - Body copy: standard sans-serif (Nike font, Helvetica Neue).
  - White text on dark imagery, or stark black text on minimal white.

Composition:
  - Full-bleed cinematic photography (not constrained to safe areas).
  - Athlete fills frame, often shot from low angle (HEROIC perspective).
  - Negative space placed strategically to anchor type.
  - Diagonal compositions suggesting motion and forward momentum.
  - Two-thirds image, one-third type (or full image with type overlay at edge).
  - Vertical orientation often (Instagram-native).

Color palette (the contrast war):
  - Foundation: deep blacks (#0A0A0A), warm grays (#3D3D3D).
  - Hero color: brand-extracted accent (Nike red #FA1A0A, Nike orange #FF6F00, or campaign-specific).
  - Sweat-on-skin tones: warm flesh, copper highlights, gold rim lighting.
  - High contrast — pure shadows, pure highlights.
  - Color photography with crushed blacks and warm color grading.

Photography (THE soul):
  - Shot at golden hour or with controlled studio lighting mimicking it.
  - Strong rim lighting from behind to separate athlete from background.
  - Sweat captured with macro detail — beads on skin, dripping.
  - Subjects mid-action — never posed standing still.
  - Slight motion blur acceptable in extremities (running, jumping).
  - HIGH CONTRAST color grade: deep shadows, bright highlights, saturated mid-tones.
  - Shot wide (24mm-35mm) for environmental drama, OR tight (85mm) for emotional portraits.
  - Aspect ratio: 16:9 for cinema, 9:16 for stories, 1:1 for feed.

Camera and movement:
  - Anamorphic lens flares acceptable (wide cinematic feel).
  - Steadicam-style movement implied through pose.
  - Subjects often shot from below (looking up) for monumentality.
  - Wide environmental shots: athlete tiny in vast landscape (drama of scale).
  - Tight emotional portraits: face filling frame, eyes locked on goal.

Lighting (heroic warm):
  - Golden hour natural light preferred.
  - Studio: warm key light from front, cool rim from behind.
  - Faces lit with EMOTIONAL specificity (not flat beauty lighting).
  - Sweat catches light — small specular highlights tell the effort story.

Cultural references:
  - "Just Do It" campaigns 1988-2024
  - LeBron James "Wings" video (2014)
  - Colin Kaepernick "Dream Crazy" (2018)
  - Serena Williams "Dream Crazier" (2019)
  - Eliud Kipchoge "Breaking2" documentary
  - Spike Lee Nike commercials
  - Nike Phenomenal Shot
  - Wieden+Kennedy historic Nike ads

Movement aesthetic:
  - Implied EXPLOSION of effort.
  - Diagonal energy.
  - Subjects pushing through frame edges.

What this style REJECTS:
  - Posed athletic photography (tennis player smiling at camera = NO).
  - Bright cheerful lighting (Nike isn't happy — Nike is FOCUSED).
  - Pastels or muted color palettes.
  - Multiple athletes in one frame (unless deliberate team mythology).
  - Stock fitness photography aesthetic.
  - Static, stable compositions.
`,

  palette: {
    foundation: ['#0A0A0A', '#3D3D3D'],
    primary: ['#FFFFFF', '#FA1A0A'],
    accent: ['#FF6F00', '#FFD700'],
  },

  typography: {
    display: ['Druk Heavy', 'Compacta', 'Trade Gothic Condensed', 'Helvetica Inserat'],
    body: ['Helvetica Neue', 'Trade Gothic'],
  },

  references: {
    brands: ['Nike (1988-present)', 'Adidas (heroic sports campaigns)', 'Under Armour'],
    artists: ['Wieden+Kennedy (agency)', 'Spike Lee', 'Lance Acord (cinematographer)'],
    works: [
      'Just Do It original (1988)',
      'LeBron Wings (2014)',
      'Dream Crazy (Kaepernick 2018)',
      'Breaking2 (Kipchoge 2017)',
    ],
  },

  moodKeywords: [
    'heroic',
    'gritty',
    'aspirational',
    'cinematic',
    'triumphant',
    'focused',
    'monumental',
    'emotive',
  ],

  pairsWellWith: [
    'cinematic-villeneuve-vast',
    'mood-urgent-revolutionary',
    'cinematic-tarantino-pulp',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'mood-quiet-contemplation',
    'mood-melancholy-rainy',
  ],
  bestForVerticals: [
    'sports-athletic',
    'fitness',
    'automotive-performance',
    'energy-drinks',
    'tech-fitness',
  ],
  forbiddenForVerticals: ['wellness-meditation', 'beauty-traditional', 'finance-conservative'],
};

// ═══════════════════════════════════════════════════════════════
// 3. PENTAGRAM — Systematic brand methodology
// ═══════════════════════════════════════════════════════════════
const BRAND_PENTAGRAM_SYSTEMATIC: StyleDNA = {
  id: 'brand-pentagram-systematic',
  name: 'Pentagram Systematic',
  tagline: 'The world\'s most respected design firm. Type, system, intelligence.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'pentagram',
    'pentagram-design',
    'pentagram-style',
    'paula-scher',
    'michael-bierut',
    'natasha-jen',
    'systematic-brand',
    'brand-system',
    'identity-system',
    'estilo pentagram',
    'estética pentagram',
    'identidad sistémica',
    'sistema de marca',
    'tipo pentagram',
    'libro de marca',
    'brand book design',
  ],

  archetypeBase: 'brand-system-document',

  promptDirective: `
Aesthetic philosophy: PENTAGRAM (London, NYC, Berlin, Austin) — The most influential design firm in the world. Founded 1972 by Alan Fletcher, Theo Crosby et al. Pentagram's work is INTELLIGENT typography, RIGOROUS systems, BOLD wordmarks. Each project documented as comprehensive brand manual. This is design as INFRASTRUCTURE — invisible until you notice everything is governed by one logic.

Typography:
  - Display: Pentagram's signature is BOLD CUSTOM WORDMARKS often in geometric sans-serif (custom or based on FF Mark, Founders Grotesk, GT America).
  - Sometimes combines with elegant serifs (GT Sectra, Tiempos) for editorial contrast.
  - Type used as IMAGE — wordmarks become compositional elements.
  - Hierarchical system always visible: H1, H2, H3, body, caption.
  - Typography is FUNCTIONAL — every weight has a job.
  - Multilingual considerations (Pentagram works global).

Composition:
  - Documentary brand book layout — multiple sections labeled clearly.
  - Each composition demonstrates a SYSTEM (logo + grid + color + type + applications).
  - Asymmetric layouts using strict 12-column grids.
  - Generous margins, rigorous baseline alignment.
  - Multiple "applications" shown: stationery, signage, web, packaging.
  - Editorial pacing — each section breathes before the next.

Color palette (rigorous restraint):
  - Project-dependent (Pentagram never repeats palettes).
  - Common patterns: ONE bold primary + black + white + 1-2 supporting tones.
  - Deep saturation OR muted scholarly tones (no pastels).
  - Color systems with documented hex codes and pantone refs.
  - Use color SYSTEMICALLY — primary for headers, secondary for accents, tertiary for backgrounds.

Photography style:
  - Editorial product photography on white seamless OR architectural environment.
  - Documentary photography of brand applications in real contexts.
  - Photographer-grade quality (think Phaidon book photography).
  - Shot at 50mm or 85mm prime — natural perspective.

Information design:
  - Always shows the brand SYSTEM, not just a logo:
    • Logo variations (primary, secondary, monogram, lockup)
    • Color palette (with HEX, RGB, CMYK, Pantone)
    • Typography hierarchy (H1-H6, body, caption with sample sizes)
    • Application examples (stationery, signage, digital)
    • Grid systems (visible underlying structure)
    • Spacing rules (clear space around logo)
    • Brand voice principles
    • DO/DON'T examples

Cultural references:
  - Paula Scher's Public Theater identity (1994)
  - Michael Bierut's MIT Media Lab (2014)
  - Natasha Jen's MoMA Design Store
  - Marina Willer's Tate identity work
  - Alex Gendell's Mailchimp redesign
  - Pentagram annual review books
  - Design Observer essays
  - Massimo Vignelli legacy (American Modernism)

Layout style (THE signature):
  - Multi-zone composition: brand mark zone + applications zone + system zone + typography zone + palette zone.
  - Each zone clearly labeled (small caps annotations).
  - Grid lines occasionally visible as design feature.
  - Demonstrates the "system" through repetition and variation.

What this style REJECTS:
  - Single-image posters (Pentagram shows SYSTEMS).
  - Decorative scripts.
  - "Cute" illustrations.
  - Single-deliverable presentations.
  - Stock photography.
  - Memphis chaos.
  - Brutalism's aggression (Pentagram is intelligent, not violent).
`,

  palette: {
    foundation: ['#FAFAFA', '#1A1A1A'],
    primary: ['#000000', '#FFFFFF'],
    accent: ['#E63946', '#1E40AF', '#FFD23F'],
  },

  typography: {
    display: ['Custom geometric sans', 'GT America', 'Founders Grotesk', 'FF Mark'],
    body: ['GT America', 'Inter', 'Söhne'],
    accent: ['GT Sectra', 'Tiempos'],
  },

  references: {
    brands: ['Pentagram (firm)', 'Public Theater', 'MIT Media Lab', 'Mailchimp', 'Verizon'],
    artists: [
      'Paula Scher',
      'Michael Bierut',
      'Natasha Jen',
      'Marina Willer',
      'Alex Gendell',
      'Massimo Vignelli',
    ],
    eras: ['Pentagram 1972-present'],
    works: [
      'Public Theater identity (Scher)',
      'MIT Media Lab system (Bierut)',
      'NYC subway map (Vignelli)',
    ],
  },

  moodKeywords: [
    'authoritative',
    'systematic',
    'intelligent',
    'editorial',
    'rigorous',
    'documented',
    'mature',
    'institutional',
  ],

  pairsWellWith: [
    'design-swiss-international',
    'brand-apple-keynote-minimal',
    'mood-quiet-contemplation',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
  ],
  bestForVerticals: [
    'cultural-institution',
    'tech-saas',
    'editorial',
    'finance-premium',
    'b2b-enterprise',
    'university',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'wellness-spa'],
};

// ═══════════════════════════════════════════════════════════════
// 4. YOHJI YAMAMOTO NOIR — Poetic minimalism in black
// ═══════════════════════════════════════════════════════════════
const BRAND_YOHJI_YAMAMOTO_NOIR: StyleDNA = {
  id: 'brand-yohji-yamamoto-noir',
  name: 'Yohji Yamamoto Noir',
  tagline: 'Black is modest and arrogant at the same time. Black is lazy and easy.',
  category: 'brand-reference',
  era: 'timeless',
  movement: 'japanese-minimalism',
  intensity: 'subtle',

  aliases: [
    'yohji',
    'yamamoto',
    'yohji-yamamoto',
    'y-3',
    'japanese-noir',
    'japanese-fashion-minimal',
    'avant-garde-japanese',
    'cdg',
    'comme-des-garcons',
    'rei-kawakubo',
    'estilo yohji',
    'estilo yamamoto',
    'yohji yamamoto',
    'noir japonés',
    'minimalismo japonés noir',
    'comme des garçons',
    'rei kawakubo',
    'fashion japonés vanguardia',
    'moda japonesa',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: YOHJI YAMAMOTO — Japanese designer who reinvented Western fashion in 1981 Paris. "Black is modest and arrogant at the same time." This DNA captures Japanese avant-garde fashion's POETIC NOIR — black on black on black, deconstructed silhouettes, anti-fashion that becomes the highest fashion. Adjacent: Comme des Garçons (Rei Kawakubo) and the Antwerp Six. NOT goth (cultural specificity matters) — this is intellectual Japanese darkness with WABI-SABI elegance.

Typography:
  - Display: serif (Garamond, Bodoni Italic) OR ultra-thin geometric sans (Avenir Next Ultra Light, Helvetica Neue Ultra Light at weight 100).
  - Often handwritten or brush-stroke headlines (Japanese kanji influence acceptable).
  - WHITE thin text on BLACK background — always.
  - Tracking generous (+0.05em on display).
  - Italic forms common (poetic motion).
  - Single-line headlines often.
  - Negative space dominates (text occupies 5-15% of frame).

Composition:
  - VOID-DOMINANT compositions — 80%+ negative space (black void).
  - Subjects emerging from darkness (Caravaggio influence on Japanese photography).
  - Asymmetric compositions, but anchored emotionally not mathematically.
  - Cropped figures — heads cut off, hands as protagonists.
  - Architectural fashion shots: figure as silhouette in vast black space.

Color palette (the noir absolute):
  - Foundation: pure black (#0A0A0A) — NOT navy, NOT charcoal, but deep velvet black.
  - Accents: warm white (#F5F5DC), bone (#FAF8F0), mustard (#D4A017) RARE.
  - Greys: cool stone (#5C5C5C), warm taupe (#7A6A5A).
  - NEVER bright colors. Color appears as exception.
  - Black-on-black tonal variations is the COLOR (different blacks: ink, soot, char, jet).

Photography (THE soul of Japanese fashion):
  - Black and white preferred OR severely desaturated color.
  - Photographers: Daido Moriyama (grain), Hiroshi Sugimoto (long exposure), Nobuyoshi Araki (intimate).
  - High contrast — deep shadows, blown highlights acceptable.
  - Grain visible (35mm film aesthetic).
  - Subjects often unsmiling, contemplative, mid-thought.
  - Backstage runway aesthetic: candid, raw, unposed.
  - Models cropped at unexpected places (foot becomes protagonist, etc.).

Camera and lighting:
  - Available light or single hard light source.
  - Window light at noon — harsh shadows tell the story.
  - Studio: single hard key light from above-left, deep shadows on right side.
  - Lens: 50mm or 85mm prime, often shot wide open (f/1.4-2.8) for dreamy DOF.
  - Sometimes 35mm for environmental drama.

Materials and surfaces:
  - Wool, cashmere, silk in BLACK — texture variations within blackness.
  - Leather, both matte and patent (rare specular).
  - Concrete and tatami floors.
  - Aged paper, parchment.
  - Surfaces should feel HANDMADE, not industrial.

Cultural references:
  - Yohji Yamamoto FW1983 collection (the original)
  - Comme des Garçons "Lumps and Bumps" SS1997
  - Daido Moriyama photography books (Stray Dog, Lettre à St. Loup)
  - Hiroshi Sugimoto long exposures
  - Wim Wenders' "Notebook on Cities and Clothes" (1989 Yohji documentary)
  - Antwerp Six (Margiela, Demeulemeester, Van Noten)
  - Junya Watanabe collections
  - The Row brand identity (Olsen sisters)

Movement aesthetic:
  - Stillness with implied breath.
  - Fabric in motion (capturing the moment between wind and stillness).

Texture/Material:
  - Fabric textures up close (deep blacks with subtle weaves visible).
  - Wabi-sabi imperfections (frayed edges, raw seams, asymmetric cuts).

What this style REJECTS:
  - Brightness of any kind.
  - "Pretty" beauty lighting.
  - Color saturation.
  - Centered, balanced compositions.
  - Smiling subjects.
  - Logo-driven branding (Yohji never does big logos).
  - Athletic energy or sports aesthetics.
  - Western fashion conventions (model walks toward camera = NO).
  - Digital perfection (this is film grain land).
`,

  palette: {
    foundation: ['#0A0A0A'],
    primary: ['#F5F5DC', '#FAF8F0'],
    accent: ['#D4A017', '#5C5C5C'],
    forbidden: ['#FF6EC7', '#00CED1', '#FFEB3B'], // Memphis brightness
  },

  typography: {
    display: ['Garamond', 'Bodoni Italic', 'Avenir Next Ultra Light', 'Helvetica Neue Ultra Light'],
    body: ['Garamond', 'Helvetica Neue Light'],
    accent: ['Brush script', 'Hand-drawn'],
  },

  references: {
    brands: ['Yohji Yamamoto', 'Y-3', 'Comme des Garçons', 'Junya Watanabe', 'The Row'],
    artists: [
      'Yohji Yamamoto',
      'Rei Kawakubo',
      'Daido Moriyama (photographer)',
      'Hiroshi Sugimoto (photographer)',
      'Nobuyoshi Araki (photographer)',
      'Wim Wenders (documentarian)',
    ],
    eras: ['Japanese avant-garde 1981-present', 'Antwerp Six 1986-present'],
    works: [
      'Yohji Yamamoto FW1983',
      'Comme des Garçons "Body Meets Dress" SS1997',
      'Notebook on Cities and Clothes (Wenders)',
    ],
  },

  moodKeywords: [
    'contemplative',
    'poetic',
    'severe',
    'elegant',
    'introverted',
    'philosophical',
    'wabi-sabi',
    'noir',
  ],

  pairsWellWith: [
    'mood-melancholy-rainy',
    'mood-quiet-contemplation',
    'cinematic-tarkovsky-poetic',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'fashion-luxury',
    'fashion-avant-garde',
    'cultural-institution',
    'art-gallery',
    'editorial',
    'perfume-niche',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 5. AESOP APOTHECARY — Scientific minimalism with warmth
// ═══════════════════════════════════════════════════════════════
const BRAND_AESOP_APOTHECARY: StyleDNA = {
  id: 'brand-aesop-apothecary-minimal',
  name: 'Aesop Apothecary Minimal',
  tagline: 'Scientific apothecary meets literary salon. Amber glass and cream paper.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'subtle',

  aliases: [
    'aesop',
    'aesop-style',
    'aesop-aesthetic',
    'apothecary',
    'apothecary-aesthetic',
    'scientific-minimal',
    'literary-minimal',
    'amber-glass-aesthetic',
    'estilo aesop',
    'estética aesop',
    'apoteca',
    'farmacia minimalista',
    'literario minimalista',
    'frasco ámbar',
    'minimalismo cálido',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: AESOP — Australian skincare brand founded 1987, redefining luxury through restraint. The brand operates as scientific apothecary crossed with literary salon. Amber glass bottles, cream-colored Helvetica labels, rooms designed by Frida Escobedo and Marc Newson. Aesop is what happens when Swiss design RESPECTS science and EMBRACES warmth. Every store reads like an essay.

Typography:
  - Display: Helvetica or Helvetica Neue in REGULAR weight (400). Never bold.
  - Sometimes serif (Caslon, Adobe Garamond) for editorial contrast on long-form copy.
  - All-caps for product names (small caps at body size — "REVERENCE APHELION").
  - Generous tracking on uppercase (+0.1em).
  - Body copy: literary-quality, sentence-case, 9-10pt with generous leading.
  - Hierarchical SYSTEM clear (header, subhead, body, caption, ingredient list, citation).
  - Uses ALL THE TYPE — long body copy, footnotes, citations (it's literature, not advertising).

Composition:
  - Editorial layout — feels like reading a serious magazine.
  - Generous margins (2-3 inches typical).
  - Single-product photography on neutral backgrounds.
  - Type-heavy — text occupies 40-60% of frame.
  - Asymmetric balance via product placement and white space.
  - Multiple text columns acceptable (literary essay layout).

Color palette (the apothecary scheme):
  - Foundation: cream (#F5F2EB), warm white (#FAF8F0), oat (#E8E2D4).
  - Primary: amber/honey glass tones (#C4956A, #B8804A, #8B5E2F).
  - Accent: forest green (#2D4A2B), oxblood (#722F37), inkwell black (#1A1A1A).
  - NO pure white (always warm).
  - NO bright primaries (Aesop never shouts).
  - Earth tones grounded by literary darks.

Materials and surfaces (THE Aesop signature):
  - AMBER GLASS bottles (the iconic packaging).
  - Cream-colored paper labels with letterpress feel.
  - Brushed aluminum caps.
  - Reclaimed wood, raw concrete, terra cotta.
  - Linen and natural fiber fabrics.
  - Surfaces feel HANDMADE, scholarly, considered.
  - Architecture references: Frida Escobedo, Marc Newson, Snøhetta.

Photography style:
  - Single product photography on cream or stone backgrounds.
  - Window light, natural and patient (golden hour preferred).
  - 50mm prime lens — natural perspective.
  - Shallow depth of field but not extreme (f/2.8 typical).
  - Subjects: amber bottles, cream paper, brushed metal, wood, marble, plants (rosemary, eucalyptus).
  - Environmental context: aesop store interiors (designed by acclaimed architects).

Lighting:
  - Window light at golden hour.
  - Directional but soft (window with sheer curtain quality).
  - Subtle warmth in shadows.
  - Reflections on amber glass picking up environment.

Pattern and ornamentation:
  - NONE explicitly.
  - Pattern emerges from MATERIAL textures (linen weave, wood grain, glass surface).
  - Botanical references in product (rosemary, eucalyptus, fig leaf) shown in photography.

Cultural references:
  - Aesop store designs (Frida Escobedo, Marc Newson, Snøhetta, Studio KO)
  - The Gentlewoman magazine
  - Apartamento magazine
  - Cereal magazine
  - Penguin Classics covers
  - Margaret Howell brand identity
  - Le Labo (similar apothecary lineage)
  - Aesop's annual print campaigns
  - Wabi-sabi philosophy

Movement aesthetic:
  - Stillness, patience, contemplation.
  - Implied warmth and ritual.

What this style REJECTS:
  - Pure white backgrounds (too clinical — Aesop is warm).
  - Cold metallic finishes.
  - Bold colors.
  - Sans-serif as primary headline (Aesop's serif heritage matters).
  - Memphis chaos.
  - Y2K chrome (opposite philosophy).
  - Lifestyle photography with people smiling at camera.
  - Nike's heroic energy (Aesop is contemplative, not athletic).
`,

  palette: {
    foundation: ['#F5F2EB', '#FAF8F0', '#E8E2D4'],
    primary: ['#C4956A', '#B8804A', '#8B5E2F'],
    accent: ['#2D4A2B', '#722F37', '#1A1A1A'],
    forbidden: ['#FF6EC7', '#00FF00'], // Memphis brightness
  },

  typography: {
    display: ['Helvetica Neue Regular', 'Helvetica'],
    body: ['Adobe Garamond', 'Caslon', 'Helvetica Neue'],
    accent: ['Italic serif'],
  },

  references: {
    brands: ['Aesop', 'Le Labo', 'Margaret Howell', 'The Row (lifestyle)'],
    artists: [
      'Frida Escobedo (architect)',
      'Marc Newson (designer)',
      'Snøhetta (architects)',
      'Studio KO (architects)',
    ],
    eras: ['Aesop 1987-present', 'Apothecary aesthetic revival 2010s+'],
    works: [
      'Aesop store interiors (multiple cities)',
      'Aesop annual print campaigns',
      'The Aesop print magazine series',
    ],
  },

  moodKeywords: [
    'contemplative',
    'warm',
    'scholarly',
    'apothecary',
    'literary',
    'considered',
    'patient',
    'wabi-sabi',
  ],

  pairsWellWith: [
    'design-swiss-international',
    'mood-quiet-contemplation',
    'brand-yohji-yamamoto-noir',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'design-brutalist-architectural',
  ],
  bestForVerticals: [
    'beauty-clean',
    'wellness-spa',
    'fashion-luxury',
    'cultural-institution',
    'editorial',
    'food-artisanal',
    'perfume-niche',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic', 'tech-developer'],
};

// ─── Exports ────────────────────────────────────────────────────
export const BRAND_REFERENCE_DNAS: StyleDNA[] = [
  BRAND_APPLE_KEYNOTE,
  BRAND_NIKE_CINEMATIC,
  BRAND_PENTAGRAM_SYSTEMATIC,
  BRAND_YOHJI_YAMAMOTO_NOIR,
  BRAND_AESOP_APOTHECARY,
];

export {
  BRAND_APPLE_KEYNOTE,
  BRAND_NIKE_CINEMATIC,
  BRAND_PENTAGRAM_SYSTEMATIC,
  BRAND_YOHJI_YAMAMOTO_NOIR,
  BRAND_AESOP_APOTHECARY,
};
