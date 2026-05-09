/**
 * 🏷️ STYLE DNA — Brand References (Extra Pack)
 *
 * 5 DNAs adicionales basados en marcas icónicas con identidad visual codificada.
 *
 * NOTA LEGAL: Estos DNAs NO copian assets de las marcas. Capturan los
 * principios de diseño públicos que cualquier diseñador puede inspirarse.
 *
 * DNAs incluidos:
 *   1. brand-supreme-bold-typography      — Streetwear hype red box
 *   2. brand-tesla-futuristic-clean       — Auto premium tech minimalism
 *   3. brand-comme-des-garcons-deconstructed — Avant-garde fashion
 *   4. brand-byredo-luxury-restraint      — Niche perfume restraint
 *   5. brand-patagonia-honest-outdoor     — Outdoor authentic
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. SUPREME — Streetwear hype red box logo
// ═══════════════════════════════════════════════════════════════
const BRAND_SUPREME_BOLD: StyleDNA = {
  id: 'brand-supreme-bold-typography',
  name: 'Supreme Bold Typography',
  tagline: 'Red box. White Futura. Drop culture. Streetwear royalty.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'postmodernism',
  intensity: 'extreme',

  aliases: [
    'supreme',
    'supreme-style',
    'supreme-aesthetic',
    'red-box-logo',
    'streetwear-hype',
    'futura-bold',
    'box-logo',
    'drop-culture',
    'estilo supreme',
    'supreme',
    'streetwear hype',
    'logo caja roja',
    'tipo supreme',
    'estética streetwear',
    'cultura drop',
  ],

  archetypeBase: 'brutalist-text-hero',

  promptDirective: `
Aesthetic philosophy: SUPREME — NYC skate brand founded 1994 by James Jebbia. Red box logo, Futura Bold Italic, drop culture. NOT just "streetwear" — Supreme INVENTED hype merch as art. Their visual language is rebellious appropriation: classic art covered with red box, religious imagery defaced, corporate logos remixed. The aesthetic is INSTANTLY recognizable yet always provocative.

Typography (THE Supreme signature):
  - Display: Futura Bold Italic — ALWAYS. This is the brand's DNA.
  - White text on red box, or red text on stark backgrounds.
  - All-caps for hero, sentence case acceptable for subhead.
  - Tracking tight on the box logo (-0.02em).
  - Hero text often single word: "SUPREME", "BOX", "DROP", "FW24".
  - Type as logo, type as image.

Composition (the box logo dominance):
  - Red box with white Futura is FOCAL POINT.
  - Box can be top-left, center, or covering imagery.
  - Photography behind box: appropriated art, vintage imagery, model shots.
  - Off-center compositions, deliberate "wrong" placement.
  - Sometimes box BLEEDS off frame edges.
  - Square or vertical format (Instagram-native).

Color palette (the red box absolutes):
  - PRIMARY: Supreme Red (#DC2626) — exact tone matters.
  - White (#FFFFFF) for typography on red.
  - Pure black (#000000) for negative spaces.
  - When color photography behind: faded, vintage, Kodachrome aesthetic.
  - NEVER pastels, NEVER muted reds (must be SUPREME RED).

Photography (when used):
  - Vintage film aesthetic preferred (Kodachrome 64 looks).
  - Skate photography (kindred lineage — Big Brother, Thrasher).
  - Documentary photography appropriated (war photography, religious iconography).
  - Model photography in NYC streets.
  - Always RAW, never glossy commercial.
  - Halftone dots acceptable (xerox aesthetic).

Subjects (Supreme's vocabulary):
  - Skate culture references.
  - NYC street culture.
  - Appropriated fine art (Da Vinci, Caravaggio with box).
  - Religious imagery (Madonna, saints).
  - Hip-hop and metal culture references.
  - 90s nostalgia (Pulp Fiction, Larry Clark photography).

Materials and surfaces:
  - Cotton t-shirts.
  - Box logo on red background.
  - Sticker culture (laptops, signs covered).
  - Newsprint texture.
  - Sometimes glitch effects (digital decay).

Cultural references:
  - James Jebbia interviews
  - Supreme's drop culture model
  - Larry Clark photography (Kids 1995)
  - Harmony Korine films
  - Kim Hiorthøy zines
  - Original Stüssy lineage
  - Off-White (kindred but louder)
  - Palace Skateboards (UK parallel)

Movement aesthetic:
  - URGENT — drops happen Thursdays at 11am.
  - Implied scarcity, hype.

Texture/Material:
  - Cotton garment texture.
  - Sticker layering.
  - Wheatpaste poster aesthetic.

What this style REJECTS:
  - Polished commercial photography.
  - Soft pastel palettes.
  - Pretty fashion photography.
  - Anything corporate-feeling.
  - Sentimental imagery.
  - Multiple competing colors (red box rules).
  - "Tasteful" design.
`,

  palette: {
    foundation: ['#FFFFFF', '#000000'],
    primary: ['#DC2626'],
    accent: ['#FFFFFF', '#000000'],
    forbidden: ['#FFB6C1', '#E0BBE4'], // Soft palettes
  },

  typography: {
    display: ['Futura Bold Italic', 'Futura Heavy', 'Avenir Black'],
    body: ['Futura', 'Avenir'],
  },

  references: {
    brands: ['Supreme', 'Off-White', 'Stüssy', 'Palace Skateboards'],
    artists: [
      'James Jebbia (founder)',
      'Larry Clark (photographer)',
      'Harmony Korine (filmmaker)',
    ],
    works: [
      'Supreme Box Logo (1994)',
      'Larry Clark "Kids" (1995)',
      'Supreme drops culture',
    ],
    eras: ['Streetwear 1994-present', 'Drop culture era'],
  },

  moodKeywords: [
    'rebellious',
    'urgent',
    'iconic',
    'streetwear',
    'hype',
    'irreverent',
    'youth',
    'drop',
  ],

  pairsWellWith: [
    'design-brutalist-architectural',
    'mood-urgent-revolutionary',
    'cinematic-tarantino-pulp',
  ],
  forbiddenCombinations: [
    'brand-aesop-apothecary-minimal',
    'cinematic-wes-anderson-symmetric',
    'mood-quiet-contemplation',
  ],
  bestForVerticals: [
    'fashion-streetwear',
    'sports-athletic-street',
    'music-hip-hop',
    'youth-culture',
    'sneakers',
  ],
  forbiddenForVerticals: [
    'finance-conservative',
    'wellness-spa',
    'pharmaceutical',
    'wedding-services',
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. TESLA — Futuristic clean automotive premium
// ═══════════════════════════════════════════════════════════════
const BRAND_TESLA_FUTURISTIC: StyleDNA = {
  id: 'brand-tesla-futuristic-clean',
  name: 'Tesla Futuristic Clean',
  tagline: 'Silicon Valley meets automotive. Night drives. Single screen. Software religion.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'subtle',

  aliases: [
    'tesla',
    'tesla-style',
    'tesla-aesthetic',
    'silicon-valley-auto',
    'futuristic-clean',
    'electric-vehicle-premium',
    'cybertruck-aesthetic',
    'estilo tesla',
    'tesla',
    'futurista limpio',
    'auto premium tech',
    'tipo tesla',
    'silicon valley auto',
    'eléctrico premium',
  ],

  archetypeBase: 'full-bleed-cinematic',

  promptDirective: `
Aesthetic philosophy: TESLA — Elon Musk's electric vehicle company that reinvented automotive design and marketing (2008-present). Tesla's aesthetic is SILICON VALLEY MEETS AUTOMOTIVE — clean lines, no chrome detail, single touchscreen replacing every button, software-first thinking. Photography: night drives through tunnels, supercharger station moments, families inside cars on long trips. NOT traditional auto advertising (highway curves, sunset drives) — Tesla photography emphasizes TECHNOLOGY and FUTURE.

Typography (when in ad context):
  - Display: Tesla's custom font OR sleek geometric sans (Inter, Söhne, Helvetica Neue).
  - Light to medium weights (300-500), never bold.
  - White text on dark imagery, or stark black on white.
  - Generous tracking on display (+0.05em).
  - Single hero phrase: "Model Y", "Cybertruck", "Charging".
  - Numerical specs as supporting elements.

Composition (the Tesla world):
  - WIDE cinematic shots — car small in vast environment.
  - Or ULTRA-CLOSE — door handle detail, screen UI close-up.
  - Single car ALWAYS (never car family shots).
  - Architectural environments (modernist homes, urban streets, supercharger stations).
  - Negative space generous.
  - 16:9 cinematic aspect ratio for hero shots.

Color palette (the Tesla spectrum):
  - Pearl white (#FAFAFA) — Tesla's signature paint.
  - Midnight metallic black (#0A0A0A).
  - Solid red (Tesla Red Multi-Coat #C00018).
  - Silver metallic (#C0C0C0).
  - Deep blue night sky (#0A1F44).
  - Concrete gray (#7A7A7A) for urban backgrounds.
  - NEVER warm earth tones — always cool, futuristic.

Photography (the Tesla cinema):
  - Shot at NIGHT or BLUE HOUR (twilight) for premium feel.
  - Or harsh midday for desert/highway shots.
  - Supercharger stations LIT from within — practical lights.
  - Car headlights and taillights as design features.
  - Cinematic anamorphic lens flares acceptable.
  - Color graded: cool, slightly desaturated, premium.

Camera:
  - Wide angle (24-35mm) for environmental.
  - Telephoto (85-135mm) for product detail.
  - Drone shots common (overhead, sweeping).
  - Track shots paralleling moving car.
  - Slow zoom on detail (wheel, door handle, screen).

Lighting:
  - Available night light (moonlight, streetlamps).
  - LED supercharger ambient.
  - Single dramatic key for product hero.
  - Long exposure light trails from passing cars.

Materials and surfaces:
  - Brushed aluminum.
  - Glass (panoramic roof, windshield).
  - Leather interior (vegan in newer models).
  - Touch screen (the central design element).
  - Concrete floors (showroom and supercharger).

UI/Software design:
  - Single 15-17" landscape touchscreen.
  - Map-centric UI.
  - Minimalist iconography.
  - Dark mode default.
  - White typography on near-black backgrounds.

Cultural references:
  - Tesla product photography 2012-present
  - SpaceX visual language (kindred Musk aesthetic)
  - Apple keynote videos (lineage)
  - Knight Rider (1980s) — automotive futurism
  - Blade Runner 2049 (architectural inspiration)
  - Joel Beverly photography
  - Marc Newson (Apple Car designer)

Movement aesthetic:
  - Smooth, electric (no gear shifts).
  - Implied speed via composition (long tracks, light trails).

Materials:
  - Glass, aluminum, technology surfaces.
  - Concrete environments.
  - Sometimes sand (Mars/Mojave aesthetic for Cybertruck).

What this style REJECTS:
  - Traditional automotive photography (chrome, leather close-ups, dial gauges).
  - Family lifestyle clichés (kids in back seat, dog in trunk).
  - Sunset highway sentimentality (BMW/Mercedes territory).
  - Warm color grading.
  - Vintage references.
  - Brand book layout (Tesla doesn't do brand books — software updates instead).
`,

  palette: {
    foundation: ['#0A0A0A', '#FAFAFA', '#7A7A7A'],
    primary: ['#FFFFFF', '#000000'],
    accent: ['#C00018', '#0A1F44', '#C0C0C0'],
  },

  typography: {
    display: ['Inter Display', 'Söhne', 'Helvetica Neue Light'],
    body: ['Inter', 'Söhne'],
  },

  references: {
    brands: ['Tesla', 'SpaceX (kindred)', 'Rivian (parallel)', 'Lucid (parallel)'],
    artists: [
      'Franz von Holzhausen (Tesla designer)',
      'Marc Newson (Apple Car)',
      'Elon Musk vision',
    ],
    works: [
      'Tesla Model S launch (2012)',
      'Cybertruck reveal (2019)',
      'Tesla supercharger network photography',
    ],
    eras: ['Tesla product photography 2012-present', 'EV revolution 2010s+'],
  },

  moodKeywords: [
    'futuristic',
    'clean',
    'premium',
    'technological',
    'silent',
    'electric',
    'minimalist',
    'aspirational',
  ],

  pairsWellWith: [
    'brand-apple-keynote-minimal',
    'cinematic-villeneuve-vast',
    'design-swiss-international',
  ],
  forbiddenCombinations: [
    'mood-nostalgic-polaroid',
    'design-memphis-group-80s',
    'cinematic-wes-anderson-symmetric',
  ],
  bestForVerticals: [
    'automotive-electric',
    'tech-saas',
    'consumer-electronics',
    'energy-renewable',
    'real-estate-modernist',
  ],
  forbiddenForVerticals: ['food-traditional', 'kids-toys', 'wellness-organic', 'wedding-services'],
};

// ═══════════════════════════════════════════════════════════════
// 3. COMME DES GARÇONS — Avant-garde deconstructed fashion
// ═══════════════════════════════════════════════════════════════
const BRAND_COMME_DES_GARCONS: StyleDNA = {
  id: 'brand-comme-des-garcons-deconstructed',
  name: 'Comme des Garçons Deconstructed',
  tagline: 'Body meets dress. Fashion as anti-fashion. Rei Kawakubo philosophy.',
  category: 'brand-reference',
  era: 'timeless',
  movement: 'deconstructivism',
  intensity: 'extreme',

  aliases: [
    'cdg',
    'comme-des-garcons',
    'rei-kawakubo',
    'kawakubo-style',
    'deconstructed-fashion',
    'avant-garde-fashion',
    'anti-fashion',
    'lumps-and-bumps',
    'estilo cdg',
    'comme des garçons',
    'rei kawakubo',
    'moda deconstruida',
    'tipo cdg',
    'fashion vanguardia',
    'anti-moda',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: COMME DES GARÇONS — Founded 1969 by Rei Kawakubo in Tokyo. CDG is RADICAL anti-fashion that became fashion. "Body Meets Dress" SS1997 (the famous "lumps and bumps" collection) showed the world that clothing could distort bodies, create new silhouettes, REJECT prettiness. NOT just minimalist (that's Yohji) — CDG is constructed, deconstructed, reconstructed. Holes, frays, exposed seams as features. Color used as RUPTURE, not decoration.

Typography (when in editorial):
  - Display: minimal sans (Helvetica Bold, Univers Bold) at extreme sizes.
  - Or hand-lettered (CDG's Play line uses heart graphic).
  - Often Japanese characters integrated.
  - White text on stark black, black text on stark white.
  - All-caps acceptable, generous tracking on display.
  - Editorial titles in italic serif acceptable.

Composition:
  - SUBJECT IS PROTAGONIST always — body meeting clothing.
  - Often centered figure on stark background.
  - Sometimes diagonal compositions implying motion.
  - CROPPED figures — heads cut off (Rei's signature decision).
  - Body parts as focus (a sleeve, a fold, a hole).
  - Square or 4:5 format.

Color palette (CDG ruptures):
  - DOMINANT: pure black (#0A0A0A) and pure white (#FAFAFA).
  - ACCENTS: shocking pink (#FF00FF), neon yellow (#FFFF00), bright red (#E60000).
  - Earth tones in collections referencing nature.
  - When color appears, it's PURE and SATURATED — not muted.
  - The famous "Polka Dots" collection (color and pattern as concept).
  - NO sentimental colors (no rose pink, no peach).

Photography:
  - Black and white preferred for runway documentation.
  - Color photography sharp, editorial, magazine-quality.
  - Subjects often unsmiling, almost confrontational.
  - Lighting clean studio or natural — never moody romantic.
  - Crisp digital or medium format film.
  - Focus on garment construction, fabric behavior.

Garment philosophy (THE soul):
  - DECONSTRUCTED — exposed seams, raw edges, deliberate "imperfection."
  - VOLUMETRIC — clothing has architectural shape independent of body.
  - ASYMMETRIC — one sleeve longer, one side different.
  - HOLES, slits, frays as features.
  - LAYERS upon layers (a CDG outfit has 4-7 garments visible).

Subjects (when in fashion ad):
  - Models often older (40s-70s) — Rei rejects youth obsession.
  - Children in adult clothes (CDG's playful series).
  - Mannequins as substitutes for human models.
  - Performers, artists, dancers (not professional models).

Cultural references:
  - Comme des Garçons "Body Meets Dress" SS1997 (the iconic "lumps and bumps")
  - Rei Kawakubo Met Costume Institute exhibition (2017)
  - Junya Watanabe (CDG protégé)
  - Antwerp Six (kindred)
  - Yohji Yamamoto (Japanese parallel)
  - Margiela (Belgian deconstructionist parallel)
  - Issey Miyake (Japanese predecessor)

Movement aesthetic:
  - Subjects MOVING within static frame.
  - Garments capturing motion (folds, drape, swing).

Texture/Material:
  - Wool felt (CDG's signature material).
  - Raw silk, denim, leather.
  - Frayed edges visible.
  - Hand-stitched details.
  - Layered construction.

What this style REJECTS:
  - "Pretty" fashion photography.
  - Sexy fashion (CDG is intellectual, not sexual).
  - Smooth, finished construction.
  - Western fashion conventions (model walks toward camera, smiling).
  - Sentimental color palettes.
  - Glamour lighting.
  - Anything Helmut Newton-coded (different lineage).
`,

  palette: {
    foundation: ['#0A0A0A', '#FAFAFA'],
    primary: ['#000000', '#FFFFFF'],
    accent: ['#FF00FF', '#FFFF00', '#E60000'],
    forbidden: ['#FFB6C1', '#FFE4B5'], // Sentimental colors
  },

  typography: {
    display: ['Helvetica Bold', 'Univers Bold', 'Hand-lettered'],
    body: ['Helvetica', 'Garamond'],
  },

  references: {
    brands: ['Comme des Garçons', 'Junya Watanabe', 'Margiela', 'Issey Miyake'],
    artists: [
      'Rei Kawakubo',
      'Junya Watanabe',
      'Martin Margiela',
      'Issey Miyake',
    ],
    works: [
      'Body Meets Dress SS1997 ("Lumps and Bumps")',
      'Rei Kawakubo Met Costume Institute (2017)',
      'CDG Play heart logo (Filip Pagowski)',
    ],
    eras: ['Japanese avant-garde fashion 1981-present'],
  },

  moodKeywords: [
    'avant-garde',
    'deconstructed',
    'intellectual',
    'radical',
    'sculptural',
    'experimental',
    'anti-fashion',
    'philosophical',
  ],

  pairsWellWith: [
    'brand-yohji-yamamoto-noir',
    'cinematic-tarkovsky-poetic',
    'design-brutalist-architectural',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
    'photo-jonathan-lovekin-food',
  ],
  bestForVerticals: [
    'fashion-avant-garde',
    'fashion-luxury',
    'art-gallery',
    'cultural-institution',
    'editorial',
    'perfume-niche',
  ],
  forbiddenForVerticals: ['food-fast', 'kids-toys', 'sports-athletic', 'tech-saas-mainstream'],
};

// ═══════════════════════════════════════════════════════════════
// 4. BYREDO — Niche perfume luxury restraint
// ═══════════════════════════════════════════════════════════════
const BRAND_BYREDO_LUXURY: StyleDNA = {
  id: 'brand-byredo-luxury-restraint',
  name: 'Byredo Luxury Restraint',
  tagline: 'Rectangular bottles. Black caps. Stockholm minimalism. Niche becomes universal.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'subtle',

  aliases: [
    'byredo',
    'byredo-style',
    'niche-perfume',
    'stockholm-minimal',
    'ben-gorham',
    'le-labo-style',
    'frederic-malle',
    'niche-fragrance',
    'estilo byredo',
    'byredo',
    'perfume nicho',
    'minimalismo estocolmo',
    'tipo byredo',
    'fragancia premium',
  ],

  archetypeBase: 'hero-typographic-apple',

  promptDirective: `
Aesthetic philosophy: BYREDO — Stockholm-based luxury fragrance house founded 2006 by Ben Gorham. Byredo redefined niche perfumery's visual language: rectangular flacons with black caps, beige paper labels with classical typography, minimal storefronts. NOT traditional luxury (gold ornament, French heritage flourishes) — Byredo is SCANDINAVIAN MINIMALISM applied to fragrance. The bottle is sculpture. The label is poetry. The brand is restraint.

Typography:
  - Display: classical serif (Caslon, Garamond, custom) or Helvetica.
  - All-caps for product names with extreme tracking (+0.15em).
  - Sentence case for brief poetic descriptions.
  - Color: deep brown (#5D4E37), inkwell black, occasional muted gold.
  - Hierarchy minimal — the bottle is hero, type supports.
  - Italic for emphasis on poetic notes.

Composition:
  - Single bottle centered on neutral seamless.
  - 4:5 vertical format common.
  - Sometimes flat-lay with bottle + label + ingredients.
  - Sometimes lifestyle: bottle on marble counter with single flower.
  - Generous negative space (60-70%).
  - Rule of thirds anchored on bottle center.

Color palette (Stockholm minimalism):
  - FOUNDATION: warm cream (#F5F2EB), bone (#FAF8F0), oat (#E8DDC9).
  - Bottle: clear glass with amber/honey liquid visible (#C4956A, #B8804A).
  - Labels: brown craft paper (#A87E47), occasional pure white.
  - Bottle caps: pure black (#0A0A0A).
  - Accents: muted forest green (#3D5240), oxblood (#722F37).
  - NEVER bright colors, NEVER pastels.

Bottle photography (THE soul):
  - Bottle as SCULPTURE — single hero shot.
  - Soft window light from one side.
  - Subtle shadow on opposite side.
  - Glass reflections rendered carefully (not blown out).
  - 85mm or 100mm macro lens.
  - F/4-f/5.6 aperture (deep DOF on bottle, soft background).

Materials and surfaces:
  - Marble (carrara, calacatta) for surfaces.
  - Aged brass (not shiny gold).
  - Linen and natural fabrics.
  - Craft paper for labels.
  - Glass bottles (rectangular, weighty).
  - Wood (oak, walnut) furniture.

Lighting:
  - Window light at golden hour or overcast morning.
  - Single soft key from one side.
  - Subtle gradient shadows.
  - Backlight occasionally for translucent liquid.
  - NEVER harsh, NEVER colored gels.

Photography style (lifestyle when used):
  - Bottle on bedside table, marble bath, kitchen counter.
  - Single human element (a hand, partial face) — not full models.
  - Warm domestic environments.
  - Books, flowers, fabric as supporting elements.
  - Stockholm or Brooklyn brownstone aesthetic.

Cultural references:
  - Byredo product photography 2006-present
  - Aesop (kindred Australian apothecary)
  - Le Labo (kindred NYC niche)
  - Frédéric Malle (parallel French niche)
  - The Row brand identity (kindred minimalism)
  - Margaret Howell (kindred restraint)
  - Cereal magazine
  - The Gentlewoman magazine

Movement aesthetic:
  - Stillness, ritual, contemplation.

Texture/Material:
  - Glass weight implied through reflections.
  - Marble veining as visual texture.
  - Linen weave details.
  - Brass patina.

What this style REJECTS:
  - Traditional luxury ornament (gold flourishes, Versailles).
  - Bright color photography.
  - Lifestyle photography with smiling models.
  - Decorative typography (no scripts, no flourishes).
  - Multiple competing accents.
  - Anything that feels "marketed" rather than "curated."
  - Stock photography aesthetics.
`,

  palette: {
    foundation: ['#F5F2EB', '#FAF8F0', '#E8DDC9'],
    primary: ['#A87E47', '#5D4E37'],
    accent: ['#0A0A0A', '#3D5240', '#722F37', '#C4956A'],
    forbidden: ['#FF6EC7', '#FFEB3B'],
  },

  typography: {
    display: ['Caslon', 'Garamond', 'Helvetica'],
    body: ['Caslon', 'Garamond', 'Helvetica Neue Light'],
    accent: ['Italic serif'],
  },

  references: {
    brands: ['Byredo', 'Le Labo', 'Frédéric Malle', 'Aesop', 'The Row'],
    artists: ['Ben Gorham (founder Byredo)', 'Edouard Roschi (Le Labo)'],
    works: [
      'Byredo bottle design (2006-present)',
      'Le Labo retail experience',
      'Aesop store interiors',
    ],
    eras: ['Niche fragrance 2006-present', 'Scandinavian minimalism'],
  },

  moodKeywords: [
    'restrained',
    'considered',
    'scandinavian',
    'sculptural',
    'patient',
    'curated',
    'minimal',
    'apothecary',
  ],

  pairsWellWith: [
    'brand-aesop-apothecary-minimal',
    'mood-quiet-contemplation',
    'photo-irving-penn-product',
    'brand-yohji-yamamoto-noir',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'perfume-niche',
    'beauty-luxury',
    'fashion-luxury',
    'wellness-spa',
    'art-gallery',
    'editorial',
    'jewelry-craft',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 5. PATAGONIA — Honest outdoor authentic
// ═══════════════════════════════════════════════════════════════
const BRAND_PATAGONIA_HONEST: StyleDNA = {
  id: 'brand-patagonia-honest-outdoor',
  name: 'Patagonia Honest Outdoor',
  tagline: '"Don\'t buy this jacket." Real climbers. Real mountains. Activist commerce.',
  category: 'brand-reference',
  era: 'contemporary-2020s',
  movement: 'documentary-realism',
  intensity: 'moderate',

  aliases: [
    'patagonia',
    'patagonia-style',
    'patagonia-aesthetic',
    'outdoor-honest',
    'climbing-photography',
    'yvon-chouinard',
    'eco-brand',
    'outdoor-activist',
    'estilo patagonia',
    'patagonia',
    'outdoor honesto',
    'fotografía escalada',
    'tipo patagonia',
    'marca activista',
    'aventura real',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: PATAGONIA — Outdoor brand founded 1973 by climber Yvon Chouinard. Patagonia rejected traditional outdoor advertising (smiling models in Photoshop landscapes) and committed to REAL CLIMBERS, REAL MOUNTAINS, REAL ENVIRONMENTAL PHOTOGRAPHY. Their famous "Don't Buy This Jacket" Black Friday ad (2011) is anti-consumerism as marketing. Patagonia photography is documentary cinema applied to gear.

Typography (Patagonia's restraint):
  - Display: serif (their wordmark uses "Spencerian" custom serif).
  - Body: clean sans (Avenir, Helvetica Neue) or warm serif (Garamond).
  - Color: forest green (#2D4A2B), warm brown (#8B5E2F), or stark black on cream.
  - Hierarchy editorial — like long-form journalism.
  - Patagonia uses TEXT extensively (their ads have substantial body copy).

Composition:
  - WIDE environmental shots — climber/hiker tiny in vast landscape.
  - Or TIGHT documentary portraits — weathered face, equipment detail.
  - Vertical format common for mobile-native (climbing routes are vertical).
  - 16:9 cinematic for hero shots.
  - Negative space = SKY usually (mountains lead eye up).

Color palette (the natural world):
  - Foundation: alpine sky blue (#5DADE2), clear glacier (#A8D8E8).
  - Earth: warm sand (#C4956A), forest moss (#3D5240), granite gray (#7A7A7A).
  - Patagonia signature: forest green (#2D4A2B), oxblood red (#722F37), mustard (#D4A017).
  - Snow whites (#FAFAFA), volcanic black (#1A1A1A).
  - WARM tones in golden hour photography.
  - Saturation pushed slightly (nature looks natural, but vivid).

Photography (THE Patagonia ethic):
  - REAL CLIMBERS, REAL HIKERS — never models pretending.
  - Documentary photography by climbing photographers (Jimmy Chin, Renan Ozturk).
  - Environmental fidelity — mountains photographed as they actually look.
  - Moments of EFFORT visible (sweat, cold, fatigue).
  - Equipment shown in USE, not displayed.
  - Worn gear preferred (old Patagonia jackets are status symbols).

Subjects:
  - Climbers on rock or ice walls.
  - Hikers in vast alpine.
  - Surfers (their water lineage).
  - Children playing in nature (real kids, real dirt).
  - Indigenous peoples (Patagonia partners with).
  - Activists (their environmental advocacy).

Light and atmosphere:
  - GOLDEN HOUR — alpenglow on mountains.
  - BLUE HOUR — twilight in mountains.
  - Snow reflecting harsh midday sun.
  - Storm light — dramatic clouds breaking.
  - Window light in cabin/tent interiors.
  - REAL atmosphere (cold breath visible, sweat, snow falling).

Camera:
  - Wide angle for environmental (16-24mm).
  - Telephoto for compressing distant mountains (200-400mm).
  - Action cam aesthetic (chest mount during climb).
  - 35mm or medium format for documentary portraits.
  - Sometimes 35mm film grain for nostalgic warmth.

Materials and surfaces:
  - Worn nylon, faded fabrics.
  - Rope, carabiners, ice axes.
  - Granite, ice, wind-carved rock.
  - Tent canvas, rain-stained.
  - Hot coffee in steel mugs.

Activism and editorial integration:
  - Patagonia photography often comes WITH long-form text:
    • Climate change essays
    • Worker fair-trade stories
    • Indigenous land rights
  - Layout includes BODY COPY substantial (1000+ words).
  - Magazine-quality editorial design.

Cultural references:
  - Patagonia advertising 1973-present
  - "Don't Buy This Jacket" New York Times ad (2011)
  - Patagonia Provisions (food line)
  - The North Face (kindred but more commercial)
  - Arc'teryx (kindred but more technical)
  - Filson (kindred but more Americana)
  - Jimmy Chin documentaries (Free Solo, Meru)
  - Renan Ozturk photography
  - "The Power of One Voice" (Yvon Chouinard book)

Movement aesthetic:
  - Implied effort and motion.
  - Wind through hair, snow falling, breath visible.

Texture/Material:
  - Real fabric textures (Polartec, GORE-TEX, Capilene).
  - Weathered surfaces (rock, ice, wood).
  - Authenticity over polish.

What this style REJECTS:
  - Models smiling in pristine clothing.
  - Photoshopped landscapes.
  - "Adventure" as costume.
  - Aspirational without authenticity.
  - Studio photography of outdoor gear.
  - Commercial fashion photography.
  - Patagonia would never use Helmut Newton aesthetics.
`,

  palette: {
    foundation: ['#5DADE2', '#FAFAFA', '#A8D8E8'],
    primary: ['#2D4A2B', '#8B5E2F', '#C4956A'],
    accent: ['#722F37', '#D4A017', '#1A1A1A'],
  },

  typography: {
    display: ['Spencerian', 'Garamond', 'Avenir'],
    body: ['Avenir', 'Helvetica Neue', 'Garamond'],
  },

  references: {
    brands: ['Patagonia', 'Arc\'teryx', 'The North Face', 'Filson'],
    artists: [
      'Yvon Chouinard (founder)',
      'Jimmy Chin (climber/photographer)',
      'Renan Ozturk (climber/photographer)',
      'Cory Richards (photographer)',
    ],
    works: [
      '"Don\'t Buy This Jacket" NYT ad (2011)',
      'Free Solo (2018 Chin documentary)',
      'Meru (2015 Chin documentary)',
      'Patagonia catalog 1973-present',
    ],
    eras: ['Outdoor activist marketing 1973-present'],
  },

  moodKeywords: [
    'authentic',
    'rugged',
    'environmental',
    'documentary',
    'committed',
    'natural',
    'adventurous',
    'honest',
  ],

  pairsWellWith: [
    'photo-vivian-maier-street',
    'cinematic-villeneuve-vast',
    'mood-nostalgic-polaroid',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'design-memphis-group-80s',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'outdoor-recreation',
    'sports-athletic',
    'travel-adventure',
    'environmental',
    'food-organic',
    'nonprofit-environmental',
    'fashion-utility',
  ],
  forbiddenForVerticals: ['fashion-luxury', 'beauty-traditional', 'finance', 'wedding-services'],
};

// ─── Exports ────────────────────────────────────────────────────
export const BRAND_REFERENCE_EXTRA_DNAS: StyleDNA[] = [
  BRAND_SUPREME_BOLD,
  BRAND_TESLA_FUTURISTIC,
  BRAND_COMME_DES_GARCONS,
  BRAND_BYREDO_LUXURY,
  BRAND_PATAGONIA_HONEST,
];

export {
  BRAND_SUPREME_BOLD,
  BRAND_TESLA_FUTURISTIC,
  BRAND_COMME_DES_GARCONS,
  BRAND_BYREDO_LUXURY,
  BRAND_PATAGONIA_HONEST,
};
