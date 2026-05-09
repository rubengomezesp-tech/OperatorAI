/**
 * 🏛️ STYLE DNA — Eras Históricas
 *
 * 5 DNAs basados en eras visuales icónicas que abarcan siglos de historia.
 * Cada era codificó una sensibilidad visual reconocible.
 *
 * DNAs incluidos:
 *   1. era-baroque-chiaroscuro-1600s   — Caravaggio dark drama
 *   2. era-art-deco-1920s              — Geometric luxury 20s
 *   3. era-mid-century-1950s           — Don Draper warmth
 *   4. era-cyberpunk-1980s-neon        — Blade Runner original
 *   5. era-vaporwave-2010s             — Internet aesthetic glow
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. BAROQUE CHIAROSCURO 1600s — Caravaggio dark drama
// ═══════════════════════════════════════════════════════════════
const ERA_BAROQUE_CHIAROSCURO: StyleDNA = {
  id: 'era-baroque-chiaroscuro-1600s',
  name: 'Baroque Chiaroscuro 1600s',
  tagline: 'Caravaggio darkness. Single candle. Saint or sinner emerging from void.',
  category: 'era-historical',
  era: 'baroque-1600s',
  movement: 'modernism',
  intensity: 'extreme',

  aliases: [
    'baroque',
    'caravaggio',
    'caravaggio-style',
    'chiaroscuro',
    'tenebrism',
    'rembrandt-light',
    'dutch-golden-age',
    'baroque-painting',
    '1600s-art',
    'estilo barroco',
    'caravaggio',
    'claroscuro',
    'tenebrismo',
    'tipo caravaggio',
    'pintura barroca',
    'siglo XVII',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: BAROQUE CHIAROSCURO (1600s) — The visual revolution led by Caravaggio (1571-1610), Artemisia Gentileschi (1593-1656), Rembrandt van Rijn (1606-1669), and the Dutch Golden Age. NOT religious art generally — this is the SPECIFIC LIGHT TECHNIQUE that defined Western painting for 200+ years. Single candle or window in vast darkness. Saint or sinner emerging from void. Drama as metaphysics. Sacred and profane sharing same dramatic illumination.

Typography (when in editorial):
  - Display: classical serif (Trajan Pro for Roman gravitas, Adobe Caslon, Garamond).
  - All-caps with extreme tracking for inscription feel.
  - Italic for Latin or biblical phrases.
  - Color: deep umber (#5D4E37), inkwell black, antique gold (#D4AF37).
  - Hierarchy of inscription — like cathedral plaques.
  - Decorative initial letter capitals acceptable.

Composition (THE Baroque drama):
  - SUBJECT EMERGING FROM DARKNESS — most of frame in shadow.
  - Single light source illuminating subject from one side.
  - Diagonal compositions — dramatic action lines.
  - Subjects frozen MID-MOTION (Caravaggio captures peak action).
  - Heavy framing devices (architectural elements, drapery).
  - Foreground subject + middleground action + background void.

Color palette (the dark drama):
  - DOMINANT: deep blacks (#0A0A0A) and dark umbers (#3D2F2A).
  - HIGHLIGHTS: warm flesh tones (#D4A582) catching candlelight.
  - ACCENTS: blood red (#722F37), antique gold (#D4AF37), crimson (#A00000).
  - Earth tones: ochre (#A87E47), sienna (#A05A4A).
  - NEVER bright pastels.
  - NEVER cool blues unless deliberate dramatic contrast.

Lighting (THE soul — TENEBRISM):
  - SINGLE LIGHT SOURCE always — candle, window, divine intervention.
  - Subject lit FROM ONE SIDE, deep shadow on opposite.
  - HIGH CONTRAST — pure darkness AND pure highlight.
  - Light defines form; absence of light is just as expressive.
  - NEVER fill light, NEVER soft global illumination.
  - Faces half in light, half in shadow (psychological complexity).

Subject treatment:
  - Subjects from working class (Caravaggio's models were street people).
  - Saints with DIRTY FEET (radical realism for the era).
  - Hands as protagonists (caught reaching, gesturing, holding).
  - Faces with EMOTIONAL SPECIFICITY — fear, ecstasy, doubt.
  - Bodies posed AT MOMENT of dramatic action.

Photography (when translating to modern):
  - Studio with single key light (mimicking candlelight).
  - 50mm or 85mm prime lens.
  - F/2.8-f/4 (medium DOF).
  - Subject's lit side sharp, shadow side may have texture loss.
  - Rich shadow detail preserved (not crushed black).
  - Slight oil-painting color grade (warm, slightly desaturated).

Subjects (the Baroque cast):
  - Saints in mystical experience (Caravaggio Saint Matthew).
  - Judith and Holofernes (Gentileschi violence and triumph).
  - Self-portraits in dramatic light (Rembrandt).
  - Still life with single light (Dutch vanitas).
  - Working class figures in religious roles.
  - Couples in dramatic embrace or conflict.

Materials and textures:
  - Velvet, brocade, heavy drapery.
  - Aged leather, brass, candles.
  - Stone walls, wooden tables.
  - Pewter, silver, occasional gold leaf.
  - Worn linen, embroidered tapestries.
  - Skin with REAL pores, wrinkles, character.

Cultural references:
  - Caravaggio "Calling of Saint Matthew" (1599-1600)
  - Caravaggio "Judith Beheading Holofernes" (1599)
  - Artemisia Gentileschi "Judith Slaying Holofernes" (1620)
  - Rembrandt "The Night Watch" (1642)
  - Rembrandt self-portraits
  - Vermeer "Girl with a Pearl Earring" (1665)
  - Georges de La Tour candle paintings
  - Jusepe de Ribera Spanish baroque
  - Modern parallels: Sebastião Salgado photography
  - Cinematography: Barry Lyndon (Kubrick), The Revenant (Lubezki)

Movement aesthetic:
  - FROZEN drama — peak action captured.
  - Implied violent motion just before/after.

Architecture (when present):
  - Stone walls, vaulted ceilings.
  - Worn wooden beams.
  - Single-pane windows letting light slant in.
  - Cathedral spaces.
  - Domestic interiors with one window.

What this style REJECTS:
  - Soft global illumination.
  - Bright cheerful palettes.
  - Modern technology in frame.
  - Crisp digital perfection.
  - Multiple competing light sources.
  - Sentimental warmth (this is dramatic warmth, not gentle).
  - Anything 20th or 21st century technology-coded.
`,

  palette: {
    foundation: ['#0A0A0A', '#3D2F2A'],
    primary: ['#D4A582', '#5D4E37'],
    accent: ['#722F37', '#D4AF37', '#A00000', '#A87E47'],
    forbidden: ['#FF6EC7', '#00CED1'], // Modern colors
  },

  typography: {
    display: ['Trajan Pro', 'Adobe Caslon', 'Garamond'],
    body: ['Adobe Caslon', 'Garamond'],
    accent: ['Italic serif', 'Decorative caps'],
  },

  references: {
    artists: [
      'Caravaggio',
      'Artemisia Gentileschi',
      'Rembrandt van Rijn',
      'Vermeer',
      'Georges de La Tour',
      'Jusepe de Ribera',
    ],
    works: [
      'Calling of Saint Matthew (Caravaggio 1600)',
      'Judith Slaying Holofernes (Gentileschi 1620)',
      'The Night Watch (Rembrandt 1642)',
      'Girl with a Pearl Earring (Vermeer 1665)',
    ],
    eras: ['Italian Baroque 1600s', 'Dutch Golden Age 1600s', 'Spanish Tenebrism 1600s'],
  },

  moodKeywords: [
    'dramatic',
    'reverent',
    'sacred',
    'tenebrist',
    'theatrical',
    'monumental',
    'classical',
    'profound',
  ],

  pairsWellWith: [
    'cinematic-kubrick-symmetric',
    'mood-quiet-contemplation',
    'cinematic-tarkovsky-poetic',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'design-memphis-group-80s',
    'era-vaporwave-2010s',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'fashion-luxury',
    'wine-spirits-premium',
    'cultural-institution',
    'jewelry-luxury',
    'fragrance-niche',
    'editorial',
    'art-gallery',
  ],
  forbiddenForVerticals: ['kids-toys', 'tech-saas', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 2. ART DECO 1920s — Geometric luxury
// ═══════════════════════════════════════════════════════════════
const ERA_ART_DECO: StyleDNA = {
  id: 'era-art-deco-1920s',
  name: 'Art Deco 1920s Geometric Luxury',
  tagline: 'Chrysler Building. Gatsby gold. Geometric sunbursts. The roaring twenties.',
  category: 'era-historical',
  era: 'art-deco-1920s',
  movement: 'modernism',
  intensity: 'bold',

  aliases: [
    'art-deco',
    'art-deco-style',
    'art-deco-1920s',
    'gatsby',
    'roaring-twenties',
    'chrysler-building',
    'geometric-luxury',
    'cassandre',
    'estilo art deco',
    'art deco',
    'años 20',
    'gatsby',
    'geometría dorada',
    'tipo art deco',
    'chrysler',
    'lujo geométrico',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: ART DECO (1920s-1930s) — The geometric luxury aesthetic of post-WWI optimism. Sunburst patterns, stepped silhouettes, chrome and gold, geometric typography. NOT generic "vintage" — Art Deco is SPECIFIC: Chrysler Building (1930), Hoover Dam, Cassandre's poster work, Erté fashion illustration, Gatsby aesthetic. The decorative arts movement that fused industrial precision with luxury craft.

Typography (THE Art Deco signature):
  - Display: geometric sans-serif with Art Deco character (Broadway, Parisian, ITC Bauhaus, Gabriel Sans).
  - Letters often STRETCHED VERTICALLY (compressed letterforms common).
  - All-caps for hero, generous tracking (+0.10em).
  - Beveled edges, geometric flourishes.
  - Sometimes THREE-DIMENSIONAL extruded letterforms.
  - Italic forward-leaning common (forward-thinking energy).

Composition (THE geometric world):
  - SYMMETRIC compositions with central axis.
  - Stepped pyramidal forms (Chrysler Building stepped tower).
  - SUNBURST radiating from focal point.
  - Streamlined diagonals (speed and progress).
  - Strict geometric grids.
  - Decorative borders with geometric patterns.

Color palette (the gold and lacquer spectrum):
  - PRIMARY: warm gold (#D4AF37), bronze (#CD7F32), antique brass (#B8860B).
  - DEEP BLACK lacquer (#0A0A0A).
  - PEARLESCENT WHITE (#F5F5DC).
  - JEWEL TONES: emerald (#50C878), ruby (#9B111E), sapphire (#0F52BA).
  - SOFT PASTELS: dusty rose (#D4A5A5), cream (#FFFDD0).
  - NEVER neon, NEVER computer-graphics colors.

Patterns and motifs (signature):
  - SUNBURST radiating lines.
  - STEPPED PYRAMID forms.
  - ZIGZAG patterns.
  - CHEVRON arrows.
  - GEOMETRIC FLORALS (stylized flowers).
  - SCROLL borders.
  - ROSETTE medallions.

Materials and surfaces:
  - LACQUERED black.
  - POLISHED CHROME.
  - INLAID WOOD (marquetry).
  - MOTHER-OF-PEARL inlay.
  - VELVET, fur, satin.
  - MARBLE in geometric inlay.

Subjects (the Art Deco world):
  - Cocktail party culture.
  - Streamlined automobiles, locomotives, ocean liners.
  - Sphinx-like women in beaded gowns.
  - Gentlemen in tuxedos with white scarves.
  - Skyscrapers (Chrysler, Empire State).
  - Geometric still life with cocktails, cigarettes.

Photography style (when translating to modern):
  - Studio lighting with hard edges.
  - Gold and bronze color grade.
  - Subjects in elegant Art Deco interiors.
  - High contrast — sharp shadows from architectural elements.
  - Slight grain (period-appropriate for 1920s photography).
  - 4x5 large format aesthetic.

Architecture (when present):
  - SKYSCRAPERS with stepped tops.
  - Lobbies with marble inlay floors.
  - Hotels with chrome ELEVATOR DOORS.
  - Theatres with sunburst proscenium arches.
  - Train stations with vaulted ceilings.

Cultural references:
  - Chrysler Building (William Van Alen 1930)
  - The Great Gatsby (Fitzgerald 1925)
  - Cassandre travel posters (1920s-30s)
  - Erté fashion illustration
  - Tamara de Lempicka paintings
  - Edward Steichen photography
  - Hercule Poirot mysteries (period-appropriate)
  - Jean Dunand lacquerwork
  - Eileen Gray furniture
  - Modern parallels: The Shape of Water (del Toro), Boardwalk Empire

Movement aesthetic:
  - STREAMLINED forward energy.
  - Implied speed, progress, modernity (for the era).

Texture/Material:
  - LACQUER finish.
  - GOLD LEAF.
  - MARBLE veining.
  - POLISHED METAL.
  - VELVET nap.
  - JEWEL refraction.

What this style REJECTS:
  - Naturalistic photography.
  - Soft pastels (this is jewel-tone era).
  - Brutalism.
  - Y2K chrome (different shine).
  - Memphis chaos.
  - Anything pre-1900 or post-1940 (specific era).
`,

  palette: {
    foundation: ['#0A0A0A', '#F5F5DC'],
    primary: ['#D4AF37', '#CD7F32', '#B8860B'],
    accent: ['#50C878', '#9B111E', '#0F52BA', '#D4A5A5'],
    forbidden: ['#FF00FF', '#00FF00'], // Neon
  },

  typography: {
    display: ['Broadway', 'ITC Bauhaus', 'Parisian', 'Avenir Black'],
    body: ['Garamond', 'Bodoni'],
    accent: ['Geometric italic'],
  },

  references: {
    artists: [
      'Tamara de Lempicka',
      'Cassandre (poster designer)',
      'Erté',
      'Edward Steichen (photographer)',
      'Jean Dunand',
      'Eileen Gray',
      'William Van Alen (Chrysler architect)',
    ],
    brands: ['Cartier (period)', 'Lalique (glass)', 'Hermès (period)'],
    works: [
      'Chrysler Building (1930)',
      'The Great Gatsby (Fitzgerald 1925)',
      'Cassandre Normandie poster (1935)',
      'Hoover Dam (1936)',
    ],
    eras: ['Art Deco 1920s-1930s', 'Roaring Twenties'],
  },

  moodKeywords: [
    'luxurious',
    'geometric',
    'streamlined',
    'optimistic',
    'glamorous',
    'jazz-age',
    'aspirational',
    'decorative',
  ],

  pairsWellWith: [
    'design-bauhaus-geometric',
    'cinematic-wes-anderson-symmetric',
    'mood-quiet-contemplation',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'design-brutalist-architectural',
    'era-vaporwave-2010s',
    'design-memphis-group-80s',
  ],
  bestForVerticals: [
    'jewelry-luxury',
    'wine-spirits-premium',
    'fashion-luxury',
    'hospitality-luxury-hotel',
    'fragrance-luxury',
    'cultural-institution',
    'real-estate-luxury',
  ],
  forbiddenForVerticals: ['tech-developer', 'kids-toys', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 3. MID-CENTURY 1950s — Don Draper warmth
// ═══════════════════════════════════════════════════════════════
const ERA_MID_CENTURY: StyleDNA = {
  id: 'era-mid-century-1950s',
  name: 'Mid-Century 1950s Don Draper',
  tagline: 'Madison Avenue gold. Eames chairs. Sunset cocktails. American optimism mid-pour.',
  category: 'era-historical',
  era: 'mid-century-1950s',
  movement: 'modernism',
  intensity: 'moderate',

  aliases: [
    'mid-century',
    'mid-century-modern',
    'don-draper',
    'mad-men',
    'madison-avenue',
    'eames-style',
    '1950s-1960s',
    'rat-pack',
    'estilo mid-century',
    'don draper',
    'mad men',
    'años 50',
    'tipo mid-century',
    'eames',
    'optimismo americano',
    'madison avenue',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: AMERICAN MID-CENTURY MODERN (1950s-1960s) — The optimistic post-war design era of Don Draper, Mad Men, Eames furniture, Saul Bass film titles. NOT generic vintage — this is SPECIFIC American optimism: nuclear families with cigarettes, suburban modernism, NYC advertising heroism. Madison Avenue gold meets backyard barbecue warmth. The aesthetic of America believing in itself.

Typography (THE Mid-century signature):
  - Display: classic mid-century sans (Avenir, Futura, Trade Gothic, Akzidenz-Grotesk).
  - Or sleek slab serif (Mercury, Caslon Italic) for editorial.
  - All-caps for advertising hero text with generous tracking.
  - Sometimes hand-lettered (Saul Bass title style).
  - Color: warm mustard (#D4A017), classic American red (#A00000), navy blue (#0F52BA).
  - Italic for emphasis.

Composition:
  - Asymmetric balance — Saul Bass-style composition.
  - Lots of negative space (white space breathes).
  - Photographic AND illustration mixed (sometimes overlay).
  - Pop art influence emerging (Lichtenstein, Warhol).
  - Magazine spread style — Life, Look, Esquire layouts.
  - Photography often square format (Hasselblad).

Color palette (the optimistic warmth):
  - WARM MUSTARD yellow (#D4A017) — period-iconic.
  - CLASSIC AMERICAN red (#A00000, #C8102E).
  - NAVY blue (#0F52BA, #1B365D).
  - WARM BEIGE and cream (#F5F2E8, #E8DDC9).
  - FOREST GREEN (#2D4A2B), wheat (#F5DEB3).
  - WARM BROWN (#8B5E2F, #5D4E37).
  - Color saturation MEDIUM — vibrant but not neon.
  - Slight Kodachrome-warm color grade.

Photography (the period look):
  - Shot on Kodachrome or Ektachrome 120 film.
  - Slight magenta-warm color shift.
  - Soft focus with dreamy bokeh.
  - Posed but candid feel (Norman Rockwell to Slim Aarons spectrum).
  - Daylight or warm tungsten.
  - Square format common.

Subjects (the American Mid-century world):
  - Men in tailored suits with skinny ties.
  - Women in shift dresses, kitten heels, pillbox hats.
  - Family groups in backyards or station wagons.
  - Couples at cocktail parties.
  - Office workers in glass-walled NYC towers.
  - Children in summer gardens.

Production design:
  - EAMES LOUNGE CHAIR (signature object).
  - MOLDED PLASTIC chairs (Knoll, Herman Miller).
  - GEORGE NELSON clocks.
  - WALL-MOUNTED record players.
  - SUNKEN LIVING ROOMS with fireplaces.
  - GLASS-WALLED MODERNIST homes (California Case Study Houses).

Textiles and patterns:
  - GEOMETRIC fabrics (boomerang, atomic patterns).
  - STRIPED awnings.
  - PLAID for masculine objects.
  - SOLID color fabric blocks.

Lighting:
  - Natural daylight through floor-to-ceiling windows.
  - Warm lamps in evening interiors.
  - Outdoor: golden hour at backyard parties.
  - Cocktail lounge dim warm.

Cultural references:
  - Mad Men (AMC 2007-2015) — the modern Mid-century reference
  - Norman Rockwell paintings (kindred but more idealized)
  - Slim Aarons photography (jet-set elite)
  - Charles & Ray Eames furniture
  - George Nelson Bubble Lamps
  - Knoll furniture
  - Saul Bass film titles (Vertigo, North by Northwest, Anatomy of a Murder)
  - Edward Hopper paintings (kindred melancholy)
  - Mid-Century Modern California Case Study Houses
  - Volkswagen's "Think Small" advertising campaign

Movement aesthetic:
  - Mid-pour, mid-conversation, mid-cocktail-stir.
  - Implied social fluency.

Texture/Material:
  - WALNUT wood grain.
  - LEATHER (chairs, briefcases).
  - WOOL fabric (suits).
  - GLASS panels.
  - CHROME accents.
  - FORMICA counters.

What this style REJECTS:
  - Pre-WWI aesthetics.
  - Brutalism (1970s).
  - Memphis chaos (1980s).
  - Y2K chrome (2000s).
  - Modern minimalism (cold).
  - Anything that doesn't FEEL like 1955-1965.
`,

  palette: {
    foundation: ['#F5F2E8', '#E8DDC9'],
    primary: ['#D4A017', '#A00000', '#0F52BA'],
    accent: ['#2D4A2B', '#8B5E2F', '#5D4E37', '#1B365D'],
  },

  typography: {
    display: ['Avenir', 'Futura', 'Trade Gothic', 'Mercury'],
    body: ['Caslon', 'Garamond', 'Akzidenz-Grotesk'],
    accent: ['Hand-lettered', 'Italic serif'],
  },

  references: {
    artists: [
      'Charles & Ray Eames',
      'George Nelson',
      'Saul Bass',
      'Norman Rockwell',
      'Slim Aarons (photographer)',
      'Edward Hopper',
    ],
    brands: ['Knoll', 'Herman Miller', 'Volkswagen (period)', 'Mad Men reference'],
    works: [
      'Eames Lounge Chair (1956)',
      'Saul Bass film titles (Vertigo, Anatomy of a Murder)',
      'Mad Men (AMC 2007-2015)',
      'Mid-Century Modern Case Study Houses',
      'Volkswagen "Think Small" (1960)',
    ],
    eras: ['American Mid-century 1950s-1965', 'Madison Avenue golden era'],
  },

  moodKeywords: [
    'optimistic',
    'aspirational',
    'sophisticated',
    'warm',
    'social',
    'refined',
    'period',
    'classic',
  ],

  pairsWellWith: [
    'mood-nostalgic-polaroid',
    'cinematic-wes-anderson-symmetric',
    'cinematic-pta-warm-1970s',
  ],
  forbiddenCombinations: [
    'design-brutalist-architectural',
    'design-y2k-chrome-millennium',
    'era-vaporwave-2010s',
    'cinematic-gaspar-noe-neon',
  ],
  bestForVerticals: [
    'wine-spirits-premium',
    'fashion-vintage',
    'hospitality-classic-hotel',
    'real-estate-modernist',
    'editorial',
    'cultural-institution',
    'food-classic',
  ],
  forbiddenForVerticals: ['tech-developer', 'kids-toys', 'sports-athletic-modern'],
};

// ═══════════════════════════════════════════════════════════════
// 4. CYBERPUNK 1980s NEON — Blade Runner original
// ═══════════════════════════════════════════════════════════════
const ERA_CYBERPUNK_80S: StyleDNA = {
  id: 'era-cyberpunk-1980s-neon',
  name: 'Cyberpunk 1980s Neon',
  tagline: 'Blade Runner rain. Neon kanji signs. Trench coats. Future as decay.',
  category: 'era-historical',
  era: 'cyberpunk-1980s',
  movement: 'postmodernism',
  intensity: 'extreme',

  aliases: [
    'cyberpunk',
    'cyberpunk-80s',
    'blade-runner',
    'blade-runner-original',
    'akira',
    'ghost-in-the-shell',
    'neuromancer',
    'neon-noir',
    '1980s-future',
    'estilo cyberpunk',
    'blade runner',
    'akira',
    'tipo cyberpunk',
    'futuro 80s',
    'neon noir',
    'kanji neon',
    'lluvia neon',
  ],

  archetypeBase: 'full-bleed-cinematic',

  promptDirective: `
Aesthetic philosophy: CYBERPUNK 1980s — The dystopian future imagined in 1982-1995. Blade Runner (1982), Neuromancer (Gibson 1984), Akira (Otomo 1988), Ghost in the Shell (Shirow 1989), The Matrix (1999) — all share this DNA. Future as DECAY, not utopia. Neon kanji signs in eternal Tokyo rain. Trench coats. Cigarettes. Megacorps. Tech invading bodies. NOT 90s techno-optimism (different aesthetic) — this is SPECIFIC to mid-80s noir-future with Asian urbanism.

Typography (the Cyberpunk system):
  - Display: condensed sans (Eurostile, Bank Gothic, Microgramma).
  - Or futuristic Asian-influenced (Helvetica with Japanese characters mixed).
  - Letters with NEON GLOW effect (chromatic aberration, bloom).
  - All-caps with tight tracking for technical feel.
  - Sometimes monospace (Courier, OCR-A) for computer terminals.
  - Color: hot pink (#FF1493), neon cyan (#00FFFF), acid green (#00FF00) on black.

Composition (the noir-future):
  - WIDE establishing shots of vast cityscapes.
  - Tight CLOSE-UPS through rain on glass.
  - LOW ANGLE looking up at megalithic architecture.
  - Subjects DWARFED by neon advertising.
  - Mirrored surfaces, holographic ads.
  - Asian script and Roman script mixed in same frame.

Color palette (THE cyberpunk neon):
  - PRIMARY: hot pink (#FF1493), neon cyan (#00FFFF), acid green (#00FF00).
  - DEEP BLACK background (#0A0A0A, #050505).
  - SODIUM ORANGE (#FF6F00) for street lamps.
  - PURPLE-MAGENTA gradient (#FF00FF, #9B111E).
  - WET PAVEMENT reflects all colors (rich saturation).
  - Skin tones rendered in neon casts (cyan-tinted, pink-tinted).
  - NEVER warm earth tones, NEVER pastels.

Lighting (THE Blade Runner signature):
  - PRACTICAL NEON SIGNS as primary illumination.
  - SODIUM VAPOR street lamps (orange-pink).
  - SEARCHLIGHTS sweeping through fog.
  - NEON KANJI signs in vertical orientation.
  - HOLOGRAPHIC ADS projecting onto buildings.
  - VOLUMETRIC LIGHT (god rays through fog/rain).

Atmosphere (THE crucial element):
  - ETERNAL RAIN — Blade Runner's permanent weather.
  - FOG, smoke, atmospheric haze ALWAYS.
  - STEAM rising from street vents.
  - SMOKE from cigarettes, fires, exhaust.
  - Atmosphere makes light VISIBLE (god rays, light beams).
  - Wet reflective pavement.

Production design (the Cyberpunk universe):
  - MEGALITHIC ARCHITECTURE — towers vanishing into clouds.
  - NEON ASIAN CITYSCAPES — Tokyo, Hong Kong influences.
  - CRAMPED APARTMENT INTERIORS with bare bulbs.
  - DINER WITH NEON SIGNS (Blade Runner noodle bar).
  - INDUSTRIAL FACILITIES with steam pipes.
  - HOLOGRAPHIC DISPLAYS, FLOATING SCREENS.

Subjects (the Cyberpunk cast):
  - Detectives in trench coats (Deckard archetype).
  - Hackers with implants (Molly from Neuromancer).
  - Salarymen in cramped offices.
  - Replicants/AIs hiding in crowds.
  - Punks with mohawks and tech accessories.
  - Models in vinyl/leather/metallic.
  - Crowds with umbrellas in rain.

Camera and movement:
  - WIDE anamorphic 2.39:1.
  - Slow tracking through environments.
  - Often 35-50mm prime (natural perspective).
  - Bird's-eye establishing shots of city.
  - Smoke/rain/light particles in foreground.

Cultural references:
  - Blade Runner (Scott 1982) — the cyberpunk founding text
  - Neuromancer (Gibson 1984) — the cyberpunk founding novel
  - Akira (Otomo 1988) — Japanese cyberpunk masterpiece
  - Ghost in the Shell (Shirow 1989, Oshii 1995)
  - Ridley Scott's Tokyo aesthetic
  - Syd Mead conceptual designs (Blade Runner)
  - Moebius comics (Heavy Metal)
  - The Matrix (1999) — late-stage cyberpunk
  - Cyberpunk 2077 game (modern reference)
  - Vangelis Blade Runner soundtrack (mood translation)

Movement aesthetic:
  - Subjects walking through dense crowds.
  - Cameras gliding over cityscapes.
  - Rain falling, neon flickering.

Texture/Material:
  - WET CONCRETE.
  - VINYL/LEATHER trench coats.
  - METALLIC fabrics.
  - GLASS panels with rain.
  - HOLOGRAPHIC iridescence.
  - STEAM/FOG.

What this style REJECTS:
  - Bright daylight (this is night cinema).
  - Natural environments (this is urban).
  - Warm earth tones.
  - Modern minimalism (clean tech aesthetic).
  - Y2K chrome (later era, cleaner).
  - Anything optimistic.
`,

  palette: {
    foundation: ['#0A0A0A', '#050505'],
    primary: ['#FF1493', '#00FFFF', '#00FF00'],
    accent: ['#FF6F00', '#FF00FF', '#9B111E'],
    forbidden: ['#F5DEB3', '#A87E47'], // Warm earth tones
  },

  typography: {
    display: ['Eurostile', 'Bank Gothic', 'Microgramma', 'Helvetica Inserat'],
    body: ['Courier', 'OCR-A', 'Helvetica'],
    accent: ['Japanese kanji', 'Monospace'],
  },

  references: {
    artists: [
      'Ridley Scott (Blade Runner)',
      'William Gibson (writer)',
      'Katsuhiro Otomo (Akira)',
      'Masamune Shirow (Ghost in the Shell)',
      'Mamoru Oshii (Ghost in the Shell film)',
      'Syd Mead (Blade Runner concept artist)',
      'Moebius (comics)',
    ],
    works: [
      'Blade Runner (Scott 1982)',
      'Neuromancer (Gibson 1984)',
      'Akira (Otomo 1988)',
      'Ghost in the Shell (Oshii 1995)',
      'The Matrix (Wachowski 1999)',
    ],
    eras: ['Cyberpunk 1980s-1990s', 'Tokyo neon era 1980s'],
  },

  moodKeywords: [
    'dystopian',
    'neon',
    'rainy',
    'urban',
    'futuristic',
    'noir',
    'oppressive',
    'atmospheric',
  ],

  pairsWellWith: [
    'cinematic-villeneuve-vast',
    'cinematic-gaspar-noe-neon',
    'design-brutalist-architectural',
  ],
  forbiddenCombinations: [
    'cinematic-malick-magic-hour',
    'cinematic-studio-ghibli-painterly',
    'mood-nostalgic-polaroid',
    'era-art-deco-1920s',
  ],
  bestForVerticals: [
    'gaming',
    'tech-cybersecurity',
    'film-tv',
    'music-electronic',
    'fashion-streetwear',
    'editorial',
  ],
  forbiddenForVerticals: ['food-traditional', 'wellness-spa', 'kids-toys', 'wedding-services'],
};

// ═══════════════════════════════════════════════════════════════
// 5. VAPORWAVE 2010s — Internet aesthetic glow
// ═══════════════════════════════════════════════════════════════
const ERA_VAPORWAVE: StyleDNA = {
  id: 'era-vaporwave-2010s',
  name: 'Vaporwave 2010s Internet',
  tagline: 'Mall Greek statues. Pink-purple gradient. Windows 95 nostalgia. Aesthetic.',
  category: 'era-historical',
  era: 'contemporary-2020s',
  movement: 'vaporwave',
  intensity: 'bold',

  aliases: [
    'vaporwave',
    'vaporwave-aesthetic',
    'aesthetic',
    'a-e-s-t-h-e-t-i-c',
    'mall-aesthetic',
    'tumblr-aesthetic',
    'pink-purple-gradient',
    'windows-95-nostalgia',
    'estilo vaporwave',
    'vaporwave',
    'estética 2010',
    'tumblr',
    'tipo vaporwave',
    'rosa morado',
    'nostalgia 90s',
  ],

  archetypeBase: 'spotify-duotone-diagonal',

  promptDirective: `
Aesthetic philosophy: VAPORWAVE — Internet aesthetic born around 2010-2012 on Tumblr/4chan. NOT just "neon 80s" — Vaporwave is SPECIFIC mid-90s mall culture nostalgia mixed with Greco-Roman statues, Windows 95 UI, anime, Japanese commercial typography. The aesthetic of CAPITALISM AS FEELING — empty malls, dead palm trees, Macintosh Plus music. Layered, glitchy, ironic.

Typography (the Vaporwave system):
  - Display: condensed sans with pink/cyan glow.
  - Or thin geometric (Avant Garde, Helvetica) with extreme tracking (+0.30em).
  - Sometimes Japanese characters mixed (片仮名 katakana common).
  - Letter-spaced extreme: "A E S T H E T I C" (one letter each).
  - Color: hot pink (#FF1493), cyan (#00FFFF), purple (#9B30FF), with 90s computer feel.
  - Drop shadows in CHROMATIC ABERRATION (red/cyan offset).
  - Sometimes WORDART (90s Microsoft Office aesthetic).

Composition (the Vaporwave layering):
  - LAYERED collage compositions.
  - Greek/Roman statue (often partially digital glitch).
  - Pink/purple/cyan gradient skies.
  - Palm trees, sunset horizons.
  - 90s computer UI elements (Windows 95 windows, MacOS icons).
  - JAPANESE ADVERTISEMENTS layered.
  - GRID FLOORS receding to vanishing point (TRON-style).

Color palette (THE Vaporwave gradient):
  - HOT PINK (#FF1493, #FF6EC7).
  - PURPLE (#9B30FF, #BA55D3).
  - CYAN (#00FFFF, #00BFFF).
  - SOFT PASTELS: peach (#FFB347), lavender (#C9B8E0).
  - GRADIENT SKIES: pink-purple-orange sunset.
  - Sometimes acid green (#39FF14) accent.
  - NEVER muted earth tones.

Patterns and motifs (THE signature):
  - GREEK MARBLE statues (Venus de Milo, David).
  - PALM TREES, often dead or silhouetted.
  - GRID FLOORS receding (TRON-style).
  - SUNSET HORIZONS with mountain silhouettes.
  - 90s COMPUTER UI windows.
  - GLITCH ART (RGB channel separation, scan lines).
  - JAPANESE COMMERCIAL TYPOGRAPHY.
  - 90s ANIME FRAMES.
  - POLYGONAL 3D RENDERS (low-poly).

Photography style (when used):
  - Empty mall interiors (Zumthor-esque emptiness applied to commerce).
  - Tropical sunset compositions.
  - Greek statue close-ups in pink-purple light.
  - 90s consumer products (iMac G3 lineage).
  - Japanese vending machines glowing in dark.
  - Color graded with PINK-PURPLE PUSH and CYAN highlights.

Subjects (the Vaporwave universe):
  - Greek marble busts/statues.
  - Empty escalators in malls.
  - Dolphins (random Vaporwave motif).
  - Windows 95 desktop icons.
  - Roman columns in sunset.
  - Anime girls (90s aesthetic).
  - Tropical plants in glass terrariums.

Cultural references (the Vaporwave foundational):
  - Macintosh Plus "Floral Shoppe" album (Vektroid 2011)
  - Tumblr aesthetic blog culture 2010-2014
  - 4chan /mu/ thread origins
  - Hiroshi Yoshimura music (Japanese ambient predecessor)
  - Saint Pepsi music
  - "Aesthetic" memes
  - Synthwave (kindred but different aesthetic)
  - Outrun aesthetic (kindred)
  - Mall culture documentaries
  - 90s commercial Japan TV ads
  - Charli XCX music videos (modern Vaporwave heir)

Atmosphere:
  - DREAMY, slow, glitchy.
  - VHS tracking errors.
  - Compression artifacts as features.
  - Smoke, fog softening edges.

Texture/Material:
  - VHS GRAIN and tracking lines.
  - MARBLE statue textures.
  - GLASS reflections.
  - PLASTIC transparency.
  - HOLOGRAPHIC stickers.
  - PIXEL LOW-RES intentional.

Movement aesthetic:
  - Slowed down (literal Vaporwave music technique = slow + reverb).
  - Floating, dream-like.
  - Implied nostalgia time-warp.

What this style REJECTS:
  - Crisp digital perfection.
  - Naturalistic photography.
  - Earth tones.
  - High contrast cyberpunk noir (different era).
  - Brutalism.
  - Clean modern minimalism.
  - Anything that doesn't feel ironic or layered.
`,

  palette: {
    foundation: ['#FF1493', '#9B30FF'],
    primary: ['#FF6EC7', '#00FFFF', '#BA55D3'],
    accent: ['#39FF14', '#FFB347', '#C9B8E0'],
    forbidden: ['#5D4E37', '#A87E47'], // Earth tones
  },

  typography: {
    display: ['Avant Garde', 'Helvetica with extreme tracking', 'Microgramma'],
    body: ['Helvetica', 'Avant Garde'],
    accent: ['Japanese katakana', 'WordArt 90s', 'Glitch effects'],
  },

  references: {
    artists: [
      'Macintosh Plus / Vektroid (musician)',
      'Saint Pepsi (musician)',
      '猫 シ Corp. (musician)',
      'Charli XCX (modern heir)',
    ],
    brands: ['Tumblr aesthetic culture', '4chan /mu/ origins'],
    works: [
      'Floral Shoppe (Vektroid 2011)',
      'Tumblr aesthetic blogs 2010-2014',
      'Saint Pepsi "Hit Vibes" (2013)',
    ],
    eras: ['Vaporwave 2010-2014', 'Internet aesthetic era 2010s', '90s mall nostalgia'],
  },

  moodKeywords: [
    'nostalgic',
    'dreamy',
    'ironic',
    'layered',
    'glitchy',
    'tropical',
    'capitalist-melancholy',
    'aesthetic',
  ],

  pairsWellWith: [
    'design-y2k-chrome-millennium',
    'design-memphis-group-80s',
    'mood-euphoria-celebration',
  ],
  forbiddenCombinations: [
    'era-baroque-chiaroscuro-1600s',
    'era-art-deco-1920s',
    'design-bauhaus-geometric',
    'cinematic-tarkovsky-poetic',
    'mood-melancholy-rainy',
  ],
  bestForVerticals: [
    'music-electronic',
    'gaming',
    'fashion-streetwear',
    'art-cultural-edgy',
    'youth-culture',
  ],
  forbiddenForVerticals: ['finance', 'pharmaceutical', 'wellness-spa', 'wedding-services'],
};

// ─── Exports ────────────────────────────────────────────────────
export const ERA_HISTORICAL_DNAS: StyleDNA[] = [
  ERA_BAROQUE_CHIAROSCURO,
  ERA_ART_DECO,
  ERA_MID_CENTURY,
  ERA_CYBERPUNK_80S,
  ERA_VAPORWAVE,
];

export {
  ERA_BAROQUE_CHIAROSCURO,
  ERA_ART_DECO,
  ERA_MID_CENTURY,
  ERA_CYBERPUNK_80S,
  ERA_VAPORWAVE,
};
