/**
 * 🎨 STYLE DNA — Pro Design Modern (Digital-Native 2026)
 *
 * 5 DNAs ULTRA-CONTEMPORÁNEOS que dominan el discurso visual 2024-2026.
 * Formatos que NO existían hace 5 años, democratizados por Octane,
 * Cinema 4D, Figma, y la cultura visual de Instagram/X.
 *
 * DNAs incluidos:
 *   1. pro-liquid-metal-3d-2026         — 3D liquid renders Octane premium
 *   2. pro-glassmorphism-frosted        — Frosted glass UI premium
 *   3. pro-anti-design-deconstructed    — Caos controlado moderno
 *   4. pro-magazine-collage-digital     — Editorial collage 2026
 *   5. pro-data-overlay-dashboard       — UI overlays + data viz
 *
 * BRAND CONTEXT RULES (aplicado a TODOS):
 *   - NEVER include real brand names as visible text in the image
 *   - ONLY use brand text/name from user prompt context
 *   - If no brand context: use neutral placeholders or NO TEXT
 *   - Generic products only, unless user describes specific product
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. LIQUID METAL 3D 2026 — Octane-style premium renders
// ═══════════════════════════════════════════════════════════════
const PRO_LIQUID_METAL_3D: StyleDNA = {
  id: 'pro-liquid-metal-3d-2026',
  archetypeBase: 'hero-typographic-apple',
  name: 'Liquid Metal 3D — Octane Premium',
  tagline: 'Molten chrome and dripping gold. Ray-traced luxury rendered in 3D.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'liquid-metal',
    'liquid metal 3d',
    'metal líquido',
    'metal liquido 3d',
    'octane render',
    'octane-render',
    'cinema 4d render',
    'c4d render',
    'cromado líquido',
    'cromado liquido',
    'dripping gold',
    'oro fundido',
    'molten gold',
    'molten metal',
    '3d melting',
    '3d melt',
    'premium product render',
    'hyperreal metal',
    'chrome render',
    'mercurial silver',
    'liquid chrome',
    'fluid metal',
    'beeple style',
    'beeple-style',
    'render premium 3d',
    'producto 3d cromado',
  ],

  promptDirective: `LIQUID METAL 3D RENDER — OCTANE/CINEMA 4D PREMIUM AESTHETIC

LIGHTING:
- HDR studio environment with 1-2 dramatic light sources
- Strong rim light (45° back) + key light (front-top) + low fill
- Ray-traced reflections — surfaces MIRROR the environment
- Caustics and refraction visible on liquid surfaces

MATERIALS:
- Hyperreal liquid chrome, molten gold, mercurial silver
- Iridescent holographic finishes (subtle, premium)
- Surface tension visible (dripping, morphing, flowing)
- Materials behave like real fluid metal — surface tension,
  controlled drips, viscous flow patterns

TYPOGRAPHY (if any text):
- Sans-serif modern, minimal: Helvetica Now, Söhne, Inter Display
- Light/Regular weight, generous tracking
- Position: minimal, often single line bottom or corner
- NEVER include real brand names — use ONLY user-provided text

COMPOSITION:
- Hero subject centered or 60/40 off-center
- Liquid metal flowing AROUND, ENVELOPING, or EMERGING from subject
- Background: black absolute (#000), gradient mesh dark, or studio sweep
- Negative space: 60-70% of frame
- Camera angle: slight low angle (hero) or eye-level product shot

COLOR GRADE:
- High contrast: deep blacks (#0A0A0A) + bright metallic highlights
- Color tints in metal: warm gold tones, cool silver, or chromatic
- NO desaturation — metals are vivid and reflective
- Optional accent: single color light (red, blue, magenta) for drama

REJECTS:
- Flat 2D illustration aesthetic
- Cartoon 3D (Disney-style)
- Low-poly or stylized renders
- Matte finishes (this is HIGHLY POLISHED)
- Multiple competing focal points

BRAND CONTEXT RULE:
NEVER write real brand names (Nike, Apple, etc.) in the image.
Use ONLY brand text from user prompt. If no context provided,
use neutral placeholders (PREMIUM, NEW, EXCLUSIVE) or NO TEXT.

REFERENCES (spiritual lineage, NOT for visual copying):
- Beeple "Everydays" 3D maestro contemporáneo
- Matt Tanner Cinema 4D commercial work
- Apple WWDC 2023+ keynote graphics
- Pentagram product reveals
- Off-White product campaigns aesthetic

USE CASE: luxury skincare, perfume reveals, tech product launches,
NFT/crypto brand campaigns, premium SaaS tier announcements`,

  palette: {
    foundation: ['#000000', '#0A0A0A', '#1A1A1A'],
    primary: ['#D4AF37', '#FFD700', '#C0C0C0', '#E5E4E2'],
    accent: ['#FFE89C', '#8B6914', '#A0A0FF'],
    forbidden: ['#FF6B9D', '#FFB8CC', '#FFD1DC'],
  },

  typography: {
    display: ['Helvetica Now Display', 'Söhne', 'Inter Display'],
    body: ['Helvetica Now', 'Söhne', 'Inter'],
    accent: ['JetBrains Mono', 'GT America Mono'],
  },

  references: {
    brands: ['Apple keynotes', 'Off-White', 'Nike Air Max launches', 'Glossier Play'],
    artists: ['Beeple (Mike Winkelmann)', 'Matt Tanner', 'Refik Anadol'],
    eras: ['3D Renaissance 2020-2026', 'Contemporary commercial 3D'],
    works: ['Apple WWDC graphics', 'Tools for Humanity brand identity'],
  },

  moodKeywords: ['luxurious', 'futuristic', 'premium', 'morphing', 'cinematic', 'dripping', 'reflective', 'dramatic'],

  pairsWellWith: ['mood-luxury-quiet', 'brand-apple-minimalism'],
  forbiddenCombinations: ['design-memphis-80s', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['tech-saas', 'beauty-luxury', 'fashion-luxury', 'crypto-web3', 'jewelry-watches'],
  forbiddenForVerticals: ['food-fast', 'kids-toys', 'pets'],
};

// ═══════════════════════════════════════════════════════════════
// 2. GLASSMORPHISM FROSTED — Premium UI aesthetic
// ═══════════════════════════════════════════════════════════════
const PRO_GLASSMORPHISM: StyleDNA = {
  id: 'pro-glassmorphism-frosted',
  archetypeBase: 'hero-typographic-apple',
  name: 'Glassmorphism Frosted Pro',
  tagline: 'Frosted glass cards floating on color. macOS Big Sur era refined.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'glassmorphism',
    'frosted glass',
    'cristal frosted',
    'cristal esmerilado',
    'glass effect',
    'glass-morphism',
    'frosted ui',
    'macos big sur',
    'macos style',
    'apple glass',
    'liquid glass',
    'translucent glass',
    'transparent glass ui',
    'ui premium',
    'premium ui design',
    'iphone-style ui',
    'ios glass',
    'fluent design',
    'visionos style',
    'apple vision pro',
    'cristal premium',
    'efecto cristal',
    'transparencia premium',
    'glass overlay',
    'blurred glass',
    'aero glass',
  ],

  promptDirective: `GLASSMORPHISM FROSTED PREMIUM UI AESTHETIC

CORE TECHNIQUE:
- Translucent frosted glass surfaces (50-80% opacity)
- Heavy gaussian blur on backgrounds visible THROUGH glass
- Subtle white/light borders (1-2px, 30% opacity)
- Soft drop shadows (long, low opacity)
- Layered depth: glass cards float ABOVE colored backgrounds

BACKGROUND:
- Vibrant gradient mesh (purple/pink/blue or warm sunset tones)
- OR organic shapes/blobs in soft pastels (HEAVILY blurred)
- OR photo background (HEAVILY blurred behind glass)
- The blur is what makes the glass effect READ visually

GLASS ELEMENTS:
- Cards, buttons, panels with frosted appearance
- Stack 2-3 glass layers for depth
- Light source from top-left causes subtle shimmer on edges
- Optional: tiny noise/grain texture INSIDE glass (organic feel)

TYPOGRAPHY:
- SF Pro, Inter, or system stack — modern sans-serif
- High contrast against glass: usually dark on light or vice versa
- Body text 16-18px, headlines 32-72px, weights Light/Regular/Semibold
- NEVER use real brand names — only user context

COMPOSITION:
- Center-anchored or grid-based UI layout
- Hero element (product, headline, dashboard) on glass card
- Negative space breathable (50%+ of frame)
- Optional small UI elements (badges, progress bars) on glass

COLOR GRADE:
- Vibrant background colors (saturated)
- Glass softens and desaturates 30-40%
- Light, airy, premium feeling
- Light source highlights edges of glass elements

REJECTS:
- Heavy shadows or 3D extrusion (this is FLAT depth)
- Skeumorphism (no faux materials beyond glass)
- Sharp solid borders without blur
- Dark/heavy overall mood (glass is OPTIMISTIC)

BRAND CONTEXT RULE:
NEVER include real brand names. Use ONLY user-provided brand text.
If no context: use neutral UI labels (HOME, NEW, FEATURED) or no text.

REFERENCES (spiritual lineage):
- macOS Big Sur (2020) introduced this widely
- Apple Vision Pro / visionOS UI
- Frosted glass on iOS
- Microsoft Fluent Design System
- Various Dribbble UI design 2021-2026

USE CASE: SaaS dashboards, app reveals, premium tech UI mockups,
fintech apps, productivity tools, modern web app launches`,

  palette: {
    foundation: ['#FAFAFA', '#F0F4FF', '#FFE8F0'],
    primary: ['#7B61FF', '#FF6B9D', '#4ECDC4', '#FFB347'],
    accent: ['#FFFFFF', '#000000', '#1A1A2E'],
    forbidden: ['#000000 backgrounds', 'pure black'],
  },

  typography: {
    display: ['SF Pro Display', 'Inter Display', 'Söhne'],
    body: ['SF Pro Text', 'Inter', 'Helvetica Neue'],
    accent: ['SF Pro Rounded', 'Inter'],
  },

  references: {
    brands: ['Apple macOS Big Sur', 'Apple Vision Pro', 'Notion', 'Linear', 'Arc Browser'],
    artists: ['Apple Human Interface Team', 'Linear design team'],
    eras: ['Post-2020 UI design', 'Apple Vision era 2024+'],
    works: ['macOS Big Sur, Sonoma', 'visionOS', 'iOS 7-17 evolution'],
  },

  moodKeywords: ['premium', 'translucent', 'modern', 'optimistic', 'tech-forward', 'airy', 'breathable', 'refined'],

  pairsWellWith: ['mood-quiet-luxury', 'brand-apple-minimalism'],
  forbiddenCombinations: ['design-brutalism', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['tech-saas', 'fintech', 'productivity', 'app-launches', 'web3'],
  forbiddenForVerticals: ['heavy-machinery', 'food-rustic', 'farming'],
};

// ═══════════════════════════════════════════════════════════════
// 3. ANTI-DESIGN DECONSTRUCTED — Caos controlado moderno
// ═══════════════════════════════════════════════════════════════
const PRO_ANTI_DESIGN: StyleDNA = {
  id: 'pro-anti-design-deconstructed',
  archetypeBase: 'editorial-magazine',
  name: 'Anti-Design Deconstructed',
  tagline: 'Intentional ugly. Broken grid. Default fonts as rebellion.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'deconstructivism',
  intensity: 'extreme',

  aliases: [
    'anti-design',
    'anti design',
    'deconstructed',
    'deconstructivism',
    'broken grid',
    'ugly design',
    'intentionally ugly',
    'feo a propósito',
    'feo intencional',
    'rebel design',
    'punk design',
    'raw design',
    'unpolished',
    'crudo',
    'desafiante',
    'crash baggage style',
    'mschf style',
    'demna gvasalia',
    'balenciaga aesthetic',
    'vetements aesthetic',
    'web brutalism',
    'web brutalismo',
    'glitch aesthetic',
    'broken layout',
  ],

  promptDirective: `ANTI-DESIGN DECONSTRUCTED — INTENTIONAL CHAOS AESTHETIC

CORE PHILOSOPHY:
- Reject "clean" design conventions deliberately
- Embrace asymmetry, broken grids, mixed fonts, raw textures
- Look "wrong" but feel intentional — every break is calculated
- Aesthetic of refusal: refuse polish, refuse harmony, refuse minimalism
- Intelligence is in WHAT you break, not random chaos

LAYOUT:
- Broken grid: elements off-aligned, overlapping unexpectedly
- Text rotated at odd angles (-7°, 13°, 22°)
- Multiple typography systems collide (sans + serif + mono together)
- Elements bleed off-edges, partially cropped intentionally
- Negative space used UNCONVENTIONALLY (right-aligned, off-balance)

TYPOGRAPHY:
- Mix DEFAULT system fonts (Times New Roman, Arial, Courier)
  with high-end ones for jarring contrast
- Inconsistent sizing on purpose (tiny, huge, tiny again)
- Underlines, strikethroughs, brackets, asterisks as decoration
- Text wraps awkwardly — ragged, no justification
- Mixed cases: ALL CAPS + lowercase + Sentence Case in same block
- NEVER use real brand names — user context only

VISUAL ELEMENTS:
- Found imagery treatment: photocopier glitch, scan lines, fax effects
- Crooked photos, misregistered colors (CMYK fail), torn paper
- Hand-drawn marks, scribbles, arrows pointing nowhere
- Color blocks at unexpected angles
- Photographic content: low-res, oversaturated, or HIGH-CONTRAST B&W

COLOR GRADE:
- Aggressive contrast or aggressive flatness (no middle)
- Default web colors: blue links (#0000EE), red errors (#FF0000)
- Acid greens, hot pinks, alongside grays
- Or extreme: only black + white + 1 jarring accent

COMPOSITION:
- No clear focal point OR multiple competing ones
- Hero element NOT centered
- Information hierarchy intentionally confused
- White space inconsistent (cramped here, vast there)

REJECTS:
- Symmetry, balance, harmony
- Beautiful typography pairings
- Polished retouching
- Predictable grid systems
- "Tastefulness"

BRAND CONTEXT RULE:
Even in chaos, NEVER include real brand names not provided by user.
Use placeholder text or generic concepts. Brand context comes from
user prompt only.

REFERENCES (spiritual lineage):
- Demna Gvasalia at Balenciaga / Vetements
- MSCHF projects and drops
- Web brutalism movement
- David Carson (Ray Gun magazine)
- Crash Baggage brand identity
- Dazed magazine experimental issues

USE CASE: streetwear drops, music album campaigns, art events,
fashion subculture, NFT/web3 anti-establishment, youth brands,
provocative manifestos`,

  palette: {
    foundation: ['#FFFFFF', '#000000', '#F0F0F0'],
    primary: ['#0000EE', '#FF0000', '#00FF00', '#FFFF00'],
    accent: ['#FF1493', '#00FFFF', '#FF00FF'],
    forbidden: ['Pastels', 'Soft gradients', 'Earth tones'],
  },

  typography: {
    display: ['Times New Roman', 'Arial Black', 'Comic Sans (ironic)', 'Impact'],
    body: ['Courier', 'Times', 'Arial', 'Helvetica'],
    accent: ['Wingdings', 'Hand-drawn marks', 'System default'],
  },

  references: {
    brands: ['Balenciaga', 'Vetements', 'MSCHF', 'Crash Baggage', 'Heaven by Marc Jacobs'],
    artists: ['David Carson', 'Demna Gvasalia', 'Wolfgang Tillmans', 'Jonny Lu'],
    eras: ['Post-irony 2020-2026', 'Web brutalism revival'],
    works: ['Ray Gun magazine', 'Balenciaga FW21+ campaigns'],
  },

  moodKeywords: ['rebellious', 'raw', 'unpolished', 'provocative', 'ironic', 'refusing', 'ugly-beautiful', 'jarring'],

  pairsWellWith: ['mood-grunge-90s', 'design-punk-zine'],
  forbiddenCombinations: ['pro-glassmorphism-frosted', 'pro-luxury-spotlight-pedestal', 'design-swiss-international'],

  bestForVerticals: ['streetwear', 'music', 'art-galleries', 'subculture-fashion', 'web3-rebel'],
  forbiddenForVerticals: ['luxury-jewelry', 'private-banking', 'medical', 'corporate-b2b'],
};

// ═══════════════════════════════════════════════════════════════
// 4. MAGAZINE COLLAGE DIGITAL — Editorial collage 2026
// ═══════════════════════════════════════════════════════════════
const PRO_MAGAZINE_COLLAGE: StyleDNA = {
  id: 'pro-magazine-collage-digital',
  archetypeBase: 'editorial-magazine',
  name: 'Magazine Collage Digital 2026',
  tagline: 'Cut-paste editorial in pixels. Layered photo + type + texture.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'postmodernism',
  intensity: 'bold',

  aliases: [
    'magazine collage',
    'collage editorial',
    'collage digital',
    'photo collage',
    'cut-paste',
    'cut paste',
    'recortes editorial',
    'collage pop',
    'mixed media',
    'multimedia collage',
    'instagram collage',
    'collage instagram',
    'editorial moodboard',
    'moodboard',
    'moodboard editorial',
    'tear-out aesthetic',
    'magazine clippings',
    'recortes de revista',
    'clipart aesthetic',
    'analog digital mix',
    'paper texture digital',
    'digital scrapbook',
    'aesthetic scrapbook',
    'tumblr collage',
    'pinterest aesthetic',
  ],

  promptDirective: `MAGAZINE COLLAGE DIGITAL — EDITORIAL CUT-PASTE AESTHETIC

CORE TECHNIQUE:
- Layered composition: 4-7 distinct visual elements overlapping
- Mix of: photographs (cropped/cut-out), typography, textures,
  illustrations, color blocks, hand-drawn marks
- Each element has visible "edges" — like physical cut paper
- Tactile feeling despite being digital
- Slight rotation on elements (-5° to 8°) for organic feel

VISUAL ELEMENTS LAYERED:
- Hero photograph (cropped tight, often close-up portrait or product)
- Secondary photos (smaller, supporting context)
- Bold typography (often large headlines, mixed with smaller copy)
- Texture layers: paper grain, halftone, scan lines, ink stains
- Color blocks (rectangles, circles) as visual anchors
- Decorative marks: arrows, asterisks, hand-drawn lines, numbers

PHOTOGRAPHY TREATMENT:
- High contrast, slightly oversaturated
- Mix of color photos and B&W
- Some images have visible "cutout" edges (white border with shadow)
- Some images bleed off-frame intentionally

TYPOGRAPHY:
- Mix 2-3 type families intentionally
- Display headlines: condensed bold sans (Impact, Druk, Helvetica Bold)
- Editorial body: serif (Times, Caslon)
- Accent text: monospace or hand-drawn
- Some text rotated, some justified, some ragged
- NEVER use real brand names — only user context

COMPOSITION:
- Asymmetric, energetic, non-linear hierarchy
- Multiple focal points pull eye through layout
- Negative space used selectively (some areas dense, some sparse)
- "Designed mess" — chaotic but intentional

COLOR GRADE:
- Saturated brand colors as accents
- Photo realism on hero images (not stylized)
- Texture overlays add warmth/grit
- Optional: split-tone color (cyan shadows, orange highlights)

REJECTS:
- Single clean photo with text overlay (THIS IS NOT THAT)
- Symmetric grids
- Single typeface throughout
- Polished gradients (this is TACTILE not digital-clean)
- Clip-art clichés (this is EDITORIAL not Pinterest beginner)

BRAND CONTEXT RULE:
NEVER include real brand names. Photographs should be generic
(no visible logos on products). Use ONLY user-provided brand text.

REFERENCES (spiritual lineage):
- i-D magazine editorial layouts
- Dazed & Confused magazine spreads
- Wolfgang Tillmans installations
- The Gentlewoman magazine
- MM Paris studio editorial design
- Tyler Mitchell photo editorial layouts

USE CASE: fashion editorial campaigns, music album promotions,
art gallery openings, magazine launches, lifestyle brand storytelling,
youth culture brands, creative agency portfolios`,

  palette: {
    foundation: ['#FFFEF8', '#F5F2EA', '#1A1A1A'],
    primary: ['#FF4136', '#FFD700', '#0074D9', '#2ECC40'],
    accent: ['#B10DC9', '#FF851B', '#7FDBFF'],
    forbidden: ['Pastel-only schemes', 'Ultra-clean digital'],
  },

  typography: {
    display: ['Druk', 'Helvetica Black', 'Impact', 'Akzidenz Grotesk'],
    body: ['Times New Roman', 'GT Sectra', 'Caslon'],
    accent: ['Courier', 'JetBrains Mono', 'Hand-drawn marks'],
  },

  references: {
    brands: ['i-D Magazine', 'Dazed', 'The Gentlewoman', 'Self Service'],
    artists: ['Wolfgang Tillmans', 'Tyler Mitchell', 'M/M Paris', 'Peter Saville'],
    eras: ['Magazine editorial 1990s revival', 'Collage 2020-2026'],
    works: ['Dazed Vol IV', 'i-D late 2010s editorial'],
  },

  moodKeywords: ['editorial', 'tactile', 'layered', 'energetic', 'cultured', 'youth', 'eclectic', 'curated-chaos'],

  pairsWellWith: ['photo-editorial-fashion', 'mood-grunge-90s'],
  forbiddenCombinations: ['design-swiss-international', 'pro-glassmorphism-frosted'],

  bestForVerticals: ['fashion-editorial', 'music', 'magazines', 'art-galleries', 'lifestyle', 'youth-culture'],
  forbiddenForVerticals: ['enterprise-software', 'medical', 'banking-traditional'],
};

// ═══════════════════════════════════════════════════════════════
// 5. DATA OVERLAY DASHBOARD — UI overlays + data viz
// ═══════════════════════════════════════════════════════════════
const PRO_DATA_OVERLAY: StyleDNA = {
  id: 'pro-data-overlay-dashboard',
  archetypeBase: 'hero-typographic-apple',
  name: 'Data Overlay Dashboard',
  tagline: 'Charts, metrics, HUD elements layered on imagery. Numbers as story.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'data overlay',
    'data viz',
    'data visualization',
    'visualización datos',
    'dashboard ad',
    'dashboard aesthetic',
    'metrics overlay',
    'numbers overlay',
    'hud overlay',
    'hud aesthetic',
    'tech overlay',
    'graficas overlay',
    'graphs overlay',
    'analytics aesthetic',
    'estilo analytics',
    'figma overlay',
    'figma data',
    'mockup dashboard',
    'sci-fi hud',
    'minority report',
    'cyberpunk ui',
    'tactical hud',
    'fintech dashboard',
    'saas dashboard ad',
    'product dashboard hero',
    'feature highlight',
    'ai feature ad',
  ],

  promptDirective: `DATA OVERLAY DASHBOARD — UI + DATA VIZ + IMAGERY

CORE TECHNIQUE:
- Hero photograph or 3D render as background (50-70% of frame)
- UI elements ANNOTATE/OVERLAY the imagery as if "scanning" reality
- Charts, metrics, KPI cards, progress bars layered as data viz
- Connection lines between data points and image features
- Translucent panels with monospace data + sans-serif labels

LAYOUT:
- Background: photographic (product, person, scene) or clean abstract
- Foreground: 3-7 UI cards/elements positioned strategically
- UI elements connect to image with thin lines (1-2px)
- Bottom or side panels for "data feed" with live metrics
- Top corner: status/timestamp/coordinates monospace

UI ELEMENTS:
- Translucent rounded rectangles (rgba black 60-80% opacity)
  with thin colored borders (1-2px)
- Data labels in monospace: numbers, percentages, codes
- Progress bars, mini charts (line, bar, donut), meters
- Tags/pills with status (ACTIVE, LIVE, +12%, -3.2%)
- Coordinate-style labels (X: 240, Y: 480)
- Optional crosshairs or scan-frame overlays

TYPOGRAPHY:
- Body/data: monospace (JetBrains Mono, IBM Plex Mono, GT America Mono)
- Headlines: Inter, Söhne (modern sans, weight 500-700)
- Numbers: tabular figures, clear hierarchy
- Color: high-contrast white or accent colors on dark UI panels
- NEVER use real brand names — user context only

DATA STYLING:
- Use neutral or fictional metrics if no user data provided
- "+247%", "ACTIVE", "$24.8K", "98.7% accuracy" — feel real
- Numbers should look REAL but be GENERIC unless user provides data
- Don't use real company stock prices, real metrics

COLOR GRADE:
- Background imagery: cinematic color grade (teal/orange or moody)
- UI elements: dark translucent + 1 accent color
  (cyan #00FFE0, mint green #00D9A3, electric blue #0066FF, or amber)
- Optional: glow/light leaks on accent elements

COMPOSITION:
- Hero subject (product/person/scene) is centered or 60/40
- UI elements distributed AROUND subject (frame the action)
- Don't crowd center — UI orbits the hero
- Strong visual hierarchy: subject → primary metric → supporting data

REJECTS:
- Cluttered UI without breathing room
- Childish or game-like UI elements
- Too many colors (max 2-3 accent colors)
- Realistic logos of real apps (Figma, Notion, etc.)

BRAND CONTEXT RULE:
NEVER include real brand names or real app logos in UI.
Use generic UI labels (DASHBOARD, METRICS, ANALYTICS) or
ONLY user-provided brand context.

REFERENCES (spiritual lineage):
- Apple announcements with feature callouts
- Tesla vehicle reveals with stat overlays
- Sci-fi film HUDs (Minority Report, Iron Man, Westworld)
- Linear app design system aesthetic
- Vercel marketing site approach
- Bloomberg Terminal aesthetic refined

USE CASE: SaaS feature launches, AI product reveals, fintech ads,
analytics tools, sports performance brands, automotive tech,
crypto/web3 dashboards, productivity tool campaigns`,

  palette: {
    foundation: ['#0A0A0F', '#12121A', '#1A1A2E'],
    primary: ['#FFFFFF', '#00FFE0', '#0066FF', '#00D9A3'],
    accent: ['#FFA500', '#FF3366', '#A855F7'],
    forbidden: ['Pastels for UI', 'Hand-drawn elements'],
  },

  typography: {
    display: ['Inter Display', 'Söhne', 'GT America'],
    body: ['Inter', 'Söhne', 'SF Pro'],
    accent: ['JetBrains Mono', 'IBM Plex Mono', 'GT America Mono'],
  },

  references: {
    brands: ['Apple feature reveals', 'Tesla vehicle UIs', 'Linear app', 'Vercel'],
    artists: ['Linear design team', 'Refik Anadol (data art)'],
    eras: ['Sci-fi HUD aesthetic 1990s-2026', 'Modern SaaS UI 2020+'],
    works: ['Minority Report HUDs', 'Iron Man interfaces', 'Westworld panels'],
  },

  moodKeywords: ['analytical', 'precise', 'tech-forward', 'futuristic', 'data-driven', 'professional', 'cinematic'],

  pairsWellWith: ['mood-tech-cinematic', 'pro-tech-product-keynote-film'],
  forbiddenCombinations: ['design-organic-natural', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['tech-saas', 'fintech', 'ai-products', 'analytics', 'automotive-tech', 'crypto-web3'],
  forbiddenForVerticals: ['food-traditional', 'kids-toys', 'wellness-organic', 'pets'],
};

// ═══════════════════════════════════════════════════════════════
// EXPORT — All Pro Design Modern DNAs
// ═══════════════════════════════════════════════════════════════
export const PRO_DESIGN_MODERN_DNAS: StyleDNA[] = [
  PRO_LIQUID_METAL_3D,
  PRO_GLASSMORPHISM,
  PRO_ANTI_DESIGN,
  PRO_MAGAZINE_COLLAGE,
  PRO_DATA_OVERLAY,
];
