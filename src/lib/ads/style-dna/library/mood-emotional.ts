/**
 * 🎭 STYLE DNA — Mood / Emotional
 *
 * 5 DNAs basados en estados emocionales/atmosféricos.
 * Estos no son "estilos visuales" sino TEMPERATURAS afectivas.
 * Se combinan bien con DNAs de otras categorías para añadir dimensión emocional.
 *
 * DNAs incluidos:
 *   1. mood-melancholy-rainy           — Edward Hopper rainy windowsill
 *   2. mood-euphoria-celebration       — Pride / festival joy
 *   3. mood-quiet-contemplation        — Library at midnight
 *   4. mood-urgent-revolutionary       — Protest poster energy
 *   5. mood-nostalgic-polaroid         — Warm memory haze
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. MELANCHOLY RAINY — Edward Hopper rainy windowsill
// ═══════════════════════════════════════════════════════════════
const MOOD_MELANCHOLY_RAINY: StyleDNA = {
  id: 'mood-melancholy-rainy',
  name: 'Melancholy Rainy Windowsill',
  tagline: 'Edward Hopper meets Sofia Coppola. Loneliness as beauty.',
  category: 'mood-emotional',
  era: 'timeless',
  movement: 'cinematic-naturalism',
  intensity: 'subtle',

  aliases: [
    'melancholy',
    'melancholic',
    'rainy',
    'rainy-day',
    'windowsill',
    'edward-hopper',
    'lonely',
    'introspective',
    'lost-in-translation',
    'sofia-coppola',
    'melancólico',
    'melancolía',
    'lluvia',
    'día lluvioso',
    'soledad',
    'introspectivo',
    'edward hopper',
    'sofia coppola',
    'tristeza poética',
    'azul nostalgia',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: MELANCHOLY RAINY WINDOWSILL — The emotional temperature of Edward Hopper paintings (Nighthawks, Automat, Morning Sun) crossed with Sofia Coppola's "Lost in Translation" cinematography. Loneliness rendered as BEAUTIFUL. Rain on glass as protagonist. Single figure in soft half-light. NOT depressing — this is melancholy as aesthetic territory: bittersweet, contemplative, with implied longing.

Typography:
  - Display: classical serif (Garamond Italic, Caslon, Tiempos Italic) — letters lean as if bowing in thought.
  - Or thin geometric sans (Helvetica Neue Light, Avenir Next Ultra Light).
  - Color: deep slate blue (#3D5A80), rust orange (#A05A2C), cool gray (#5C5C5C).
  - Generous tracking on display.
  - Single hero phrase per composition (less is more melancholic).
  - Italic forms when possible (poetic).
  - Often white text on muted blue or sepia backgrounds.

Composition:
  - Single figure in window OR negative space dominant landscape.
  - Rule of thirds anchored on emptiness, not subject.
  - Diagonal compositions implying lean, fall, descent.
  - Foreground-background separation through atmosphere.
  - Cropped figures — back of head, side profile, half-glimpsed.

Color palette (the sad palette):
  - Foundation: cool gray-blue (#3D5A80), warm gray (#5C5C5C), sky-overcast (#A8B5B8).
  - Accents: rust orange (#A05A2C), faded yellow window light (#D4A745), wine red (#722F37).
  - Skin tones: warm flesh in cool environment.
  - Cool dominates, warm interrupts (single yellow lamp in blue room).
  - NO bright saturation — desaturated 30-40% from full color.

Photography:
  - 35mm or medium format film aesthetic.
  - Window light at twilight (5pm-7pm).
  - Soft directional light from a single window.
  - SHALLOW depth of field (f/1.4-2.8) for dreamy backgrounds.
  - Atmospheric haze (rain on windows, condensation, fog).
  - Color graded: cool shadows lifted, warm highlights subdued.

Atmosphere (THE mood maker):
  - RAIN on window glass (visible droplets, streaks).
  - CONDENSATION fog on windows.
  - Steam rising from coffee cups, breath in cold air.
  - Soft focus middle distance.
  - Single light source creating long warm window shadow.

Subject (when present):
  - Figure looking OUT through window.
  - Holding warm mug or cigarette.
  - Eyes lowered or distant.
  - Soft sweater/robe textures.
  - Often shot from behind or side profile.
  - Hand resting on glass.

Lighting:
  - Window light from one side.
  - Lamp light warm pool against blue room.
  - Twilight blue spilling through.
  - Streetlights orange against blue dusk.
  - Always LOW KEY (more shadow than light).

Cultural references:
  - Edward Hopper paintings (Nighthawks, Automat, Morning Sun, Office in a Small City)
  - Sofia Coppola's Lost in Translation (2003)
  - Wong Kar-wai's In the Mood for Love (2000)
  - Greta Gerwig's Frances Ha (2012) quieter scenes
  - Nan Goldin's photography
  - Saul Leiter's color photography
  - Andrew Wyeth paintings
  - Hilma af Klint's contemplative work
  - The Smiths album covers (Morrissey-era)
  - Mazzy Star album art

Movement aesthetic:
  - Stillness with rain animating frame.
  - Implied breath, slow blink, distant thought.

Texture/Material:
  - Wet glass, water droplets.
  - Worn wood, painted walls peeling.
  - Soft cotton, knit fabrics.
  - Steam, fog, breath.

What this style REJECTS:
  - Bright sunlight.
  - Crowded scenes.
  - Saturated colors.
  - Smiling subjects.
  - Athletic energy.
  - Memphis joy.
  - Anything that "should make people happy."
`,

  palette: {
    foundation: ['#3D5A80', '#5C5C5C', '#A8B5B8'],
    primary: ['#FFFFFF', '#0A0A0A'],
    accent: ['#A05A2C', '#D4A745', '#722F37'],
    forbidden: ['#FFEB3B', '#FF6EC7'], // Bright happiness colors
  },

  typography: {
    display: ['Garamond Italic', 'Caslon', 'Tiempos Italic', 'Helvetica Neue Light'],
    body: ['Garamond', 'Caslon', 'Helvetica Neue'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Edward Hopper',
      'Saul Leiter',
      'Nan Goldin',
      'Sofia Coppola',
      'Wong Kar-wai',
      'Andrew Wyeth',
    ],
    works: [
      'Nighthawks (Hopper, 1942)',
      'Lost in Translation (Coppola, 2003)',
      'In the Mood for Love (Wong, 2000)',
      'Saul Leiter color photography',
    ],
    eras: ['American realism 1940s-50s', 'Independent film 2000s', 'Hong Kong cinema 2000s'],
  },

  moodKeywords: [
    'melancholic',
    'lonely',
    'introspective',
    'bittersweet',
    'rainy',
    'contemplative',
    'poetic',
    'twilight',
  ],

  pairsWellWith: [
    'brand-yohji-yamamoto-noir',
    'cinematic-tarkovsky-poetic',
    'mood-quiet-contemplation',
    'mood-nostalgic-polaroid',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
    'brand-nike-cinematic-athletic',
  ],
  bestForVerticals: [
    'fashion-melancholy',
    'editorial',
    'cultural-institution',
    'art-gallery',
    'wine-spirits-premium',
    'perfume-niche',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 2. EUPHORIA CELEBRATION — Pride parade joy
// ═══════════════════════════════════════════════════════════════
const MOOD_EUPHORIA_CELEBRATION: StyleDNA = {
  id: 'mood-euphoria-celebration',
  name: 'Euphoria Celebration',
  tagline: 'Confetti explosion. Glitter sweat. Joy as collective phenomenon.',
  category: 'mood-emotional',
  era: 'contemporary-2020s',
  movement: 'maximalism',
  intensity: 'extreme',

  aliases: [
    'euphoria',
    'celebration',
    'pride',
    'festival',
    'party',
    'joy',
    'jubilant',
    'celebratory',
    'glitter',
    'confetti',
    'euforia',
    'celebración',
    'orgullo',
    'festival',
    'fiesta',
    'alegría',
    'jubiloso',
    'glitter',
    'confeti',
    'fiesta brillante',
  ],

  archetypeBase: 'spotify-duotone-diagonal',

  promptDirective: `
Aesthetic philosophy: EUPHORIA CELEBRATION — Collective joy as visual phenomenon. Pride parades, music festivals, wedding receptions at peak hour, New Year's countdowns. NOT individual happiness — this is COLLECTIVE EUPHORIA. Bodies in motion, glitter on sweaty skin, lens flares from concert lights, multiple subjects connecting. Saturation is HONEST here, not chaotic.

Typography:
  - Display: BOLD geometric sans-serif (Druk Heavy, Avenir Black) OR custom display with energy.
  - Hero text in bright saturated colors — magenta, electric blue, sunshine yellow.
  - Often layered over imagery, white outline ringed for legibility.
  - All-caps acceptable for hero.
  - Tracking can be tight (urgent forward energy).
  - Multiple text colors per piece (RAINBOW spectrum).

Composition:
  - Multiple subjects (3+ people) in joyful interaction.
  - Diagonal compositions suggesting motion and energy.
  - Frame-filling — no negative space.
  - Hands raised, jumping figures, embracing forms.
  - Confetti, glitter, smoke filling air.
  - Lens flares from light sources.

Color palette (the spectrum):
  - Foundation: warm darks (#1A0F0F) for night scenes OR sunny daylight whites.
  - PRIMARY SPECTRUM: hot pink (#FF1493), magenta (#FF00FF), electric blue (#00BFFF), sunshine yellow (#FFD700), lime (#32CD32), tangerine (#FF6F00).
  - Glitter/sequin highlights: gold (#FFD700), rose gold (#E0BBE4), holographic.
  - Skin tones: warm, gleaming with sweat.
  - HIGH SATURATION but EARNED through subject (concert lights justify magenta).

Photography:
  - Concert/festival photography quality.
  - Long exposures on dance floors (light trails).
  - Multiple flash sources from different angles.
  - Slight motion blur in extremities (movement preserved).
  - Color saturation pushed to extreme.
  - LENS FLARES from stage lights (anamorphic blue/orange flares).

Atmosphere:
  - GLITTER airborne in light.
  - CONFETTI mid-fall.
  - SMOKE machine haze.
  - Sweat catching colored light.
  - Steam rising from dance floor.

Subjects:
  - Multiple people (3+) in interaction.
  - Bodies in motion (dancing, jumping, embracing).
  - Sweaty skin gleaming.
  - Open mouths (laughing, singing).
  - Hands raised in air.
  - Eyes closed in pure joy or open with electric energy.
  - DIVERSE bodies (race, age, gender, body type).

Lighting:
  - Concert/festival lighting from above.
  - COLORED gels (magenta, blue, green stage lights).
  - LASER beams cutting through smoke.
  - String lights as background bokeh.
  - Sunny daylight for outdoor festivals.
  - Strobe-frozen poses.

Cultural references:
  - Pride parades (NYC, Madrid, São Paulo)
  - Glastonbury Festival photography
  - Coachella aesthetic
  - Burning Man documentation
  - Diana Ross at the disco era
  - Studio 54 photography (Bill Bernstein)
  - HBO's Euphoria (Sam Levinson)
  - Beyoncé Renaissance Tour aesthetic
  - Lizzo concert visuals
  - Carnival in Rio / Trinidad

Movement aesthetic:
  - EXPLOSIVE energy.
  - Implied dance, jumping, spinning.
  - Camera moves with crowd.

Texture/Material:
  - Glitter on skin.
  - Sequins reflecting light.
  - Sweat as light catcher.
  - Fabric in motion (cape billowing, hair flying).
  - Bare skin gleaming.

What this style REJECTS:
  - Single isolated subject.
  - Muted color palettes.
  - Static poses.
  - Dim contemplative lighting.
  - Sad or solemn mood.
  - Brutalism's coldness.
  - Apple's sterile minimalism.
  - Empty negative space.
`,

  palette: {
    foundation: ['#1A0F0F', '#FFFFFF'],
    primary: ['#FF1493', '#FF00FF', '#00BFFF', '#FFD700'],
    accent: ['#32CD32', '#FF6F00', '#E0BBE4'],
    forbidden: ['#5C5C5C', '#3D5A80'], // Sad colors
  },

  typography: {
    display: ['Druk Heavy', 'Avenir Black', 'Custom display energy'],
    body: ['Avenir', 'Helvetica Bold'],
  },

  references: {
    artists: [
      'Bill Bernstein (Studio 54 photographer)',
      'Tyler Mitchell (photographer)',
      'Sam Levinson (Euphoria HBO)',
      'David LaChapelle',
      'Tim Walker',
    ],
    works: [
      'Pride parade documentation',
      'Studio 54 photography 1977-1980',
      'Euphoria HBO (2019-)',
      'Beyoncé Renaissance Tour visuals',
    ],
    eras: ['Disco era 1977-1980', 'Festival era 2010s+', 'Pride era 1969-present'],
  },

  moodKeywords: [
    'euphoric',
    'celebratory',
    'joyful',
    'electric',
    'collective',
    'jubilant',
    'maximalist',
    'glittering',
  ],

  pairsWellWith: ['design-memphis-group-80s', 'design-y2k-chrome-millennium'],
  forbiddenCombinations: [
    'mood-melancholy-rainy',
    'mood-quiet-contemplation',
    'brand-yohji-yamamoto-noir',
    'cinematic-tarkovsky-poetic',
    'design-brutalist-architectural',
  ],
  bestForVerticals: [
    'music-festival',
    'fashion-streetwear',
    'beauty-fun',
    'beverages-alcohol',
    'lgbtq-pride',
    'kids-celebration',
    'wedding-celebration',
  ],
  forbiddenForVerticals: [
    'finance',
    'pharmaceutical',
    'funeral-services',
    'wellness-meditation',
  ],
};

// ═══════════════════════════════════════════════════════════════
// 3. QUIET CONTEMPLATION — Library at midnight
// ═══════════════════════════════════════════════════════════════
const MOOD_QUIET_CONTEMPLATION: StyleDNA = {
  id: 'mood-quiet-contemplation',
  name: 'Quiet Contemplation',
  tagline: 'Library at midnight. Single lamp. Page turning. Time stopped.',
  category: 'mood-emotional',
  era: 'timeless',
  movement: 'modernism',
  intensity: 'subtle',

  aliases: [
    'quiet',
    'contemplation',
    'contemplative',
    'silence',
    'meditative',
    'library',
    'studious',
    'monastic',
    'still',
    'serene',
    'tranquilo',
    'silencio',
    'contemplación',
    'meditativo',
    'biblioteca',
    'monástico',
    'sereno',
    'introspectivo',
    'paz',
    'calma',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: QUIET CONTEMPLATION — The mood of a library at 2am, a monastery before dawn, a study after the family has gone to sleep. Time has stopped. Single warm light against deep shadow. The mind is FULL but the body is still. NOT melancholy (that has sadness) — this is FULFILLED stillness. The aesthetic of finished work, completed thought, earned peace.

Typography:
  - Display: classical serif (Caslon, Garamond, Tiempos) — typography of books, not advertising.
  - Single-line hero, contained and considered.
  - Color: deep ink (#1A1A1A), warm sepia (#A87E47), wine (#722F37).
  - Body copy long-form (this style accommodates LITERATURE).
  - Generous leading (1.6-1.8 line-height).
  - Proper old-style figures, ligatures, drop caps acceptable.
  - Italic for emphasis (no bold).

Composition:
  - Single subject or single object as protagonist.
  - Generous negative space (50-70%).
  - Asymmetric balance through typography placement.
  - Rule of thirds anchored on light source.
  - Books, papers, candles as still-life elements.
  - Foreground tactile object + background depth.

Color palette (warm darkness):
  - Foundation: deep navy-black (#0A0F1F), warm bone (#FAF8F0), sepia (#A87E47).
  - Lamp light warm yellow (#F4D58A).
  - Wine red (#722F37) for accents.
  - Forest green (#2D4A2B) for restful counterpoint.
  - NO bright colors — everything has GENTLE saturation.

Photography:
  - Available natural light at twilight or candlelight.
  - Window light from one side.
  - Single warm lamp in dark room.
  - Subjects in profile or 3/4 view, often reading or thinking.
  - Hands holding books, pens, cups.
  - Faces in soft warm pool of light.
  - Long exposures or stillness implied.

Subjects:
  - Hands holding worn books (leather, fabric covers).
  - Single steaming cup of tea.
  - Aged paper with handwriting.
  - Candles burning (multiple, low).
  - Spectacles on book.
  - Brass desk lamp casting yellow circle.
  - Quiet figure reading or writing.

Lighting:
  - SINGLE warm lamp (incandescent yellow, 2700K-3000K).
  - Candlelight warmth.
  - Window light at golden hour.
  - HIGH CONTRAST between lit pool and surrounding dark.
  - Backlighting subjects creates rim warmth.

Materials and surfaces:
  - Worn leather (book covers, chair armrests).
  - Aged paper (cream colored, slightly yellowed).
  - Brass and aged wood.
  - Linen and wool fabrics.
  - Crystal or porcelain (steaming tea cup).
  - Stone or hardwood floors.

Architecture and environment:
  - Library shelves stretching to ceiling.
  - Wood-paneled rooms.
  - Window seats with cushions.
  - Reading nooks under stairs.
  - Monastery cells (austere but warm).
  - Old hotel lobbies with leather chairs.
  - Wood desks with brass details.

Cultural references:
  - The New York Public Library reading rooms
  - Borges' library mythology
  - Trinity College Long Room (Dublin)
  - Penguin Classics covers (1960s)
  - Rilke's "Letters to a Young Poet"
  - Susan Sontag's writing room photographs
  - Marguerite Duras' wabi-sabi interiors
  - Robert Frank's "The Americans" quiet scenes
  - Bibliothèque Nationale de France
  - Saul Leiter's interior photography

Movement aesthetic:
  - Stillness with implied page turning, breath.
  - Slow, ritual movement (preparing tea, lighting candle).

Texture/Material:
  - Aged book bindings.
  - Linen and wool warmth.
  - Wood grain visible.
  - Paper grain in close-up.

What this style REJECTS:
  - Multiple subjects.
  - Bright lighting.
  - Saturated colors.
  - Action or movement.
  - Modern tech (laptops, phones — they break the timelessness).
  - Memphis chaos.
  - Y2K plastic.
  - Brutalist aggression.
`,

  palette: {
    foundation: ['#0A0F1F', '#FAF8F0'],
    primary: ['#A87E47', '#F4D58A'],
    accent: ['#722F37', '#2D4A2B'],
  },

  typography: {
    display: ['Caslon', 'Garamond', 'Tiempos', 'Adobe Caslon Pro'],
    body: ['Caslon', 'Garamond', 'Sabon'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Saul Leiter',
      'Robert Frank',
      'Susan Sontag (writing aesthetic)',
      'Borges (literary reference)',
    ],
    brands: ['Aesop (kindred warmth)', 'Penguin Classics covers'],
    eras: ['Timeless library aesthetic', 'Mid-century literary culture'],
    works: [
      'Penguin Classics covers (1960s)',
      'New York Public Library reading rooms',
      'Trinity College Long Room',
    ],
  },

  moodKeywords: [
    'contemplative',
    'still',
    'serene',
    'studious',
    'monastic',
    'literary',
    'patient',
    'fulfilled',
  ],

  pairsWellWith: [
    'brand-aesop-apothecary-minimal',
    'brand-yohji-yamamoto-noir',
    'cinematic-tarkovsky-poetic',
    'mood-melancholy-rainy',
    'mood-nostalgic-polaroid',
  ],
  forbiddenCombinations: [
    'design-memphis-group-80s',
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
    'mood-urgent-revolutionary',
  ],
  bestForVerticals: [
    'editorial',
    'cultural-institution',
    'fashion-luxury',
    'wine-spirits-premium',
    'wellness-spa',
    'beauty-clean',
    'art-gallery',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-fast', 'sports-athletic'],
};

// ═══════════════════════════════════════════════════════════════
// 4. URGENT REVOLUTIONARY — Protest poster energy
// ═══════════════════════════════════════════════════════════════
const MOOD_URGENT_REVOLUTIONARY: StyleDNA = {
  id: 'mood-urgent-revolutionary',
  name: 'Urgent Revolutionary',
  tagline: 'Protest poster. Bold red. Now or never. Type as scream.',
  category: 'mood-emotional',
  era: 'contemporary-2020s',
  movement: 'brutalism',
  intensity: 'extreme',

  aliases: [
    'urgent',
    'urgency',
    'revolutionary',
    'protest',
    'protest-poster',
    'activist',
    'manifesto',
    'rebellion',
    'urgente',
    'revolucionario',
    'manifiesto',
    'protesta',
    'cartel-protesta',
    'activista',
    'rebelión',
    'agresivo-político',
    'now-or-never',
    'wake-up-call',
  ],

  archetypeBase: 'brutalist-text-hero',

  promptDirective: `
Aesthetic philosophy: URGENT REVOLUTIONARY — The visual language of protest posters, manifestos, climate emergency campaigns, civil rights movements. NOW OR NEVER energy. Type as SCREAM. Bold red flag energy. NOT decorative political — this is design as ALARM SYSTEM, design as PUBLIC SUMMONS. Effective revolutionary design forces the viewer to ACT, not just look.

Typography (THE message itself):
  - Display: HEAVIEST industrial sans-serif (Druk Heavy, Compacta, Industrial Stencil).
  - All-caps. Always.
  - Letters STRETCHED, COMPRESSED, or DISTORTED for impact.
  - Headlines often broken across lines for breath emphasis: "NOW / OR / NEVER".
  - Color: blood red (#DC2626) on white, pure black on safety yellow (#FACC15), white on protest red.
  - Tracking: TIGHT (-0.05em) for compression urgency.
  - Letters can be CUT OFF by frame edges (urgency overflows).
  - Stencil typography for activist street feel.

Composition:
  - Type DOMINATES (60-90% of frame).
  - Image (when present) is supporting evidence — small documentary photograph.
  - Asymmetric, off-balance compositions implying instability.
  - Diagonal text orientations acceptable (slogans tilted).
  - Layered information: hero scream + subhead context + footer CTA.
  - White space is ABSENT (urgency fills).

Color palette (the alarm spectrum):
  - PROTEST RED (#DC2626) — flag, blood, alarm.
  - SAFETY YELLOW (#FACC15) — hazard, attention.
  - PURE BLACK (#000000) — newspaper print authority.
  - PURE WHITE (#FFFFFF) — paper background or stark contrast.
  - Sometimes single hot pink (#FF1493) for queer activism legacy.
  - NO subtle palettes. NO soft tones. NO gradients.

Imagery (when used):
  - Documentary photojournalism (black and white preferred).
  - Halftone dots visible (newsprint aesthetic).
  - Subjects mid-action (protesting, speaking, fighting).
  - Crowds OR single iconic gesture (fist raised, flag held).
  - High contrast (crushed shadows, blown highlights).
  - Photocopier degradation acceptable (zerox aesthetic).

Cultural references:
  - May 1968 Paris protests posters (Atelier Populaire)
  - Soviet constructivist propaganda (Rodchenko, El Lissitzky)
  - Black Panther poster art (Emory Douglas)
  - ACT UP "Silence = Death" (Avram Finkelstein)
  - Shepard Fairey OBEY campaigns
  - Barbara Kruger's text-on-image work
  - Jenny Holzer truisms
  - Climate strike posters 2019+
  - Black Lives Matter signage
  - Greenpeace campaign aesthetic
  - The Guerrilla Girls posters
  - Russian cubo-futurism (Mayakovsky)

Materials and printing:
  - Risograph print aesthetic (limited inks, registration off slightly).
  - Silkscreen poster.
  - Newsprint (yellowed, foldable).
  - Photocopier degradation.
  - Spray paint stencils.
  - Rough paper textures.

Movement aesthetic:
  - URGENT, immediate, NOW.
  - Type that pushes off the page toward viewer.

What this style REJECTS:
  - Decorative typography.
  - Soft colors.
  - Centered tasteful layouts.
  - Beauty for beauty's sake.
  - Multiple competing messages.
  - Subtlety.
  - Memphis playfulness.
  - Y2K commercialism.
  - Apple's polish (revolution doesn't have polish).
  - Corporate "social responsibility" sterilization.
`,

  palette: {
    foundation: ['#FFFFFF', '#000000'],
    primary: ['#DC2626', '#FACC15'],
    accent: ['#FF1493'],
    forbidden: ['#FFB6C1', '#9370DB'], // Soft palettes
  },

  typography: {
    display: ['Druk Heavy', 'Compacta', 'Industrial Stencil', 'Helvetica Black Inserat'],
    body: ['Helvetica Bold', 'Trade Gothic Bold'],
    accent: ['Stencil', 'Hand-lettered'],
  },

  references: {
    artists: [
      'Atelier Populaire (May 68)',
      'Emory Douglas (Black Panther)',
      'Avram Finkelstein (ACT UP)',
      'Shepard Fairey',
      'Barbara Kruger',
      'Jenny Holzer',
      'Aleksandr Rodchenko',
      'El Lissitzky',
    ],
    works: [
      'May 68 Paris posters',
      'Silence = Death (1987)',
      'OBEY GIANT (Fairey)',
      'Black Panther Party newspaper',
      'Russian constructivist propaganda',
    ],
    eras: ['Russian Revolution 1917-1925', 'May 1968', 'AIDS activism 1980s-90s', 'Climate movement 2019+'],
  },

  moodKeywords: [
    'urgent',
    'revolutionary',
    'aggressive',
    'demanding',
    'activist',
    'immediate',
    'unfiltered',
    'manifestic',
  ],

  pairsWellWith: [
    'design-brutalist-architectural',
    'brand-nike-cinematic-athletic', // Both have urgency
  ],
  forbiddenCombinations: [
    'mood-quiet-contemplation',
    'mood-melancholy-rainy',
    'mood-nostalgic-polaroid',
    'cinematic-wes-anderson-symmetric',
    'brand-aesop-apothecary-minimal',
    'cinematic-studio-ghibli-painterly',
  ],
  bestForVerticals: [
    'activist-nonprofit',
    'environmental',
    'political-campaign',
    'underground-music',
    'social-cause',
  ],
  forbiddenForVerticals: [
    'beauty-traditional',
    'wellness-spa',
    'kids-toys',
    'wedding-services',
    'luxury-jewelry',
  ],
};

// ═══════════════════════════════════════════════════════════════
// 5. NOSTALGIC POLAROID — Warm memory haze
// ═══════════════════════════════════════════════════════════════
const MOOD_NOSTALGIC_POLAROID: StyleDNA = {
  id: 'mood-nostalgic-polaroid',
  name: 'Nostalgic Polaroid',
  tagline: 'Faded Polaroid. Sun-bleached memory. Summer that already passed.',
  category: 'mood-emotional',
  era: 'mid-century-1950s',
  movement: 'documentary-realism',
  intensity: 'subtle',

  aliases: [
    'nostalgic',
    'nostalgia',
    'polaroid',
    'vintage-photo',
    'sun-bleached',
    'faded-memory',
    'super-8',
    'analog-warmth',
    'family-album',
    '70s-aesthetic',
    'nostálgico',
    'nostalgia',
    'polaroid',
    'foto vintage',
    'memoria',
    'álbum familiar',
    'tipo polaroid',
    'verano pasado',
    'recuerdos cálidos',
    'analógico cálido',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: NOSTALGIC POLAROID — The aesthetic of finding a shoe box of family Polaroids from 1976. Sun-bleached, slightly faded, warm and yellowed by time. Photos of summers that already passed. NOT cynical retro — this is GENUINE nostalgia, the bittersweet tenderness of looking back at ordinary moments that have become precious. Children's birthday parties, beach days, parents young.

Typography:
  - Display: hand-written script OR rounded sans-serif (Comic Sans... no, but warm rounded humanist sans like Avenir Next Rounded, Apercu).
  - Captions in handwritten cursive (real handwriting feel, not script font).
  - Color: faded brown ink (#8B5E2F), washed-out black (#3D3D3D), gentle red (#A05A2C).
  - Generous tracking on display.
  - Date stamps acceptable in corner (1976, 1982 typeface).

Composition:
  - Single moment captured imperfectly.
  - Subjects often looking AT camera (family photo style).
  - Slightly off-center, spontaneous.
  - White Polaroid border framing.
  - Light leaks at corners (not overdone).
  - Multiple Polaroids arranged as collage acceptable.

Color palette (the warm fade):
  - Foundation: warm cream (#F5F2E8), faded beige (#E8DDC9), oat (#D4C4A8).
  - Yellowed highlights (sun-bleached areas brighter and warmer).
  - Faded blues (#6B8AA0) — what was vibrant blue, now muted.
  - Faded reds (#A05A4A) — what was scarlet, now coral.
  - Faded greens (#7A8B5A) — what was forest, now sage.
  - Black anchored to sepia, not pure (#3D2F2A).

Photography (THE genuine thing):
  - 35mm film grain VISIBLE (not digital noise — actual silver halide grain).
  - Light leaks at frame edges.
  - Color shifts: cyan in shadows, magenta in highlights (cross-processing feel).
  - Slight motion blur in mundane subjects.
  - Imperfect framing — heads cut off, hands in foreground.
  - Dust spots and scratches acceptable.

Atmosphere:
  - Sun haze (golden late afternoon light).
  - Beach sand and water reflections.
  - Warm wind through open windows.
  - Steam from coffee, breath in winter cold.
  - Smoke from cigarettes (1970s nostalgia-specific).

Subjects:
  - Family members in candid moments.
  - Children at birthday parties.
  - Beach days, picnics, road trips.
  - Pets (golden retrievers especially).
  - Pre-digital interiors (TVs with antenna, rotary phones).
  - Polaroid CAMERAS themselves.
  - Carnival games, ice cream cones.
  - Convertible cars at sunset.

Lighting:
  - Sun through trees (dappled).
  - Late afternoon golden hour ALWAYS.
  - Window light (no flash — flash kills nostalgia).
  - Beach sun reflecting off water.
  - Backlit subjects (sun behind makes everything dreamy).

Materials and surfaces:
  - Polaroid white border (slightly yellowed at edges).
  - Faded paper textures.
  - Wood paneling (1970s home).
  - Avocado green and orange (signature 70s).
  - Polyester fabrics.
  - Vinyl LPs, cassette tapes (nostalgia objects).

Cultural references:
  - Family Polaroid albums 1972-1989
  - William Eggleston color photography
  - Stephen Shore "Uncommon Places"
  - Slim Aarons high-society leisure
  - Sofia Coppola's The Virgin Suicides (1999)
  - Wong Kar-wai's "In the Mood for Love" (2000) — Asian parallel
  - Larry Sultan "Pictures from Home"
  - Nan Goldin's "The Ballad of Sexual Dependency"
  - Harmony Korine's aesthetics
  - Petra Collins photography
  - Tame Impala album art (Currents era)
  - HBO's "Euphoria" quiet scenes (different than party scenes)

Movement aesthetic:
  - Stillness with implied warm wind, distant laughter.
  - Memory's slow motion.

Texture/Material:
  - Polaroid plastic and chemical fade.
  - 35mm grain.
  - Sun-bleached fabrics.
  - Old paper edges browned.

What this style REJECTS:
  - Digital perfection (this is FILM aesthetic).
  - Cold color palettes.
  - Modern technology in frame (smartphones, modern cars).
  - High contrast.
  - Polished commercial photography.
  - Memphis chaos.
  - Y2K chrome.
  - Brutalism's coldness.
  - Anything new-looking.
`,

  palette: {
    foundation: ['#F5F2E8', '#E8DDC9', '#D4C4A8'],
    primary: ['#8B5E2F', '#3D2F2A'],
    accent: ['#6B8AA0', '#A05A4A', '#7A8B5A'],
  },

  typography: {
    display: ['Hand-written script', 'Avenir Next Rounded', 'Apercu', 'Caslon Italic'],
    body: ['Caslon', 'Garamond', 'Helvetica Neue'],
    accent: ['Cursive handwriting'],
  },

  references: {
    artists: [
      'William Eggleston',
      'Stephen Shore',
      'Slim Aarons',
      'Larry Sultan',
      'Nan Goldin',
      'Petra Collins',
      'Sofia Coppola (cinematic parallel)',
    ],
    works: [
      'Family Polaroid albums 1972-1989',
      'William Eggleston "The Democratic Forest"',
      'Stephen Shore "Uncommon Places"',
      'The Virgin Suicides (Coppola, 1999)',
    ],
    eras: ['American 1970s suburbia', 'Color photography 1970s-80s'],
  },

  moodKeywords: [
    'nostalgic',
    'tender',
    'sun-bleached',
    'faded',
    'warm',
    'imperfect',
    'analog',
    'memory',
  ],

  pairsWellWith: [
    'cinematic-wes-anderson-symmetric',
    'cinematic-studio-ghibli-painterly',
    'mood-melancholy-rainy',
    'mood-quiet-contemplation',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'design-brutalist-architectural',
    'design-memphis-group-80s',
    'mood-urgent-revolutionary',
    'mood-euphoria-celebration',
  ],
  bestForVerticals: [
    'food-artisanal',
    'wine-spirits-craft',
    'fashion-vintage',
    'travel-nature',
    'editorial-storytelling',
    'beauty-organic',
    'kids-storybook',
  ],
  forbiddenForVerticals: ['tech-developer', 'finance-modern', 'sports-athletic'],
};

// ─── Exports ────────────────────────────────────────────────────
export const MOOD_EMOTIONAL_DNAS: StyleDNA[] = [
  MOOD_MELANCHOLY_RAINY,
  MOOD_EUPHORIA_CELEBRATION,
  MOOD_QUIET_CONTEMPLATION,
  MOOD_URGENT_REVOLUTIONARY,
  MOOD_NOSTALGIC_POLAROID,
];

export {
  MOOD_MELANCHOLY_RAINY,
  MOOD_EUPHORIA_CELEBRATION,
  MOOD_QUIET_CONTEMPLATION,
  MOOD_URGENT_REVOLUTIONARY,
  MOOD_NOSTALGIC_POLAROID,
};
