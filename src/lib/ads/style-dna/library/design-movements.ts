/**
 * 🎨 STYLE DNA — Design Movements
 *
 * 5 DNAs fundamentales de movimientos de diseño históricos.
 * Cada uno con profundidad de Art Director senior.
 *
 * Filosofía:
 *   "Movements aren't styles you copy — they're philosophies you embody."
 *
 * DNAs incluidos:
 *   1. design-bauhaus-geometric        — Geometría primaria 1920s
 *   2. design-swiss-international      — Müller-Brockmann grid mastery
 *   3. design-memphis-group-80s        — Sottsass maximalismo cromático
 *   4. design-brutalist-architectural  — Concreto crudo, sin gracias
 *   5. design-y2k-chrome-millennium    — Y2K cromado futurista
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. BAUHAUS — Geometría primaria, función sobre decoración
// ═══════════════════════════════════════════════════════════════
const DESIGN_BAUHAUS_GEOMETRIC: StyleDNA = {
  id: 'design-bauhaus-geometric',
  name: 'Bauhaus Geometric',
  tagline: 'Form follows function — primary shapes, primary colors, zero ornament.',
  category: 'design-movement',
  era: 'bauhaus-1920s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'bauhaus',
    'bauhaus-style',
    'bauhaus-design',
    'german-modernism',
    'kandinsky-style',
    'klee-style',
    'moholy-nagy',
    'geometric-modernism',
    'primary-geometry',
    'circle-square-triangle',
    'weimar-design',
    'dessau-style',
    'estilo bauhaus',
    'modernismo alemán',
    'geometría primaria',
    'formas primarias',
    'estilo kandinsky',
    'estética bauhaus',
  ],

  archetypeBase: 'bento-grid-modular',

  promptDirective: `
Aesthetic philosophy: BAUHAUS DOCTRINE — "Form follows function." Every visual element exists because it serves a purpose. Decoration is enemy. Beauty emerges from clarity, from honest relationships between shapes, colors, and space. This is NOT retro pastiche — this is design at its most fundamental, stripped to architectural essence.

Typography:
  - Display: Geometric sans-serif inspired by Herbert Bayer's Universal typeface (Futura, Avenir, Century Gothic in their geometric weights). Weights 400-600, never decorative.
  - Body: Same family, weight 400. Generous tracking on uppercase headlines (+0.05em).
  - All-caps for hero text is acceptable (very Bauhaus).
  - Hierarchy through SIZE only, never decoration or color shifts.

Composition:
  - Strict mathematical grid — 12 columns or 8pt baseline.
  - Asymmetric balance using primary geometric shapes (CIRCLE, SQUARE, TRIANGLE) as compositional elements.
  - Diagonal tensions allowed (45° angles common in Bauhaus posters).
  - White space is a SHAPE itself — equally important to colored shapes.
  - Layering of pure geometric forms creates depth (like Kandinsky's compositions).

Color palette (Bauhaus rigor):
  - Foundation: pure white (#FAFAFA), pure black (#0A0A0A).
  - Primary triad: cadmium red (#E63946), bauhaus blue (#2563EB), school-bus yellow (#FBBF24).
  - These three are SACRED — never substituted with pastels or tints.
  - Use 1-2 primaries per piece (NEVER all three at once unless deliberately maximalist).
  - NO gradients, NO transparencies, NO color blending.

Lighting (if photography or 3D):
  - Flat, even lighting — no dramatic shadows.
  - The Bauhaus rejected drama; prefer matte studio lighting.
  - If using 3D shapes: rendering with subtle ambient occlusion, no harsh specular.

Camera (if applicable):
  - Direct front-on or 90° angled views.
  - No tilt-shift, no shallow depth of field.
  - If photography of objects: Constructivist style — straight architectural angles.

Cultural references:
  - Wassily Kandinsky's "Composition VIII" (1923)
  - Herbert Bayer's Universal alphabet experiments
  - Marcel Breuer's tubular steel furniture aesthetic
  - László Moholy-Nagy's photographic experiments
  - Oskar Schlemmer's "Triadic Ballet" geometric figures
  - Original Bauhaus exhibition posters (1923-1933)

Movement aesthetic:
  - Static, anchored, purposeful.
  - Implied dynamism through diagonal compositions, never literal motion.

Texture/Material:
  - Flat surfaces.
  - Matte paper textures acceptable for poster aesthetic.
  - NO gloss, NO chrome, NO texture beyond paper grain.

What this style REJECTS:
  - Decorative elements (florals, ornaments, swashes).
  - Gradients or color blending.
  - Pastels or muted colors (use pure primaries).
  - Soft drop shadows (use hard offset shadows if any).
  - Curvy/organic typography.
  - Photo-realistic textures.
  - Anything Art Nouveau, anything Victorian, anything "luxurious."
`,

  palette: {
    foundation: ['#FAFAFA', '#0A0A0A'],
    primary: ['#E63946', '#2563EB', '#FBBF24'],
    accent: [],
    forbidden: ['#FFC0CB', '#E0BBE4', '#FFD700'], // Pastels, ornate gold
  },

  typography: {
    display: ['Futura', 'Avenir', 'Century Gothic', 'Universal'],
    body: ['Futura', 'Avenir', 'Century Gothic'],
    accent: ['Geometric monospace'],
  },

  references: {
    artists: [
      'Wassily Kandinsky',
      'Herbert Bayer',
      'László Moholy-Nagy',
      'Marcel Breuer',
      'Oskar Schlemmer',
      'Paul Klee',
    ],
    eras: ['Bauhaus 1919-1933', 'Weimar Modernism', 'Dessau period'],
    works: [
      'Composition VIII (Kandinsky)',
      'Bauhaus exhibition posters',
      'Universal alphabet (Bayer)',
    ],
  },

  moodKeywords: [
    'rational',
    'architectural',
    'fundamental',
    'geometric',
    'primary',
    'utilitarian',
    'pure',
    'modernist',
  ],

  pairsWellWith: ['design-swiss-international'],
  forbiddenCombinations: ['design-memphis-group-80s', 'design-y2k-chrome-millennium'],
  bestForVerticals: ['tech-saas', 'architecture', 'education', 'cultural-institution'],
  forbiddenForVerticals: ['food-traditional', 'beauty-romantic', 'fashion-feminine'],
};

// ═══════════════════════════════════════════════════════════════
// 2. SWISS INTERNATIONAL STYLE — Müller-Brockmann grid mastery
// ═══════════════════════════════════════════════════════════════
const DESIGN_SWISS_INTERNATIONAL: StyleDNA = {
  id: 'design-swiss-international',
  name: 'Swiss International Style',
  tagline: 'The grid is god. Helvetica is gospel. Asymmetry is calculated.',
  category: 'design-movement',
  era: 'swiss-1960s',
  movement: 'swiss-international',
  intensity: 'moderate',

  aliases: [
    'swiss',
    'swiss-design',
    'swiss-style',
    'international-style',
    'müller-brockmann',
    'muller-brockmann',
    'helvetica-style',
    'akzidenz-grotesk',
    'grid-system',
    'objective-design',
    'estilo suizo',
    'diseño suizo',
    'estilo internacional',
    'helvetica',
    'sistema de retícula',
    'diseño racional',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: SWISS INTERNATIONAL STYLE — "Objective design" pioneered by Müller-Brockmann, Hofmann, and Lohse in 1950s-60s Switzerland. The grid is not a constraint but a tool of CLARITY. Every element earns its position through rational hierarchy. This is design that PROVES it works through mathematical structure, not aesthetic charm.

Typography:
  - Display: Helvetica (the original, not Helvetica Neue), Akzidenz-Grotesk, or Univers. Sans-serif PURISM.
  - Body: Same family, no mixing.
  - Weights 400-700 maximum; avoid lights and ultra-bolds.
  - LEFT-aligned (rag right) for body. Justified text is SUSPECT (creates river of white space).
  - Generous leading (1.5x for body).
  - Tight tracking on display, normal on body.
  - Hierarchy through size + weight + position in grid, NEVER color decoration.

Composition (this is the SOUL):
  - 12-column or 8-column rigid grid system. Visible OR invisible — but always present.
  - Asymmetric layouts — never centered, never symmetric.
  - White space is COMPOSED — equal weight to type and image.
  - Information arranged in clear hierarchical zones (not "balanced" but "ordered").
  - Diagonal tensions allowed only when functional (not decorative).
  - One DOMINANT element + supporting elements. Never visual chaos.

Color palette (restrained discipline):
  - Foundation: pure white (#FFFFFF) or near-black (#1A1A1A).
  - One single accent color (deep red #DC143C, royal blue #1E40AF, or industrial yellow #FACC15).
  - Black, white, and ONE accent. Never two accents in one piece.
  - NO gradients, NO transparency, NO ornamental color usage.

Photography style (when applicable):
  - High-contrast black and white photography.
  - Strict grids of grouped images (Karl Gerstner-style image grids).
  - If color photography: muted, journalistic, NEVER lifestyle/aspirational.
  - Documentary realism over commercial polish.

Camera (if applicable):
  - 50mm prime lens (standard human vision).
  - Direct, unmanipulated framing.
  - Photojournalistic neutrality.

Cultural references:
  - Josef Müller-Brockmann grid system books
  - Armin Hofmann's posters (Basel)
  - Karl Gerstner's "Designing Programmes"
  - Helvetica documentary by Gary Hustwit
  - Akzidenz-Grotesk specimens
  - Otl Aicher's 1972 Munich Olympics identity
  - Massimo Vignelli's NYC subway map

Movement aesthetic:
  - Stillness through structure.
  - Implied directionality via type orientation (vertical type used purposefully).

Texture/Material:
  - Matte paper.
  - Offset printing aesthetic — slight ink gain acceptable.
  - NO digital shine, NO 3D effects, NO illustrations.

What this style REJECTS:
  - Decorative typography (no display fonts, no scripts).
  - Centered compositions.
  - Multiple accent colors.
  - Photographic backgrounds with text overlays (use clean white).
  - Stock photography style.
  - "Friendly" illustrations.
  - Anything that looks American (Saul Bass is American — different lineage).
  - Sentimentality.
`,

  palette: {
    foundation: ['#FFFFFF', '#1A1A1A'],
    primary: ['#000000'],
    accent: ['#DC143C', '#1E40AF', '#FACC15'],
    forbidden: ['#FFB6C1', '#9370DB'], // Sentimental colors
  },

  typography: {
    display: ['Helvetica', 'Akzidenz-Grotesk', 'Univers', 'Neue Haas Grotesk'],
    body: ['Helvetica', 'Akzidenz-Grotesk', 'Univers'],
  },

  references: {
    artists: [
      'Josef Müller-Brockmann',
      'Armin Hofmann',
      'Karl Gerstner',
      'Otl Aicher',
      'Massimo Vignelli',
      'Max Bill',
    ],
    eras: ['Swiss Style 1950s-1960s', 'Basel School', 'Zurich School'],
    works: [
      'Grid Systems in Graphic Design (Müller-Brockmann)',
      '1972 Munich Olympics identity',
      'NYC Subway map (Vignelli)',
    ],
  },

  moodKeywords: [
    'rational',
    'objective',
    'systematic',
    'authoritative',
    'clear',
    'disciplined',
    'modernist',
    'clinical',
  ],

  pairsWellWith: [
    'design-bauhaus-geometric',
    'mood-quiet-contemplation',
    'cinematic-kubrick-symmetric',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
  ],
  bestForVerticals: [
    'tech-saas',
    'finance',
    'cultural-institution',
    'editorial',
    'pharmaceutical',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-traditional'],
};

// ═══════════════════════════════════════════════════════════════
// 3. MEMPHIS GROUP 80s — Sottsass maximalismo cromático
// ═══════════════════════════════════════════════════════════════
const DESIGN_MEMPHIS_GROUP: StyleDNA = {
  id: 'design-memphis-group-80s',
  name: 'Memphis Group 80s',
  tagline: 'Color crimes, geometric chaos, postmodern joy.',
  category: 'design-movement',
  era: 'memphis-1980s',
  movement: 'memphis-group',
  intensity: 'extreme',

  aliases: [
    'memphis',
    'memphis-group',
    'memphis-80s',
    'memphis-style',
    'sottsass',
    'ettore-sottsass',
    'postmodern-design',
    'maximalism',
    '80s-design',
    'eighties-design',
    'milan-postmodern',
    'estilo memphis',
    'maximalismo',
    'diseño postmoderno',
    'estilo sottsass',
    'años 80',
    'estética 80s',
    'chillón',
    'caótico-cromático',
  ],

  archetypeBase: 'type-collage-mixed-media',

  promptDirective: `
Aesthetic philosophy: MEMPHIS GROUP — Founded by Ettore Sottsass in Milan (1981), this movement was a revolt against modernist sobriety. EVERYTHING modernism rejected, Memphis embraced: clashing colors, decorative patterns, geometric chaos, "bad taste" reclaimed as joy. This is design as REBELLION against rules. NOT retro nostalgia — Memphis is timeless punk attitude in object form.

Typography:
  - Display: Bold geometric sans-serif (Avenir Heavy, Eurostile Bold) OR custom decorative letterforms with weird proportions.
  - Mix typography aggressively — bold display next to thin condensed sans next to monospace next to italic.
  - Letters can be ANGLED (rotated 5-15°), STRETCHED, OUTLINED, or OFFSET-shadowed.
  - Hierarchy is PLAYFUL — biggest text might not be most important.
  - Custom letterforms acceptable (looks like 80s pop magazines).

Composition:
  - Asymmetric chaos with internal logic.
  - Layered shapes overlapping freely — circles, triangles, squiggles, ZIGZAGS, CONFETTI dots, GRID PATTERNS.
  - Pattern + solid + pattern combinations (not "tasteful").
  - Diagonal compositions, tilted elements.
  - Foreground/background distinction blurred deliberately.
  - "Everything competes for attention" — and somehow it works.

Color palette (THE Memphis signature):
  - SATURATED, CLASHING colors that "shouldn't" work together:
    Hot pink (#FF6EC7), electric teal (#00CED1), banana yellow (#FFEB3B), 
    mint green (#A8E6CF), grape purple (#9B59B6), crimson red (#E74C3C),
    cyan blue (#00BCD4), magenta (#E91E63).
  - NEVER muted, NEVER pastel, NEVER tasteful.
  - Use 4-6 colors per piece (regular design says 2-3 max — Memphis breaks rules).
  - Black accents for typography contrast.
  - White or grid backgrounds to "calm" the chaos.

Patterns and motifs (signature):
  - SQUIGGLE LINES (the "Bacterio" pattern by Sottsass).
  - CONFETTI DOTS (random scattered circles).
  - ZIGZAG patterns.
  - GRID DOTS or GRID LINES.
  - TRIANGLE SHAPES floating freely.
  - HALF-CIRCLES, ARCH SHAPES.
  - Crayon-like SCRIBBLES.

Lighting / texture:
  - FLAT illustration style (no realistic shading).
  - Hard-edged shapes (no gradients except deliberate retro chrome).
  - Plastic, laminate, terrazzo material references.
  - Silkscreen poster aesthetic.

Cultural references:
  - Ettore Sottsass furniture (Carlton Bookcase, Tahiti Lamp)
  - Memphis Milano exhibition 1981
  - Nathalie Du Pasquier patterns
  - 80s MTV graphics, Saved by the Bell aesthetics
  - Lisa Frank stickers (extreme cousin)
  - Camille Walala contemporary patterns
  - Trapper Keeper folder designs
  - Esprit ad campaigns 1985-1990

Movement aesthetic:
  - JOYFUL, energetic, anarchic.
  - Implied movement through diagonal lines and floating elements.

Texture/Material:
  - Glossy plastic finish references.
  - Terrazzo and laminate materials.
  - Bright matte paper for posters.

What this style REJECTS:
  - Restraint of any kind.
  - Muted colors, beige, "tasteful" palettes.
  - Symmetry and "designer" composition rules.
  - Realistic photography (this is illustration land).
  - Negative space as breath (Memphis fills space with JOY).
  - Anything Swiss, anything corporate.
  - "Mature" design (Memphis is permanent youth).
`,

  palette: {
    foundation: ['#FFFFFF', '#1A1A1A'],
    primary: ['#FF6EC7', '#00CED1', '#FFEB3B', '#9B59B6'],
    accent: ['#A8E6CF', '#E74C3C', '#00BCD4', '#E91E63'],
    forbidden: ['#D4C9A8', '#6B6560'], // Tasteful muted tones
  },

  typography: {
    display: ['Avenir Heavy', 'Eurostile', 'VAG Rundschrift', 'Custom angled'],
    body: ['Avenir', 'Helvetica Bold'],
    accent: ['Monospace italic', 'Decorative display'],
  },

  references: {
    artists: [
      'Ettore Sottsass',
      'Nathalie Du Pasquier',
      'Michele De Lucchi',
      'Peter Shire',
      'Camille Walala',
    ],
    brands: ['Esprit (1980s)', 'Swatch (1980s)', 'Lisa Frank'],
    eras: ['Memphis Milano 1981-1988', '80s MTV graphics era'],
    works: [
      'Carlton Bookcase (Sottsass)',
      'Memphis Milano 1981 exhibition',
      'Bacterio pattern',
    ],
  },

  moodKeywords: [
    'joyful',
    'rebellious',
    'maximalist',
    'playful',
    'chaotic',
    'energetic',
    'irreverent',
    'kitsch',
  ],

  pairsWellWith: ['design-y2k-chrome-millennium', 'mood-euphoria-celebration'],
  forbiddenCombinations: [
    'design-bauhaus-geometric',
    'design-swiss-international',
    'design-brutalist-architectural',
    'mood-quiet-contemplation',
  ],
  bestForVerticals: [
    'fashion-streetwear',
    'kids-toys',
    'music-festival',
    'art-cultural',
    'beauty-fun',
  ],
  forbiddenForVerticals: [
    'finance',
    'pharmaceutical',
    'luxury-jewelry',
    'funeral-services',
  ],
};

// ═══════════════════════════════════════════════════════════════
// 4. BRUTALISM — Concrete, raw, unapologetic
// ═══════════════════════════════════════════════════════════════
const DESIGN_BRUTALIST_ARCHITECTURAL: StyleDNA = {
  id: 'design-brutalist-architectural',
  name: 'Brutalist Architectural',
  tagline: 'Raw concrete. Bestial typography. Anti-design as aesthetic violence.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'brutalism',
  intensity: 'extreme',

  aliases: [
    'brutalism',
    'brutalist',
    'brutalist-design',
    'web-brutalism',
    'anti-design',
    'raw-design',
    'concrete-aesthetic',
    'bestial',
    'aggressive-design',
    'punk-design',
    'estilo brutalista',
    'brutalismo',
    'agresivo',
    'crudo',
    'anti-diseño',
    'punk',
    'underground',
    'feo-bonito',
  ],

  archetypeBase: 'brutalist-text-hero',

  promptDirective: `
Aesthetic philosophy: ARCHITECTURAL BRUTALISM (1950s) translated to graphic design via web-brutalism (2014+). The concrete is HONEST. The typography is BESTIAL. Beauty emerges from raw materiality, not polish. This rejects "user-friendly" tropes — it CHALLENGES the viewer. Successful brutalism is uncomfortable yet magnetic. NOT messy or amateur — brutalism is INTENTIONAL aesthetic violence with surgical precision.

Typography (THE soul of brutalism):
  - Display: HEAVY industrial sans-serif (Druk Heavy, Inter Black, Helvetica Black, Compacta).
  - Letters STRETCH vertically or horizontally beyond normal proportions.
  - All-caps for hero text — ALWAYS.
  - Tracking can be EXTREMELY tight (negative letter-spacing, letters touching).
  - OR extremely loose (letters spread apart with intent).
  - Body: monospace (Courier, IBM Plex Mono) or industrial sans.
  - Mix of HUGE display text + SMALL fineprint, no medium sizes.
  - Type can break grid, overflow edges, overlap with images.

Composition:
  - Aggressive asymmetry.
  - Type as architectural element (massive blocks of text as buildings).
  - Single-color backgrounds (often gray, beige, or stark white).
  - Images placed without grace — square crops, off-center, deliberately "wrong."
  - Heavy black borders, rules, dividers (1-3px thick lines structuring layout).
  - Empty space is HEAVY (not airy).

Color palette (concrete and oxidation):
  - Foundation: concrete gray (#7A7A7A, #6B6B6B), bone (#F5F5DC), warm white (#FAF8F0).
  - High contrast: pure black (#000000) and pure white (#FFFFFF).
  - Industrial accents (when used): hazard yellow (#FFCC00), traffic red (#E60000), oxidation orange (#CC5500).
  - NO gradients (concrete is matte).
  - NO pastels.

Photography style (if applicable):
  - Raw, harsh, unedited aesthetic.
  - Direct flash photography (Daido Moriyama, Bruce Davidson).
  - Black and white preferred; if color, desaturated.
  - Subjects look caught, not posed.

Materials and textures:
  - Raw concrete textures (béton brut).
  - Brutalist architecture references (Trellick Tower, Barbican, Habitat 67).
  - Photocopier textures (xerox aesthetic).
  - Halftone dots visible.
  - Rough paper, newsprint texture.

Cultural references:
  - Le Corbusier's Unité d'Habitation
  - Erno Goldfinger's Trellick Tower
  - Brutalist architecture book series (Phaidon)
  - David Carson's Ray Gun magazine
  - Wolfgang Weingart's Basel work
  - The Outline (defunct media brand)
  - Bloomberg Businessweek covers (2010s)
  - Yale School of Architecture website
  - SSENSE editorial design
  - Vetements brand identity 2014-2018

Movement aesthetic:
  - Static, IMPOSING, monumental.
  - Type that "stands its ground."

Texture/Material:
  - Concrete (rough, weathered).
  - Newspaper (high-contrast print).
  - Photocopier degradation.

What this style REJECTS:
  - Roundness, softness, friendliness.
  - Decorative typography (no scripts, no thin sans-serifs).
  - "Beautiful" photography.
  - Pastel anything.
  - White space as breathing room (brutalism's white space is ABSENCE, heavy).
  - Bauhaus-clean geometry (brutalism is rougher).
  - Anything that looks "nice."
`,

  palette: {
    foundation: ['#7A7A7A', '#F5F5DC', '#FAF8F0'],
    primary: ['#000000', '#FFFFFF'],
    accent: ['#FFCC00', '#E60000', '#CC5500'],
    forbidden: ['#FFB6C1', '#FFE4B5'], // Soft, friendly colors
  },

  typography: {
    display: ['Druk Heavy', 'Inter Black', 'Helvetica Black', 'Compacta', 'Bebas Neue'],
    body: ['IBM Plex Mono', 'Courier', 'Roboto Mono'],
    accent: ['Industrial sans', 'Stencil'],
  },

  references: {
    artists: [
      'David Carson',
      'Wolfgang Weingart',
      'Le Corbusier (architecture)',
      'Erno Goldfinger (architecture)',
      'Daido Moriyama (photography)',
    ],
    brands: ['Vetements (2014-2018)', 'SSENSE editorial', 'The Outline (defunct)'],
    eras: ['Brutalist architecture 1950s-1970s', 'Web-brutalism 2014+'],
    works: [
      'Trellick Tower',
      'Ray Gun magazine (Carson)',
      'Bloomberg Businessweek covers',
    ],
  },

  moodKeywords: [
    'aggressive',
    'raw',
    'imposing',
    'industrial',
    'unapologetic',
    'monumental',
    'punk',
    'bestial',
  ],

  pairsWellWith: [
    'mood-urgent-revolutionary',
    'cinematic-tarantino-pulp',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'mood-quiet-contemplation',
    'mood-nostalgic-polaroid',
  ],
  bestForVerticals: [
    'fashion-streetwear',
    'music-underground',
    'art-cultural',
    'tech-developer',
  ],
  forbiddenForVerticals: [
    'beauty-traditional',
    'food-traditional',
    'luxury-jewelry',
    'wellness-spa',
  ],
};

// ═══════════════════════════════════════════════════════════════
// 5. Y2K CHROME MILLENNIUM — Cromado futurista de los 2000
// ═══════════════════════════════════════════════════════════════
const DESIGN_Y2K_CHROME: StyleDNA = {
  id: 'design-y2k-chrome-millennium',
  name: 'Y2K Chrome Millennium',
  tagline: 'Liquid chrome, blob shapes, blue gradient skies — the 2000 future that never came.',
  category: 'design-movement',
  era: 'y2k-millennium',
  movement: 'vaporwave',
  intensity: 'bold',

  aliases: [
    'y2k',
    'y2k-aesthetic',
    'y2k-chrome',
    'millennium-chrome',
    'liquid-chrome',
    '2000s-aesthetic',
    'chrome-aesthetic',
    'frutiger-aero',
    'aqua-aesthetic',
    'metallic-design',
    'cyber-y2k',
    'estilo y2k',
    'estética 2000',
    'cromado',
    'futurista 2000',
    'aesthetic 2000s',
    'metálico líquido',
    'cyber 2000',
    'frutiger',
  ],

  archetypeBase: 'y2k-liquid-chrome',

  promptDirective: `
Aesthetic philosophy: Y2K MILLENNIUM CHROME — The optimistic future imagined in 1998-2003 that never materialized. This is the aesthetic of Microsoft Bliss wallpapers, early Apple iPods, Sony VAIO laptops, mid-Matrix sequels. Chrome surfaces, blob shapes, blue-sky gradients, transparent plastic. NOT 90s nostalgia (that's grunge) — this is the TURN OF THE MILLENNIUM specifically, where digital was new and shiny and full of promise.

Typography:
  - Display: Futuristic sans-serif with rounded terminals (Eurostile, Bank Gothic, Microgramma) OR ultra-thin geometric (Avant Garde Light).
  - Often CHROMED — gradient fills going from silver (#E0E0E0) to deep blue (#0050C8) to silver again.
  - Reflective sheen on letterforms (light hitting from above-left, creating gleam).
  - Beveled edges, slight 3D extrusion.
  - Italic angles common (5-10° forward lean = "futurist motion").

Composition:
  - Curved layouts — elements arranged on slight arcs, not strict grids.
  - Blob shapes (organic chrome forms) as compositional elements.
  - Layered transparent panels (frosted glass before "glassmorphism" had a name).
  - Diagonal motion lines suggesting speed.
  - Reflective surfaces dominate the visual field.

Color palette (the chrome era):
  - Foundation: chrome silver (#C0C0C0), iridescent gradients (silver → blue → purple).
  - Sky blues: cerulean (#007FFF), electric blue (#0066FF), Microsoft Bliss blue (#3FA9F5).
  - Pearl whites with blue tint (#F0F8FF).
  - Holographic accents: pink-purple-blue gradient transitions.
  - Cyber green (#00FF7F) as accent, deep navy (#0A1F44) for contrast.
  - Liquid mercury rendering on surfaces.

Surface materials (THE signature):
  - LIQUID CHROME — flowing metallic surfaces with blue gradient reflections.
  - FROSTED GLASS / Aqua finish — translucent panels with subtle blur.
  - HOLOGRAPHIC FOIL — rainbow shifts on movement.
  - PLASTIC TRANSPARENT — early iMac G3 colored translucent plastic.
  - LENS FLARE — anamorphic blue lens flares from light sources.

Lighting (heavy chrome means heavy lighting):
  - Studio lighting from above, creating chrome highlights.
  - Reflective bounce — every surface picks up sky/environment.
  - Long highlight streaks on chrome edges.
  - Soft glow halos around bright elements (bloom effect).

3D / depth treatment:
  - Slight 3D extrusion on type and shapes (1-3 unit depth).
  - Floating elements with subtle drop shadows.
  - Blob shapes feel SCULPTED, not flat.

Cultural references:
  - Microsoft Bliss wallpaper (2001)
  - Apple iPod commercials (2001-2004)
  - Sony VAIO design language
  - Matrix Reloaded (2003) — Niobe's chrome motorcycle aesthetic
  - Sega Dreamcast UI design
  - Frutiger Aero design movement
  - Early iMac G3 colored plastics
  - Charli XCX album art aesthetic (2020s revival)
  - PinkPantheress music video aesthetic

Photography references:
  - Reflective product photography circa 2001-2005.
  - Chrome objects on white seamless.
  - Blob-shaped studio pillows as set design.

What this style REJECTS:
  - Matte materials.
  - Vintage textures (no grain, no paper, no warmth).
  - Earthy color palettes.
  - Anything pre-2000 nostalgia (Memphis is a different era).
  - Brutalism (opposite philosophy).
  - Minimalism (Y2K is maximalist).
`,

  palette: {
    foundation: ['#C0C0C0', '#F0F8FF'],
    primary: ['#007FFF', '#0066FF', '#3FA9F5', '#0A1F44'],
    accent: ['#00FF7F', '#FF00FF', '#00FFFF'],
    forbidden: ['#8B4513', '#556B2F'], // Earthy tones
  },

  typography: {
    display: ['Eurostile', 'Bank Gothic', 'Microgramma', 'Avant Garde'],
    body: ['Helvetica', 'Eurostile'],
    accent: ['Italic futurist', 'Bevel-extruded'],
  },

  references: {
    artists: ['Hajime Sorayama', 'Andrew Thomas Huang', 'Zaha Hadid (architecture)'],
    brands: ['Apple iPod era 2001-2004', 'Sony VAIO', 'Sega Dreamcast', 'PinkPantheress visuals'],
    eras: ['Y2K 1998-2003', 'Frutiger Aero 2004-2013', 'Y2K revival 2020+'],
    works: [
      'Microsoft Bliss wallpaper',
      'Matrix Reloaded chrome aesthetic',
      'iMac G3 transparent plastic',
    ],
  },

  moodKeywords: [
    'futuristic',
    'optimistic',
    'glossy',
    'reflective',
    'cyber',
    'aspirational',
    'metallic',
    'fluid',
  ],

  pairsWellWith: ['design-memphis-group-80s', 'mood-euphoria-celebration'],
  forbiddenCombinations: [
    'design-brutalist-architectural',
    'design-bauhaus-geometric',
    'mood-melancholy-rainy',
    'mood-nostalgic-polaroid',
  ],
  bestForVerticals: [
    'tech-saas',
    'music-pop',
    'fashion-streetwear',
    'gaming',
    'beauty-fun',
  ],
  forbiddenForVerticals: [
    'food-traditional',
    'wellness-organic',
    'finance-conservative',
  ],
};

// ─── Exports ────────────────────────────────────────────────────
export const DESIGN_MOVEMENT_DNAS: StyleDNA[] = [
  DESIGN_BAUHAUS_GEOMETRIC,
  DESIGN_SWISS_INTERNATIONAL,
  DESIGN_MEMPHIS_GROUP,
  DESIGN_BRUTALIST_ARCHITECTURAL,
  DESIGN_Y2K_CHROME,
];

export {
  DESIGN_BAUHAUS_GEOMETRIC,
  DESIGN_SWISS_INTERNATIONAL,
  DESIGN_MEMPHIS_GROUP,
  DESIGN_BRUTALIST_ARCHITECTURAL,
  DESIGN_Y2K_CHROME,
};
