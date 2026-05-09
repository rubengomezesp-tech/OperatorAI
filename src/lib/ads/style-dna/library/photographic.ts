/**
 * 📸 STYLE DNA — Photographic
 *
 * 5 DNAs basados en lenguajes fotográficos icónicos.
 * Cada fotógrafo codificó una gramática visual única reproducible.
 *
 * DNAs incluidos:
 *   1. photo-helmut-newton-fashion       — Fashion noir provocativo
 *   2. photo-irving-penn-product         — Product photography purist
 *   3. photo-vivian-maier-street         — Street photography intimate
 *   4. photo-platon-portrait-power       — Portrait power black & white
 *   5. photo-jonathan-lovekin-food       — Food photography natural light
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. HELMUT NEWTON FASHION — Noir provocativo
// ═══════════════════════════════════════════════════════════════
const PHOTO_HELMUT_NEWTON: StyleDNA = {
  id: 'photo-helmut-newton-fashion',
  name: 'Helmut Newton Fashion Noir',
  tagline: 'Black and white fashion power. Tall women. Pool sides. Provocation as elegance.',
  category: 'photographic',
  era: 'mid-century-1950s',
  movement: 'cinematic-naturalism',
  intensity: 'bold',

  aliases: [
    'helmut-newton',
    'newton-style',
    'newton-fashion',
    'fashion-noir',
    'fashion-bw',
    'high-fashion-photography',
    'vogue-paris',
    'paris-fashion-noir',
    'estilo helmut newton',
    'newton',
    'fotografía fashion noir',
    'moda blanco y negro',
    'tipo helmut newton',
    'vibras newton',
    'fotografía provocativa',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: HELMUT NEWTON — German-Australian photographer (1920-2004) who reinvented fashion photography in 1960s-90s Vogue Paris. NOT pretty fashion — Newton's fashion is POWER, dominance, sexual tension rendered as architecture. Tall women in heels by swimming pools. White hotel rooms. Mediterranean villas. Black and white absolutes with occasional saturated color. NOT just "fashion photography" — Newton invented a specific lineage of feminine power photography.

Typography (when present in ad context):
  - Display: classic fashion magazine serif (Bodoni, Didot, Caslon Italic) — reflects Vogue Paris heritage.
  - Or sans-serif at extreme weights (ultra-light or ultra-bold, never medium).
  - Color: white text on black, or stark black on white.
  - Generous tracking on display, italic for editorial captions.
  - All-caps headlines with spread tracking.
  - Single hero phrase per composition.

Composition (THE Newton signature):
  - Subject often in HEELS, suit, or formal wear — power signaling.
  - Architectural backgrounds: pool sides, hotel suites, marble floors.
  - Subject DOMINATES frame, often shot from below (heroic).
  - Geometric architectural elements as compositional anchors.
  - Tension between elegance and edge always present.

Color palette (the Newton dichotomy):
  - PRIMARY: pure black (#000000) and pure white (#FFFFFF).
  - HIGH CONTRAST always — no muddy grays.
  - When color appears: deep red lipstick (#A00000), nude flesh tones, occasional gold accent.
  - Sky pool blue (#3D5A80) acceptable as environmental.
  - NEVER pastels, NEVER muted, NEVER soft.

Photography (THE Newton craft):
  - Medium format film (Hasselblad) aesthetic — square or slight rectangle.
  - Shot mostly in HARSH SUNLIGHT (Mediterranean midday, deep shadows).
  - Strobes used to overpower sun (creates hyperreal dynamic range).
  - Subjects often shot from low angle (looking up at them).
  - Crisp focus throughout subject, slightly soft architectural backgrounds.
  - Heavy contrast in printing — pure shadows, pure highlights.

Camera and lens:
  - 50mm or 80mm prime lens (medium format equivalent).
  - Direct front-facing or 3/4 angles.
  - Eye-level OR low-angle (never bird's-eye).

Lighting:
  - Available HARSH light or studio strobe mimicking it.
  - Single key light from front or front-side.
  - DEEP shadows on opposite side.
  - Rim light from window or sun for separation.

Subjects (when figures present):
  - Tall women in heels (Newton's signature).
  - Power suits, formal wear, sometimes nude with strategic placement.
  - Sometimes men in suits as supporting characters.
  - Faces often unsmiling, direct gaze at camera.
  - Body language CONFIDENT, never coy.

Architecture and locations:
  - Hotel suites (Ritz Paris, Carlyle NYC).
  - Pool decks at midday.
  - Marble floors, white walls.
  - Mirrors as compositional devices (multiplicities of subject).
  - Mediterranean villas.

Cultural references:
  - Helmut Newton "White Women" (1976)
  - Helmut Newton "Big Nudes" (1981)
  - Helmut Newton's Vogue Paris work 1960s-1990s
  - Yves Saint Laurent campaigns
  - Karl Lagerfeld's vision (parallel)
  - Peter Lindbergh (kindred but warmer)
  - Steven Meisel (modern parallel)

Movement aesthetic:
  - Static power.
  - Subjects mid-pose, monumental.

What this style REJECTS:
  - Soft beauty lighting.
  - "Natural" or candid moments.
  - Smiling subjects.
  - Pastel color palettes.
  - Gentle compositions.
  - Bohemian or "warm" fashion.
  - Anything that diminishes the subject's power.
`,

  palette: {
    foundation: ['#000000', '#FFFFFF'],
    primary: ['#000000', '#FFFFFF'],
    accent: ['#A00000', '#3D5A80', '#D4AF37'],
    forbidden: ['#FFB6C1', '#E0BBE4'], // Soft pastels
  },

  typography: {
    display: ['Bodoni', 'Didot', 'Caslon Italic', 'Helvetica Neue Ultra Light'],
    body: ['Bodoni', 'Garamond'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Helmut Newton',
      'Peter Lindbergh',
      'Steven Meisel',
      'Guy Bourdin',
      'Karl Lagerfeld',
    ],
    brands: ['Vogue Paris', 'Yves Saint Laurent', 'Chanel'],
    works: [
      'White Women (1976)',
      'Big Nudes (1981)',
      'Vogue Paris 1960s-1990s',
    ],
    eras: ['Fashion photography 1960s-1990s'],
  },

  moodKeywords: [
    'powerful',
    'provocative',
    'architectural',
    'sharp',
    'dominant',
    'glamorous',
    'noir',
    'monumental',
  ],

  pairsWellWith: [
    'brand-yohji-yamamoto-noir',
    'mood-quiet-contemplation',
    'cinematic-kubrick-symmetric',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'mood-nostalgic-polaroid',
    'cinematic-studio-ghibli-painterly',
  ],
  bestForVerticals: [
    'fashion-luxury',
    'beauty-luxury',
    'perfume-niche',
    'jewelry-luxury',
    'editorial',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'wellness-spa'],
};

// ═══════════════════════════════════════════════════════════════
// 2. IRVING PENN PRODUCT — Purist product photography
// ═══════════════════════════════════════════════════════════════
const PHOTO_IRVING_PENN: StyleDNA = {
  id: 'photo-irving-penn-product',
  name: 'Irving Penn Product Purist',
  tagline: 'Single object. Gray seamless. North light. The object as monument.',
  category: 'photographic',
  era: 'mid-century-1950s',
  movement: 'modernism',
  intensity: 'subtle',

  aliases: [
    'irving-penn',
    'penn-style',
    'penn-product',
    'still-life-photography',
    'product-still-life',
    'gray-seamless',
    'object-portraiture',
    'estilo irving penn',
    'irving penn',
    'fotografía objeto',
    'still life producto',
    'tipo irving penn',
    'fotografía purista',
  ],

  archetypeBase: 'hero-typographic-apple',

  promptDirective: `
Aesthetic philosophy: IRVING PENN — American photographer (1917-2009) who elevated still life and portraiture to art. Penn's product photography is OBJECT AS MONUMENT — single subject on neutral seamless, lit with north window light, photographed with reverence. NOT advertising photography (showy, lifestyle) — Penn's photography asks: what is this object? Penn made cigarettes look like sculptures, mud pies look like jewels, fashion look like portraiture.

Typography (when present in ad):
  - Display: classic serif (Adobe Caslon, Garamond, Tiempos) — Penn worked with editorial designers who used these.
  - Or refined sans (Helvetica Light, Univers).
  - Color: deep umber (#5D4E37), inkwell black, never bright.
  - Hierarchy minimal — caption-style typography, not display dominance.
  - Italic for emphasis, normal sentence case.

Composition (THE Penn rigor):
  - SINGLE SUBJECT centered or rule-of-thirds.
  - Negative space DOMINATES (60-75% of frame).
  - Subject occupies 25-40% of frame.
  - Often square format (Hasselblad medium format).
  - Compositions feel STILL — no implied motion.
  - Subject sits ON something (table edge, pedestal) — not floating.

Color palette (Penn's neutral world):
  - Foundation: neutral GRAY SEAMLESS (#7A7A7A, #6B6B6B) — Penn's signature.
  - Or warm white (#F5F2EB) for softer subjects.
  - Subject brings its own color, environment is neutral.
  - Subtle tonal variations (warm grays, cool grays).
  - NEVER bright background colors.
  - Black for absolute contrast on dark subjects.

Photography (THE Penn craft):
  - Medium or large format film (Hasselblad, view camera).
  - 80-150mm equivalent lens (compresses without distortion).
  - NORTH LIGHT — single window, soft, directional.
  - Studio strobes mimicking north light (single key, slight fill).
  - Tack sharp throughout subject (f/8-f/11, deep DOF).
  - Subtle texture in shadows preserved (not crushed).

Camera and lighting:
  - Subject lit from front-left or front-right.
  - Soft shadow on opposite side (gradient, not hard).
  - Subtle rim from above for separation.
  - NEVER flat light, NEVER multiple competing sources.
  - Light is the only protagonist besides subject.

Subjects (Penn photographed everything):
  - Single objects: bottles, glasses, fruit, cigarettes, mud.
  - Single garments on mannequin or hanging.
  - Single faces (his portraiture lineage).
  - Tribal artifacts (his ethnographic series).
  - Food rendered as still life.

Materials and surfaces:
  - Worn paper, aged surfaces.
  - Glass with subtle reflections.
  - Fabric textures up close.
  - Wood, stone, terra cotta.
  - Subjects often have IMPERFECTIONS — Penn celebrated patina.

Cultural references:
  - Irving Penn "Worlds in a Small Room" (1974)
  - Vogue covers 1948-1990
  - "Earthly Bodies" (1987)
  - "Cigarettes" series (1972)
  - Robert Mapplethorpe (kindred but starker)
  - Edward Weston (predecessor)

Movement aesthetic:
  - Stillness as protagonist.
  - Time stopped.

Texture/Material:
  - Subject material readable in detail.
  - Background neutral but not flat (subtle texture).
  - Soft shadow gradients.

What this style REJECTS:
  - Lifestyle context (no environment, no people interacting with object).
  - Multiple subjects in frame.
  - Hard dramatic lighting (this is north light territory).
  - Bright color backgrounds.
  - Implied motion.
  - "Cool" angles or compositions.
  - Anything advertising-y or salesy.
`,

  palette: {
    foundation: ['#7A7A7A', '#6B6B6B', '#F5F2EB'],
    primary: ['#5D4E37', '#1A1A1A'],
    accent: ['#FFFFFF'],
    forbidden: ['#FF6EC7', '#FFEB3B'], // Bright colors
  },

  typography: {
    display: ['Adobe Caslon', 'Garamond', 'Tiempos', 'Helvetica Light'],
    body: ['Adobe Caslon', 'Garamond'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Irving Penn',
      'Edward Weston',
      'Robert Mapplethorpe',
      'Hiroshi Sugimoto (kindred)',
    ],
    brands: ['Vogue (1948-1990)', 'Clinique (his commercial work)'],
    works: [
      'Worlds in a Small Room (1974)',
      'Cigarettes series (1972)',
      'Earthly Bodies (1987)',
      'Vogue covers',
    ],
    eras: ['Mid-century photography 1948-1990'],
  },

  moodKeywords: [
    'reverent',
    'still',
    'monumental',
    'pure',
    'patient',
    'neutral',
    'considered',
    'classical',
  ],

  pairsWellWith: [
    'brand-aesop-apothecary-minimal',
    'brand-apple-keynote-minimal',
    'mood-quiet-contemplation',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'beauty-clean',
    'perfume-niche',
    'fashion-luxury',
    'wine-spirits-premium',
    'food-artisanal',
    'editorial',
    'cultural-institution',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 3. VIVIAN MAIER STREET — Street photography intimate
// ═══════════════════════════════════════════════════════════════
const PHOTO_VIVIAN_MAIER: StyleDNA = {
  id: 'photo-vivian-maier-street',
  name: 'Vivian Maier Street Photography',
  tagline: 'Found 35mm. Strangers caught. The city as autobiography.',
  category: 'photographic',
  era: 'mid-century-1950s',
  movement: 'documentary-realism',
  intensity: 'subtle',

  aliases: [
    'vivian-maier',
    'maier-style',
    'street-photography',
    'rolleiflex',
    'self-portrait-mirror',
    'chicago-street',
    'nyc-street-1950s',
    'estilo vivian maier',
    'vivian maier',
    'fotografía calle',
    'street photography',
    'tipo vivian maier',
    'fotografía urbana íntima',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: VIVIAN MAIER — Chicago nanny who shot 150,000 negatives in private (1950s-1990s) discovered posthumously in 2007. Maier's photography is INTIMATE strangers — children playing, women on benches, men reading newspapers, her own reflections in shop windows. Square format Rolleiflex aesthetic — shot from waist height, subjects unaware. NOT decisive moment Bresson — Maier captured the QUIET moments between events.

Typography (when present in ad):
  - Display: vintage editorial serif (Caslon, Garamond, vintage news fonts).
  - Or condensed sans (Trade Gothic, Bebas Neue) — newspaper era.
  - Color: warm sepia (#5D4E37), inkwell black.
  - Hierarchy gentle, like photo essay captions.
  - Italic for poetic touches.

Composition (THE Maier signature):
  - SQUARE FORMAT (6x6 Rolleiflex aspect ratio).
  - Subject often in MIDDLE GROUND, not foreground.
  - Shot from WAIST HEIGHT (Rolleiflex viewfinder is on top).
  - Subjects often unaware of camera (candid).
  - Self-portrait often included via REFLECTIONS (shop windows, mirrors).
  - Children, working class people, urban environments.

Color palette (Maier's two worlds):
  - 1950s-60s: BLACK AND WHITE (silver gelatin film).
  - 1970s-80s: faded color (Kodachrome 25, slight cyan shift).
  - When color: muted warm tones, faded yellows, dusty blues.
  - Skin tones warm, environments slightly desaturated.
  - NEVER bright modern saturation.

Photography (THE Maier craft):
  - Medium format film (Rolleiflex 6x6, occasionally Leica 35mm).
  - Square format primary — accept this constraint.
  - GRAIN visible (Tri-X 400, Kodachrome 25).
  - Slight motion blur acceptable in subjects walking.
  - Available natural light — never flash.
  - Shot at f/8 typically, deep DOF.
  - Imperfect framing — heads cut off, hands prominent, feet visible.

Light and atmosphere:
  - URBAN light — sun reflecting off buildings, sidewalk light.
  - Window light through shop displays.
  - Streetlamp light at dusk.
  - Often shot at BUSY HOURS (commute, lunch, after work).
  - Atmospheric — sometimes rain, fog, snow.

Subjects (Maier's universe):
  - Children playing on sidewalks.
  - Working class people in transit.
  - Elderly people on park benches.
  - Couples in candid moments.
  - Self-portraits in reflections.
  - Trash cans, empty streets, urban texture.
  - Hand-held objects (newspapers, cigarettes, bags).

Subject treatment:
  - Subjects mid-action, mid-thought.
  - NEVER posed, NEVER smiling at camera.
  - Body language captured imperfectly.
  - Faces often partially hidden, in profile.
  - Working class dignity (NOT ironic, NOT exploitative).

Cultural references:
  - Vivian Maier exhibitions and books (2010-present)
  - Saul Leiter (kindred Chicago/NYC street)
  - Diane Arbus (kindred but darker)
  - Garry Winogrand (kindred but more aggressive)
  - "Finding Vivian Maier" (2013 documentary)
  - Wim Wenders' "Notebook on Cities and Clothes" (similar honesty)

Movement aesthetic:
  - Walking pace.
  - Subjects in motion through frame.
  - Implied breath, conversation, life happening.

Texture/Material:
  - Film grain visible.
  - Sidewalk texture, brick walls, urban surfaces.
  - Worn clothing, old hats, scuffed shoes.

What this style REJECTS:
  - Posed subjects.
  - Bright commercial color.
  - Studio lighting.
  - Modern digital aesthetic.
  - Glamour or aspirational lifestyle.
  - Pristine environments.
  - Anything Instagram-perfect.
  - Sharp digital edges.
`,

  palette: {
    foundation: ['#3D2F2A', '#F5F2E8'],
    primary: ['#5D4E37', '#7A6A5A'],
    accent: ['#A87E47', '#6B8AA0'],
  },

  typography: {
    display: ['Caslon', 'Garamond', 'Trade Gothic'],
    body: ['Caslon', 'Garamond'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Vivian Maier',
      'Saul Leiter',
      'Diane Arbus',
      'Garry Winogrand',
      'Robert Frank',
    ],
    works: [
      'Vivian Maier Street Photographer (book)',
      'Finding Vivian Maier (2013 documentary)',
      'Saul Leiter early color',
    ],
    eras: ['American street photography 1950s-1980s'],
  },

  moodKeywords: [
    'intimate',
    'candid',
    'observed',
    'documentary',
    'urban',
    'humble',
    'patient',
    'dignified',
  ],

  pairsWellWith: [
    'mood-melancholy-rainy',
    'mood-nostalgic-polaroid',
    'cinematic-tarkovsky-poetic',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'design-memphis-group-80s',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'editorial',
    'cultural-institution',
    'food-artisanal',
    'travel-authentic',
    'nonprofit-social',
    'publishing',
  ],
  forbiddenForVerticals: ['tech-developer', 'finance-modern', 'beauty-luxury'],
};

// ═══════════════════════════════════════════════════════════════
// 4. PLATON PORTRAIT POWER — Black and white power portrait
// ═══════════════════════════════════════════════════════════════
const PHOTO_PLATON_PORTRAIT: StyleDNA = {
  id: 'photo-platon-portrait-power',
  name: 'Platon Portrait Power',
  tagline: 'Wide angle. Black background. Eyes locked. Power and humanity in 1/60s.',
  category: 'photographic',
  era: 'contemporary-2020s',
  movement: 'documentary-realism',
  intensity: 'bold',

  aliases: [
    'platon',
    'platon-portrait',
    'platon-style',
    'power-portrait',
    'time-magazine-cover',
    'new-yorker-portrait',
    'wide-angle-portrait',
    'estilo platon',
    'platon antoniou',
    'retrato poder',
    'time magazine',
    'tipo platon',
    'retrato cara grande',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: PLATON ANTONIOU — British-Greek photographer who shot covers for Time, New Yorker, Rolling Stone since 2000. Platon's portraits are POWER MEETING HUMANITY — Putin, Obama, Madonna, Stephen Hawking shot with same intimate intensity. Wide-angle lens close to face creates psychological tension. Black seamless background. Subject looks DIRECTLY at lens. The result feels like meeting them in a small room.

Typography (when in editorial context):
  - Display: condensed bold sans (Trade Gothic Bold Condensed, Helvetica Inserat).
  - Magazine cover style — single hero phrase + subhead.
  - All-caps for hero, sentence case for subhead.
  - Color: stark white on black, bold red (#E60000) for accent.
  - Tracking tight on display.

Composition (THE Platon signature):
  - SUBJECT'S FACE FILLS FRAME — head and partial shoulders.
  - WIDE-ANGLE perspective (24-35mm equivalent).
  - Slight distortion as a feature (eyes large, nose forward).
  - Subject CENTERED, looking directly at camera.
  - Tight crop, occasionally cuts top of head.
  - 4x5 or 8x10 large format aesthetic (square or slight portrait).

Color palette (the absolutes):
  - BLACK SEAMLESS background (#0A0A0A, no gradient).
  - WHITE highlight on subject's face (#FAFAFA).
  - Skin tones warm and accurate.
  - Occasional accent color from clothing (red Putin tie famous example).
  - Black and white versions equally valid.

Photography (THE craft):
  - Large format film or digital medium format (Hasselblad).
  - 24-35mm wide angle equivalent — INTENTIONAL distortion.
  - Lens 18-24 inches from subject's face (intimate distance).
  - Studio strobe — single key from above, slight fill.
  - Sharp focus on EYES (subject's window into power and vulnerability).
  - Texture preserved (skin pores, wrinkles, character).

Camera and lighting (THE Platon trick):
  - Wide angle close = signature distortion that feels CLOSE.
  - Single beauty dish or large softbox above camera, angled down 30°.
  - Black flag below to control fill (deep shadows under chin).
  - Sometimes rim light from behind to separate from black.
  - Catch lights in eyes essential — they make portrait feel ALIVE.

Subjects (Platon's gallery of power):
  - Heads of state (Putin, Obama, Mandela, Trump).
  - Cultural icons (Madonna, Bowie, Beyoncé).
  - Scientists (Stephen Hawking).
  - Soldiers, refugees (his "Power" series shows ALL power).
  - Subjects look directly at camera — eye contact non-negotiable.

Treatment of power:
  - Platon DEMOCRATIZES power by lighting CEO and refugee identically.
  - Vulnerability and authority both visible.
  - Subject's HUMANITY surfaces, not their title.

Cultural references:
  - Platon's Time Magazine covers (2000-present)
  - "Power" book (2011)
  - "Service" series (US Military)
  - Avedon "In the American West" (predecessor)
  - Yousuf Karsh (predecessor — Churchill 1941)
  - Annie Leibovitz (kindred but different lighting)

Movement aesthetic:
  - STILLNESS — moment of confrontation with camera.
  - Subject's micro-expression captured.

Texture/Material:
  - Skin texture preserved (no airbrushing — Platon's ethic).
  - Clothing details visible.
  - Hair texture.
  - Black background ABSENT of texture (true black void).

What this style REJECTS:
  - Beauty-light flattery.
  - Wide environmental context (it's intimate, close).
  - Multiple subjects.
  - Color backgrounds.
  - Soft focus or shallow DOF on face.
  - Posed/glamorized expressions.
  - Smiles for the sake of selling.
`,

  palette: {
    foundation: ['#0A0A0A', '#FAFAFA'],
    primary: ['#000000', '#FFFFFF'],
    accent: ['#E60000', '#A87E47'],
  },

  typography: {
    display: ['Trade Gothic Bold Condensed', 'Helvetica Inserat', 'Druk Heavy'],
    body: ['Helvetica', 'Inter'],
  },

  references: {
    artists: [
      'Platon Antoniou',
      'Richard Avedon',
      'Yousuf Karsh',
      'Annie Leibovitz',
    ],
    brands: ['Time Magazine', 'The New Yorker', 'Rolling Stone'],
    works: [
      'Power (2011 book)',
      'Service series',
      'Time Magazine covers 2000+',
    ],
    eras: ['Editorial portraiture 2000-present'],
  },

  moodKeywords: [
    'intimate',
    'powerful',
    'confrontational',
    'humanizing',
    'direct',
    'editorial',
    'iconic',
    'archetypal',
  ],

  pairsWellWith: [
    'cinematic-kubrick-symmetric',
    'mood-quiet-contemplation',
    'brand-yohji-yamamoto-noir',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'editorial',
    'b2b-enterprise',
    'cultural-institution',
    'consultancy',
    'finance-premium',
    'sports-athletic',
    'political-campaign',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'beauty-fun'],
};

// ═══════════════════════════════════════════════════════════════
// 5. JONATHAN LOVEKIN FOOD — Natural light food photography
// ═══════════════════════════════════════════════════════════════
const PHOTO_JONATHAN_LOVEKIN: StyleDNA = {
  id: 'photo-jonathan-lovekin-food',
  name: 'Jonathan Lovekin Food Natural',
  tagline: 'Window light. Imperfect plating. Food as honest object. Yotam Ottolenghi book aesthetic.',
  category: 'photographic',
  era: 'contemporary-2020s',
  movement: 'documentary-realism',
  intensity: 'subtle',

  aliases: [
    'jonathan-lovekin',
    'lovekin-food',
    'food-photography',
    'ottolenghi-style',
    'natural-light-food',
    'cookbook-photography',
    'phaidon-cookbook',
    'kinfolk-food',
    'estilo lovekin',
    'lovekin',
    'fotografía comida natural',
    'tipo ottolenghi',
    'gastronomía editorial',
    'cocina natural',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: JONATHAN LOVEKIN — British food photographer best known for Yotam Ottolenghi's cookbooks (Plenty, Jerusalem, Simple, Flavor). Lovekin's food photography rejects the glossy magazine cliché — NO fake steam, NO retouched colors, NO impossible plating. Instead: honest food shot in natural window light, sometimes mid-eating, sometimes with hands, on real ceramic plates. The photo essay aesthetic — food that you actually want to cook and eat.

Typography (when in editorial context):
  - Display: warm serif (Caslon, Sabon, Tiempos).
  - Editorial cookbook style — like Phaidon or Apartamento.
  - Hero phrase + ingredient list captions.
  - Color: warm dark brown (#5D4E37), deep red (#722F37).
  - Italic for emphasis, generous leading.
  - Sometimes hand-lettered captions.

Composition (THE Lovekin signature):
  - SINGLE PLATE OR DISH centered or rule-of-thirds.
  - Sometimes shot from DIRECTLY ABOVE (overhead) — flat-lay style.
  - Sometimes 30-45° angle with subject in foreground.
  - HANDS may enter frame (cutting, serving, dipping bread).
  - Linen napkin, wooden table, ceramic plate as supporting elements.
  - Negative space in 30-50% of frame.

Color palette (warm earth):
  - Foundation: oat (#E8DDC9), warm cream (#F5F2E8), aged wood (#A87E47).
  - Food brings own color naturally — never enhanced.
  - Greens: muted, garden-fresh (#7A8B5A, #5C7C5C).
  - Reds: tomato, paprika, beet (#A05A2C, #8B5E2F).
  - Yellows: turmeric, saffron (#D4A017).
  - NO neon saturation.

Photography (THE Lovekin craft):
  - Window light — north-facing or diffused south.
  - Single light source — sometimes with simple reflector for fill.
  - 50mm or 85mm prime lens — natural perspective.
  - Sharp focus on hero element of dish, soft elsewhere.
  - Slight motion blur acceptable on hands or steam.
  - 35mm digital or medium format aesthetic.

Light:
  - WINDOW LIGHT at golden hour or overcast noon.
  - Soft directional shadows fall ACROSS plate.
  - Backlight occasionally for translucent foods (jelly, broth).
  - NEVER ring light, NEVER hard flash.

Subjects:
  - The dish as protagonist.
  - Sometimes hands cutting, dipping, serving.
  - Sometimes the cooking process (mise en place).
  - Linen napkins, wooden boards, ceramic plates.
  - Imperfect plating — drips, crumbs, visible love.

Plating philosophy:
  - REAL FOOD that real people would eat.
  - Generous portions (not pretentious tiny dishes).
  - Imperfect — sauce drips, crumbs visible.
  - Garnish purposeful (herbs, lemon, olive oil) — not decorative.
  - Plates with character (handmade ceramics, vintage china).

Cultural references:
  - Yotam Ottolenghi cookbooks (Plenty 2010, Jerusalem 2012, Simple 2018)
  - Phaidon's cookbook line
  - Bon Appétit magazine 2015+ aesthetic
  - The Kitchn website
  - Apartamento magazine food features
  - Cereal magazine food photography
  - Jamie Oliver's earlier cookbooks (warmer era)

Movement aesthetic:
  - Implied — steam rising, hands moving, droplets falling.
  - Mid-action moments captured.

Texture/Material:
  - Ceramic plate textures.
  - Linen weaves visible.
  - Wood grain on tables.
  - Food TEXTURE prominent — herb leaves, crusty bread, melted cheese.

What this style REJECTS:
  - Glossy magazine perfection.
  - Fake steam (added in post).
  - Impossible plating (food never moves like that).
  - Chrome and glass tableware.
  - Bright unnatural saturation.
  - Studio lighting.
  - Empty white plates with single artistic dot of sauce.
`,

  palette: {
    foundation: ['#E8DDC9', '#F5F2E8', '#A87E47'],
    primary: ['#5D4E37', '#7A6A5A'],
    accent: ['#7A8B5A', '#A05A2C', '#D4A017', '#722F37'],
  },

  typography: {
    display: ['Caslon', 'Sabon', 'Tiempos'],
    body: ['Caslon', 'Garamond'],
    accent: ['Italic serif', 'Hand-lettered'],
  },

  references: {
    artists: [
      'Jonathan Lovekin',
      'Helene Dujardin',
      'Andrew Montgomery',
    ],
    brands: ['Phaidon (cookbooks)', 'Bon Appétit', 'Cereal Magazine'],
    works: [
      'Plenty (Ottolenghi 2010)',
      'Jerusalem (Ottolenghi 2012)',
      'Simple (Ottolenghi 2018)',
      'Flavor (Ottolenghi 2020)',
    ],
    eras: ['Editorial cookbook 2010-present'],
  },

  moodKeywords: [
    'warm',
    'honest',
    'inviting',
    'natural',
    'seasonal',
    'patient',
    'culinary',
    'home-cooking',
  ],

  pairsWellWith: [
    'brand-aesop-apothecary-minimal',
    'mood-quiet-contemplation',
    'mood-nostalgic-polaroid',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'design-memphis-group-80s',
    'design-brutalist-architectural',
  ],
  bestForVerticals: [
    'food-artisanal',
    'restaurant-fine-dining',
    'cookbook-publishing',
    'wellness-organic',
    'beverages-craft',
    'editorial',
    'farm-to-table',
  ],
  forbiddenForVerticals: ['tech-developer', 'finance', 'sports-athletic', 'fast-food'],
};

// ─── Exports ────────────────────────────────────────────────────
export const PHOTOGRAPHIC_DNAS: StyleDNA[] = [
  PHOTO_HELMUT_NEWTON,
  PHOTO_IRVING_PENN,
  PHOTO_VIVIAN_MAIER,
  PHOTO_PLATON_PORTRAIT,
  PHOTO_JONATHAN_LOVEKIN,
];

export {
  PHOTO_HELMUT_NEWTON,
  PHOTO_IRVING_PENN,
  PHOTO_VIVIAN_MAIER,
  PHOTO_PLATON_PORTRAIT,
  PHOTO_JONATHAN_LOVEKIN,
};
