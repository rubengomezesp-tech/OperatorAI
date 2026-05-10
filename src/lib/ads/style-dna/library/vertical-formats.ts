/**
 * 📱 STYLE DNA — Vertical Native Formats (9:16 Mobile-First)
 *
 * 5 DNAs OPTIMIZADOS para formato vertical 9:16:
 * Instagram Stories, Reels, TikTok, YouTube Shorts.
 *
 * NO son simples adaptaciones de horizontales — son nativos verticales,
 * con composiciones que SOLO funcionan en este formato.
 *
 * DNAs incluidos:
 *   1. vertical-story-bold-minimal      — Story 9:16 bold + minimal
 *   2. vertical-reel-typography         — Reel typo-driven hero
 *   3. vertical-product-floating        — Producto flotando vertical
 *   4. vertical-split-narrative         — Split horizontal en vertical
 *   5. vertical-grid-stories-pro        — Grid stories editorial
 *
 * BRAND CONTEXT RULES (aplicado a TODOS):
 *   - NEVER include real brand names as visible text in the image
 *   - ONLY use brand text/name from user prompt context
 *   - If no brand context: use neutral placeholders or NO TEXT
 *   - Generic products only, unless user describes specific product
 *
 * THUMB-STOP RULE:
 *   - All these DNAs must capture attention in <3 seconds
 *   - Mobile-first hierarchy (top half is gold, bottom half optional)
 *   - Safe zones for IG/TikTok UI overlays respected
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. VERTICAL STORY BOLD MINIMAL — 9:16 Stories
// ═══════════════════════════════════════════════════════════════
const VERTICAL_STORY_BOLD: StyleDNA = {
  id: 'vertical-story-bold-minimal',
  archetypeBase: 'hero-typographic-apple',
  name: 'Vertical Story Bold Minimal',
  tagline: 'Mobile-first 9:16. Hero element + bold type. Thumb-stopping.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'vertical story',
    'historia vertical',
    'instagram story',
    'historia instagram',
    'story 9:16',
    'story format',
    'formato story',
    'ig story',
    'story ad',
    'anuncio story',
    'tiktok ad vertical',
    'tiktok story',
    'youtube shorts ad',
    'reels story',
    'snapchat story',
    'mobile-first vertical',
    'móvil vertical',
    'vertical bold',
    'vertical minimal',
    'thumb-stop ad',
    'scroll-stopper vertical',
    'phone format',
    'formato móvil',
    'formato celular',
    'formato vertical',
    '9 16 ad',
  ],

  promptDirective: `VERTICAL STORY BOLD MINIMAL — 9:16 MOBILE-FIRST AD

⚠️ CRITICAL: This DNA is for VERTICAL 9:16 format ONLY.
Composition must work on mobile screens, with safe zones
for platform UI overlays (IG/TikTok caption, profile, like buttons).

ASPECT RATIO: 9:16 (1080x1920px or similar)

LAYOUT ZONES:
- TOP 15%: SAFE for content (avoid heavy text — IG header overlap)
- HERO ZONE 15-65%: PRIMARY content area (hero subject + headline)
- COPY ZONE 65-85%: Supporting copy or product detail
- BOTTOM 15%: SAFE zone for CTA or skip platform UI overlap

COMPOSITION PHILOSOPHY:
- ONE hero element (product, person, type) dominates
- Composition optimized for thumb-scroll (hero in upper-mid)
- Generous breathing room (50%+ negative space)
- Visual hierarchy obvious in <1 second
- Safe-zone aware (text won't be obscured by platform UI)

HERO TREATMENT:
- Single hero subject — product floating, person centered,
  or massive typography
- Subject sized to dominate but leave breathing room
- Background simple (solid color, soft gradient, or minimal photo)
- No competing elements

TYPOGRAPHY:
- Display: massive, often 200-300px tall on 1080px wide
- Modern sans (Söhne, Inter Display, Helvetica Now Black)
- Or: refined serif (GT Sectra, Tiempos Headline)
- Hero copy: 1-3 words ideally, single line if possible
- Supporting copy: 1 line max, smaller, monospace optional
- NEVER use real brand names — user context only

COLOR STRATEGY:
- High contrast for mobile readability
- Bold color block + white type, or white BG + black type
- Optional: brand color flooding 60-100% of frame
- Avoid pastels (don't pop on small screens)

VISUAL ELEMENTS:
- Optional: small visual accent (icon, mark, simple shape)
- Optional: subtle motion suggestion (graphic arrow, line)
- Geometric simplicity (circle, rectangle, single shape)
- Photographic content if used: cropped TIGHT to subject

MOTION CONSIDERATIONS (even for static):
- Composition implies motion or focus
- Subject often facing UP or right (thumb scroll direction)
- Implied energy in static frame

REJECTS:
- Horizontal layouts cropped to vertical (poor adaptation)
- Multiple competing elements
- Text in unsafe zones (top header, bottom UI)
- Tiny details that disappear on phone screen
- Cluttered information design

BRAND CONTEXT RULE:
NEVER include real brand names visible in image. Use ONLY
user-provided brand text. For generic ads: invented short phrases
("NEW", "NOW LIVE", "PREMIUM", "ARRIVE") or no text.

REFERENCES (spiritual lineage):
- Glossier Instagram Stories campaigns
- Off-White Story drops
- Apple Stories ads
- Skims social campaigns
- Aesop verticals
- Modern brand vertical templates 2024-2026

USE CASE: Instagram Stories ads, TikTok product reveals,
YouTube Shorts ads, Snapchat ads, vertical product launches,
mobile app promotion, vertical brand campaigns,
flash sale announcements`,

  palette: {
    foundation: ['#FFFFFF', '#000000', '#FAF6E8'],
    primary: ['#1A1A1A', '#FF1F1F', '#0066FF', '#D4AF37'],
    accent: ['#FF6B35', '#5C8001', '#7B68EE'],
    forbidden: ['Pastels for primary background', 'Multiple competing colors'],
  },

  typography: {
    display: ['Söhne', 'Inter Display Black', 'Helvetica Now Display Black', 'GT Sectra Display'],
    body: ['Söhne', 'Inter', 'Helvetica Now'],
    accent: ['Söhne Mono', 'JetBrains Mono'],
  },

  references: {
    brands: ['Glossier Stories', 'Off-White', 'Apple Stories', 'Skims', 'Aesop'],
    artists: ['Brand vertical-format designers 2020-2026'],
    eras: ['Vertical-first design 2018-2026'],
    works: ['Instagram Stories templates evolved', 'TikTok ad formats'],
  },

  moodKeywords: ['immediate', 'bold', 'mobile-native', 'thumb-stopping', 'minimal', 'clear', 'modern'],

  pairsWellWith: ['pro-typographic-poster-monumental', 'pro-tactile-product-hyperreal'],
  forbiddenCombinations: ['pro-magazine-collage-digital', 'pro-data-overlay-dashboard'],

  bestForVerticals: ['social-media-ads', 'mobile-app-launches', 'fashion-stories', 'product-drops', 'flash-sales', 'event-promotion'],
  forbiddenForVerticals: ['print-magazines', 'desktop-banners', 'billboard'],
};

// ═══════════════════════════════════════════════════════════════
// 2. VERTICAL REEL TYPOGRAPHY — Typo-driven hero
// ═══════════════════════════════════════════════════════════════
const VERTICAL_REEL_TYPO: StyleDNA = {
  id: 'vertical-reel-typography',
  archetypeBase: 'editorial-magazine',
  name: 'Vertical Reel Typography Hero',
  tagline: 'Reel/TikTok hero where typography fills the frame. Words as image.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'swiss-international',
  intensity: 'extreme',

  aliases: [
    'vertical reel',
    'reel vertical',
    'reel typography',
    'reel tipografía',
    'vertical type hero',
    'tipo vertical hero',
    'tiktok type ad',
    'reel typo ad',
    'instagram reel ad',
    'anuncio reel',
    'youtube shorts type',
    'shorts tipográfico',
    'mobile typography hero',
    'typography mobile',
    'tipografía móvil',
    'word ad vertical',
    'palabra hero vertical',
    'vertical poster',
    'póster vertical',
    'mobile poster',
    'manifesto vertical',
    'manifiesto vertical',
    'vertical bold type',
    'tipo vertical bold',
    'reel quote',
    'cita reel',
  ],

  promptDirective: `VERTICAL REEL TYPOGRAPHY HERO — TYPE FILLS THE FRAME

⚠️ CRITICAL: This DNA is for VERTICAL 9:16 format ONLY.
Optimized for Instagram Reels, TikTok, YouTube Shorts.

ASPECT RATIO: 9:16 (1080x1920px or similar)

CORE PHILOSOPHY:
- TYPOGRAPHY IS the entire visual — no photo or product
- Words/phrase fills 70-90% of frame height
- Bold, declarative, manifesto-energy
- Designed to be READ in <2 seconds at thumb-scroll speed
- Inheritance: Swiss posters scaled for mobile

LAYOUT TYPOLOGY:
A) STACKED HERO: Each word on own line, vertical stack
B) MASSIVE SINGLE WORD: One word fills 70% of frame
C) HERO + TAGLINE: Big word top + smaller line bottom
D) WRAP AROUND: Type wraps with intentional ragged line breaks

TYPOGRAPHY HEROES:
- Display: ultra-bold weights (Druk, Helvetica Black,
  Akzidenz Grotesk Bold, custom condensed)
- Hero size: 200-400px on 1080px wide canvas
- Tracking: tight (-2% to 0%) for impact
- Weight: 700-900 (Heavy/Black/Ultra)
- Optional: refined display serif (GT Sectra Display Bold)
- NEVER use real brand names — user context only

COLOR STRATEGY:
- Single solid color background (red, black, electric blue,
  bright pink — bold, decisive)
- Type contrasting: white on color, black on light
- OR: monochrome (all-black, all-white) with one accent
- High saturation for thumb-stop in feed

TEXT CHOICES:
- 1-7 words ideal (longer = harder to read at scroll speed)
- Universal/aspirational phrases work well
- Or: question that hooks ("WHAT IF...", "WHY NOT...")
- Or: single command word ("STOP", "GO", "NOW", "BEGIN")
- Avoid product features — focus on EMOTION/MANIFESTO
- All-caps works well for bold type

SAFE ZONE AWARENESS:
- Top 15%: avoid critical type (IG/TT header overlay)
- Bottom 15%: avoid critical type (caption, like buttons)
- Hero zone: 15-85% vertical safe for type

OPTIONAL ELEMENTS:
- Single small graphic mark (asterisk, period, line)
- Brand logo small at top-center or bottom (if user provides)
- Subtle texture overlay (paper grain, halftone)
- Otherwise: ZERO ornament — type stands alone

REJECTS:
- Photography or product imagery (this is PURE TYPE)
- Multiple typographic styles
- Decorative borders/frames
- Tiny supporting copy
- Light/thin type weights (need impact)
- Pastel or muted colors

BRAND CONTEXT RULE:
NEVER include real brand names. Use ONLY user-provided text.
If no copy provided: use universal manifesto phrases brand-neutral
("BEGIN NOW", "MAKE IT", "DO LESS", "ARRIVE").

REFERENCES (spiritual lineage):
- Anthony Burrill posters (printed wisdom)
- Stefan Sagmeister manifesto posters
- Pentagram (Paula Scher) bold type
- Glossier vertical campaigns
- Aesop vertical typographic ads
- Charli XCX BRAT cover (single-color type aesthetic)
- David Carson vertical work

USE CASE: brand manifestos in vertical, cause/social campaigns,
fashion drops with one-word concepts, music album launches,
manifesto-driven product launches, vertical poster campaigns,
youth movement activism (when brand-neutral)`,

  palette: {
    foundation: ['#000000', '#FFFFFF', '#FF1F1F', '#0066FF'],
    primary: ['#000000', '#FFFFFF', '#1A1A1A'],
    accent: ['#FFD700', '#FF6B35', '#5C8001', '#7B68EE'],
    forbidden: ['Pastels', 'Multiple weak colors', 'Light type weights'],
  },

  typography: {
    display: ['Druk Wide', 'Helvetica Black', 'Akzidenz Grotesk Black', 'GT Sectra Display Bold', 'Custom condensed'],
    body: ['Söhne', 'Inter', 'Helvetica'],
    accent: ['JetBrains Mono', 'Söhne Mono'],
  },

  references: {
    brands: ['Off-White posters', 'Glossier vertical', 'Aesop verticals', 'Charli XCX BRAT'],
    artists: ['Anthony Burrill', 'Paula Scher', 'David Carson', 'Stefan Sagmeister'],
    eras: ['Swiss design 1960s', 'Vertical poster era 2020-2026'],
    works: ['Public Theater identity', 'Aesop campaign verticals'],
  },

  moodKeywords: ['decisive', 'manifesto', 'bold', 'declarative', 'unforgettable', 'punchy', 'mobile-native'],

  pairsWellWith: ['pro-typographic-poster-monumental', 'design-swiss-international'],
  forbiddenCombinations: ['pro-magazine-collage-digital', 'pro-tactile-product-hyperreal'],

  bestForVerticals: ['fashion-drops', 'music-launches', 'manifesto-campaigns', 'youth-causes', 'event-promotion-vertical', 'brand-statements'],
  forbiddenForVerticals: ['product-detail-shots', 'lifestyle-imagery', 'b2b-saas-detailed'],
};

// ═══════════════════════════════════════════════════════════════
// 3. VERTICAL PRODUCT FLOATING — Product floating in vertical
// ═══════════════════════════════════════════════════════════════
const VERTICAL_PRODUCT_FLOAT: StyleDNA = {
  id: 'vertical-product-floating',
  archetypeBase: 'documentary-honest',
  name: 'Vertical Product Floating',
  tagline: 'Product hovering in vertical space. Mobile-first hero product.',
  category: 'photographic',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'vertical product',
    'producto vertical',
    'product floating vertical',
    'producto flotando vertical',
    'mobile product ad',
    'anuncio producto móvil',
    'instagram product story',
    'historia producto instagram',
    'tiktok product ad',
    'product reveal vertical',
    'revelación producto vertical',
    'product hero vertical',
    'producto hero vertical',
    'vertical product photography',
    'fotografía producto vertical',
    'phone size product',
    'tamaño teléfono producto',
    'mobile-first product',
    'producto mobile-first',
    'reel product',
    'producto reel',
  ],

  promptDirective: `VERTICAL PRODUCT FLOATING — MOBILE-FIRST HERO PRODUCT

⚠️ CRITICAL: This DNA is for VERTICAL 9:16 format ONLY.

ASPECT RATIO: 9:16 (1080x1920px)

CORE PHILOSOPHY:
- Single product as hero, floating in vertical space
- Composition optimized for mobile thumb-scroll feed
- Generous negative space (vertical canvas allows it)
- Premium product photography aesthetic
- Designed for Stories/Reels/TikTok where viewer fully focused

PRODUCT POSITIONING:
- Product centered horizontally
- Vertically: typically upper-middle (thirds rule for vertical)
- 50-70% of frame width
- Floating effect: subtle shadow below, slightly elevated
- Often shot from slight low angle (hero presentation)
- Generic product placeholders if no user context

LIGHTING:
- Single key light from top-front (like Apple keynote)
- Soft fill or natural ambient
- Optional rim light for separation from background
- Reveals product material qualities (texture, finish)
- Color temperature: matches product type
  (warm for cosmetics, cool for tech, neutral for fashion)

BACKGROUND:
- Solid color (brand color flooding)
- Or: soft gradient (sunrise, sunset, dream-like)
- Or: textured neutral (subtle paper grain, fabric)
- Or: deep cinematic black (premium tech feel)
- NEVER busy or competing with product

TYPOGRAPHY ZONES:
- Optional: brand mark TOP (small, centered, brand-neutral)
- Optional: product name BELOW product (medium size, single line)
- Optional: tagline at BOTTOM (small, refined)
- Most space dedicated to product visual
- NEVER use real brand names — user context only

PRODUCT TYPES IDEAL:
- Cosmetics, skincare, fragrance bottles
- Tech accessories (headphones, smartwatches)
- Fashion items (shoes, bags, accessories)
- Premium food/beverage packaging
- Drinks, cocktails (presentation-worthy)
- Books (especially design/luxury)
- Crafted objects, jewelry

COLOR GRADE:
- Faithful product colors (true to material)
- Background colors: harmonious or dramatic contrast
- Premium feel: accurate, not over-saturated
- Optional: subtle film grain (very subtle)

VISUAL DETAILS:
- Subtle shadows underneath (suggesting weight)
- Reflections on product surface (controlled)
- Surface texture visible (this is hi-res hero)
- Optional: complementary small element near product
  (drop, ingredient, splash) — minimal

NEGATIVE SPACE:
- Vertical format allows GENEROUS space above and below
- Use it — don't fill every inch
- Eye drawn directly to product (no distractions)

REJECTS:
- Multiple products competing
- Cluttered styling/props
- Lifestyle scene (this is hero product alone)
- Heavy text overlays
- Cartoon/CG aesthetic (this is REAL photography)

BRAND CONTEXT RULE:
NEVER show real brand names/logos on products. Generic
unbranded product unless user provides specific brand context.
If user provides logo, include subtly (small, top or bottom).

REFERENCES (spiritual lineage):
- Aesop Instagram product Stories
- Glossier vertical product photography
- Le Labo verticals
- Apple product Stories
- Skims product social ads
- Diptyque vertical campaigns

USE CASE: e-commerce product launches, beauty product drops,
fragrance reveals, tech accessory promotion, fashion item
spotlights, food/beverage launches, jewelry verticals,
book covers in social ads`,

  palette: {
    foundation: ['#FAF6E8', '#F5F2EA', '#0A0A0A', '#1A1A2E'],
    primary: ['#A4906E', '#3D342A', '#FFFFFF', '#D4AF37'],
    accent: ['#FF6B9D', '#7B68EE', '#5A5240'],
    forbidden: ['Cluttered backgrounds', 'Competing products'],
  },

  typography: {
    display: ['GT Sectra', 'Söhne Light', 'Inter Display Light', 'Caslon'],
    body: ['Söhne', 'Inter', 'GT America'],
    accent: ['Söhne Mono', 'JetBrains Mono'],
  },

  references: {
    brands: ['Aesop verticals', 'Glossier', 'Le Labo', 'Diptyque', 'Apple Stories'],
    artists: ['Brand product photographers 2020-2026'],
    eras: ['Mobile-first product photography 2018-2026'],
    works: ['Aesop social campaigns', 'Glossier product Stories'],
  },

  moodKeywords: ['premium', 'tactile', 'inviting', 'crafted', 'mobile-native', 'sophisticated', 'editorial'],

  pairsWellWith: ['pro-tactile-product-hyperreal', 'pro-luxury-spotlight-pedestal'],
  forbiddenCombinations: ['pro-anti-design-deconstructed', 'pro-acid-graphics-raw'],

  bestForVerticals: ['cosmetics-skincare', 'fragrance', 'jewelry', 'tech-accessories', 'fashion-items', 'food-premium', 'books-design'],
  forbiddenForVerticals: ['enterprise-software', 'fast-food-cheap', 'rural-products'],
};

// ═══════════════════════════════════════════════════════════════
// 4. VERTICAL SPLIT NARRATIVE — Horizontal split in vertical
// ═══════════════════════════════════════════════════════════════
const VERTICAL_SPLIT_NARRATIVE: StyleDNA = {
  id: 'vertical-split-narrative',
  archetypeBase: 'documentary-honest',
  name: 'Vertical Split Narrative',
  tagline: 'Two stories vertically stacked. Top + bottom narrative split.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'vertical split',
    'split vertical',
    'división vertical',
    'horizontal split vertical',
    'split top bottom',
    'arriba abajo',
    'before after vertical',
    'antes después vertical',
    'two-part vertical',
    'dos partes vertical',
    'dual narrative',
    'narrativa dual',
    'vertical comparison',
    'comparación vertical',
    'split mobile',
    'split móvil',
    'two scene vertical',
    'dos escenas vertical',
    'vertical diptych',
    'díptico vertical',
    'top bottom story',
    'historia arriba abajo',
    'reel split',
    'split reel',
  ],

  promptDirective: `VERTICAL SPLIT NARRATIVE — TOP/BOTTOM STORY SPLIT

⚠️ CRITICAL: This DNA is for VERTICAL 9:16 format ONLY.
Designed specifically for vertical canvas where horizontal
split-screen wouldn't make sense.

ASPECT RATIO: 9:16 (1080x1920px)

CORE PHILOSOPHY:
- Two scenes/states/concepts stacked VERTICALLY
- Top half + bottom half tells a story together
- Vertical canvas advantage: each half feels like its own frame
- Used for: before/after, with/without, cause/effect,
  problem/solution, two product variants, day/night

LAYOUT:
- Frame divided 50/50 vertically (top half + bottom half)
- Or: 60/40 top-heavy (when one needs more emphasis)
- Optional: thin gold/colored line dividing the halves
- Each half: complete photographic/graphic composition

TOP HALF TREATMENT:
- "Before" or "Without" or "Concept A"
- Often: muted, cool tones, slightly underexposed
- Color grade: cooler, lower saturation
- Subject framed with breathing room

BOTTOM HALF TREATMENT:
- "After" or "With" or "Concept B"
- Often: vibrant, warm, cinematic
- Color grade: warm, higher saturation
- Same subject framing for consistency
- Or: completely different scene showing transformation

DIVIDER OPTIONS:
- Hard line between halves (1-2px gold or brand color)
- Or: gradient blend (soft transition)
- Or: gap with brand color flooding (negative space divider)
- Or: typography spans across the divider

TYPOGRAPHY:
- Labels: small, top of each half ("BEFORE" / "AFTER" or numbered)
- Hero copy: spans across halves OR centered in middle band
- Modern sans-serif (Söhne, Inter Display, GT America)
- Often: monospace for labels (gives editorial/data feel)
- NEVER use real brand names — user context only

VISUAL CONSISTENCY:
- Same composition logic in both halves
- Same lighting style (different mood OK)
- Same subject distance/framing
- Color shift is the visual argument

USE CASES:
- Before/after transformations
- With/without product comparisons
- Day/night same scene
- Empty/full demonstrations
- Old/new contrast
- Two product variants side-by-side (vertically)

PHOTOGRAPHY:
- High quality on BOTH halves (don't make one look bad)
- Fair representation of "before" state
- Cinematic execution (not infomercial)
- Optional: subtle film grain/emulation

REJECTS:
- One side polished, other sloppy (unfair comparison)
- Cheesy "miracle transformation" energy
- Too many split divisions (more than 2)
- Cartoon/exaggerated differences

BRAND CONTEXT RULE:
NEVER include real brand names. Generic products in both halves.
If user provides specific brand context, use ONLY that.

REFERENCES (spiritual lineage):
- Editorial photography diptychs
- Apple before/after feature highlights
- Architectural transformation features
- Time-lapse moment captures
- Fashion editorial pairs

USE CASE: SaaS feature improvements, home renovation,
beauty before/afters (editorial), fitness transformation,
software UI improvements, automotive comparisons,
day-to-night campaigns, season-to-season fashion`,

  palette: {
    foundation: ['#1A1A1A', '#FFFEF8', '#0A0A0A', '#F5F2EA'],
    primary: ['#A4906E', '#5A5240', '#FFFFFF', '#1A1410'],
    accent: ['#7A2424', '#1A4D3E', '#0066CC', '#D4AF37'],
    forbidden: ['Mismatched style halves', 'Cartoon contrast'],
  },

  typography: {
    display: ['Söhne', 'Inter Display', 'GT Sectra'],
    body: ['Söhne', 'Inter', 'GT America'],
    accent: ['Söhne Mono', 'JetBrains Mono', 'GT America Mono'],
  },

  references: {
    brands: ['Apple feature comparisons (vertical)', 'NYT photo essays'],
    artists: ['Editorial photography teams', 'Iwan Baan style'],
    eras: ['Vertical diptych era 2020-2026'],
    works: ['Editorial transformation features', 'Apple feature ad split'],
  },

  moodKeywords: ['analytical', 'narrative', 'cinematic', 'considered', 'persuasive', 'documentary', 'editorial'],

  pairsWellWith: ['pro-comparison-split-cinematic', 'pro-tactile-product-hyperreal'],
  forbiddenCombinations: ['pro-acid-graphics-raw', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['saas-features-mobile', 'home-renovation', 'beauty-before-after', 'automotive', 'software-ui', 'fashion-seasonal', 'fitness-editorial'],
  forbiddenForVerticals: ['music-rave', 'streetwear-rebel', 'gaming-casual'],
};

// ═══════════════════════════════════════════════════════════════
// 5. VERTICAL GRID STORIES PRO — Editorial grid in vertical
// ═══════════════════════════════════════════════════════════════
const VERTICAL_GRID_STORIES: StyleDNA = {
  id: 'vertical-grid-stories-pro',
  archetypeBase: 'editorial-magazine',
  name: 'Vertical Grid Stories Pro',
  tagline: 'Multi-frame storytelling stacked vertically. Editorial sequence.',
  category: 'mixed-fusion',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'vertical grid',
    'grilla vertical',
    'grid stories',
    'historias en grilla',
    'multi-frame vertical',
    'multi-frame story',
    'multiple frames vertical',
    'múltiples frames vertical',
    'stacked frames',
    'frames apilados',
    'sequence vertical',
    'secuencia vertical',
    'storyboard vertical',
    'comic strip vertical',
    'tira cómica vertical',
    'narrative grid',
    'narrativa en grid',
    'vertical sequence',
    'secuencia vertical',
    '3 panel vertical',
    '4 panel vertical',
    'editorial vertical sequence',
    'photo essay vertical',
    'foto ensayo vertical',
  ],

  promptDirective: `VERTICAL GRID STORIES PRO — STACKED EDITORIAL FRAMES

⚠️ CRITICAL: This DNA is for VERTICAL 9:16 format ONLY.

ASPECT RATIO: 9:16 (1080x1920px)

CORE PHILOSOPHY:
- 3-5 frames stacked vertically tell a sequential story
- Like a magazine spread compressed to phone screen
- Editorial photography essay aesthetic
- Each frame contributes to a narrative arc
- Premium polish despite multi-frame complexity

LAYOUT:
- 3, 4, or 5 horizontal frames stacked vertically
- Frames separated by thin white/colored gap (8-16px)
- Each frame: 16:9 horizontal aspect within vertical canvas
- Optional: header/footer text bands above/below grid
- Frames may have varied heights (editorial drama)

FRAME CONTENT:
- Frame 1: hero shot or establishing image
- Middle frames: detail shots, supporting context, product views
- Final frame: callout, brand mark, CTA, or punctuation
- Each frame complete composition (rule of thirds, etc.)
- Generic products in frames if no user context

PHOTOGRAPHY STYLE:
- Cinematic color grade across all frames
- Consistent lighting style (cohesion)
- Same color palette across frames
- Different but related subjects/angles
- Editorial polish (not snapshots)

TYPOGRAPHY:
- Header band (top): small, refined — maybe brand mark or chapter label
- Footer band (bottom): caption, attribution, or CTA
- Within frames: minimal or no text (let imagery breathe)
- Optional: small captions IN frames (small, monospace bottom)
- NEVER use real brand names — user context only

NARRATIVE STRUCTURE:
- Each frame moves the story forward
- Logical progression: setup → development → conclusion
- Or: variation on theme (4 details of same subject)
- Or: process documentation (steps 1, 2, 3, 4)

COLOR & MOOD:
- Cohesive palette across frames (cinematic continuity)
- Color grade emotional: warm/cool/moody/bright
- Optional: subtle frame borders (white or thin gold)
- Background between frames: neutral or brand color

VISUAL CONNECTORS:
- Eye flows TOP to BOTTOM (natural mobile scroll direction)
- Each frame relates visually to next (color, motion, subject)
- Optional: thin connecting lines or arrows between frames
- Or: shared visual element across frames (same color, prop)

EDITORIAL DETAILS:
- Folio elements: frame numbers (01/04, 02/04, etc.)
- Optional: very small captions in monospace
- Magazine-like polish

USE CASES:
- Multi-step processes (recipes, tutorials, workflows)
- Product feature showcases (4 features = 4 frames)
- Story-driven brand campaigns
- Travel/lifestyle photo essays
- Fashion editorial (looks 1, 2, 3, 4)
- Before/middle/after transformations
- Day-in-life sequences

REJECTS:
- Inconsistent style across frames
- Random/unrelated images
- Heavy text on every frame
- Snapshot quality (must be POLISHED)
- More than 5 frames (too small to read)

BRAND CONTEXT RULE:
NEVER include real brand names. Use ONLY user-provided context.
Frame imagery should be brand-neutral unless user specifies.

REFERENCES (spiritual lineage):
- Vogue editorial photo essays
- Wallpaper magazine multi-image features
- Cereal magazine photo essays
- The Gentlewoman editorial spreads
- Kinfolk magazine vertical stories
- Apple "moment" multi-frame ads

USE CASE: editorial brand campaigns, fashion lookbooks (vertical),
product feature showcases, recipe/tutorial campaigns,
travel content, lifestyle storytelling, multi-step demos,
story-driven launches, photo essay marketing`,

  palette: {
    foundation: ['#1A1A1A', '#FFFEF8', '#FAF6E8', '#0A0A0A'],
    primary: ['#A4906E', '#5A5240', '#3D342A', '#FFFFFF'],
    accent: ['#D4AF37', '#7A2424', '#1A4D3E'],
    forbidden: ['Inconsistent palette across frames', 'Cartoon styles'],
  },

  typography: {
    display: ['GT Sectra', 'Söhne Light', 'Inter Display Light'],
    body: ['Söhne', 'Inter', 'GT America'],
    accent: ['Söhne Mono', 'JetBrains Mono Light'],
  },

  references: {
    brands: ['Vogue editorial', 'Wallpaper magazine', 'Cereal', 'The Gentlewoman', 'Kinfolk'],
    artists: ['Editorial photographers 2020-2026', 'Magazine art directors'],
    eras: ['Editorial photography 2015-2026'],
    works: ['Vogue photo essays', 'Cereal magazine spreads'],
  },

  moodKeywords: ['editorial', 'narrative', 'sophisticated', 'cinematic', 'crafted', 'considered', 'magazine-quality'],

  pairsWellWith: ['pro-magazine-collage-digital', 'pro-tactile-product-hyperreal'],
  forbiddenCombinations: ['pro-acid-graphics-raw', 'pro-anti-design-deconstructed'],

  bestForVerticals: ['fashion-editorial', 'travel', 'food-recipe', 'lifestyle-brands', 'product-features', 'tutorial-content', 'magazine-content'],
  forbiddenForVerticals: ['hardcore-gaming', 'crypto-rebel', 'discount-retail-loud'],
};

// ═══════════════════════════════════════════════════════════════
// EXPORT — All Vertical Format DNAs
// ═══════════════════════════════════════════════════════════════
export const VERTICAL_FORMAT_DNAS: StyleDNA[] = [
  VERTICAL_STORY_BOLD,
  VERTICAL_REEL_TYPO,
  VERTICAL_PRODUCT_FLOAT,
  VERTICAL_SPLIT_NARRATIVE,
  VERTICAL_GRID_STORIES,
];
