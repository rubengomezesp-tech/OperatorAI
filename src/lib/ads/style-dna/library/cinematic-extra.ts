/**
 * 🎬 STYLE DNA — Cinematic (Extra Pack)
 *
 * 5 DNAs adicionales basados en lenguajes cinematográficos icónicos.
 *
 * DNAs incluidos:
 *   1. cinematic-pta-warm-1970s        — Paul Thomas Anderson 70s warmth
 *   2. cinematic-fincher-cold-clinical — David Fincher digital cold
 *   3. cinematic-malick-magic-hour     — Terrence Malick magic hour
 *   4. cinematic-spike-jonze-whimsical — Spike Jonze whimsical surreal
 *   5. cinematic-gaspar-noe-neon       — Gaspar Noé neon nightlife
 */

import type { StyleDNA } from '../types';

// ═══════════════════════════════════════════════════════════════
// 1. PAUL THOMAS ANDERSON — 70s warm cinematic
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_PTA_WARM: StyleDNA = {
  id: 'cinematic-pta-warm-1970s',
  name: 'Paul Thomas Anderson 70s Warm',
  tagline: 'Boogie Nights warmth. Magnolia tenderness. Long takes. American sad.',
  category: 'cinematic',
  era: 'mid-century-1950s',
  movement: 'cinematic-naturalism',
  intensity: 'moderate',

  aliases: [
    'pta',
    'paul-thomas-anderson',
    'pta-style',
    'boogie-nights',
    'magnolia-aesthetic',
    'there-will-be-blood',
    'phantom-thread',
    '70s-warm-cinema',
    'estilo pta',
    'paul thomas anderson',
    'tipo pta',
    'cine cálido 70s',
    'magnolia',
    'boogie nights',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: PAUL THOMAS ANDERSON — American director of Boogie Nights (1997), Magnolia (1999), There Will Be Blood (2007), The Master (2012), Phantom Thread (2017), Licorice Pizza (2021). PTA's cinema is WARM 1970s aesthetic with American melancholy underneath. Long takes, slow zooms, warm color grading, period-perfect production design. NOT just "70s nostalgia" — PTA understands the SAD UNDERSIDE of the era's optimism.

Typography (when in editorial):
  - Display: 1970s vintage serif (Cooper Black for Boogie Nights era, Caslon for Phantom Thread).
  - Or condensed sans (Trade Gothic Bold) for newspaper era.
  - Color: warm amber (#A87E47), faded black (#3D2F2A), period browns.
  - All-caps with generous tracking for vintage feel.
  - Italic for emotional emphasis.

Composition:
  - LONG TAKES implied through composition patience.
  - Subjects centered or rule-of-thirds.
  - Often shot at 50mm — natural human perspective.
  - Slow zooms (PTA loves slow zoom-ins on faces).
  - Frame within frame compositions (doorways, mirrors).
  - Tracking shots through environments (Boogie Nights pool party scene).

Color palette (the warm 70s spectrum):
  - WARM AMBERS: vintage gold (#A87E47), butterscotch (#D4A017).
  - FADED REDS: brick (#A05A4A), wine (#722F37).
  - WARM BROWNS: chocolate (#5D4E37), coffee (#3D2F2A).
  - CREAM: aged paper (#F5F2E8), oat (#E8DDC9).
  - Occasional FOREST GREEN (#3D5240) for outdoor.
  - NEVER cool blues unless deliberate (period-incorrect).

Photography (THE PTA craft):
  - Shot on 35mm or 65mm film (Phantom Thread shot 35mm).
  - Robert Elswit cinematography (PTA's long-time DP).
  - Anamorphic 2.39:1 widescreen.
  - Shallow DOF on emotional close-ups (f/2.8 on 50mm).
  - Deep DOF on environmental tracking (f/8 on 35mm).
  - Period-accurate film grain.
  - Color graded WARM (slight magenta lift, golden highlights).

Camera and lighting:
  - 35mm Cooke S4 or vintage Lomo anamorphic lenses.
  - Practical lights (lamps, windows, neon signs) preferred.
  - Tungsten light embraced (warm orange tone).
  - Sodium vapor street lights.
  - Backlit subjects for silhouette drama.

Production design (THE soul):
  - PERIOD-PERFECT detail (PTA has obsessive production design).
  - Boogie Nights: 1977 wood paneling, gold wallpaper, shag carpet.
  - Magnolia: 1999 corporate San Fernando Valley.
  - The Master: 1950s mid-century with sea spray.
  - Phantom Thread: 1955 London fashion atelier.
  - Licorice Pizza: 1973 Encino sun and gas stations.

Subjects (PTA's universe):
  - American outsiders, hustlers, dreamers.
  - Single-parent households.
  - Aging professionals (Phillip Seymour Hoffman roles).
  - Young people on the cusp of adulthood.
  - Religious figures, cults, charismatic leaders.
  - Working class Americans.

Movement aesthetic:
  - SLOW. Patient. Tracked.
  - Long takes establish psychological time.

Cultural references:
  - Boogie Nights (1997) — disco/porn industry 70s
  - Magnolia (1999) — LA interconnected lives
  - There Will Be Blood (2007) — turn of century oil
  - The Master (2012) — postwar 1950s
  - Phantom Thread (2017) — 1955 London couture
  - Licorice Pizza (2021) — 1973 SF Valley
  - Robert Altman (predecessor lineage)
  - Hal Ashby (predecessor)

Texture/Material:
  - Wood paneling, shag carpet (70s).
  - Aged film grain throughout.
  - Worn fabrics with character.
  - Smoke (cigarettes, fireplaces, exhaust).

What this style REJECTS:
  - Cool digital cinema aesthetics (this is FILM warmth).
  - Crisp digital sharpness.
  - Modern production design in period scenes.
  - Bright unnatural saturation.
  - Anything Fincher-like (cool clinical opposite of PTA).
  - Anything 1980s (PTA's range is 1899-1973).
`,

  palette: {
    foundation: ['#F5F2E8', '#3D2F2A', '#5D4E37'],
    primary: ['#A87E47', '#D4A017', '#A05A4A'],
    accent: ['#722F37', '#3D5240', '#E8DDC9'],
  },

  typography: {
    display: ['Cooper Black', 'Caslon', 'Trade Gothic Bold'],
    body: ['Caslon', 'Garamond', 'Trade Gothic'],
    accent: ['Italic serif'],
  },

  references: {
    artists: [
      'Paul Thomas Anderson',
      'Robert Elswit (cinematographer)',
      'Robert Altman (predecessor)',
      'Hal Ashby (predecessor)',
    ],
    works: [
      'Boogie Nights (1997)',
      'Magnolia (1999)',
      'There Will Be Blood (2007)',
      'The Master (2012)',
      'Phantom Thread (2017)',
      'Licorice Pizza (2021)',
    ],
    eras: ['PTA filmography 1996-present'],
  },

  moodKeywords: [
    'warm',
    'melancholic',
    'nostalgic',
    'period',
    'humanistic',
    'patient',
    'cinematic',
    'tender',
  ],

  pairsWellWith: [
    'mood-nostalgic-polaroid',
    'mood-melancholy-rainy',
    'photo-vivian-maier-street',
  ],
  forbiddenCombinations: [
    'design-y2k-chrome-millennium',
    'cinematic-fincher-cold-clinical',
    'design-memphis-group-80s',
  ],
  bestForVerticals: [
    'fashion-vintage',
    'food-artisanal',
    'editorial',
    'wine-spirits-craft',
    'cultural-institution',
    'film-tv',
    'music-vinyl',
  ],
  forbiddenForVerticals: ['tech-developer', 'finance-modern', 'kids-toys'],
};

// ═══════════════════════════════════════════════════════════════
// 2. DAVID FINCHER — Cold clinical digital
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_FINCHER_COLD: StyleDNA = {
  id: 'cinematic-fincher-cold-clinical',
  name: 'David Fincher Cold Clinical',
  tagline: 'Green-cyan grading. Digital perfection. Obsession as aesthetic.',
  category: 'cinematic',
  era: 'contemporary-2020s',
  movement: 'cinematic-naturalism',
  intensity: 'bold',

  aliases: [
    'fincher',
    'david-fincher',
    'fincher-style',
    'seven-aesthetic',
    'fight-club',
    'social-network',
    'gone-girl',
    'cold-cinema',
    'estilo fincher',
    'david fincher',
    'tipo fincher',
    'cine frío clínico',
    'verde cian',
    'digital perfecto',
  ],

  archetypeBase: 'full-bleed-cinematic',

  promptDirective: `
Aesthetic philosophy: DAVID FINCHER — American director of Seven (1995), Fight Club (1999), Zodiac (2007), The Social Network (2010), Gone Girl (2014), Mank (2020). Fincher's cinema is CLINICAL OBSESSION — green-cyan color grading, digital perfection, hundreds of takes per shot. The aesthetic of paranoia, conspiracy, modernity-as-disease. Steady camera, deliberate movement, computer-precise framing. NOT warm humanism (that's PTA) — Fincher is the COLD inverse.

Typography (when in editorial):
  - Display: condensed sans (Trade Gothic Bold Condensed, Helvetica Inserat).
  - Or stark serif at extreme size (Bodoni, Times for newspaper era).
  - Color: pale yellow (#FACC15), pure black, antiseptic white.
  - Title cards often white text on black with tight tracking.
  - Hierarchy SURGICAL — like medical labels.

Composition (the Fincher precision):
  - Rigid symmetry or rule-of-thirds with mathematical precision.
  - Subject CENTERED or perfectly off-center (1/3 or 2/3 from edge).
  - Often LOW ANGLE looking up at corporate spaces.
  - Wide environmental shots with tiny human in vast architecture.
  - Tracking shots through impossible spaces (Zodiac credits, Fight Club opening).
  - Frame-within-frame compositions common.

Color palette (THE Fincher signature):
  - PALE YELLOW (#FACC15) — Fight Club lights, Seven streetlamps.
  - GREEN-CYAN (#00CED1, #4A90A4) — sodium vapor + fluorescent.
  - DESATURATED EVERYTHING — color graded -30% saturation.
  - WARM SKIN tones contrasted with cool environments.
  - PURE BLACK shadows (crushed in DI).
  - NEVER bright saturated reds (Fincher avoids them — "too obvious").

Photography (THE Fincher craft):
  - Shot on RED digital cameras (Fincher pioneer of digital cinema).
  - Or 65mm film (Mank).
  - Anamorphic 2.39:1 cinema.
  - F/2.8-f/4 typical aperture (medium DOF).
  - SHARP throughout (digital clarity is feature).
  - Color graded heavily — green-cyan in shadows, warm highlights.

Camera and movement:
  - SUBTLE movement only — slow dollies, smooth pans.
  - HUNDREDS of takes per shot (Fincher's reputation).
  - Computer-controlled motion (Mocon for Zodiac).
  - Sometimes static for psychological pressure.
  - Frame within frame (looking through windows, doorways).

Lighting (THE Fincher mood):
  - PRACTICAL sources only when possible.
  - Sodium vapor street lights (orange-pink).
  - Fluorescent office (sickly green-cyan).
  - Tungsten lamps (warm pools in darkness).
  - HIGH CONTRAST — pure shadows, defined highlights.
  - Subjects often half-lit (psychological complexity).

Subjects (Fincher's universe):
  - Investigators, conspirators, programmers.
  - White-collar professionals in glass towers.
  - Detectives in rain-soaked cities.
  - Couples with secrets.
  - Cult members, conspiracy theorists.
  - Always characters with INTERIORITY.

Production design:
  - Modern corporate spaces (Social Network — Harvard, Facebook).
  - Decaying urban environments (Seven's eternal rain).
  - Beige suburban hell (Gone Girl).
  - Dim apartment interiors.
  - 1970s San Francisco (Zodiac).

Movement aesthetic:
  - DELIBERATE. Computer-precise.
  - Time stretches in psychological scenes.

Cultural references:
  - Seven (1995) — eternal rain neo-noir
  - Fight Club (1999) — corporate dystopia
  - Zodiac (2007) — 1970s San Francisco precision
  - The Social Network (2010) — modern Harvard
  - Gone Girl (2014) — suburban deception
  - Mindhunter (Netflix series 2017-2019)
  - Mank (2020) — black and white period
  - Christopher Doyle (kindred Asian cinematographer)

Texture/Material:
  - Glass and steel architecture.
  - Wet pavement, neon reflections.
  - Computer screens, surveillance footage aesthetic.
  - Stainless steel, brushed aluminum.

What this style REJECTS:
  - Warm humanistic photography.
  - Saturated color palettes.
  - Soft natural lighting.
  - Hand-held camera shake.
  - 1970s nostalgia warmth (PTA territory).
  - Anything sentimental.
`,

  palette: {
    foundation: ['#0A0A0A', '#1A1A1A'],
    primary: ['#FACC15', '#4A90A4'],
    accent: ['#00CED1', '#5C5C5C', '#FAFAFA'],
  },

  typography: {
    display: ['Trade Gothic Bold Condensed', 'Helvetica Inserat', 'Bodoni'],
    body: ['Helvetica', 'Inter'],
  },

  references: {
    artists: [
      'David Fincher',
      'Jeff Cronenweth (cinematographer Fincher long-time)',
      'Erik Messerschmidt (cinematographer)',
    ],
    works: [
      'Seven (1995)',
      'Fight Club (1999)',
      'Zodiac (2007)',
      'The Social Network (2010)',
      'Gone Girl (2014)',
      'Mindhunter (2017-2019)',
    ],
    eras: ['Fincher filmography 1992-present', 'Digital cinema era'],
  },

  moodKeywords: [
    'cold',
    'clinical',
    'paranoid',
    'precise',
    'obsessive',
    'modern',
    'digital',
    'unsettling',
  ],

  pairsWellWith: [
    'cinematic-kubrick-symmetric',
    'design-brutalist-architectural',
    'mood-urgent-revolutionary',
    'brand-tesla-futuristic-clean',
  ],
  forbiddenCombinations: [
    'cinematic-pta-warm-1970s',
    'cinematic-studio-ghibli-painterly',
    'mood-nostalgic-polaroid',
    'design-memphis-group-80s',
  ],
  bestForVerticals: [
    'tech-saas',
    'finance',
    'cybersecurity',
    'consulting',
    'editorial',
    'film-tv',
    'true-crime',
  ],
  forbiddenForVerticals: ['kids-toys', 'food-artisanal', 'wellness-spa'],
};

// ═══════════════════════════════════════════════════════════════
// 3. TERRENCE MALICK — Magic hour transcendent
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_MALICK_MAGIC: StyleDNA = {
  id: 'cinematic-malick-magic-hour',
  name: 'Terrence Malick Magic Hour',
  tagline: 'Wheat fields. Sun through fingers. Whispered voiceover. Cinema as prayer.',
  category: 'cinematic',
  era: 'mid-century-1950s',
  movement: 'cinematic-naturalism',
  intensity: 'moderate',

  aliases: [
    'malick',
    'terrence-malick',
    'malick-style',
    'days-of-heaven',
    'tree-of-life',
    'badlands',
    'magic-hour',
    'spiritual-cinema',
    'estilo malick',
    'terrence malick',
    'tipo malick',
    'magic hour cine',
    'cine espiritual',
    'tree of life',
    'days of heaven',
  ],

  archetypeBase: 'documentary-honest',

  promptDirective: `
Aesthetic philosophy: TERRENCE MALICK — American director of Badlands (1973), Days of Heaven (1978), The Thin Red Line (1998), The Tree of Life (2011), Knight of Cups (2015). Malick's cinema is TRANSCENDENT NATURALISM — wheat fields at golden hour, children running through grass, hands touching tree bark, whispered voiceover asking philosophical questions. NOT plot-driven cinema — Malick films are PRAYERS. Every frame seeks God in light.

Typography (when in editorial):
  - Display: classical serif (Garamond Italic, Caslon, Adobe Bodoni).
  - Body: warm serif at literary leading.
  - Color: warm amber (#A87E47), faded sepia, deep umber.
  - Italic forms common (poetic, contemplative).
  - Hierarchy minimal — typography exists as caption, not declaration.
  - Hand-written feel acceptable.

Composition (the Malick gaze):
  - WIDE establishing shots — figure tiny in vast nature.
  - LOW ANGLE looking up through trees, plants, hands.
  - HANDS as protagonists (touching grass, water, faces).
  - Subjects often SHOT FROM BEHIND walking forward.
  - Children as photographic subjects (innocence as aesthetic).
  - Movement from darkness toward light.

Color palette (the magic hour spectrum):
  - GOLDEN HOUR amber (#FFB347, #D4A017).
  - WARM CREAM sky (#F5DEB3).
  - SUMMER FIELD greens (#9ACD32, #6B8E23).
  - WARM EARTH browns (#A87E47, #8B5E2F).
  - SUNSET oranges and pinks (#FF6F00, #F4C2A1).
  - Deep blues only at twilight (#3D5A80).
  - SLIGHTLY DESATURATED — film aesthetic, not Instagram saturation.

Photography (THE Malick craft):
  - Shot at MAGIC HOUR (golden hour + sunset + blue hour).
  - Days of Heaven famously shot ENTIRELY at magic hour.
  - Néstor Almendros + Haskell Wexler cinematography (Days of Heaven).
  - Emmanuel Lubezki (modern Malick — Tree of Life onwards).
  - HAND-HELD MOTION — graceful but unsteady (Lubezki's signature).
  - Wide angle (24-35mm) for environmental immersion.
  - 70mm or 35mm film, sometimes Steadicam.

Camera and movement:
  - HAND-HELD floating camera (Lubezki style).
  - Camera moves WITH subjects, not in front of.
  - Subjects walk into frame from edges.
  - Focus shifts mid-shot (rack focus to nature elements).
  - Subjects often blur in/out of focus.

Lighting (THE Malick obsession):
  - MAGIC HOUR exclusively for hero moments.
  - Sun BACKLIGHTING subjects (rim light from behind).
  - LENS FLARES embraced (not avoided).
  - SUN through TREES creating dappled light.
  - Sun behind hands creating glow.
  - Twilight blue and amber transitions.

Subjects (Malick's universe):
  - Children playing in nature (Tree of Life).
  - Soldiers crossing fields (Thin Red Line).
  - Couples in wheat fields (Days of Heaven).
  - Hands touching natural surfaces.
  - Animals in golden light.
  - Cosmic imagery (Tree of Life — universe origins).

Movement aesthetic:
  - GRACEFUL, like dance.
  - Subjects ALWAYS in motion (running, walking, reaching).
  - Camera floats parallel to motion.

Voiceover aesthetic (translates to type):
  - Whispered, philosophical.
  - "Mother... brother... what are we?"
  - Hand-written letter quality.

Cultural references:
  - Badlands (1973)
  - Days of Heaven (1978) — magic hour milestone
  - The Thin Red Line (1998)
  - The New World (2005)
  - The Tree of Life (2011) — cosmic existential
  - To the Wonder (2012)
  - Knight of Cups (2015)
  - Néstor Almendros cinematography
  - Emmanuel Lubezki cinematography
  - Andrew Wyeth paintings (kindred American pastoral)

Texture/Material:
  - Wheat field stalks.
  - Wet grass at dawn.
  - Tree bark, leaves, pinecones.
  - Soft cotton clothing in golden light.
  - Skin in sun.

What this style REJECTS:
  - Studio lighting.
  - Static cameras.
  - Posed subjects.
  - Bright saturated commercial colors.
  - Indoor scenes (Malick is outdoor cinema).
  - Anything urban (rare exceptions in Knight of Cups).
  - Plot-driven structure (this is meditation cinema).
`,

  palette: {
    foundation: ['#F5DEB3', '#FFB347', '#A87E47'],
    primary: ['#D4A017', '#9ACD32', '#FF6F00'],
    accent: ['#3D5A80', '#F4C2A1', '#6B8E23'],
  },

  typography: {
    display: ['Garamond Italic', 'Caslon', 'Adobe Bodoni'],
    body: ['Garamond', 'Caslon'],
    accent: ['Hand-written', 'Italic serif'],
  },

  references: {
    artists: [
      'Terrence Malick',
      'Néstor Almendros (cinematographer)',
      'Emmanuel Lubezki (cinematographer)',
      'Andrew Wyeth (kindred painter)',
    ],
    works: [
      'Days of Heaven (1978)',
      'The Thin Red Line (1998)',
      'The Tree of Life (2011)',
      'The New World (2005)',
    ],
    eras: ['Malick filmography 1973-present'],
  },

  moodKeywords: [
    'transcendent',
    'pastoral',
    'spiritual',
    'natural',
    'golden',
    'wandering',
    'philosophical',
    'graceful',
  ],

  pairsWellWith: [
    'cinematic-studio-ghibli-painterly',
    'cinematic-tarkovsky-poetic',
    'mood-nostalgic-polaroid',
    'photo-jonathan-lovekin-food',
  ],
  forbiddenCombinations: [
    'design-brutalist-architectural',
    'design-y2k-chrome-millennium',
    'cinematic-fincher-cold-clinical',
    'mood-urgent-revolutionary',
  ],
  bestForVerticals: [
    'travel-nature',
    'wellness-organic',
    'wedding-celebration',
    'food-organic',
    'fashion-bohemian',
    'cultural-institution',
    'editorial',
  ],
  forbiddenForVerticals: ['tech-developer', 'finance', 'sports-athletic-urban', 'gaming'],
};

// ═══════════════════════════════════════════════════════════════
// 4. SPIKE JONZE — Whimsical surreal
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_SPIKE_JONZE: StyleDNA = {
  id: 'cinematic-spike-jonze-whimsical',
  name: 'Spike Jonze Whimsical Surreal',
  tagline: 'Her warmth. Where the Wild Things. Childhood imagination as adult truth.',
  category: 'cinematic',
  era: 'contemporary-2020s',
  movement: 'surrealism',
  intensity: 'moderate',

  aliases: [
    'spike-jonze',
    'jonze-style',
    'her-aesthetic',
    'where-the-wild-things-are',
    'being-john-malkovich',
    'whimsical-cinema',
    'surreal-warm',
    'estilo spike jonze',
    'spike jonze',
    'tipo jonze',
    'cine surreal cálido',
    'her',
    'whimsical',
    'fantasía adulta',
  ],

  archetypeBase: 'editorial-magazine',

  promptDirective: `
Aesthetic philosophy: SPIKE JONZE — American director of Being John Malkovich (1999), Adaptation (2002), Where the Wild Things Are (2009), Her (2013), Beastie Boys music videos. Jonze's cinema is WHIMSICAL SURREALISM rendered with warmth and emotional truth. NOT random "weird" — Jonze finds the EMOTIONAL CORE of strange premises. Adult characters with childlike wonder. Existential questions in everyday situations. Her makes you cry over an OS. Wild Things makes you grieve a wolf monster.

Typography (when in editorial):
  - Display: warm humanist sans (Avenir, Apercu, Inter Display).
  - Or rounded serif (Cooper, Sentinel) for fantasy aesthetic.
  - Color: dusty pink (#F4C2A1), warm cream, faded orange, deep blue.
  - Hand-lettered acceptable for whimsical projects.
  - Hierarchy emotional, not corporate.

Composition:
  - Subject often in middle of LARGE GENTLE environment.
  - Soft focus on subject, dreamy bokeh background.
  - Symmetric or rule-of-thirds with warm asymmetry.
  - Mid-shot most common (not too close, not too wide).
  - Subjects looking off-frame at something we don't see.

Color palette (the Jonze warmth):
  - HER PALETTE: dusty rose (#F4C2A1), warm cream (#F5DEB3), faded coral (#FF7F50), grey-blue (#8B9DA9).
  - WHERE THE WILD THINGS ARE: forest greens, wolf grays, ochre, warm browns.
  - BEING JOHN MALKOVICH: muted office beiges, fluorescent skin tones.
  - General: SLIGHTLY DESATURATED warm tones (35-50% saturation).
  - Reds always SOFT (coral, blush) — never cherry red.
  - NEVER cold, NEVER neon, NEVER aggressive.

Photography:
  - Shot on 35mm film for warmth (Hoyte van Hoytema for Her).
  - Anamorphic widescreen.
  - Soft focus aesthetics — slight blur preserved.
  - Bokeh round and creamy.
  - 50mm or 85mm portrait lenses.
  - Color graded WARM with PINK-CORAL push.

Camera:
  - Soft handheld OR steady tracking.
  - Slow dollies in close to characters.
  - Subjective POV moments (Her — phone screen perspectives).
  - Sometimes character looks DIRECTLY at camera (breaking 4th wall briefly).

Lighting:
  - WINDOW LIGHT preferred — warm afternoon.
  - Practical lights (lamps, monitors, neon signs).
  - Sodium vapor street lights at dusk.
  - SOFT key from one side, gentle fill.
  - Backlight for separation, never dramatic rim.

Production design (THE Jonze world):
  - LA in Her — pastel future LA, no smartphones.
  - Wild Things — handmade monster suits, real forests.
  - Adaptation — sweaty Hollywood interiors.
  - Music videos — playful absurdity (Beastie Boys "Sabotage" 70s cop spoof).

Subjects (Jonze's universe):
  - Lonely adults seeking connection.
  - Children in mood-shifted situations.
  - Couples at edges of relationships.
  - Creators, writers, voice actors.
  - Monsters with feelings.
  - Talking objects (Her, Adaptation).

Movement aesthetic:
  - GENTLE. Patient.
  - Subjects move at conversational pace.

Cultural references:
  - Being John Malkovich (1999)
  - Adaptation (2002)
  - Where the Wild Things Are (2009)
  - Her (2013) — the Jonze masterpiece
  - I'm Here (2010 short)
  - Beastie Boys music videos (Sabotage 1994)
  - Karen O music videos
  - Maurice Sendak (Wild Things author)
  - Charlie Kaufman screenplays (collaborator)
  - Michel Gondry (kindred whimsical)
  - Wes Anderson (kindred but more rigid)

Texture/Material:
  - Soft cotton fabrics.
  - Worn wood, vinyl records.
  - Handmade objects (felt, yarn, crayon-drawn).
  - Pastel walls (Her LA buildings).
  - Soft sweaters (Theodore in Her).

What this style REJECTS:
  - Cold digital cinematography.
  - Aggressive editing.
  - Cynical detachment (Jonze always feels FOR characters).
  - Saturated commercial colors.
  - Brutalism.
  - Nightlife/club aesthetic.
  - Corporate sleek.
`,

  palette: {
    foundation: ['#F5DEB3', '#F4C2A1'],
    primary: ['#FF7F50', '#8B9DA9'],
    accent: ['#A05A4A', '#6B8E23', '#5D4E37'],
  },

  typography: {
    display: ['Avenir', 'Apercu', 'Cooper'],
    body: ['Avenir', 'Inter', 'Garamond'],
    accent: ['Hand-lettered', 'Italic serif'],
  },

  references: {
    artists: [
      'Spike Jonze',
      'Charlie Kaufman (collaborator)',
      'Hoyte van Hoytema (cinematographer Her)',
      'Karen O (collaborator)',
      'Michel Gondry (kindred)',
    ],
    works: [
      'Being John Malkovich (1999)',
      'Adaptation (2002)',
      'Where the Wild Things Are (2009)',
      'Her (2013)',
      'I\'m Here (2010 short)',
      'Beastie Boys "Sabotage" (1994)',
    ],
    eras: ['Spike Jonze filmography 1994-present'],
  },

  moodKeywords: [
    'whimsical',
    'tender',
    'surreal',
    'warm',
    'introspective',
    'imaginative',
    'gentle',
    'emotional',
  ],

  pairsWellWith: [
    'cinematic-studio-ghibli-painterly',
    'cinematic-wes-anderson-symmetric',
    'mood-melancholy-rainy',
    'mood-nostalgic-polaroid',
  ],
  forbiddenCombinations: [
    'design-brutalist-architectural',
    'cinematic-fincher-cold-clinical',
    'design-y2k-chrome-millennium',
    'mood-urgent-revolutionary',
  ],
  bestForVerticals: [
    'tech-saas-warm',
    'wellness-mental',
    'editorial',
    'film-tv',
    'kids-storybook',
    'fashion-vintage',
    'music-indie',
  ],
  forbiddenForVerticals: ['finance', 'sports-athletic', 'sneakers-streetwear'],
};

// ═══════════════════════════════════════════════════════════════
// 5. GASPAR NOÉ — Neon aggressive nightlife
// ═══════════════════════════════════════════════════════════════
const CINEMATIC_GASPAR_NOE: StyleDNA = {
  id: 'cinematic-gaspar-noe-neon',
  name: 'Gaspar Noé Neon Aggressive',
  tagline: 'Strobe lights. Spiral camera. Argentinian provocateur. Cinema as drug trip.',
  category: 'cinematic',
  era: 'contemporary-2020s',
  movement: 'postmodernism',
  intensity: 'extreme',

  aliases: [
    'gaspar-noe',
    'noe-style',
    'irreversible',
    'enter-the-void',
    'climax',
    'love',
    'nightclub-cinema',
    'neon-aggressive',
    'estilo noé',
    'gaspar noé',
    'tipo noé',
    'cine neon agresivo',
    'club nocturno cine',
    'irreversible',
    'climax',
  ],

  archetypeBase: 'spotify-duotone-diagonal',

  promptDirective: `
Aesthetic philosophy: GASPAR NOÉ — French-Argentinian provocateur director of I Stand Alone (1998), Irreversible (2002), Enter the Void (2009), Love (2015), Climax (2018), Vortex (2021). Noé's cinema is ASSAULTIVE EXPERIENCE — strobing reds, neon clubs, spiral camera moves, single-take violence, drug trip visualizations. NOT subtle cinema — Noé wants to PHYSICALLY AFFECT you. Long takes that become exhausting. Saturated colors that hurt eyes. CINEMA AS PSYCHOLOGICAL EXPERIMENT.

Typography (when in editorial):
  - Display: massive condensed sans, often DISTORTED (Noé's title cards).
  - All-caps, tight tracking, screen-stretched.
  - Color: blood red (#E60000), electric pink (#FF1493), neon blue (#00BFFF).
  - Sometimes inverted (white on red, or black on saturated blue).
  - Title cards Noé-style: massive single words filling frame.

Composition:
  - SPIRAL camera moves (Enter the Void god view).
  - LONG single-take shots (Irreversible's tunnel scene).
  - Subjects in CLUB environments — neon, smoke, crowds.
  - Tight close-ups on faces during intense emotion.
  - Wide environmental shots in dark spaces with single light source.
  - BREAKING fourth wall (text addressing viewer directly).

Color palette (the assaultive neon):
  - SATURATED REDS (#E60000, #FF0000) — Noé's signature.
  - ELECTRIC PINK (#FF1493, #FF00FF).
  - NEON BLUE (#00BFFF, #007FFF).
  - PURE BLACK (#0A0A0A) for negative spaces.
  - Skin tones rendered in colored gel light (red-cast, pink-cast).
  - NEVER muted, NEVER subtle, NEVER warm earthy.

Photography (THE Noé craft):
  - Shot on RED digital cameras (Climax shot 8K).
  - Or 65mm film (Enter the Void).
  - Anamorphic 2.39:1 cinema.
  - LONG TAKES — sometimes 30+ minutes single shot (Climax opening dance).
  - Hand-held OR Steadicam (fluid but unstable).
  - Color graded EXTREME — saturated, glowing.
  - Strobing effects in editing.

Camera and movement (THE Noé signature):
  - SPIRAL camera (Enter the Void POV from soul perspective).
  - 360° rotations.
  - Inverted compositions (camera upside down).
  - Long tracking through environments.
  - Sometimes camera FOLLOWS object falling.

Lighting (the club aesthetic):
  - NEON SIGNS as primary illumination.
  - Strobes (in club scenes).
  - Colored gels (red, pink, blue, green).
  - Monitor/screen glow on faces.
  - NEVER natural light (Noé is night cinema).

Subjects (Noé's universe):
  - Dancers in clubs (Climax).
  - Couples in apartments (Love, Vortex).
  - Drug users (Enter the Void).
  - Strangers in city streets at night.
  - Bodies in altered states.
  - Subjects often TOPLESS or partially undressed.

Production design:
  - Neon-lit clubs.
  - Apartment interiors with red lighting.
  - Tokyo streets at night (Enter the Void).
  - Argentinian winter forests (Climax).
  - 1990s-2010s urban environments.

Cultural references:
  - I Stand Alone (1998)
  - Irreversible (2002) — backwards storytelling
  - Enter the Void (2009) — Tokyo trip
  - Love (2015)
  - Climax (2018) — single dance into hell
  - Vortex (2021) — split screen old age
  - Daft Punk music videos (kindred)
  - Argento giallo cinema (predecessor)
  - Stanley Kubrick (predecessor different)
  - Lars von Trier (kindred provocateur)
  - Refn's Drive (kindred neon aesthetic)

Movement aesthetic:
  - VIOLENT ENERGY.
  - Camera and subjects in constant motion.
  - Time stretches and compresses.

Texture/Material:
  - Wet pavement reflecting neon.
  - Sweaty skin under colored lights.
  - Smoke, fog, particles in light beams.
  - Vinyl, leather, club surfaces.

What this style REJECTS:
  - Natural light.
  - Pastel color palettes.
  - Static cameras.
  - Family-friendly subjects.
  - Gentle emotional warmth.
  - Anything Wes Anderson coded.
  - Daytime scenes (Noé is night cinema).
`,

  palette: {
    foundation: ['#0A0A0A'],
    primary: ['#E60000', '#FF1493', '#00BFFF'],
    accent: ['#FF00FF', '#FF0000', '#7A0000'],
    forbidden: ['#F5DEB3', '#A87E47'], // Warm earth tones
  },

  typography: {
    display: ['Druk Heavy', 'Compacta Bold', 'Helvetica Inserat'],
    body: ['Helvetica Bold', 'Trade Gothic'],
  },

  references: {
    artists: [
      'Gaspar Noé',
      'Benoît Debie (cinematographer)',
      'Dario Argento (predecessor)',
      'Lars von Trier (kindred)',
      'Nicolas Winding Refn (kindred)',
    ],
    works: [
      'I Stand Alone (1998)',
      'Irreversible (2002)',
      'Enter the Void (2009)',
      'Love (2015)',
      'Climax (2018)',
      'Vortex (2021)',
    ],
    eras: ['Noé filmography 1998-present', 'Provocateur cinema'],
  },

  moodKeywords: [
    'aggressive',
    'neon',
    'nightlife',
    'visceral',
    'provocative',
    'altered',
    'kinetic',
    'psychedelic',
  ],

  pairsWellWith: [
    'design-y2k-chrome-millennium',
    'mood-euphoria-celebration',
    'design-memphis-group-80s',
    'mood-urgent-revolutionary',
  ],
  forbiddenCombinations: [
    'cinematic-malick-magic-hour',
    'cinematic-studio-ghibli-painterly',
    'mood-quiet-contemplation',
    'brand-aesop-apothecary-minimal',
  ],
  bestForVerticals: [
    'music-electronic',
    'fashion-streetwear',
    'nightlife-club',
    'beverages-alcohol',
    'film-tv',
    'art-cultural-edgy',
  ],
  forbiddenForVerticals: [
    'wellness-spa',
    'kids-toys',
    'food-traditional',
    'finance-conservative',
    'wedding-services',
  ],
};

// ─── Exports ────────────────────────────────────────────────────
export const CINEMATIC_EXTRA_DNAS: StyleDNA[] = [
  CINEMATIC_PTA_WARM,
  CINEMATIC_FINCHER_COLD,
  CINEMATIC_MALICK_MAGIC,
  CINEMATIC_SPIKE_JONZE,
  CINEMATIC_GASPAR_NOE,
];

export {
  CINEMATIC_PTA_WARM,
  CINEMATIC_FINCHER_COLD,
  CINEMATIC_MALICK_MAGIC,
  CINEMATIC_SPIKE_JONZE,
  CINEMATIC_GASPAR_NOE,
};
