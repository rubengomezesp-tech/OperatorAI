/**
 * 🎭 STYLE DNA — Pro Design Editorial (Premium Editorial Formats)
 *
 * 5 DNAs de FORMATOS editoriales modernos que se usan en
 * portadas de revistas, manifiestos de marca, y campañas de élite.
 *
 * DNAs incluidos:
 *   1. pro-typographic-poster-monumental  — Typography como imagen
 *   2. pro-quote-pull-editorial-bold      — Quote pull magazine-style
 *   3. pro-comparison-split-cinematic     — Before/after editorial
 *   4. pro-luxury-spotlight-pedestal      — Producto en pedestal
 *   5. pro-tech-product-keynote-film      — Tech product Apple-film
 *
 * BRAND CONTEXT RULES (aplicado a TODOS):
 *   - NEVER include real brand names as visible text in the image
 *   - ONLY use brand text/name from user prompt context
 *   - If no brand context: use neutral placeholders or NO TEXT
 *   - Generic products only, unless user describes specific product
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. TYPOGRAPHIC POSTER MONUMENTAL — Typography as image
// ═══════════════════════════════════════════════════════════════
const PRO_TYPOGRAPHIC_POSTER: StyleDNA = {
  id: 'pro-typographic-poster-monumental',
  archetypeBase: 'editorial-magazine',
  name: 'Typographic Poster Monumental',
  tagline: 'Typography as image. One word. Massive. Unforgettable.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'swiss-international',
  intensity: 'bold',

  aliases: [
    'typographic poster',
    'poster tipográfico',
    'póster tipográfico',
    'poster typo',
    'monumental typography',
    'tipografía monumental',
    'big type',
    'tipografía grande',
    'massive type',
    'one word ad',
    'palabra única',
    'una palabra',
    'manifesto poster',
    'póster manifiesto',
    'pentagram poster',
    'paula scher style',
    'jessica walsh',
    'walsh studio',
    'anthony burrill',
    'made thought',
    'mast brothers',
    'street poster',
    'póster callejero',
    'wheatpaste',
    'minimal poster',
    'poster minimal',
    'tipografía como imagen',
    'type as image',
    'editorial bold',
    'editorial poster',
  ],

  promptDirective: `TYPOGRAPHIC POSTER MONUMENTAL — TYPE AS THE IMAGE

CORE PHILOSOPHY:
- The TYPOGRAPHY IS the image, not decoration on top of one
- Inheritance from 1960s Swiss posters but executed with
  contemporary type foundries and CSS variable fonts
- One powerful word/phrase fills the frame
- Bold, decisive, manifesto-energy
- Stops the scroll because it DEMANDS to be read

COMPOSITION:
- Type fills 50-90% of frame height
- Word/phrase positioned: dead-center, top-anchored, or off-balance
- Background: solid color, subtle gradient, or minimal photo
- Optional: type CROPPED at edges (parts cut off intentionally)
- Optional: stacked multi-line (each word a new line, spaced)

TYPOGRAPHY HEROES:
- Display: heavy weights — Druk, Druk Wide, Helvetica Bold,
  Akzidenz Grotesk Black, custom condensed
- Or refined editorial serif: GT Sectra Display, Tiempos Headline
- Tracking: tight (luxury feel) or generous (editorial feel)
- Weight contrast: black weight headline + light supporting text
- NEVER use real brand names — user context only

COLOR USE:
- High contrast: black on cream, white on saturated color, etc.
- Single brand color flooding background
- Type often inverted (white type on color, color on white)
- Optional: 2-color split (type half-and-half on color blocks)

SUPPORTING ELEMENTS:
- Minimal: maybe 1 small line of supporting copy
- Or: small visual element (logo placement, photo crop, mark)
- Otherwise: type stands alone in confident silence

WHEN TO USE PHOTO:
- If photo present: it's CROPPED tight as backdrop
- Type overlaps photo, type still dominates
- Photo treated with color filter or duotone

NEGATIVE SPACE:
- Used as part of composition (not just empty)
- Generous around type (lets type BREATHE)
- Or: type fills aggressively (no breathing room — intentional pressure)

REJECTS:
- Decorative typography flourishes
- Multiple competing typographic styles
- Cluttered information design
- Predictable centered logo + tagline + cta layout
- Type as accent (here type is HERO)

BRAND CONTEXT RULE:
NEVER include real brand names. Use ONLY user-provided
copy. If no copy: use universal manifesto phrases
("DO LESS", "MAKE NOW", "ARRIVE", "BEGIN") — generic, brand-neutral.

REFERENCES (spiritual lineage):
- Pentagram (Paula Scher posters)
- &Walsh (Jessica Walsh studio)
- Anthony Burrill posters
- Made Thought design studio
- Pentagram (any decade — Vignelli, Bantjes era)
- Mast Brothers chocolate posters
- Aesop campaign posters

USE CASE: brand manifestos, product launches with single word
hero, social media impactful single-image campaigns,
art gallery openings, fashion drops, music album campaigns,
political/social cause posters (when neutral)`,

  palette: {
    foundation: ['#FFFFFF', '#000000', '#FAF6E8', '#0A0A0A'],
    primary: ['#FF1F1F', '#FFD700', '#0066FF', '#1A1A1A'],
    accent: ['#FF6B35', '#5C8001', '#7B68EE'],
    forbidden: ['Multiple weak colors', 'Pastels for hero type'],
  },

  typography: {
    display: ['Druk', 'Druk Wide', 'Helvetica Bold', 'Akzidenz Grotesk Black', 'GT Sectra Display'],
    body: ['Söhne', 'Inter', 'GT America'],
    accent: ['JetBrains Mono', 'GT America Mono'],
  },

  references: {
    brands: ['Pentagram identity systems', 'Aesop campaigns', 'Off-White posters'],
    artists: ['Paula Scher', 'Jessica Walsh', 'Anthony Burrill', 'Stefan Sagmeister', 'Massimo Vignelli'],
    eras: ['Swiss design 1960s', 'Contemporary editorial 2020-2026'],
    works: ['Public Theater identity (Scher)', 'Anthony Burrill posters'],
  },

  moodKeywords: ['decisive', 'monumental', 'confident', 'manifesto', 'editorial', 'powerful', 'unforgettable', 'bold'],

  pairsWellWith: ['design-swiss-international', 'mood-quiet-luxury'],
  forbiddenCombinations: ['pro-anti-design-deconstructed', 'design-memphis-80s'],

  bestForVerticals: ['fashion-luxury', 'art-galleries', 'manifestos', 'music', 'product-launches', 'editorial', 'social-cause'],
  forbiddenForVerticals: ['kids-toys', 'discount-retail', 'fast-food'],
};

// ═══════════════════════════════════════════════════════════════
// 2. QUOTE PULL EDITORIAL BOLD — Magazine quote-driven
// ═══════════════════════════════════════════════════════════════
const PRO_QUOTE_PULL: StyleDNA = {
  id: 'pro-quote-pull-editorial-bold',
  archetypeBase: 'editorial-magazine',
  name: 'Quote Pull Editorial Bold',
  tagline: 'A quote made into a hero. Magazine pull-quote energy as primary visual.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'quote pull',
    'pull quote',
    'cita destacada',
    'cita editorial',
    'magazine quote',
    'cita de revista',
    'editorial quote',
    'quote design',
    'design de cita',
    'testimonial design',
    'design testimonio',
    'quote ad',
    'anuncio cita',
    'press quote ad',
    'cita prensa',
    'review ad',
    'reseña anuncio',
    'review style',
    'estilo reseña',
    'attributed quote',
    'cita atribuida',
    'editorial type',
    'tipografía editorial',
    'serif quote',
    'cita serif',
  ],

  promptDirective: `QUOTE PULL EDITORIAL BOLD — TESTIMONIAL/QUOTE AS HERO

CORE PHILOSOPHY:
- Take a powerful quote/testimonial and make it the hero element
- Magazine-style "pull quote" treatment scaled up
- Quotation marks as architectural design element
- Authority through borrowed credibility (real reviewer voice)
- Editorial sophistication — feels like Vogue or NYT review

COMPOSITION:
- Quote fills 50-70% of frame
- Large opening quotation mark (oversized, decorative)
- Quote text in elegant serif or refined sans-serif
- Attribution below: smaller, often italic or tracked
- Optional source/publication citation
- Background: solid neutral, subtle texture, or photo

TYPOGRAPHY:
- Quote text: large editorial serif (GT Sectra, Caslon,
  Baskerville, Tiempos Headline) — italic OR roman
- OR: large modern sans (Söhne, Inter Display) for tech feel
- Opening quote mark: HUGE (often 3-5x text size)
- Attribution: smaller, all caps tracked, or italic small caps
- Optional title/role: smallest, at bottom

QUOTE STRUCTURE:
- Original quote (provided by user) — never invent reviews
- 5-15 words ideal length for hero treatment
- Attribution: name, role/title, publication (if applicable)
- If no quote provided by user: use placeholder with note,
  or generic affirmation ("Built for makers")

VISUAL STYLE:
- Background: solid color, soft gradient, or minimal photo
- Photo (if used): person being quoted, or contextual scene
- Photo treatment: subtle, not competing with text
- Brand color used as accent (in quote marks or attribution)

LAYOUT VARIATIONS:
- Centered quote on solid color background
- Quote left-aligned, image right-aligned (50/50 split)
- Quote stacked in vertical center, photo subtle background
- Multi-quote layout (3+ quotes in editorial spread)

EDITORIAL DETAILS:
- Pull quote dash/em-dash conventions (— Name)
- Optional small mark or symbol between quote and attribution
- Magazine-style folio details (small text in corners)
- Italic for emphasis on key words within quote

REJECTS:
- Generic "5 stars" review aesthetic
- Cluttered with too many testimonials
- Sales-y "BUY NOW" messaging
- Tiny quotation marks
- Overly decorative borders/frames

BRAND CONTEXT RULE:
NEVER fabricate quotes from real publications or real people.
Use ONLY user-provided quotes/testimonials. If no testimonial:
use neutral aspirational copy or skip this DNA.

REFERENCES (spiritual lineage):
- The New York Times Magazine pull quotes
- The New Yorker editorial spreads
- Vogue feature article design
- Wired magazine quote treatments
- Apple's "What people are saying" style ads
- The Gentlewoman editorial design

USE CASE: testimonial-driven campaigns, press quote celebrations,
review-based ads, customer success stories, book launches,
podcast promotion, industry recognition campaigns,
"as featured in" social proof ads`,

  palette: {
    foundation: ['#FFFEF8', '#F5F2EA', '#1A1A1A', '#FFFFFF'],
    primary: ['#1A1A1A', '#5A5240', '#3D342A'],
    accent: ['#A4906E', '#D4AF37', '#4A6B7C', '#7A2424'],
    forbidden: ['Neon colors for editorial', 'Pure black backgrounds with text only'],
  },

  typography: {
    display: ['GT Sectra', 'Caslon', 'Tiempos Headline', 'Söhne'],
    body: ['GT Sectra Display', 'Söhne', 'Inter Display'],
    accent: ['Söhne Mono', 'JetBrains Mono', 'Caslon Italic'],
  },

  references: {
    brands: ['The New Yorker', 'Vogue', 'Wired magazine', 'Apple ad campaigns'],
    artists: ['Editorial designers at Condé Nast', 'NYT Magazine design team'],
    eras: ['Magazine editorial design 2010-2026'],
    works: ['NYT Magazine spreads', 'New Yorker article design'],
  },

  moodKeywords: ['authoritative', 'editorial', 'sophisticated', 'credible', 'literary', 'curated', 'considered'],

  pairsWellWith: ['photo-editorial-fashion', 'mood-quiet-luxury'],
  forbiddenCombinations: ['pro-anti-design-deconstructed', 'pro-acid-graphics-raw'],

  bestForVerticals: ['publishing', 'media', 'professional-services', 'b2b', 'saas-enterprise', 'consulting', 'authors-creators'],
  forbiddenForVerticals: ['fast-food-fun', 'kids-toys', 'gaming-casual'],
};

// ═══════════════════════════════════════════════════════════════
// 3. COMPARISON SPLIT CINEMATIC — Before/after editorial
// ═══════════════════════════════════════════════════════════════
const PRO_COMPARISON_SPLIT: StyleDNA = {
  id: 'pro-comparison-split-cinematic',
  archetypeBase: 'documentary-honest',
  name: 'Comparison Split Cinematic',
  tagline: 'Before / after. With / without. Side-by-side as visual argument.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'documentary-realism',
  intensity: 'bold',

  aliases: [
    'comparison split',
    'comparativa',
    'before after',
    'antes después',
    'antes y después',
    'split screen',
    'pantalla dividida',
    'side by side',
    'lado a lado',
    'compare design',
    'diseño comparativo',
    'with without',
    'con sin',
    'vs design',
    'versus diseño',
    'transformation ad',
    'transformación',
    'diptych',
    'díptico',
    'diptico',
    'split image',
    'imagen dividida',
    'product comparison',
    'comparación producto',
    'feature compare',
    'comparar característica',
    'demo split',
    'demo dividido',
  ],

  promptDirective: `COMPARISON SPLIT CINEMATIC — VISUAL ARGUMENT THROUGH JUXTAPOSITION

CORE PHILOSOPHY:
- Show the transformation, problem→solution, or distinction
- Side-by-side comparison as visual ARGUMENT
- Cinematic execution: not generic "before/after" beauty ad
- Editorial approach: thoughtful framing, not infomercial
- Power lies in the CONTRAST between the two

LAYOUT VARIATIONS:
- 50/50 vertical split (left/right)
- 50/50 horizontal split (top/bottom)
- Diagonal split (more dynamic, modern)
- Center column (left + right of central element)
- 3-panel triptych (extended comparison)

LABELING:
- Small labels at top of each side: "BEFORE" / "AFTER",
  "WITH" / "WITHOUT", "OLD" / "NEW", or product names
- Labels: small caps, monospace or condensed sans
- Color coding: optional — "before" desaturated/cool,
  "after" vibrant/warm
- Or: numbered (01 / 02) for neutrality

PHOTOGRAPHY:
- Identical framing for both halves (parallel composition)
- Same lighting style for fair comparison
- Subjects positioned consistently
- Generic products if no user-specific context provided

CINEMATIC TREATMENT:
- Color grade: each side has distinct mood
  - Before: muted, cool tones, slightly underexposed
  - After: vibrant, warm, cinematic
- Or: both sides look beautiful but DIFFERENT in concept
- Optional: subtle grain, film emulation
- Negative space: equal on both sides

TYPOGRAPHY:
- Hero copy: span across both halves OR positioned in negative space
- Modern sans-serif preferred (Söhne, Inter, GT America)
- Hierarchy: Before/After labels small, hero copy larger
- NEVER use real brand names — user context only

VISUAL CONTRAST DEVICES:
- Color temperature shift (cool → warm)
- Tightness of crop (loose → tight)
- Lighting drama (flat → directional)
- Compositional energy (passive → dynamic)
- Or: NO change in style, just subject change (subtle approach)

EDITORIAL POLISH:
- Quality of both halves should be PREMIUM
- Don't make "before" look bad/cheap (editorial is fair)
- Frame consistently for legitimate comparison
- Type can extend across the divider for visual interest

REJECTS:
- Tacky infomercial "miraculous transformation" feel
- Different photo styles between halves (apples to oranges)
- Heavy red arrows pointing at differences
- Cheesy testimonial overlay
- Comic-book exclamation effects

BRAND CONTEXT RULE:
NEVER include real brand names. Generic products in both halves.
If user provides specific product/brand, use ONLY their context.

REFERENCES (spiritual lineage):
- Apple's "before/after" feature comparison shots
- Editorial photography (NYT, Vogue) using diptychs
- Photographic essays in magazines
- Architecture renovation features
- Documentary photography pairs

USE CASE: SaaS feature highlights, product upgrades,
home renovation/interior design, beauty before/afters
(elevated treatment), automotive comparisons, education
comparisons, fitness transformation (editorial style),
software UI improvements`,

  palette: {
    foundation: ['#1A1A1A', '#FFFEF8', '#F5F2EA'],
    primary: ['#A4906E', '#5A5240', '#FFFFFF'],
    accent: ['#7A2424', '#1A4D3E', '#0066CC'],
    forbidden: ['Neon colors for serious comparison'],
  },

  typography: {
    display: ['Söhne', 'Inter Display', 'GT Sectra'],
    body: ['Söhne', 'Inter', 'GT America'],
    accent: ['Söhne Mono', 'JetBrains Mono', 'GT America Mono'],
  },

  references: {
    brands: ['Apple feature comparisons', 'NYT photography essays', 'Architectural Digest'],
    artists: ['Iwan Baan (architectural)', 'Editorial photography teams'],
    eras: ['Documentary photography 2020-2026'],
    works: ['Apple keynote slides', 'Architectural transformation features'],
  },

  moodKeywords: ['analytical', 'editorial', 'cinematic', 'considered', 'thoughtful', 'persuasive', 'documentary'],

  pairsWellWith: ['pro-tech-product-keynote-film', 'pro-tactile-product-hyperreal'],
  forbiddenCombinations: ['pro-acid-graphics-raw', 'pro-y2k-redux-2026'],

  bestForVerticals: ['saas-features', 'home-renovation', 'beauty-skincare', 'automotive', 'education', 'fitness-editorial', 'software-ui'],
  forbiddenForVerticals: ['fashion-streetwear', 'music-rave', 'gaming-casual'],
};

// ═══════════════════════════════════════════════════════════════
// 4. LUXURY SPOTLIGHT PEDESTAL — Product on pedestal
// ═══════════════════════════════════════════════════════════════
const PRO_LUXURY_SPOTLIGHT: StyleDNA = {
  id: 'pro-luxury-spotlight-pedestal',
  archetypeBase: 'documentary-honest',
  name: 'Luxury Spotlight Pedestal',
  tagline: 'The product as artifact. Single light. Reverent silence around it.',
  category: 'photographic',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'luxury spotlight',
    'spotlight luxury',
    'pedestal product',
    'producto pedestal',
    'pedestal aesthetic',
    'estética pedestal',
    'museum display',
    'exhibición museo',
    'gallery product',
    'producto galería',
    'auction style',
    'estilo subasta',
    'sotheby auction',
    'christie auction',
    'product as art',
    'producto como arte',
    'product reverent',
    'producto reverencial',
    'jewelry display',
    'exhibición joyería',
    'watch photography',
    'fotografía de relojes',
    'luxury good photography',
    'fotografía artículo lujo',
    'high jewelry',
    'alta joyería',
    'sculptural product',
    'producto escultural',
  ],

  promptDirective: `LUXURY SPOTLIGHT PEDESTAL — PRODUCT AS ARTIFACT

CORE PHILOSOPHY:
- Treat the product like a museum artifact or auction item
- Single dramatic light source — like in a vault or gallery
- Surrounded by silence/negative space (reverence)
- Perfect technical execution — every reflection intentional
- The product is unquestionably PRECIOUS

LIGHTING:
- ONE primary light source (top-front 45° or top-down spotlight)
- Soft fill very low (1:8 ratio with key light)
- Optional rim light for separation from background
- Falloff dramatic — light fades into darkness around product
- Color temperature: warm (3200K) for jewelry/gold,
  cool (5600K) for steel/tech, neutral for fabric

POSITION:
- Product elevated on simple pedestal/plinth
- Pedestal: minimal stone, polished concrete, dark velvet
- Or: floating against deep background (no pedestal visible)
- Camera angle: eye-level or slightly elevated (looking down respectfully)

BACKGROUND:
- Deep velvet black (#0A0A0A) — most common
- Or: dark gradient (slightly warmer than pure black)
- Or: deep jewel tone (forest green, sapphire blue, burgundy)
- Background goes FULLY out of focus
- Optional: subtle texture (silk, velvet, marble) very dark

PRODUCT TYPES IDEAL:
- Jewelry, watches, perfume bottles
- Crystal, glass, ceramics
- Premium tech (cameras, audio equipment)
- Crafted objects (knives, pens, leather goods)
- Sculptural designs
- Artisan food in elegant vessels

PRODUCT TREATMENT:
- Show texture, material quality (metal, leather, glass)
- Highlights placed precisely (jewelry should sparkle correctly)
- Reflections show studio environment subtly
- Surface NOT over-polished — material character preserved
- Generic products if no user-specific context

TYPOGRAPHY:
- Minimal, refined: thin display serif or modern sans
- GT Sectra Light, Söhne Light, Caslon thin
- Often: small caps with generous tracking
- Position: bottom or top corner, not competing with product
- Single line, never overcrowded
- NEVER use real brand names — user context only

COMPOSITION:
- Product centered or 60/40 off-center
- Massive negative space (60-70% of frame)
- Eye drawn DIRECTLY to product (no competing elements)
- Optional small detail: branded label edge, paired object

COLOR GRADE:
- Deep blacks, rich shadows
- Highlights warm and inviting (gold tones)
- Saturation slightly elevated on key colors only
- No clipping in highlights or shadows

REJECTS:
- Cluttered styling with multiple objects
- Bright/airy backgrounds (must be DARK and reverent)
- Multiple light sources causing complex shadows
- Cartoon/CG rendering (this is REAL photography)
- Distracting environments

BRAND CONTEXT RULE:
NEVER show real brand names visible on products. If product
needs branding visible, use ONLY user-provided brand or
generic placeholder (debossed initials, abstract mark).

REFERENCES (spiritual lineage):
- Sotheby's auction catalog photography
- Christie's catalog photography
- Cartier high jewelry catalogs
- Patek Philippe campaigns
- Hermès objects photography
- Museum gallery photography (the Met, MoMA)
- Wallpaper magazine product features

USE CASE: high-end jewelry, luxury watches, premium fragrance,
artisan products, crystal/glass, premium tech reveals,
collector's items, gallery art objects, premium food/wine,
private banking visual identity`,

  palette: {
    foundation: ['#0A0A0A', '#1A1410', '#2C2820', '#3D342A'],
    primary: ['#D4AF37', '#FFD700', '#C0C0C0', '#A4906E'],
    accent: ['#1A4D3E', '#7A2424', '#0F3460'],
    forbidden: ['Bright/light backgrounds', 'Pastels', 'High-key lighting'],
  },

  typography: {
    display: ['GT Sectra Light', 'Caslon', 'Garamond Light', 'Söhne Light'],
    body: ['Söhne Light', 'GT Sectra', 'Inter Display Light'],
    accent: ['Söhne Mono', 'GT America Mono'],
  },

  references: {
    brands: ['Cartier', 'Patek Philippe', 'Hermès', 'Sotheby\'s', 'Christie\'s'],
    artists: ['Don Penny', 'Tim Walker (when in product mode)', 'Hugo Comte'],
    eras: ['Auction catalog photography (timeless)'],
    works: ['Sotheby\'s catalogs', 'Cartier catalogs'],
  },

  moodKeywords: ['reverent', 'precious', 'crafted', 'timeless', 'sophisticated', 'mysterious', 'auction-worthy', 'sacred'],

  pairsWellWith: ['pro-tactile-product-hyperreal', 'mood-quiet-luxury'],
  forbiddenCombinations: ['pro-acid-graphics-raw', 'pro-y2k-redux-2026', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['jewelry-watches', 'fragrance-luxury', 'fine-art', 'collectibles', 'private-banking', 'premium-tech', 'wine-spirits-luxury'],
  forbiddenForVerticals: ['fast-food', 'kids-toys', 'gaming', 'streetwear-rebel'],
};

// ═══════════════════════════════════════════════════════════════
// 5. TECH PRODUCT KEYNOTE FILM — Apple-style cinematic
// ═══════════════════════════════════════════════════════════════
const PRO_TECH_KEYNOTE: StyleDNA = {
  id: 'pro-tech-product-keynote-film',
  archetypeBase: 'hero-typographic-apple',
  name: 'Tech Product Keynote Film',
  tagline: 'Apple-keynote cinematic. Product orbiting in cinematic space.',
  category: 'photographic',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'tech keynote',
    'keynote tech',
    'apple keynote',
    'estilo apple keynote',
    'product keynote film',
    'producto keynote',
    'tech product cinematic',
    'producto tecnológico cinematográfico',
    'cinematic tech',
    'tecnológico cinematográfico',
    'apple film aesthetic',
    'estética apple film',
    'tesla reveal',
    'tesla keynote',
    'product launch hero',
    'lanzamiento producto hero',
    'tech reveal',
    'revelación tech',
    'iphone reveal',
    'wwdc graphics',
    'samsung unpacked',
    'product cinematic',
    'producto cine',
    'space-age product',
    'tech spotlight',
    'product spotlight tech',
  ],

  promptDirective: `TECH PRODUCT KEYNOTE FILM — APPLE-STYLE CINEMATIC

CORE PHILOSOPHY:
- Hero product floats in cinematic black space
- Single light grace caresses the surface
- Product feels MASSIVE, important, world-changing
- Restrained execution: silent confidence
- Inspired by Apple keynote graphics, Tesla reveals,
  WWDC opening sequences

LIGHTING:
- Dramatic single key light (60° angle)
- Subtle rim light defining product silhouette
- Atmospheric haze (subtle volumetric light)
- Light catches edges, creates rim highlights
- Shadows fall into deep blacks (rich, not flat)

PRODUCT POSITIONING:
- Hero product: 60-70% of frame
- Centered or slight off-center
- Often: 3/4 angle showing form (not flat-on)
- Optional: floating slightly elevated (no visible support)
- Optional: rotating motion blur (very subtle)

BACKGROUND:
- Deep cinematic black or dark gradient
- Subtle environmental hint (vague space dust, light beams)
- No distracting elements
- Optional: distant suggestion of HQ/factory/space

CAMERA TREATMENT:
- Cinematic lens character (anamorphic streaks subtle)
- Slight chromatic aberration on edges
- Film grain very subtle (intentional, not noise)
- Sharp on product, atmospheric depth in space around

TYPOGRAPHY:
- Modern sans: SF Pro, Helvetica Now, Inter Display
- Light to Regular weight (don't compete)
- Often: minimal — single line at bottom or corner
- Tracking: tight (premium tech feel)
- Color: white, soft gold, or product accent color
- NEVER use real brand names — user context only

COLOR GRADE:
- Cinematic teal-and-orange or pure tonal blacks
- Saturation pulled in shadows, lifted in highlights
- Skin tones (if any) gorgeous, slightly warm
- No clipping anywhere — full dynamic range visible

PRODUCT TYPES IDEAL:
- Phones, laptops, headphones, smartwatches
- Cars, motorcycles (parked or motion)
- Game consoles, peripherals
- Premium tech accessories
- Drones, robotics, AI hardware
- Generic placeholders if no specific product

EFFECTS / DETAILS:
- Subtle particles or atmospheric dust
- Light leaks at edges (very controlled)
- Optional: glow emanating from product (LED, screen)
- Reflections on product surface complement environment

REJECTS:
- Cluttered backgrounds
- Bright/airy presentations
- Cartoon 3D rendering
- Multiple competing light sources
- Lifestyle/use-case scenes (this is HERO product alone)
- Stock photography aesthetic

BRAND CONTEXT RULE:
NEVER show real brand names/logos on products. Generic
unbranded device unless user provides specific brand context.
Background environment should be brand-neutral.

REFERENCES (spiritual lineage):
- Apple keynote opening graphics (any iPhone reveal)
- Tesla vehicle reveals (Cybertruck, Model S unveiling)
- Samsung Unpacked event graphics
- Sony PlayStation reveals
- Sennheiser premium product ads
- Bang & Olufsen product launches

USE CASE: tech product launches, automotive reveals,
gaming hardware announcements, premium consumer electronics,
audio equipment, wearables, AI hardware unveilings,
robotics product launches, premium accessories`,

  palette: {
    foundation: ['#000000', '#0A0A0A', '#1A1A2E'],
    primary: ['#FFFFFF', '#C0C0C0', '#D4AF37', '#E5E4E2'],
    accent: ['#FF6F00', '#0066FF', '#00D9FF'],
    forbidden: ['Bright/airy backgrounds', 'Multiple bright colors'],
  },

  typography: {
    display: ['SF Pro Display', 'Helvetica Now Display', 'Inter Display Light'],
    body: ['SF Pro', 'Helvetica Now', 'Inter'],
    accent: ['SF Pro Mono', 'JetBrains Mono'],
  },

  references: {
    brands: ['Apple keynotes', 'Tesla reveals', 'Samsung Unpacked', 'Sony PlayStation'],
    artists: ['Apple Marketing Communications team', 'Tesla design team'],
    eras: ['Tech keynote era 2007-2026', 'Cinematic product reveal era'],
    works: ['iPhone reveals', 'Tesla Cybertruck unveiling', 'WWDC openings'],
  },

  moodKeywords: ['cinematic', 'epic', 'reverent', 'futuristic', 'premium', 'dramatic', 'world-changing', 'silent-confidence'],

  pairsWellWith: ['pro-data-overlay-dashboard', 'pro-luxury-spotlight-pedestal', 'pro-liquid-metal-3d-2026'],
  forbiddenCombinations: ['pro-acid-graphics-raw', 'pro-anti-design-deconstructed', 'design-memphis-80s'],

  bestForVerticals: ['tech-hardware', 'automotive-electric', 'gaming-hardware', 'audio-equipment', 'wearables', 'ai-hardware', 'consumer-electronics-premium'],
  forbiddenForVerticals: ['food-traditional', 'kids-products', 'rural-agriculture', 'fashion-streetwear'],
};

// ═══════════════════════════════════════════════════════════════
// EXPORT — All Pro Design Editorial DNAs
// ═══════════════════════════════════════════════════════════════
export const PRO_DESIGN_EDITORIAL_DNAS: StyleDNA[] = [
  PRO_TYPOGRAPHIC_POSTER,
  PRO_QUOTE_PULL,
  PRO_COMPARISON_SPLIT,
  PRO_LUXURY_SPOTLIGHT,
  PRO_TECH_KEYNOTE,
];
