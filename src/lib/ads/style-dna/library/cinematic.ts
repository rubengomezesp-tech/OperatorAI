/**
 * 🎬 STYLE DNA — Cinematic
 *
 * 5 DNAs basados en lenguajes cinematográficos icónicos.
 * Cada director codificó una gramática visual única reproducible.
 *
 * DNAs incluidos:
 *   1. cinematic-wes-anderson-symmetric    — Pastel symmetric framing
 *   2. cinematic-kubrick-symmetric         — One-point perspective horror
 *   3. cinematic-villeneuve-vast           — Brutalist sci-fi monumentality
 *   4. cinematic-studio-ghibli-painterly  — Hand-painted watercolor warmth
 *   5. cinematic-tarkovsky-poetic         — Long takes, water, light, time
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. WES ANDERSON — Symmetric pastel storybook
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_WES_ANDERSON: StyleDNA = {
  id: 'cinematic-wes-anderson-symmetric',
  name: 'Wes Anderson Symmetric',
  tagline: 'Pastel symmetry. Centered protagonist. Twee melancholy in candy color.',
  category: 'cinematic',
  era: 'contemporary-2020s',
  movement: 'cinematic-naturalism',
  intensity: 'bold',

  aliases: [
    'wes-anderson',
    'wes-anderson-style',
    'anderson-aesthetic',
    'grand-budapest',
    'royal-tenenbaums',
    'symmetric-pastel',
    'twee-cinematic',
    'storybook-cinematic',
    'estilo wes anderson',
    'wes anderson',
    'simétrico pastel',
    'storybook',
    'tipo wes anderson',
    'como wes anderson',
    'vibras wes anderson',
    'estética wes anderson',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: WES ANDERSON — Director of The Grand Budapest Hotel, Moonrise Kingdom, The French Dispatch, Asteroid City. Pastel symmetric universe where everything is curated, twee melancholy crossed with dollhouse precision. NOT just "pastel and symmetry" — Anderson's craft is OBSESSIVE production design, painted backgrounds, theatrical staging where characters speak directly to camera. Every frame is a diorama.

Typography:
  - Display: vintage serif (Adobe Caslon, Garamond, Tiempos) OR custom hand-drawn lettering with retro travel-poster character (Adobe Wood Type).
  - All-caps for titles in centered alignment.
  - Italic captions and section labels.
  - Decorative flourishes acceptable (but specific — like 1960s travel guides, not Victorian).
  - Color: deep red, navy blue, or dark olive green typography on pastel backgrounds.
  - Hierarchy formal — like a play program (Act I, Scene 2) or vintage menu.

Composition (THE signature):
  - PERFECT SYMMETRY. Every element on central axis or mirrored.
  - Subject CENTERED in frame, looking directly at camera.
  - One-point or two-point perspective compositions (corridors, hallways, rooms).
  - Dollhouse cross-sections — cutaway views of buildings revealing all rooms.
  - Front-on or 90° angle shots ONLY (no 3/4 views).
  - Static framing — camera doesn't move, characters move within frame.

Color palette (pastel maximalism):
  - Foundation: cream (#F5F2EB), butter yellow (#F4E4BC), sky blue (#A8D8E8), mint green (#B8E0D2).
  - Pastel pinks (#F4B8B8), peach (#F4C2A1), lavender (#C9B8E0).
  - Saturated counterpoints: deep red (#C9302C), navy (#1B365D), forest green (#2E5530).
  - Mustard yellow (#D4A017) as classic Anderson accent.
  - NO grays (everything has chromatic warmth).
  - Color combinations always read as "candy box" or "vintage textbook."

Production design (THE soul):
  - Dollhouse aesthetic — every prop chosen, labeled, organized.
  - Vintage typography on EVERYTHING (signage, menus, books, packaging).
  - Period-appropriate materials: brass, wood paneling, velvet, embroidery.
  - Maximalist within frames — every wall has art, every shelf has objects.
  - Each character has SIGNATURE outfit they wear throughout.

Photography:
  - 35mm film aesthetic.
  - Anamorphic 2.39:1 widescreen for cinema, 16:9 for digital.
  - Bright, evenly-lit (no harsh shadows — diffused daylight or flat fluorescent).
  - Color graded for warmth (slight magenta lift, golden highlights).
  - Sharp throughout (deep DOF — f/8 to f/11).

Camera:
  - 27mm or 40mm prime lens for environmental shots.
  - 85mm portrait for character close-ups.
  - SLOW pans (always 90° or 180° rotations, never diagonals).
  - Whip pans between symmetric matched shots.
  - Tracking shots that reveal more dollhouse rooms.

Movement aesthetic:
  - Choreographed — characters move to specific marks.
  - Implies stage direction.
  - Slow zooms acceptable for emphasis.

Cultural references:
  - The Grand Budapest Hotel (2014)
  - Moonrise Kingdom (2012)
  - The Royal Tenenbaums (2001)
  - The French Dispatch (2021)
  - Asteroid City (2023)
  - Isle of Dogs (2018)
  - Roman Coppola's collaborations
  - Vintage Pan Am posters
  - Children's storybooks (Eric Carle, Beatrix Potter)
  - "Accidentally Wes Anderson" Instagram aesthetic

What this style REJECTS:
  - Asymmetry, off-center compositions.
  - Handheld camera or shaky cam.
  - Naturalistic lighting drama.
  - Modern minimalism (Anderson is maximalist within his frames).
  - Aggressive colors (Anderson's saturation is specific, never random).
  - Anything brutalist or industrial.
  - Stock photography aesthetics.
`,

  palette: {
    foundation: ['#F5F2EB', '#F4E4BC', '#A8D8E8'],
    primary: ['#B8E0D2', '#F4B8B8', '#F4C2A1'],
    accent: ['#C9302C', '#1B365D', '#D4A017', '#2E5530'],
    forbidden: ['#0A0A0A', '#7A7A7A'], // Pure black/gray (too cold)
  },

  typography: {
    display: ['Adobe Caslon', 'Garamond', 'Tiempos Headline', 'Adobe Wood Type'],
    body: ['Adobe Caslon', 'Sabon'],
    accent: ['Italic serif', 'Vintage display'],
  },

  references: {
    artists: ['Wes Anderson', 'Roman Coppola', 'Adam Stockhausen (production designer)'],
    works: [
      'The Grand Budapest Hotel (2014)',
      'Moonrise Kingdom (2012)',
      'The Royal Tenenbaums (2001)',
      'Asteroid City (2023)',
      'The French Dispatch (2021)',
    ],
    eras: ['Anderson filmography 1996-present'],
  },

  moodKeywords: [
    'twee',
    'melancholic',
    'whimsical',
    'precious',
    'literary',
    'storybook',
    'vintage',
    'symmetric',
  ],

  pairsWellWith: ['mood-melancholy-rainy', 'mood-nostalgic-polaroid'],
  forbiddenCombinations: [
    'design-brutalist-architectural',
    'design-y2k-chrome-millennium',
    'cinematic-villeneuve-vast',
  ],
  bestForVerticals: [
    'fashion-vintage',
    'food-artisanal',
    'travel-boutique',
    'hospitality-boutique-hotel',
    'editorial',
    'kids-storybook',
  ],
  forbiddenForVerticals: ['tech-developer', 'sports-athletic', 'fitness'],
};

// ═══════════════════════════════════════════════════════════════
// 2. KUBRICK SYMMETRIC — One-point perspective horror
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_KUBRICK_SYMMETRIC: StyleDNA = {
  id: 'cinematic-kubrick-symmetric',
  name: 'Kubrick Clinical Symmetry',
  tagline: 'One-point perspective. Clinical isolation. Beauty as horror.',
  category: 'cinematic',
  era: 'mid-century-1950s',
  movement: 'cinematic-naturalism',
  intensity: 'bold',

  aliases: [
    'kubrick',
    'stanley-kubrick',
    'kubrick-style',
    'one-point-perspective',
    'shining-aesthetic',
    '2001-space-odyssey',
    'clockwork-orange',
    'symmetric-horror',
    'estilo kubrick',
    'kubrick',
    'tipo kubrick',
    'simétrico clínico',
    'horror clínico',
    'el resplandor',
    'odisea espacio',
  ],

  archetypeBase: 'hero-typographic-apple',

  promptDirective: `
Aesthetic philosophy: STANLEY KUBRICK — Director of 2001: A Space Odyssey, The Shining, A Clockwork Orange, Barry Lyndon, Eyes Wide Shut. Symmetric one-point perspective compositions where mathematical precision creates clinical horror. Beauty becomes oppressive. Spaces are ARCHITECTURE that watches you. NOT generic "horror" or "sci-fi" — this is Kubrick's specific obsession with ORDER hiding chaos.

Typography:
  - Display: serif (Bodoni, Times New Roman) OR custom typography with VERY specific era-appropriate styling.
  - All-caps centered for title cards.
  - Often single-word titles in MASSIVE size.
  - Color: white on black, or black on white (high contrast absolutes).
  - Letter-spacing generous on display.
  - Use of typography as ARCHITECTURE — "2001" written like an inscription.

Composition (THE Kubrick signature):
  - ONE-POINT PERSPECTIVE — straight central axis vanishing point.
  - Hallway corridors stretching to infinity.
  - Subject DEAD CENTER in frame.
  - Subject often staring directly at camera (the "Kubrick stare").
  - Symmetry mathematical, not casual.
  - Wide-angle lenses (24-32mm) emphasize architectural depth.

Color palette (varies by film, signature combinations):
  - 2001 era: stark white interiors, primary red (#FF0000), pure black, deep space blue.
  - Shining era: warm wood (#A0522D), blood red (#8B0000), forest green (#2E5530), gold yellow.
  - Clockwork Orange era: white plastic, milk white, blood splash red, electric blue.
  - Barry Lyndon era: candle-lit golden ambers, period oil-painting tones.
  - Eyes Wide Shut era: Christmas tree lights warmth, deep blacks, blood maroon.
  - ALWAYS HIGH CONTRAST — pure values, no muddy mid-tones.

Photography (technical perfection):
  - Shot on 35mm or 65mm film for theatrical depth.
  - Lens choice telegraphs meaning (wide for architecture, telephoto for human faces).
  - Lighting is sourced from PRACTICALS in scene (lamps, windows, candles) — Barry Lyndon famously shot by candlelight.
  - Slow zoom-ins (the famous Kubrick zoom).
  - Dolly tracks following characters down corridors.

Camera and movement:
  - Wide angle for environmental dread.
  - Steadicam moves following subjects through architecture.
  - Slow zooms — sometimes 30-60 seconds long.
  - ALWAYS deliberate, NEVER handheld chaos.
  - Frame within frame compositions (doorways, mirrors).

Lighting:
  - Practical sources only (when possible).
  - Natural light from windows.
  - HIGH CONTRAST — face half-lit, half in shadow.
  - Backlighting subjects to silhouette them.
  - Cold fluorescent for clinical scenes.
  - Warm amber for psychological warmth/falseness.

Set design and architecture:
  - Imposing geometric architecture.
  - Hexagonal patterns (Shining carpet famous example).
  - Long hallways that exist to be photographed.
  - Furniture placed with architectural precision.
  - Minimal decoration — what exists is iconic.

Cultural references:
  - 2001: A Space Odyssey (1968)
  - The Shining (1980)
  - A Clockwork Orange (1971)
  - Barry Lyndon (1975)
  - Eyes Wide Shut (1999)
  - Full Metal Jacket (1987)
  - Dr. Strangelove (1964)
  - Production designs by Ken Adam, Saul Bass title sequences

Movement aesthetic:
  - Slow, monumental, INEVITABLE.
  - Camera moves match character pace — never faster.

What this style REJECTS:
  - Asymmetric or off-center compositions.
  - Handheld camera shake.
  - Quick cuts (Kubrick holds shots).
  - Natural color grading (everything is heightened).
  - Actors smiling normally (Kubrick faces are thousand-yard stares).
  - Modern digital cinema tropes.
  - Film grain hidden or denoised.
`,

  palette: {
    foundation: ['#0A0A0A', '#FFFFFF'],
    primary: ['#8B0000', '#A0522D', '#2E5530'],
    accent: ['#FFD700', '#1B365D'],
  },

  typography: {
    display: ['Bodoni', 'Times New Roman', 'Trajan Pro'],
    body: ['Bodoni', 'Garamond'],
  },

  references: {
    artists: ['Stanley Kubrick', 'Ken Adam (production designer)', 'Saul Bass (titles)', 'John Alcott (cinematographer)'],
    works: [
      '2001: A Space Odyssey (1968)',
      'The Shining (1980)',
      'A Clockwork Orange (1971)',
      'Barry Lyndon (1975)',
      'Eyes Wide Shut (1999)',
    ],
    eras: ['Kubrick filmography 1953-1999'],
  },

  moodKeywords: [
    'clinical',
    'oppressive',
    'monumental',
    'precise',
    'dread',
    'mathematical',
    'unsettling',
    'symmetric',
  ],

  pairsWellWith: [
    'design-swiss-international',
    'mood-quiet-contemplation',
    'cinematic-villeneuve-vast',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'cinematic-wes-anderson-symmetric', // Wes is twee, Kubrick is dread (different though both symmetric)
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'tech-saas',
    'finance-premium',
    'cultural-institution',
    'pharmaceutical',
    'editorial',
    'architecture',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'beauty-romantic'],
};

// ═══════════════════════════════════════════════════════════════
// 3. VILLENEUVE VAST — Brutalist sci-fi monumentality
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_VILLENEUVE_VAST: StyleDNA = {
  id: 'cinematic-villeneuve-vast',
  name: 'Villeneuve Vast Monumental',
  tagline: 'Tiny human in vast brutalist landscape. Sand, fog, monolith.',
  category: 'cinematic',
  era: 'contemporary-2020s',
  movement: 'brutalism',
  intensity: 'extreme',

  aliases: [
    'villeneuve',
    'denis-villeneuve',
    'villeneuve-style',
    'dune-aesthetic',
    'blade-runner-2049',
    'arrival-aesthetic',
    'sci-fi-brutalist',
    'monumental-cinematic',
    'estilo villeneuve',
    'tipo villeneuve',
    'villeneuve',
    'dune',
    'blade runner 2049',
    'monumental',
    'sci-fi brutalista',
    'épico minimalista',
  ],

  archetypeBase: 'full-bleed-cinematic',

  promptDirective: `
Aesthetic philosophy: DENIS VILLENEUVE — Director of Dune (2021/2024), Blade Runner 2049, Arrival, Sicario. Master of MONUMENTAL SCALE — tiny human figures in vast brutalist landscapes. Architecture as monolith. Atmosphere as character. Color is RESTRICTED to single palettes (orange Dune, blue Sicario, sepia 2049). NOT just "epic" — Villeneuve's specific gift is making the vast feel CLAUSTROPHOBIC despite the scale.

Typography:
  - Display: massive condensed sans-serif (Druk, Trade Gothic Bold Condensed, custom display).
  - Often integrated into images (large-scale typography over landscapes).
  - Color: depends on film palette (orange against navy for Dune feel, white against sepia for 2049).
  - Tracking very tight on display (-0.04em).
  - Letters can be MASSIVE — single words filling 50% of frame.
  - Hierarchy: hero word, subhead in fineprint scale (HUGE size differential).

Composition (THE Villeneuve signature):
  - HUMAN FIGURE TINY (5-15% of frame height).
  - VAST environment dominating (75-95% of frame).
  - Single-color atmospheric overlay (orange dust, blue fog, sepia haze).
  - Architectural monoliths or natural monuments dwarfing humans.
  - Wide aspect ratios (2.39:1 anamorphic).
  - Compositions feel like architectural drawings.
  - Often shot from below (low angle making everything monumental).

Color palette (single-palette obsession):
  - DUNE PALETTE: burnt orange (#D4774C), warm sand (#E8C99A), deep shadow blue (#1B2845), dust haze (#C4956A).
  - BLADE RUNNER 2049 PALETTE: sepia gold (#A87E47), neon orange (#FF6F00), deep blue (#0A1F44), industrial gray.
  - ARRIVAL PALETTE: foggy gray-greens (#7A8B7A), soft cream (#F5F2EB), monolith black.
  - SICARIO PALETTE: deep desert tans (#C4956A), bruise blue, dust haze.
  - Always SINGLE DOMINANT TONE per scene.

Photography (Roger Deakins / Greig Fraser):
  - Shot on 65mm IMAX or anamorphic 35mm.
  - Atmospheric haze ALWAYS present (smoke, dust, fog, particulates).
  - Rim lighting from low sun (golden hour or magic hour).
  - Backlit silhouettes against bright atmosphere.
  - Long lenses (85mm-200mm) compress distance.
  - Ultra-wide (16-24mm) for environmental scope.

Atmosphere (THE crucial element):
  - DUST particles visible in light beams.
  - Fog/mist obscuring middle distance.
  - Smoke from fires, breath in cold air.
  - Atmosphere makes light VISIBLE (god rays, light beams).
  - Heavy color grading (LUTs that crush blues or warm sepias).

Architecture and landscapes:
  - Brutalist concrete monoliths.
  - Vast desert horizons.
  - Industrial structures (refineries, ships, machines).
  - Natural monuments dwarfing humans.
  - Symmetric compositions of architecture.
  - Single-material environments (all sand, all concrete, all snow).

Sound design implication (visual translates):
  - Heavy bass implied through composition weight.
  - Hans Zimmer drone visualized as monumental quietude.

Cultural references:
  - Dune (2021), Dune: Part Two (2024)
  - Blade Runner 2049 (2017)
  - Arrival (2016)
  - Sicario (2015)
  - Prisoners (2013)
  - Roger Deakins cinematography portfolio
  - Greig Fraser cinematography
  - Hugh Ferriss architectural drawings
  - Brutalist architecture photography
  - Edward Burtynsky (industrial landscapes)

Movement aesthetic:
  - SLOW. Monumental.
  - Human figures walk across vastness.
  - Camera tracks slowly past architecture.

What this style REJECTS:
  - Tight close-ups on faces (Villeneuve uses them sparingly).
  - Quick cuts.
  - Bright cheerful color palettes.
  - Multiple competing colors.
  - Indoor domestic scenes (Villeneuve is OUTDOOR vastness).
  - Memphis chaos.
  - Y2K chrome shine.
`,

  palette: {
    foundation: ['#1B2845', '#C4956A', '#A87E47'],
    primary: ['#D4774C', '#E8C99A', '#FF6F00'],
    accent: ['#0A1F44', '#FFFFFF'],
  },

  typography: {
    display: ['Druk', 'Trade Gothic Condensed', 'Helvetica Inserat'],
    body: ['Helvetica Neue', 'Inter'],
  },

  references: {
    artists: ['Denis Villeneuve', 'Roger Deakins (DP)', 'Greig Fraser (DP)', 'Hugh Ferriss (architecture drawings)'],
    works: [
      'Dune (2021)',
      'Dune: Part Two (2024)',
      'Blade Runner 2049 (2017)',
      'Arrival (2016)',
      'Sicario (2015)',
    ],
    eras: ['Villeneuve filmography 2010-present'],
  },

  moodKeywords: [
    'monumental',
    'vast',
    'oppressive',
    'atmospheric',
    'epic',
    'dread',
    'sublime',
    'desolate',
  ],

  pairsWellWith: [
    'design-brutalist-architectural',
    'cinematic-tarkovsky-poetic',
    'mood-quiet-contemplation',
    'brand-nike-cinematic-athletic',
  ],
  forbiddenCombinations: [
    'cinematic-wes-anderson-symmetric',
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'tech-saas',
    'automotive-luxury',
    'fashion-luxury',
    'consumer-electronics-premium',
    'cultural-institution',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'wellness-spa'],
};

// ═══════════════════════════════════════════════════════════════
// 4. STUDIO GHIBLI PAINTERLY — Hand-painted watercolor warmth
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_STUDIO_GHIBLI: StyleDNA = {
  id: 'cinematic-studio-ghibli-painterly',
  name: 'Studio Ghibli Painterly',
  tagline: 'Watercolor skies. Wind through grass. Wonder rendered by hand.',
  category: 'cinematic',
  era: 'timeless',
  movement: 'documentary-realism', // closest taxonomic match for hand-painted realism
  intensity: 'moderate',

  aliases: [
    'studio-ghibli',
    'ghibli',
    'ghibli-style',
    'miyazaki',
    'hayao-miyazaki',
    'totoro-aesthetic',
    'spirited-away-aesthetic',
    'ponyo-aesthetic',
    'painterly-watercolor',
    'hand-painted-anime',
    'estilo ghibli',
    'estilo miyazaki',
    'ghibli',
    'totoro',
    'tipo ghibli',
    'pintado a mano',
    'acuarela japonesa',
    'vibras ghibli',
    'estética ghibli',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: STUDIO GHIBLI — Hayao Miyazaki and Isao Takahata's animation studio. Hand-painted watercolor backgrounds, characters with simple line art, profound emotional realism. The world is rendered with WONDER — every leaf, every cloud, every bowl of soup is animated with reverence. NOT just "anime" (which is a vast medium) — this is GHIBLI's specific painterly tradition: nature as character, food as ritual, wind as invisible protagonist.

Typography:
  - Display: hand-drawn brush lettering OR humanist sans-serif (Adobe Hannari, Source Han Sans).
  - Often Japanese characters integrated with Latin script.
  - Soft serifs (Times New Roman alternatives but warmer — Garamond, Caslon).
  - Color: dark forest green (#2D4A2B), warm brown (#8B5E2F), muted navy (#3D5A80).
  - Tracking neutral, leading generous.
  - Decorative flourishes minimal — elegance through restraint.

Composition:
  - Wide environmental shots — character small in vast natural scene.
  - Layered backgrounds creating depth (foreground grass, middle trees, background mountains, sky).
  - Often centered character with rule-of-thirds environmental focus.
  - Vertical compositions emphasizing sky and clouds.
  - Cross-section views (Howl's Castle, Spirited Away bathhouse).
  - Domestic interior scenes with detailed clutter (kitchens with food, libraries with books).

Color palette (the Ghibli watercolor palette):
  - SKY: cerulean blue (#5DADE2), warm peach sunset (#F4C2A1), morning rose (#F4E4BC).
  - GREENS: forest moss (#2D4A2B), spring leaf (#90EE90), grass yellow-green (#9ACD32).
  - WARMS: terracotta (#C46B4A), wheat (#F5DEB3), wood brown (#8B5E2F).
  - WATERS: clear pond (#A8D8E8), deep ocean (#2E5994).
  - NEUTRALS: cream paper (#F5F2EB), warm gray (#7A6A5A).
  - NEVER digital saturation — always WATERCOLOR softness.

Painting technique (THE soul):
  - Watercolor washes with VISIBLE BRUSH STROKES.
  - Cell-shaded characters on painted backgrounds.
  - Sky as gradient (often top-to-bottom blue-to-pink-to-yellow).
  - Clouds as VOLUMETRIC sculptural shapes (not flat).
  - Trees rendered with individual leaf clusters.
  - Water with reflective ripples.
  - Detail concentrated in nature, simplicity in characters.

Light and atmosphere:
  - GOLDEN HOUR perpetual — most Ghibli scenes feel like late afternoon.
  - Sunlight rendered as visible BEAMS through trees.
  - Particle effects: dust motes, falling leaves, blowing seeds.
  - Wind made visible through grass animation, hair, clothing.
  - Rain shown as individual drops, not gray sheets.

Subjects (THE Ghibli universe):
  - Young protagonists (often female, age 10-14).
  - Domestic spaces (kitchens, bedrooms, libraries).
  - Natural landscapes (forests, fields, oceans, mountains).
  - Steampunk machinery (Castle in the Sky, Howl's flying machines).
  - Food as central ritual (cooking scenes legendary in Ghibli).
  - Ancient architecture (Japanese, European medieval, fantasy).

Animation feel (translates to still images):
  - Implied motion — leaves about to fall, hair blowing in unseen wind.
  - Character mid-step, not posed.
  - Faces simple but EMOTIONALLY specific.

Cultural references:
  - My Neighbor Totoro (1988)
  - Spirited Away (2001)
  - Howl's Moving Castle (2004)
  - Princess Mononoke (1997)
  - Castle in the Sky (1986)
  - Kiki's Delivery Service (1989)
  - Ponyo (2008)
  - The Wind Rises (2013)
  - When Marnie Was There (2014)
  - Joe Hisaishi soundtracks (translates to mood)
  - Hayao Miyazaki sketchbook aesthetic

Movement aesthetic:
  - Slow, contemplative, breath-paced.
  - Implied wind, water, life.

Texture/Material:
  - Watercolor paper texture visible.
  - Hand-drawn line work.
  - Cell-painted character flatness over textured backgrounds.

What this style REJECTS:
  - Photorealistic 3D rendering.
  - Digital saturation/color enhancement.
  - Hard sharp edges (everything has watercolor softness).
  - Brutalism.
  - Y2K chrome.
  - Memphis chaos.
  - Western Disney character design (Ghibli is its own tradition).
  - Anime tropes (no impossibly large eyes, no hyper-stylized hair).
`,

  palette: {
    foundation: ['#F5F2EB', '#A8D8E8'],
    primary: ['#2D4A2B', '#8B5E2F', '#F4C2A1'],
    accent: ['#5DADE2', '#90EE90', '#C46B4A', '#3D5A80'],
  },

  typography: {
    display: ['Adobe Hannari', 'Source Han Sans', 'Brush Script', 'Caslon Italic'],
    body: ['Adobe Caslon', 'Garamond', 'Source Han Sans'],
  },

  references: {
    artists: ['Hayao Miyazaki', 'Isao Takahata', 'Kazuo Oga (background painter)', 'Joe Hisaishi (composer, mood)'],
    works: [
      'My Neighbor Totoro (1988)',
      'Spirited Away (2001)',
      "Howl's Moving Castle (2004)",
      'Princess Mononoke (1997)',
      'Ponyo (2008)',
      'The Wind Rises (2013)',
    ],
    eras: ['Studio Ghibli 1985-present'],
  },

  moodKeywords: [
    'wonder',
    'nostalgic',
    'painterly',
    'pastoral',
    'gentle',
    'warm',
    'natural',
    'magical',
  ],

  pairsWellWith: [
    'mood-quiet-contemplation',
    'mood-nostalgic-polaroid',
    'cinematic-tarkovsky-poetic',
  ],
  forbiddenCombinations: [
    'design-brutalist-architectural',
    'design-y2k-chrome-millennium',
    'design-memphis-group-80s',
    'mood-urgent-revolutionary',
  ],
  bestForVerticals: [
    'kids-storybook',
    'food-artisanal',
    'travel-nature',
    'wellness-organic',
    'editorial',
    'cultural-institution',
  ],
  forbiddenForVerticals: ['tech-developer', 'finance', 'sports-athletic', 'fashion-streetwear'],
};

// ═══════════════════════════════════════════════════════════════
// 5. TARKOVSKY POETIC — Long takes, water, light, time
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_TARKOVSKY_POETIC: StyleDNA = {
  id: 'cinematic-tarkovsky-poetic',
  name: 'Tarkovsky Poetic Cinema',
  tagline: 'Long takes. Slow water. Sepia memory. Time made visible.',
  category: 'cinematic',
  era: 'mid-century-1950s',
  movement: 'cinematic-naturalism',
  intensity: 'moderate',

  aliases: [
    'tarkovsky',
    'andrei-tarkovsky',
    'tarkovsky-style',
    'stalker-aesthetic',
    'mirror-aesthetic',
    'solaris-aesthetic',
    'andrei-rublev',
    'poetic-cinema',
    'slow-cinema',
    'estilo tarkovsky',
    'tarkovsky',
    'cine poético',
    'cine lento',
    'tipo tarkovsky',
    'sepia poético',
    'agua y tiempo',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: ANDREI TARKOVSKY — Russian director (1932-1986) of Solaris, Stalker, Mirror, Andrei Rublev, The Sacrifice. Master of "sculpting in time." Long takes that breathe. Water moving slowly through frames. Sepia memories blending with monochrome present. NOT cold European arthouse — Tarkovsky's cinema is SPIRITUAL, deeply emotional, photographing the soul through landscape and weather. Time itself is the subject.

Typography:
  - Display: classical serif (Trajan, Garamond, Bodoni Old Style) — restrained, timeless.
  - Cyrillic-influenced display options (when appropriate).
  - Italic forms common for poetic phrases.
  - Generous line-spacing, tracking neutral.
  - Color: sepia (#A87E47), muted forest green, deep umber.
  - Hierarchy minimal — typography exists at margins, not as design feature.

Composition (THE Tarkovsky language):
  - Long takes implied through compositional patience.
  - Subject often deep in frame (small, contemplative).
  - Water, fire, mirrors, horses as recurring elements.
  - Tracking through landscape (slow lateral movement implied).
  - Foreground objects (glass, water, flame) refracting light.
  - Medium shots holding for emotional duration.

Color palette (sepia memory tones):
  - SEPIA dominant (#A87E47, #8B6914, #5D4E37).
  - Earth tones: clay, dust, oxide.
  - Muted greens of Russian forests (#3D5240, #5C7C5C).
  - Cool blues for water and reflections (#3D5A80).
  - Whites that have warmth (cream, oat).
  - Often shifts between sepia (memory/dream) and color (present) within same scene.

Photography (THE crucial element):
  - 35mm or 65mm film aesthetic (organic grain visible).
  - Available natural light — overcast days, golden hour, candlelight.
  - Long exposures implied by stillness.
  - Subjects often in motion through still landscape (or vice versa).
  - Water as MIRROR and TEXTURE simultaneously.
  - Reflections doubled (water + glass + mirror compositions).

Recurring visual motifs (Tarkovsky's vocabulary):
  - WATER (rain, streams, puddles, bathing scenes).
  - FIRE (candles, fireplaces, controlled burns).
  - HORSES (running through landscapes).
  - MILK (spilled, splashed, flowing).
  - GLASS panes with rain.
  - Birch trees, Russian forests.
  - Crumbling architecture, abandoned buildings.
  - Books, manuscripts, religious icons.
  - Hands handling small objects.

Atmosphere:
  - Always WEATHER — rain, snow, fog, mist.
  - Atmosphere obscures middle distance.
  - Light beams visible through atmosphere.
  - Time slows in poor weather.

Camera and movement:
  - SLOW lateral tracks across landscape.
  - Holds longer than comfortable (4-5 minute single takes).
  - Wide environmental shots (35-50mm).
  - Occasional intimate close-ups on hands or objects.
  - Camera follows characters but maintains distance.

Lighting:
  - Available natural light always preferred.
  - Window light at noon (harsh shadows tell story).
  - Candlelight for interior emotional scenes.
  - Backlit fog (god rays through trees).
  - Snow as light bouncer.

Architecture and landscapes:
  - Crumbling Russian rural architecture.
  - Wet rocks and moss-covered surfaces.
  - Birch tree forests (vertical white trunks).
  - Marsh landscapes, abandoned industrial.
  - Religious icon settings (Andrei Rublev).
  - Domestic interiors with peeling wallpaper.

Cultural references:
  - Solaris (1972)
  - Stalker (1979)
  - Mirror (1975)
  - Andrei Rublev (1966)
  - The Sacrifice (1986)
  - Nostalghia (1983)
  - Tarkovsky's "Sculpting in Time" essays
  - Russian icon painting tradition
  - Bela Tarr (kindred spirit)
  - Sergei Parajanov (visual cousin)
  - Hou Hsiao-hsien (Asian parallel)

Movement aesthetic:
  - SLOW. Patient. Inevitable.
  - Time passes visibly (water flowing, leaves falling, candles burning down).

What this style REJECTS:
  - Quick cuts.
  - Bright/cheerful color palettes.
  - Modern digital cinema sharpness.
  - Posed subjects.
  - Studio lighting drama.
  - Anything fast-paced.
  - Memphis joy, Y2K chrome, brutalist aggression.
`,

  palette: {
    foundation: ['#F5F2EB', '#A87E47'],
    primary: ['#5D4E37', '#3D5240', '#5C7C5C'],
    accent: ['#3D5A80', '#8B6914'],
  },

  typography: {
    display: ['Trajan Pro', 'Garamond', 'Bodoni Old Style'],
    body: ['Garamond', 'Caslon', 'Times New Roman'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Andrei Tarkovsky',
      'Vadim Yusov (cinematographer)',
      'Sven Nykvist (kindred DP)',
      'Bela Tarr (kindred director)',
      'Hou Hsiao-hsien',
    ],
    works: [
      'Solaris (1972)',
      'Stalker (1979)',
      'Mirror (1975)',
      'Andrei Rublev (1966)',
      'The Sacrifice (1986)',
    ],
    eras: ['Tarkovsky filmography 1962-1986'],
  },

  moodKeywords: [
    'contemplative',
    'spiritual',
    'patient',
    'memory',
    'sepia',
    'eternal',
    'poetic',
    'melancholic',
  ],

  pairsWellWith: [
    'cinematic-studio-ghibli-painterly',
    'cinematic-villeneuve-vast',
    'mood-melancholy-rainy',
    'mood-quiet-contemplation',
    'brand-yohji-yamamoto-noir',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
    'mood-urgent-revolutionary',
  ],
  bestForVerticals: [
    'cultural-institution',
    'editorial',
    'fashion-luxury',
    'wellness-spa',
    'art-gallery',
    'wine-spirits-premium',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic', 'tech-developer'],
};

// ─── Exports ────────────────────────────────────────────────────
export const CINEMATIC_DNAS: StyleDNA[] = [
  CINEMATIC_WES_ANDERSON,
  CINEMATIC_KUBRICK_SYMMETRIC,
  CINEMATIC_VILLENEUVE_VAST,
  CINEMATIC_STUDIO_GHIBLI,
  CINEMATIC_TARKOVSKY_POETIC,
];

export {
  CINEMATIC_WES_ANDERSON,
  CINEMATIC_KUBRICK_SYMMETRIC,
  CINEMATIC_VILLENEUVE_VAST,
  CINEMATIC_STUDIO_GHIBLI,
  CINEMATIC_TARKOVSKY_POETIC,
};
