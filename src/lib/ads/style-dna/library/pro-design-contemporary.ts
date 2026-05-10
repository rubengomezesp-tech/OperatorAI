/**
 * 🌈 STYLE DNA — Pro Design Contemporary (Hyper-Contemporary 2024-2026)
 *
 * 5 DNAs que dominan TikTok, Instagram, X RIGHT NOW.
 * Estéticas que viralizan en 2024-2026 — frescas, jóvenes, viralizables.
 *
 * DNAs incluidos:
 *   1. pro-acid-graphics-raw            — Acid colors saturados raw
 *   2. pro-tactile-product-hyperreal    — Producto físico hyperreal
 *   3. pro-y2k-redux-2026               — Y2K aesthetic 2.0 moderno
 *   4. pro-corporate-illustration       — Illustration corporativa premium
 *   5. pro-mesh-gradient-luminous       — Mesh gradients luminosos
 *
 * BRAND CONTEXT RULES (aplicado a TODOS):
 *   - NEVER include real brand names as visible text in the image
 *   - ONLY use brand text/name from user prompt context
 *   - If no brand context: use neutral placeholders or NO TEXT
 *   - Generic products only, unless user describes specific product
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. ACID GRAPHICS RAW — Saturated raw aesthetic
// ═══════════════════════════════════════════════════════════════
const PRO_ACID_GRAPHICS: StyleDNA = {
  id: 'pro-acid-graphics-raw',
  archetypeBase: 'editorial-magazine',
  name: 'Acid Graphics Raw',
  tagline: 'Burn-the-retina colors. Raw vector graphics. Rave culture meets digital.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'maximalism',
  intensity: 'extreme',

  aliases: [
    'acid graphics',
    'acid design',
    'acid colors',
    'colores ácidos',
    'rave aesthetic',
    'rave graphics',
    'gen z graphics',
    'gen-z aesthetic',
    'tiktok aesthetic',
    'estilo tiktok',
    'electric colors',
    'hot colors',
    'vibrant graphics',
    'saturated graphics',
    'highlighter colors',
    'fluorescent design',
    'fluorescente',
    'eye-popping',
    'maximalist 2026',
    'crash test aesthetic',
    'studio system aesthetic',
    'experimental jetset',
    'street poster aesthetic',
    'rave poster',
    'club flyer',
    'flyer aesthetic',
    'underground rave',
  ],

  promptDirective: `ACID GRAPHICS RAW — SATURATED RAVE-CULTURE DIGITAL

CORE PHILOSOPHY:
- Visual loudness as feature, not bug
- Burn-the-retina saturation — colors at 100% intensity
- Raw vector graphics over realistic photography
- Rave culture energy translated to commercial design
- Gen Z attention economy: stops the scroll IMMEDIATELY

COLOR STRATEGY:
- Hot saturated colors: electric green (#00FF41),
  acid yellow (#FFFF00), hot pink (#FF1493),
  cyan (#00FFFF), neon orange (#FF6600)
- Color CLASHES on purpose: pink + green, orange + cyan
- High-contrast pairings (no muted middle tones)
- Single-color floods with one accent

VISUAL ELEMENTS:
- Bold vector shapes: stars, asterisks, arrows, blobs
- Halftone dot patterns and gradient fills
- Distorted/stretched typography
- Stickers, badges, "limited edition" type marks
- Y2K-adjacent but more modern execution
- Optional: photographic content treated with hard color filters
- Glitch effects, scan lines, posterization on photos

TYPOGRAPHY:
- Display: extreme bold/black weights (Druk Wide, Helvetica Bold,
  custom condensed)
- Stretched, compressed, italicized intentionally
- Mix display weights with monospace details
- Often UPPERCASE, tight tracking
- High-contrast text on color (white on hot pink, etc.)
- NEVER use real brand names — user context only

LAYOUT:
- Energetic asymmetric grid
- Diagonal compositions, rotated elements
- Multiple focal points (controlled chaos)
- Bleed off edges
- Often: large typography hero + smaller graphic accents

PHOTOGRAPHY (if used):
- Heavy color treatment: duotone, posterize, hue shift
- Cropped extremely tight or extreme wide
- Subjects often youth, hands, abstracted body parts
- Or: completely abstract/no photography (pure graphics)

REJECTS:
- Pastels and muted colors
- Photorealistic styling
- Symmetric balance
- Subtle gradients
- "Tasteful" minimalism
- Anything corporate-feeling

BRAND CONTEXT RULE:
NEVER include real brand names. Use ONLY user-provided brand text.
For generic ads: invented short slogans (UNTIL DAWN, NOW LIVE, etc.)
or user-provided copy.

REFERENCES (spiritual lineage):
- 90s rave flyer culture
- Studio System studios
- Experimental Jetset typography
- Crash Test Dummies aesthetic
- Modern social media design (Glossier post-2020 era graphics)
- Music festival posters (Boiler Room, Sónar)
- Telfar campaigns

USE CASE: music festivals, club promoters, streetwear drops,
energy drinks, gaming, gen-z brands, party event promotion,
underground music labels, sneaker drops, youth fashion`,

  palette: {
    foundation: ['#000000', '#FFFFFF', '#0A0A0A'],
    primary: ['#00FF41', '#FFFF00', '#FF1493', '#00FFFF', '#FF6600'],
    accent: ['#FF0000', '#9D00FF', '#FF00FF'],
    forbidden: ['Pastels', 'Earth tones', 'Muted colors', 'Beige'],
  },

  typography: {
    display: ['Druk Wide', 'Helvetica Bold', 'Akzidenz Grotesk Black', 'Custom condensed'],
    body: ['Helvetica', 'Akzidenz Grotesk', 'Inter Bold'],
    accent: ['JetBrains Mono', 'OCR-B'],
  },

  references: {
    brands: ['Telfar', 'Online Ceramics', 'Heaven by Marc Jacobs', 'Boiler Room'],
    artists: ['Studio System', 'Experimental Jetset', 'David Rudnick'],
    eras: ['90s rave culture revival', 'Gen Z graphics 2020-2026'],
    works: ['Berghain flyers', 'Sónar Festival graphics', 'Ray Gun magazine'],
  },

  moodKeywords: ['energetic', 'loud', 'youthful', 'rebellious', 'electric', 'maximalist', 'attention-grabbing', 'rave'],

  pairsWellWith: ['pro-anti-design-deconstructed', 'design-memphis-80s'],
  forbiddenCombinations: ['design-swiss-international', 'pro-luxury-spotlight-pedestal', 'mood-quiet-luxury'],

  bestForVerticals: ['music', 'streetwear', 'gaming', 'energy-drinks', 'youth-fashion', 'club-events', 'sneakers'],
  forbiddenForVerticals: ['private-banking', 'medical', 'luxury-jewelry', 'corporate-b2b'],
};

// ═══════════════════════════════════════════════════════════════
// 2. TACTILE PRODUCT HYPERREAL — Physical product photography
// ═══════════════════════════════════════════════════════════════
const PRO_TACTILE_HYPERREAL: StyleDNA = {
  id: 'pro-tactile-product-hyperreal',
  archetypeBase: 'documentary-honest',
  name: 'Tactile Product Hyperreal',
  tagline: 'You can feel the texture through the screen. Macro detail. Studio light.',
  category: 'photographic',
  era: 'contemporary-2020s',
  movement: 'documentary-realism',
  intensity: 'bold',

  aliases: [
    'tactile product',
    'producto táctil',
    'producto tactil',
    'hyperreal product',
    'hiperreal product',
    'macro product',
    'macro fotografía',
    'macro photography',
    'product close-up',
    'product detail',
    'detalle de producto',
    'texture macro',
    'studio product premium',
    'product photography premium',
    'fotografía de producto premium',
    'still life modern',
    'natura morta moderna',
    'aesop product',
    'le labo aesthetic',
    'glossier product photo',
    'goop aesthetic',
    'editorial product',
    'fotografía editorial producto',
    'tactile beauty',
    'beauty macro',
  ],

  promptDirective: `TACTILE PRODUCT HYPERREAL — MACRO STUDIO PHOTOGRAPHY

CORE PHILOSOPHY:
- The viewer should FEEL the product through the screen
- Texture, surface, material qualities are the heroes
- Macro detail makes ordinary objects extraordinary
- Studio control: every reflection, shadow intentional
- Premium feel through photographic precision (not 3D, REAL)

PHOTOGRAPHIC APPROACH:
- Camera: medium-format aesthetic (Phase One, Hasselblad feel)
- Lens: macro 100mm or product lens, shallow depth of field
- Resolution: ultra-high detail, every grain visible
- Color: accurate, beautifully calibrated, no oversaturation
- Subject typically fills 60-80% of frame

LIGHTING:
- Soft box main light at 45° angle
- Fill light or reflector to control shadows
- Optional rim light for separation from background
- Natural-feeling but controlled studio
- Reveals material properties: matte vs glossy, soft vs hard,
  smooth vs textured

PRODUCT TREATMENT:
- Subject can be: cosmetics, skincare, food ingredients,
  jewelry, fabric, paper, wood, ceramics, glass, liquid
- Show: surface texture, drips, crystals, fibers, materiality
- Optional: water droplets, condensation, oil, flour, etc.
- Position: floating slightly above surface, on material
  background, or against neutral seamless

BACKGROUND:
- Neutral: soft cream, warm grey, deep black, or earth tone
- OR matched material (product on stone, wood, fabric, water)
- Background goes OUT of focus dramatically (f/2.8 to f/4)
- Color complements product without competing

TYPOGRAPHY (when present):
- Minimal, refined: small caps, generous tracking
- Often single line, low in frame, light weight
- Serif for editorial feeling (Caslon, Garamond, GT Sectra)
  or modern sans (Söhne, Inter Display Light)
- NEVER use real brand names — user context only

COLOR GRADE:
- Faithful, slightly warm color palette
- Skin tones gorgeous (if hands/face appear)
- Optional: very subtle film emulation grain
- Highlights ROLL OFF beautifully (no clipping)

COMPOSITION:
- Rule of thirds or center-anchored
- Generous negative space (40-60% of frame)
- Single hero subject (no clutter)
- Optional secondary detail (drop, shadow, complementary item)

REJECTS:
- Cartoon 3D rendering style
- Heavy Photoshop manipulation
- Plastic/over-perfect surfaces (REAL imperfection welcome)
- Cluttered styling with multiple objects
- Bright corporate-flat backgrounds

BRAND CONTEXT RULE:
NEVER show real brand names on products. If product needs labels,
use ONLY user-provided text. If no context: blank labels, abstract
text, or unbranded "concept" presentation.

REFERENCES (spiritual lineage):
- Aesop product photography
- Le Labo brand imagery
- Glossier early product shots
- Goop product photography
- Vogue Beauty editorial product photography
- Wallpaper magazine product features
- Conde Nast Traveler still life work

USE CASE: skincare/cosmetics, premium food, jewelry, watches,
artisanal products, perfume, wellness brands, restaurant menus,
boutique hotels, design objects, premium tea/coffee, candles`,

  palette: {
    foundation: ['#F5F2EA', '#E8E2D5', '#1A1A1A', '#2C2820'],
    primary: ['#A4906E', '#7A6B57', '#3D342A', '#D4C9B8'],
    accent: ['#8B7355', '#C9A87C', '#E5D4B8'],
    forbidden: ['Neon colors', 'Pure RGB primaries', 'Cartoon palettes'],
  },

  typography: {
    display: ['GT Sectra', 'Caslon', 'Garamond', 'Söhne Light'],
    body: ['GT Sectra Display', 'Söhne', 'Inter Display Light'],
    accent: ['Söhne Mono', 'JetBrains Mono Light'],
  },

  references: {
    brands: ['Aesop', 'Le Labo', 'Glossier (early era)', 'Byredo', 'Goop', 'Diptyque'],
    artists: ['Irving Penn', 'Bobby Doherty', 'Janneke van der Hagen'],
    eras: ['Modern still life 2015-2026', 'Premium e-commerce era'],
    works: ['Aesop product catalog', 'Le Labo lookbooks'],
  },

  moodKeywords: ['tactile', 'sensual', 'premium', 'natural', 'crafted', 'sophisticated', 'editorial', 'inviting'],

  pairsWellWith: ['mood-quiet-luxury', 'photo-irving-penn-product'],
  forbiddenCombinations: ['pro-acid-graphics-raw', 'design-memphis-80s'],

  bestForVerticals: ['skincare-beauty', 'luxury-fashion', 'food-premium', 'jewelry', 'watches', 'fragrance', 'wellness'],
  forbiddenForVerticals: ['gaming', 'kids-toys', 'fast-food'],
};

// ═══════════════════════════════════════════════════════════════
// 3. Y2K REDUX 2026 — Y2K aesthetic 2.0
// ═══════════════════════════════════════════════════════════════
const PRO_Y2K_REDUX: StyleDNA = {
  id: 'pro-y2k-redux-2026',
  archetypeBase: 'editorial-magazine',
  name: 'Y2K Redux 2026',
  tagline: 'Late 90s/early 2000s tech optimism. Chrome, blur, shine — but elevated.',
  category: 'mixed-fusion',
  era: 'y2k-millennium',
  movement: 'postmodernism',
  intensity: 'bold',

  aliases: [
    'y2k',
    'y2k aesthetic',
    'y2k 2026',
    'y2k redux',
    '2000s aesthetic',
    'estética 2000',
    'estetica 2000',
    'late 90s',
    'late 1990s',
    'finales de los 90',
    'early 2000s',
    'principios 2000',
    'milennium aesthetic',
    'milenio aesthetic',
    'chrome aesthetic',
    'estética cromada',
    'frutiger aero',
    'frutiger aero modern',
    'tech optimism',
    'optimismo tech',
    'futurism y2k',
    'cybercore',
    'ciber pop',
    'glossy plastic',
    'plástico brillante',
    'lisa frank tech',
    'mac os 9',
    'aqua aesthetic',
    'gel aesthetic',
    'bubble aesthetic',
  ],

  promptDirective: `Y2K REDUX 2026 — TECH OPTIMISM REIMAGINED

CORE PHILOSOPHY:
- Late 1990s/early 2000s aesthetic but ELEVATED
- Original Y2K was naive — Y2K Redux is INTENTIONAL and crafted
- Tech optimism with self-awareness
- Chrome, gloss, blur, "future" feeling — but premium execution
- Where Steve Jobs Aqua era meets contemporary luxury

VISUAL ELEMENTS:
- Chrome surfaces with REFLECTIONS (this is signature)
- Gel/aqua bubble effects (transparent with glossy highlights)
- Lens flares, light leaks, "futuristic" star bursts
- Holographic foil textures
- 3D type effects: chrome, gel, transparent plastic
- Soft blur on backgrounds (Frutiger Aero gradient blur)
- Optional: Wingdings-era icons but CURATED ones

COLOR PALETTE:
- Holographic iridescent (cyan-pink-purple gradient)
- Chrome silver and gold
- Sky blue + grass green (Frutiger Aero)
- Hot pink + electric blue Y2K combo
- White as primary background often (clean sky-feeling)

TYPOGRAPHY:
- Display: 3D rendered type, chrome treatments, transparent gel
- Often italic, condensed, with motion-blur or speed lines
- Custom letterings with star/sparkle accents
- Body: clean modern sans (Helvetica, Inter) — kept clean
- Optional: Comic Sans IRONICALLY (rare, only with intent)
- NEVER use real brand names — user context only

GRAPHIC ELEMENTS:
- Stars and sparkles (4-point bursts)
- Bubble shapes, blob shapes
- Speed lines / motion trails
- Computer mouse cursors / hand pointer icons
- Old web elements: hit counters, "click here", marquees (ironic)
- 3D rendered logos, badges with chrome bevels

PHOTOGRAPHY:
- Heavily retouched (intentional plasticky skin)
- Or: 3D rendered subjects (humans, products as CG)
- Backgrounds: Frutiger Aero (sky + grass + bubbles + clouds)
- Or: chrome-walled studio environments

LAYOUT:
- Center-anchored hero (often)
- Type wraps around or behind subject
- Layered depth: foreground gel + midground subject + background blur
- Generous use of glow and bloom effects

REJECTS:
- Pure minimalism (too clean for this energy)
- Anti-design (this is BUILT, not deconstructed)
- Photo-realistic without CG/retouching
- Earth tones and natural palette
- Modern sans-serif minimalism

BRAND CONTEXT RULE:
NEVER include real brand names. Use placeholder slogans
("THE FUTURE", "ULTRA POP", "MAXIMUM") or user-provided context.

REFERENCES (spiritual lineage):
- Frutiger Aero design movement (2004-2013)
- Apple Aqua interface era (Mac OS X 10.0-10.6)
- Lisa Frank meets tech aesthetic
- Sega Dreamcast packaging
- Gucci Beauty 2020+ campaigns (Y2K revival)
- Skims (Kim K) campaigns
- Charli XCX brat era + tech remix

USE CASE: gen-z fashion, beauty brands targeting youth,
music albums, perfume launches, pop music videos, tech reveals
with playful personality, gaming, anime-inspired brands,
nostalgic-future brands`,

  palette: {
    foundation: ['#FFFFFF', '#E0F0FF', '#FFE0F0'],
    primary: ['#FF1493', '#00CED1', '#7B68EE', '#FFD700'],
    accent: ['#C0C0C0', '#FFC0CB', '#9370DB'],
    forbidden: ['Earth tones', 'Muted neutrals', 'Traditional palette'],
  },

  typography: {
    display: ['Custom Y2K 3D type', 'Italic chrome lettering', 'Eurostile'],
    body: ['Helvetica', 'Inter', 'Tahoma'],
    accent: ['Comic Sans (ironic only)', 'OCR-B', 'Lucida'],
  },

  references: {
    brands: ['Gucci Beauty 2020+', 'Skims campaigns', 'Charli XCX BRAT', 'Versace Y2K'],
    artists: ['David LaChapelle', 'Pierre et Gilles', 'Steven Klein'],
    eras: ['Frutiger Aero 2004-2013', 'Apple Aqua era 2001-2007'],
    works: ['Mac OS X early UI', 'Y2K music videos', 'Lisa Frank designs'],
  },

  moodKeywords: ['optimistic', 'glossy', 'futuristic-nostalgic', 'playful', 'aspirational', 'youthful', 'shimmery', 'chrome'],

  pairsWellWith: ['design-memphis-80s', 'pro-acid-graphics-raw'],
  forbiddenCombinations: ['design-swiss-international', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['gen-z-fashion', 'beauty-fun', 'music-pop', 'gaming-casual', 'perfume-youth', 'pop-culture'],
  forbiddenForVerticals: ['private-banking', 'medical', 'enterprise-software', 'luxury-watches'],
};

// ═══════════════════════════════════════════════════════════════
// 4. CORPORATE ILLUSTRATION EVOLVED — Modern flat illustration
// ═══════════════════════════════════════════════════════════════
const PRO_CORPORATE_ILLUSTRATION: StyleDNA = {
  id: 'pro-corporate-illustration-evolved',
  archetypeBase: 'editorial-magazine',
  name: 'Corporate Illustration Evolved',
  tagline: 'Beyond Corporate Memphis. Editorial illustration meets brand storytelling.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'corporate illustration',
    'illustration corporativa',
    'ilustración corporativa',
    'modern illustration',
    'ilustración moderna',
    'flat illustration',
    'ilustración plana',
    'editorial illustration',
    'ilustración editorial',
    'tech illustration',
    'saas illustration',
    'startup illustration',
    'brand illustration',
    'illustration moderna',
    'character illustration',
    'illustration de personajes',
    'humans of figma',
    'corporate memphis evolved',
    'beyond corporate memphis',
    'duolingo illustration',
    'mailchimp illustration',
    'stripe illustration',
    'notion illustration',
    'magicpen aesthetic',
  ],

  promptDirective: `CORPORATE ILLUSTRATION EVOLVED — EDITORIAL BRAND STORYTELLING

CORE PHILOSOPHY:
- Move BEYOND the flat "Corporate Memphis" cliché
- Illustration with character, texture, and editorial sophistication
- Friendly but not childish, modern but not sterile
- Tells a story or communicates concept, not decoration
- Studio-crafted feel (not template/stock)

ILLUSTRATION STYLE:
- 2D flat with depth: subtle gradients, soft shadows, NOT pure flat
- Hand-drawn quality: imperfect lines, organic shapes
- Texture overlays: paper grain, brush textures, halftone subtle
- Characters (when present): diverse, expressive, slightly stylized
  but with REAL proportions (not Corp Memphis floating limbs)
- Optional: collage elements (photographs + illustrations mixed)

CHARACTER DESIGN (when used):
- Bodies have realistic proportions (NOT Corp Memphis stretched limbs)
- Faces with personality (subtle but expressive)
- Diverse representation natural, not tokenized
- Postures dynamic, interacting with elements
- Skin tones varied and warm

OBJECTS & SCENES:
- Tools, devices, abstractions of work concepts
- Architectural elements stylized
- Nature elements (plants, weather) integrated
- Tech elements (screens, devices) feel current

COLOR PALETTE:
- Editorial palette: 4-6 colors, harmonious
- Mid-tones over pure primary colors
- Warm + cool balance (warm focal + cool support)
- Optional: muted with 1-2 vibrant accents
- Backgrounds often colored (not white) — mood setting

TYPOGRAPHY:
- Modern sans-serif clean (Inter, Söhne, GT America)
- OR editorial serif (GT Sectra, Tiempos, Söhne Schmal)
- Hierarchy: large headline, smaller supporting copy
- Often: typography integrated INTO illustration composition
- NEVER use real brand names — user context only

LAYOUT:
- Hero illustration central or 60/40 with type
- Type breathes around illustration
- Single concept per piece (don't overload)
- Negative space generous

ILLUSTRATION QUALITY MARKERS:
- Hand-drawn linework (1-2px imperfect lines)
- Subtle dimensional shading (drop shadows, soft gradients)
- Personality in every element
- Color combinations feel CURATED
- Texture passes add warmth (not over-rendered)

REJECTS:
- Pure flat Corporate Memphis (floating limbs, one-color outlines)
- Generic stock illustration aesthetic
- Childish cartoon style
- Hyper-detailed digital painting (this is illustration not painting)
- Geometric abstraction without character

BRAND CONTEXT RULE:
NEVER include real brand names. If illustration needs to show
products/UI/screens, use generic concepts unless user provides
specific brand context.

REFERENCES (spiritual lineage):
- Magoz (editorial illustrator)
- Magdalena Pankiewicz
- Eight Hour Day studio
- Jenny Mörtsell
- Bráulio Amado studio
- Modern editorial illustrators (NYT, NYer style)
- Slack, Linear, Notion (post-Corporate Memphis evolution)
- Stripe Illustration system
- Mailchimp brand (evolved beyond Memphis)

USE CASE: SaaS marketing, fintech storytelling,
product feature explainers, editorial brand content,
healthcare brands, education platforms, B2B that needs warmth,
HR tools, workplace culture brands`,

  palette: {
    foundation: ['#F5F1E8', '#FAF6E8', '#1A1A1A'],
    primary: ['#FF6B35', '#004E89', '#F0A04B', '#5C8001'],
    accent: ['#FFAB91', '#80CBC4', '#FFD54F'],
    forbidden: ['Corporate Memphis cyan', 'Stock-illustration-blue'],
  },

  typography: {
    display: ['GT Sectra', 'Söhne', 'Tiempos Headline', 'Inter Display'],
    body: ['Söhne', 'Inter', 'GT America'],
    accent: ['GT America Mono', 'Söhne Mono'],
  },

  references: {
    brands: ['Notion', 'Linear', 'Stripe', 'Slack (modern era)', 'Headspace'],
    artists: ['Magoz', 'Bráulio Amado', 'Jenny Mörtsell', 'Magdalena Pankiewicz'],
    eras: ['Editorial illustration revival 2020-2026'],
    works: ['NYT Op-Ed illustrations', 'Stripe brand site illustrations'],
  },

  moodKeywords: ['friendly', 'editorial', 'warm', 'crafted', 'narrative', 'expressive', 'modern', 'human'],

  pairsWellWith: ['mood-warm-friendly', 'pro-magazine-collage-digital'],
  forbiddenCombinations: ['pro-anti-design-deconstructed', 'pro-acid-graphics-raw'],

  bestForVerticals: ['saas', 'fintech', 'edtech', 'healthcare', 'workplace-tools', 'b2b', 'productivity'],
  forbiddenForVerticals: ['luxury-fashion', 'private-banking-formal', 'fine-jewelry'],
};

// ═══════════════════════════════════════════════════════════════
// 5. MESH GRADIENT LUMINOUS — Luminous gradients
// ═══════════════════════════════════════════════════════════════
const PRO_MESH_GRADIENT: StyleDNA = {
  id: 'pro-mesh-gradient-luminous',
  archetypeBase: 'hero-typographic-apple',
  name: 'Mesh Gradient Luminous',
  tagline: 'Pure light made of color. Smooth gradients as primary visual.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'mesh gradient',
    'mesh gradients',
    'gradient mesh',
    'gradiente mesh',
    'luminous gradient',
    'gradiente luminoso',
    'aurora gradient',
    'gradiente aurora',
    'fluid gradient',
    'gradiente fluido',
    'gradient blur',
    'gradient soft',
    'gradiente suave',
    'gradient ambient',
    'spotify gradient',
    'apple gradient',
    'stripe gradient',
    'figma gradient',
    'linear app gradient',
    'aesthetic gradient',
    'modern gradient',
    'colorful background',
    'fondo de gradiente',
    'gradient hero',
    'gradient luminous',
    'silk gradient',
    'glow gradient',
    'soft glow background',
  ],

  promptDirective: `MESH GRADIENT LUMINOUS — PURE LIGHT MADE OF COLOR

CORE PHILOSOPHY:
- Color gradients as primary visual — not background filler
- Smooth transitions between 2-5 hues
- Feel like LIGHT, not paint
- No hard edges between colors — fluid blending
- Backgrounds and foregrounds dissolve into each other

GRADIENT TECHNIQUES:
- Mesh gradient: organic blob-shapes blending (Apple-style)
- Linear with multiple stops (3-5 colors flowing)
- Radial: light source at one corner, soft fall-off
- Conic: revolving around a point
- All HEAVILY blurred (gaussian) for ethereal feel

COLOR HARMONIES:
- Sunrise: peach + pink + lavender + coral
- Aurora borealis: green + cyan + purple + pink
- Underwater: teal + blue + dark navy + light blue
- Sunset: orange + magenta + deep purple + gold
- Dream: lavender + soft pink + warm white + gold
- Tech: deep purple + electric blue + cyan + soft pink

COMPOSITION:
- Hero element (product, person, type) on gradient background
- Element should be relatively simple — gradient is the star
- Optional: gradient OVERLAYS subject partially (light leak feel)
- Composition: center-anchored or 60/40 off-balance

VISUAL ELEMENTS:
- Subtle particles or light orbs (very faint, scattered)
- Optional grain texture (brings organic quality)
- Optional glass element (frosted) layered on gradient
- Subject (if any): can be silhouetted, illuminated by gradient
- Type: minimal, often white or single accent color

TYPOGRAPHY:
- Display: modern sans (Inter Display Light, Söhne Light)
- Light or Regular weight (don't compete with gradient softness)
- Generous tracking, often centered
- White or pure black for contrast on gradient
- NEVER use real brand names — user context only

LIGHTING/MOOD:
- Diffused, soft, ethereal
- "Glow from within" feeling
- Optional: light leak / lens flare element
- Highlights bloom softly

PRODUCT TREATMENT (if applicable):
- Product appears to FLOAT in colored light
- Surface reflects gradient colors
- Soft shadow underneath, complementary color

REJECTS:
- Hard color blocks
- Photorealistic backgrounds
- Heavy textures (gradients are SMOOTH)
- More than 5 colors in one gradient
- Overly saturated electric colors (this is SOFT light)

BRAND CONTEXT RULE:
NEVER include real brand names. Use ONLY user-provided text.
Default to no text if no context — pure visual gradient piece.

REFERENCES (spiritual lineage):
- Apple iOS lock screen wallpapers (post-iOS 14)
- Stripe.com homepage gradients (signature)
- Spotify Wrapped 2020-2026 design
- Figma marketing site gradients
- Linear app brand gradients
- Vercel marketing aesthetic

USE CASE: SaaS announcements, music streaming campaigns,
beauty/wellness brands, AI product reveals, tech feature launches,
crypto/web3 elegant variants, mindfulness apps,
album cover-adjacent designs, dream/lifestyle brands`,

  palette: {
    foundation: ['Various - depends on gradient choice'],
    primary: ['#FF6B9D', '#7B68EE', '#4ECDC4', '#FFD700', '#FF8C42'],
    accent: ['#FFFFFF', '#000000', '#1A1A2E'],
    forbidden: ['Hard color blocks', 'Pure black or white solid backgrounds'],
  },

  typography: {
    display: ['Inter Display Light', 'Söhne Light', 'GT America Light'],
    body: ['Inter', 'Söhne', 'SF Pro'],
    accent: ['JetBrains Mono Light', 'Söhne Mono'],
  },

  references: {
    brands: ['Stripe.com homepage', 'Spotify Wrapped', 'Apple iOS wallpapers', 'Linear', 'Figma'],
    artists: ['James Turrell (light-based art inspiration)', 'Apple Human Interface Team'],
    eras: ['Mesh gradient era 2020-2026'],
    works: ['iOS 14+ lock screens', 'Stripe homepage 2018-2026'],
  },

  moodKeywords: ['ethereal', 'luminous', 'dreamy', 'soft', 'modern', 'aspirational', 'calming', 'tech-poetic'],

  pairsWellWith: ['pro-glassmorphism-frosted', 'mood-quiet-luxury'],
  forbiddenCombinations: ['pro-anti-design-deconstructed', 'pro-acid-graphics-raw'],

  bestForVerticals: ['saas', 'beauty-clean', 'music-streaming', 'wellness', 'ai-products', 'lifestyle-brands', 'crypto-elegant'],
  forbiddenForVerticals: ['streetwear-rebel', 'heavy-machinery', 'rural-agriculture'],
};

// ═══════════════════════════════════════════════════════════════
// EXPORT — All Pro Design Contemporary DNAs
// ═══════════════════════════════════════════════════════════════
export const PRO_DESIGN_CONTEMPORARY_DNAS: StyleDNA[] = [
  PRO_ACID_GRAPHICS,
  PRO_TACTILE_HYPERREAL,
  PRO_Y2K_REDUX,
  PRO_CORPORATE_ILLUSTRATION,
  PRO_MESH_GRADIENT,
];
