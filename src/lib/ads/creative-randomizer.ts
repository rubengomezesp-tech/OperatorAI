/**
 * DNA Cards System — Pro-level creative direction generator
 *
 * Cada preset es una "ficha de ADN" con referentes históricos, vocabulario
 * de cámara/iluminación/textura, paletas, tipografías, y adaptaciones por
 * vertical. Esto es lo que separa output amateur de output de agencia real.
 *
 * El randomizer combina DNA + ejes + vertical hints + memoria reciente
 * para producir una dirección creativa única en cada generación.
 */

export type Framework =
  | 'before-after'
  | 'social-proof'
  | 'problem-agitation'
  | 'lifestyle'
  | 'direct-offer'
  | 'demo'
  | 'awareness';

export type Preset =
  | 'luxury-minimal'
  | 'luxury-editorial'
  | 'aggressive-bold'
  | 'aggressive-sport'
  | 'clean-conversion'
  | 'product-demo'
  | 'tech-futuristic'
  | 'storytelling-warm';

export type EmotionalAngle =
  | 'pain-relief'
  | 'aspiration-status'
  | 'fear-of-missing-out'
  | 'pride-achievement'
  | 'belonging-tribe'
  | 'rebellion-empowerment'
  | 'curiosity-discovery'
  | 'comfort-trust';

export type Vertical =
  | 'fashion-luxury'
  | 'fashion-streetwear'
  | 'beauty-skincare'
  | 'fitness-apparel'
  | 'fitness-app'
  | 'food-restaurant'
  | 'food-cpg'
  | 'saas-b2b'
  | 'saas-consumer'
  | 'tech-hardware'
  | 'tech-app'
  | 'finance-fintech'
  | 'crypto-web3'
  | 'real-estate'
  | 'coaching-personal'
  | 'coaching-business'
  | 'ecommerce-product'
  | 'agency-creative'
  | 'education-online'
  | 'health-wellness'
  | 'generic';

// ════════════════════════════════════════════════════════════════════════════
// DNA CARDS — referentes, lenguaje visual, vocabulario pro
// ════════════════════════════════════════════════════════════════════════════

interface DNACard {
  references: string[];
  lighting: string[];
  camera: string[];
  texture: string[];
  compositionSignatures: string[];
  forbidden: string[];
  typographyPairings: string[];
  colorPalettes: string[];
  moodKeywords: string[];
  verticalAdaptations: Partial<Record<Vertical, string>>;
}

export const DNA_CARDS: Record<Preset, DNACard> = {
  'luxury-minimal': {
    references: [
      'Aesop packaging 2020-2024',
      'Bottega Veneta brand identity',
      'Hermès quiet luxury campaigns',
      'Apple iPhone product pages',
      'Le Labo apothecary style',
    ],
    lighting: [
      'soft diffused window light from one side',
      '2-point studio softbox with deep shadows',
      'natural overcast daylight (no direct sun)',
      'minimal rim light separating subject from black backdrop',
    ],
    camera: [
      'medium format 80mm at f/4',
      'phase one digital back, sharp center, soft edges',
      'macro detail shot with shallow depth',
      'tilt-shift selective focus on product',
    ],
    texture: [
      'matte paper finish, no gloss',
      'fine natural film grain',
      'subtle paper texture in negative space',
      'velvety shadows, no clipping',
    ],
    compositionSignatures: [
      'generous negative space (60%+ of frame)',
      'off-center subject placed on intersection',
      'single hero element, no clutter',
      'asymmetric balance with breathing room',
      'product as sculpture, not as merchandise',
    ],
    forbidden: [
      'neon colors',
      'harsh contrast',
      'stock-photo smiles',
      'bright cyan or magenta',
      'gradient backgrounds',
      'centered logo with tagline below',
      'multiple products competing for attention',
      'corporate clipart icons',
    ],
    typographyPairings: [
      'Didot or Bodoni display + Helvetica Neue body',
      'GT Sectra + Söhne',
      'Editorial New + Inter',
      'serif display 80-120pt + sans body 14pt',
    ],
    colorPalettes: [
      '#F5F1EC + #1A1814 + #C9A876',
      '#FAF8F3 + #2B2825 + #8B7355',
      '#E8E4DC + #1F1F1F + #B8956A',
      'warm beige + obsidian + cream + single accent gold',
    ],
    moodKeywords: ['quiet', 'restrained', 'sophisticated', 'tactile', 'considered', 'enduring'],
    verticalAdaptations: {
      'fashion-luxury': 'editorial fashion shoot mood, model in profile, hands holding garment detail, natural fabric texture visible',
      'beauty-skincare': 'glass dropper bottle on stone, water droplet detail, single ingredient hero shot',
      'food-cpg': 'product on linen napkin, raw ingredients arranged minimally, marble surface',
      'saas-b2b': 'minimal device mockup with single UI element highlighted, no busy dashboard',
      'real-estate': 'architectural detail, morning light through window, natural materials',
      'coaching-business': 'desk corner, single notebook + pen, hands writing visible from above',
    },
  },

  'luxury-editorial': {
    references: [
      'Vogue editorial 1990s-2010s',
      'i-D magazine covers',
      'Wallpaper* magazine spreads',
      'Acne Studios lookbooks',
      'The Gentlewoman publication',
      'Numéro magazine art direction',
    ],
    lighting: [
      'cinematic 3-point lighting with strong key',
      'directional hard light from 45° creating sculpted shadows',
      'golden hour natural light with lens flare',
      'mixed practical lights (lamps in scene + fill)',
      'theatrical spotlight on subject, surrounding fade to dark',
    ],
    camera: [
      'medium format film aesthetic, 6x7 ratio',
      '50mm lens, eye-level perspective, slight tilt',
      'wide angle environmental portrait at 35mm',
      'over-the-shoulder narrative angle',
      'high vantage point looking down on scene',
    ],
    texture: [
      'visible film grain (Portra 400 or Kodak Gold)',
      'rich shadow detail, no crushed blacks',
      'subtle vignetting at corners',
      'analog warmth, slight color shift in shadows',
      'paper-like matte print finish',
    ],
    compositionSignatures: [
      'magazine spread layout — text column + full-bleed image',
      'asymmetric tension, subject pushed to edge',
      'layered foreground/midground/background',
      'narrative implied — viewer enters mid-scene',
      'props tell a story (open book, half-eaten meal, worn shoes)',
    ],
    forbidden: [
      'flat lay overhead shots without context',
      'isolated product on white background',
      'CGI-perfect surfaces',
      'symmetrical centered compositions',
      'sans-only typography',
      'over-saturated colors',
      'modern minimalism (this preset is rich, not empty)',
    ],
    typographyPairings: [
      'GT Super display + Söhne breve body',
      'Tiempos Headline + Tiempos Text',
      'Canela display 90pt + Suisse Int\'l 13pt',
      'mixed serif display with italic accents',
      'all-caps small caps tracking 200',
    ],
    colorPalettes: [
      'rich oxblood + cream + brass',
      'forest green + camel + ivory + dark walnut',
      'burgundy + dusty rose + warm grey',
      'navy + ochre + bone + black',
      'editorial earth tones with single saturated accent',
    ],
    moodKeywords: ['cinematic', 'narrative', 'considered', 'cultured', 'timeless', 'lived-in'],
    verticalAdaptations: {
      'fashion-luxury': 'model lounging in editorial pose, props (vintage book, espresso cup), apartment interior with art on wall',
      'fashion-streetwear': 'street-cast model on city corner, urban texture (graffiti, fence), natural attitude',
      'beauty-skincare': 'model applying product in mirror reflection, vanity with personal objects, morning ritual mood',
      'food-restaurant': 'chef\'s hands plating dish, restaurant interior softly out of focus, intimate dining moment',
      'real-estate': 'lifestyle inside the property, owner reading with coffee, golden hour through large window',
      'agency-creative': 'studio scene, paper sketches scattered, hands annotating prints',
    },
  },

  'aggressive-bold': {
    references: [
      'Nike "Just Do It" campaigns',
      'Liquid Death water branding',
      'Off-White typography aesthetic',
      'Vetements oversized graphics',
      'WWE poster design',
      'Public Enemy album covers',
      'Supreme box logo placement',
    ],
    lighting: [
      'high contrast hard light, deep shadows',
      'single hard light from above creating dramatic shadow',
      'colored gel lighting (red, blue, electric)',
      'flash strobe frozen action lighting',
      'underlit dramatic angle, light source visible',
    ],
    camera: [
      'wide angle 24mm with slight distortion',
      'low angle hero shot looking up',
      'extreme close-up filling frame',
      'motion blur on edges, sharp center',
      'dutch tilt 5-15° for tension',
    ],
    texture: [
      'high clarity, sharp every detail',
      'punch contrast, blacks crushed intentionally',
      'halftone print texture overlay (subtle)',
      'risograph print aesthetic',
      'screen-printed poster look',
    ],
    compositionSignatures: [
      'massive typography taking 40-60% of frame',
      'centered hero subject, full-bleed background',
      'diagonal energy lines',
      'single dominant element, no negotiation',
      'text overlapping image intentionally',
      'numbers or large statements as composition anchors',
    ],
    forbidden: [
      'soft pastels',
      'cursive or script typography',
      'gentle lighting',
      'minimalist negative space',
      'subtle suggestions',
      'corporate gradients',
      'apologetic copy ("maybe", "perhaps", "consider")',
    ],
    typographyPairings: [
      'Druk Wide Bold + monospace caption',
      'Helvetica Black 200pt + tiny caps',
      'condensed all-caps display + tracking 0',
      'industrial sans serif + handwritten tag',
      'massive numerals + punchy short labels',
    ],
    colorPalettes: [
      'pure black + electric red + white',
      'safety yellow + black',
      'racing red + white + chrome',
      'high-vis orange + black + white',
      'monochrome with single saturated accent',
    ],
    moodKeywords: ['unapologetic', 'urgent', 'visceral', 'kinetic', 'confrontational', 'alive'],
    verticalAdaptations: {
      'fitness-apparel': 'athlete mid-action, sweat detail, gym environment with motion blur',
      'fitness-app': 'phone held in clenched fist post-workout, gym in background',
      'fashion-streetwear': 'model with attitude, urban brutalist backdrop, oversized clothing',
      'crypto-web3': 'glitch overlays, broken grid, raw 3D rendered objects',
      'tech-app': 'phone screen aggressive close-up, single bold UI element, energy lines',
    },
  },

  'aggressive-sport': {
    references: [
      'Nike running campaigns',
      'Adidas Predator launches',
      'Under Armour locker room aesthetic',
      'Gymshark performance ads',
      'Red Bull extreme sports',
      'Peloton intensity moments',
    ],
    lighting: [
      'high-key gym lighting with fill',
      'dramatic side light highlighting muscle definition',
      'stadium spotlights, rim light from behind',
      'dust/sweat particles caught in beam',
      'cold blue + warm orange split lighting',
    ],
    camera: [
      'low angle hero shot, athlete towering',
      'frozen action at 1/2000s, water droplets sharp',
      'motion blur trailing limbs',
      'GoPro POV chest-mounted angle',
      'tracking shot horizontal motion',
    ],
    texture: [
      'sharp every pore visible',
      'sweat beads as compositional element',
      'fabric texture and stretch visible',
      'matte black surfaces with reflections',
      'concrete and rubber gym floor texture',
    ],
    compositionSignatures: [
      'split-screen before/after performance',
      'athlete frozen mid-explosive movement',
      'product (shoe, equipment) as hero in lower third',
      'data overlay (heart rate, time, reps) graphic',
      'before/after split with timeline',
    ],
    forbidden: [
      'static posed shots',
      'soft styling',
      'pastel colors',
      'serif display typography',
      'lifestyle "easy fitness" mood',
      'unrealistic CGI bodies',
    ],
    typographyPairings: [
      'extended sans bold + tabular numerals',
      'condensed all-caps + monospace stats',
      'mixed weights for hierarchy + numbers as graphics',
    ],
    colorPalettes: [
      'matte black + safety yellow',
      'chrome + obsidian + electric blue',
      'blood red + black + white',
      'team colors maximally saturated',
    ],
    moodKeywords: ['relentless', 'explosive', 'disciplined', 'feral', 'precise', 'earned'],
    verticalAdaptations: {
      'fitness-apparel': 'athlete mid-rep, sweat, gym brand environment',
      'fitness-app': 'split-screen UI + athlete results, transformation timeline',
      'tech-hardware': 'product as performance gear, stress-tested aesthetic',
    },
  },

  'clean-conversion': {
    references: [
      'Stripe homepage hero sections',
      'Notion product marketing',
      'Linear app landing pages',
      'Webflow showcase ads',
      'Apple iPhone Pro pages',
      'Square payment terminal ads',
    ],
    lighting: [
      'even soft studio lighting, minimal shadows',
      'product photography 3-point setup',
      'natural daylight, neutral color temperature',
      'flat lay overhead with diffused light',
    ],
    camera: [
      '50mm at f/5.6, sharp throughout',
      'product photography eye-level square-on',
      'isometric 3D render aesthetic',
      'orthographic projection (no perspective distortion)',
    ],
    texture: [
      'crisp clean digital, no grain',
      'pure whites, true blacks',
      'subtle drop shadows for depth',
      'glass reflections perfectly controlled',
    ],
    compositionSignatures: [
      'product centered or rule-of-thirds',
      'headline + subhead + CTA stacked logically',
      '3 feature points with icons',
      'before/after clean split',
      'single screenshot mockup floating',
    ],
    forbidden: [
      'cluttered layouts',
      'film grain',
      'chaotic typography',
      'dark moody lighting',
      'editorial narrative complexity',
    ],
    typographyPairings: [
      'Inter or SF Pro + tabular numerals',
      'modern geometric sans throughout',
      'consistent weight hierarchy (regular + medium + bold)',
    ],
    colorPalettes: [
      'white + brand-primary + dark grey',
      'soft tints + pure brand color + black',
      'gradient brand color + neutral surface',
      'minimal: white + black + 1 brand accent',
    ],
    moodKeywords: ['clear', 'efficient', 'trustworthy', 'modern', 'direct', 'professional'],
    verticalAdaptations: {
      'saas-b2b': 'product UI mockup floating, 3 feature icons, dashboard preview',
      'saas-consumer': 'phone mockup with single screen, lifestyle hint in background',
      'finance-fintech': 'card mockup, transaction visual, security trust signals',
      'ecommerce-product': 'product hero shot, key features as icons',
    },
  },

  'product-demo': {
    references: [
      'Apple keynote product reveals',
      'Tesla product walkthrough videos',
      'Dyson engineering demos',
      'Bose audio product pages',
      'GoPro feature showcases',
    ],
    lighting: [
      'product photography studio light, multi-angle',
      'rim lighting separating product from dark gradient bg',
      'underlighting revealing transparent materials',
      'beam of light highlighting key feature',
    ],
    camera: [
      'product on rotation, isometric angle',
      'cross-section cut showing internals',
      'extreme macro on key detail',
      'orbit shot 3D rendered',
    ],
    texture: [
      'pristine product surfaces',
      'material accuracy (metal, glass, fabric)',
      'subtle specular highlights',
      'no environmental dust or wear',
    ],
    compositionSignatures: [
      'product hero center frame, callouts pointing to features',
      'exploded view showing components',
      'before/after of product in use',
      'product with usage context (hand holding, in environment)',
      'comparison side-by-side with predecessor',
    ],
    forbidden: [
      'lifestyle without product visible',
      'editorial mood',
      'film grain',
      'soft focus on product',
    ],
    typographyPairings: [
      'technical sans + monospace specs',
      'consistent label style for callouts',
      'numerical specs as visual graphics',
    ],
    colorPalettes: [
      'product brand + neutral environment',
      'monochromatic base + brand accent',
      'tech aesthetic: white/grey/black + accent',
    ],
    moodKeywords: ['precise', 'engineered', 'capable', 'considered', 'inspectable'],
    verticalAdaptations: {
      'tech-hardware': 'product floating, feature callouts, exploded internals',
      'beauty-skincare': 'bottle cross-section showing layers, ingredient highlights',
      'food-cpg': 'package + ingredients flat lay, nutritional callouts',
    },
  },

  'tech-futuristic': {
    references: [
      'Blade Runner 2049 visual language',
      'Cyberpunk 2077 marketing',
      'OpenAI brand visuals',
      'Apple Vision Pro launch aesthetic',
      'TRON: Legacy art direction',
      'Radiohead Kid A artwork',
      'Mass Effect concept art',
    ],
    lighting: [
      'volumetric light through atmosphere',
      'neon practical lights as composition elements',
      'rim light defining silhouette against dark gradient',
      'screen glow lighting subject from below',
      'fog + light beam interaction',
    ],
    camera: [
      'wide angle architectural perspective',
      'low angle looking up at tech subject',
      'dolly zoom dramatic compression',
      'macro on tech detail (chip, sensor, lens)',
    ],
    texture: [
      'glossy obsidian surfaces',
      'subtle digital noise',
      'light particles and atmosphere',
      'metallic sheen with iridescence',
      'glass and reflective materials',
    ],
    compositionSignatures: [
      'subject vs vast architectural background',
      'symmetrical futuristic environment',
      'product or interface floating mid-air',
      'data visualization as composition element',
      'silhouette against glowing gradient',
    ],
    forbidden: [
      'natural earthy tones (unless contrast purpose)',
      'rustic textures',
      'film grain',
      'editorial paper feel',
      'over-used cyberpunk pink/cyan combo (too cliché)',
    ],
    typographyPairings: [
      'mono technical font + clean sans',
      'futuristic display (Eurostile-like) + Inter',
      'data labels with tabular numerals',
      'thin sans + monospace accents',
    ],
    colorPalettes: [
      'deep navy + electric cyan + cool white',
      'obsidian + iridescent gradient + accent',
      'brand color amplified + dark matte + chrome',
      'AVOID generic neon pink + cyan; use subtle iridescence',
    ],
    moodKeywords: ['intelligent', 'inevitable', 'precise', 'calm-powerful', 'sophisticated', 'sci-fi grounded'],
    verticalAdaptations: {
      'saas-b2b': 'UI floating in space, data flows visualized, architectural depth',
      'tech-app': 'phone floating with iridescent reflection, ambient atmospheric light',
      'crypto-web3': '3D rendered abstract objects, gradient sky, sense of digital infinity',
      'tech-hardware': 'product in laboratory clean room, scientific precision mood',
    },
  },

  'storytelling-warm': {
    references: [
      'Airbnb belong anywhere campaigns',
      'Patagonia documentary photography',
      'Toast restaurant marketing',
      'Headspace meditation app aesthetic',
      'Mailchimp character illustrations + photo',
      'Calm app landscape photography',
    ],
    lighting: [
      'golden hour warm sunlight',
      'firelight or candle glow practical',
      'soft window light at dawn/dusk',
      'warm tungsten interior lighting',
    ],
    camera: [
      '35mm documentary style at f/2.8',
      'environmental portrait, subject in context',
      'candid moment, slight motion ok',
      'wide angle storytelling, multiple subjects',
    ],
    texture: [
      'natural film grain (Portra 400)',
      'warm color cast in shadows',
      'soft skin retouch (not airbrushed)',
      'natural environmental textures (wood, fabric, plant)',
    ],
    compositionSignatures: [
      'human subject in warm environment',
      'shared moment between people',
      'hands as compositional element (holding, making, touching)',
      'environmental context tells story',
      'narrative implied — moment in time',
    ],
    forbidden: [
      'sterile studio backgrounds',
      'cold blue tones',
      'perfectly retouched skin',
      'aggressive geometric design',
      'cyan/magenta',
    ],
    typographyPairings: [
      'humanist serif + warm sans (Tiempos + Aktiv Grotesk)',
      'rounded sans + script accent',
      'editorial serif body + bold display',
    ],
    colorPalettes: [
      'warm beige + terracotta + forest green',
      'cream + ochre + dusty rose',
      'sand + sage + warm white',
      'natural earth tones with golden highlight',
    ],
    moodKeywords: ['warm', 'human', 'genuine', 'belonging', 'lived-in', 'considered', 'kind'],
    verticalAdaptations: {
      'food-restaurant': 'family meal scene, hands sharing dish, warm interior',
      'coaching-personal': 'mentor + student in conversation, coffee shop or home',
      'real-estate': 'family in their new home, golden hour, lived-in details',
      'health-wellness': 'morning routine, person stretching by window, peace',
      'education-online': 'student with notebook, sunlit desk, books and tea',
    },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// AXES — randomization with affinity
// ════════════════════════════════════════════════════════════════════════════

export type Composition =
  | 'rule-of-thirds'
  | 'centered-hero'
  | 'asymmetric-tension'
  | 'split-screen'
  | 'layered-depth'
  | 'full-bleed-immersive'
  | 'magazine-editorial';

export type ColorStrategy =
  | 'monochromatic'
  | 'dual-tone'
  | 'triadic-vibrant'
  | 'brand-only'
  | 'accent-pop'
  | 'gradient-modern';

export type Typography =
  | 'sans-bold-modern'
  | 'serif-elegant'
  | 'display-impact'
  | 'condensed-editorial'
  | 'mixed-hierarchy'
  | 'mono-tech';

export interface CreativeDirection {
  framework: Framework;
  preset: Preset;
  emotionalAngle: EmotionalAngle;
  composition: Composition;
  colorStrategy: ColorStrategy;
  typography: Typography;
  vertical: Vertical;
  /** Full DNA card pulled from preset for the brief to use */
  dna: DNACard;
  /** Vertical-specific adaptation hint (if available) */
  verticalHint?: string;
  /** Random selection of references / lighting / camera / etc. (1 each) */
  selectedReferences: string;
  selectedLighting: string;
  selectedCamera: string;
  selectedTexture: string;
  selectedCompositionSignature: string;
  selectedTypographyPairing: string;
  selectedColorPalette: string;
  /** All forbidden items joined */
  forbidden: string[];
  /** Reasoning trace for logs */
  seedNote: string;
}

const ALL_FRAMEWORKS: Framework[] = [
  'before-after', 'social-proof', 'problem-agitation',
  'lifestyle', 'direct-offer', 'demo', 'awareness',
];

const ALL_PRESETS: Preset[] = Object.keys(DNA_CARDS) as Preset[];

const ALL_ANGLES: EmotionalAngle[] = [
  'pain-relief', 'aspiration-status', 'fear-of-missing-out',
  'pride-achievement', 'belonging-tribe', 'rebellion-empowerment',
  'curiosity-discovery', 'comfort-trust',
];

const ALL_COMPOSITIONS: Composition[] = [
  'rule-of-thirds', 'centered-hero', 'asymmetric-tension',
  'split-screen', 'layered-depth', 'full-bleed-immersive', 'magazine-editorial',
];

const ALL_COLOR_STRATEGIES: ColorStrategy[] = [
  'monochromatic', 'dual-tone', 'triadic-vibrant',
  'brand-only', 'accent-pop', 'gradient-modern',
];

const ALL_TYPOGRAPHY: Typography[] = [
  'sans-bold-modern', 'serif-elegant', 'display-impact',
  'condensed-editorial', 'mixed-hierarchy', 'mono-tech',
];

const FRAMEWORK_PRESET_AFFINITY: Record<Framework, Preset[]> = {
  'before-after': ['aggressive-bold', 'aggressive-sport', 'clean-conversion', 'product-demo'],
  'social-proof': ['clean-conversion', 'storytelling-warm', 'luxury-editorial', 'product-demo'],
  'problem-agitation': ['aggressive-bold', 'tech-futuristic', 'aggressive-sport', 'storytelling-warm'],
  'lifestyle': ['storytelling-warm', 'luxury-editorial', 'luxury-minimal', 'aggressive-sport'],
  'direct-offer': ['aggressive-bold', 'clean-conversion', 'aggressive-sport', 'tech-futuristic'],
  'demo': ['product-demo', 'tech-futuristic', 'clean-conversion', 'luxury-minimal'],
  'awareness': ['luxury-editorial', 'luxury-minimal', 'storytelling-warm', 'tech-futuristic'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomExcluding<T>(arr: T[], exclude: T[]): T {
  const filtered = arr.filter((x) => !exclude.includes(x));
  return filtered.length > 0 ? pickRandom(filtered) : pickRandom(arr);
}

// ════════════════════════════════════════════════════════════════════════════
// VERTICAL DETECTION from user prompt + brand context
// ════════════════════════════════════════════════════════════════════════════

const VERTICAL_KEYWORDS: Record<Vertical, RegExp> = {
  'fashion-luxury': /\b(luxury fashion|haute couture|designer|handbag|jewelry|watch)\b/i,
  'fashion-streetwear': /\b(streetwear|sneaker|hype|drop|graffiti|urban wear)\b/i,
  'beauty-skincare': /\b(skincare|cosmetic|makeup|serum|cream|beauty|skin)\b/i,
  'fitness-apparel': /\b(activewear|gym wear|workout clothes|athletic apparel)\b/i,
  'fitness-app': /\b(fitness app|workout app|training app|fitness tracker)\b/i,
  'food-restaurant': /\b(restaurant|cafe|chef|menu|dining|culinary)\b/i,
  'food-cpg': /\b(snack|beverage|drink|food brand|grocery|cpg)\b/i,
  'saas-b2b': /\b(saas|b2b|enterprise|crm|erp|workflow|productivity tool)\b/i,
  'saas-consumer': /\b(consumer app|productivity app|note-taking|habit tracker)\b/i,
  'tech-hardware': /\b(hardware|device|gadget|smart home|wearable)\b/i,
  'tech-app': /\b(app|mobile app|ai app|tech app)\b/i,
  'finance-fintech': /\b(banking|finance|fintech|payment|invest|wealth|trading)\b/i,
  'crypto-web3': /\b(crypto|web3|nft|defi|blockchain|token)\b/i,
  'real-estate': /\b(real estate|property|home for sale|listing|realtor)\b/i,
  'coaching-personal': /\b(life coach|personal coach|mindfulness|self-help)\b/i,
  'coaching-business': /\b(business coach|consulting|mentor|executive coach)\b/i,
  'ecommerce-product': /\b(ecommerce|online store|shop|product launch)\b/i,
  'agency-creative': /\b(agency|creative studio|design firm|marketing agency)\b/i,
  'education-online': /\b(course|online learning|education|tutorial|class)\b/i,
  'health-wellness': /\b(wellness|meditation|yoga|mental health|therapy)\b/i,
  'generic': /^$/,
};

export function detectVertical(userPrompt: string, brandDescription?: string): Vertical {
  const text = `${userPrompt} ${brandDescription ?? ''}`.toLowerCase();
  for (const [vertical, regex] of Object.entries(VERTICAL_KEYWORDS)) {
    if (vertical === 'generic') continue;
    if (regex.test(text)) return vertical as Vertical;
  }
  return 'generic';
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN: generate creative direction
// ════════════════════════════════════════════════════════════════════════════

export interface IntentHints {
  preferAggressive?: boolean;
  preferLuxury?: boolean;
  preferTech?: boolean;
  preferWarm?: boolean;
  preferEditorial?: boolean;
}

export function detectIntentHints(userPrompt: string): IntentHints {
  const lower = userPrompt.toLowerCase();
  const hints: IntentHints = {};
  if (/\b(agresiv|aggressive|bold|fuerte|impacto|urgent|urgenc|atrev)/i.test(lower)) hints.preferAggressive = true;
  if (/\b(lujo|luxury|premium|elegant|sofistica|exclusiv|alta gama)/i.test(lower)) hints.preferLuxury = true;
  if (/\b(tech|tecnolog|futur|innovat|ai\b|saas|app\b|software)/i.test(lower)) hints.preferTech = true;
  if (/\b(c[aá]lid|warm|human|friendly|cercan|amable|cozy)/i.test(lower)) hints.preferWarm = true;
  if (/\b(editorial|magazin|narrat|cinemat|story)/i.test(lower)) hints.preferEditorial = true;
  return hints;
}

export function generateCreativeDirection(
  recentDirections: Array<Partial<CreativeDirection>> = [],
  hints: IntentHints = {},
  vertical: Vertical = 'generic',
): CreativeDirection {
  // Avoid repeating the last 2 frameworks
  const recentFrameworks = recentDirections.slice(0, 2).map((d) => d.framework).filter(Boolean) as Framework[];
  const framework = pickRandomExcluding(ALL_FRAMEWORKS, recentFrameworks);

  // Pick preset compatible with framework + avoid recent ones
  const recentPresets = recentDirections.slice(0, 2).map((d) => d.preset).filter(Boolean) as Preset[];
  let candidatePresets = FRAMEWORK_PRESET_AFFINITY[framework];

  // Apply hints with strong preference
  if (hints.preferAggressive) {
    const filtered = candidatePresets.filter((p) => p.includes('aggressive') || p === 'tech-futuristic');
    if (filtered.length > 0) candidatePresets = filtered;
  } else if (hints.preferLuxury) {
    const filtered = candidatePresets.filter((p) => p.includes('luxury'));
    if (filtered.length > 0) candidatePresets = filtered;
  } else if (hints.preferTech) {
    const filtered = candidatePresets.filter((p) => p === 'tech-futuristic' || p === 'product-demo' || p === 'clean-conversion');
    if (filtered.length > 0) candidatePresets = filtered;
  } else if (hints.preferWarm) {
    const filtered = candidatePresets.filter((p) => p === 'storytelling-warm' || p === 'luxury-editorial');
    if (filtered.length > 0) candidatePresets = filtered;
  } else if (hints.preferEditorial) {
    const filtered = candidatePresets.filter((p) => p === 'luxury-editorial' || p === 'storytelling-warm');
    if (filtered.length > 0) candidatePresets = filtered;
  }

  const preset = pickRandomExcluding(candidatePresets, recentPresets);
  const dna = DNA_CARDS[preset];

  // Other axes — random but avoiding recent
  const recentAngles = recentDirections.slice(0, 3).map((d) => d.emotionalAngle).filter(Boolean) as EmotionalAngle[];
  const emotionalAngle = pickRandomExcluding(ALL_ANGLES, recentAngles);

  const recentColors = recentDirections.slice(0, 2).map((d) => d.colorStrategy).filter(Boolean) as ColorStrategy[];
  const colorStrategy = pickRandomExcluding(ALL_COLOR_STRATEGIES, recentColors);

  const recentTypo = recentDirections.slice(0, 2).map((d) => d.typography).filter(Boolean) as Typography[];
  const typography = pickRandomExcluding(ALL_TYPOGRAPHY, recentTypo);

  const composition = pickRandom(ALL_COMPOSITIONS);

  // Pull random selections from the DNA card
  const selectedReferences = pickRandom(dna.references);
  const selectedLighting = pickRandom(dna.lighting);
  const selectedCamera = pickRandom(dna.camera);
  const selectedTexture = pickRandom(dna.texture);
  const selectedCompositionSignature = pickRandom(dna.compositionSignatures);
  const selectedTypographyPairing = pickRandom(dna.typographyPairings);
  const selectedColorPalette = pickRandom(dna.colorPalettes);
  const verticalHint = dna.verticalAdaptations[vertical];

  const seedNote = `${framework}+${preset}+${emotionalAngle}+${composition}+${vertical}`;

  return {
    framework,
    preset,
    emotionalAngle,
    composition,
    colorStrategy,
    typography,
    vertical,
    dna,
    verticalHint,
    selectedReferences,
    selectedLighting,
    selectedCamera,
    selectedTexture,
    selectedCompositionSignature,
    selectedTypographyPairing,
    selectedColorPalette,
    forbidden: dna.forbidden,
    seedNote,
  };
}

/**
 * Builds a structured creative briefing block to inject into the brief prompt.
 * This is the magic: instead of letting the LLM choose, we prescribe.
 */
export function buildDirectionBlock(direction: CreativeDirection): string {
  const lines: string[] = [];
  lines.push('═══ CREATIVE DIRECTION (locked, follow exactly) ═══');
  lines.push(`Framework: ${direction.framework}`);
  lines.push(`Preset (visual DNA): ${direction.preset}`);
  lines.push(`Emotional angle: ${direction.emotionalAngle}`);
  lines.push(`Composition strategy: ${direction.composition} — ${direction.selectedCompositionSignature}`);
  lines.push(`Vertical: ${direction.vertical}`);
  if (direction.verticalHint) lines.push(`Vertical adaptation: ${direction.verticalHint}`);
  lines.push('');
  lines.push('Visual references to channel: ' + direction.selectedReferences);
  lines.push('Lighting: ' + direction.selectedLighting);
  lines.push('Camera/lens: ' + direction.selectedCamera);
  lines.push('Texture/finish: ' + direction.selectedTexture);
  lines.push('Color palette: ' + direction.selectedColorPalette);
  lines.push('Typography pairing: ' + direction.selectedTypographyPairing);
  lines.push('Mood keywords: ' + direction.dna.moodKeywords.join(', '));
  lines.push('');
  lines.push('STRICTLY AVOID (forbidden in this preset):');
  direction.forbidden.forEach((f) => lines.push('  - ' + f));
  return lines.join('\n');
}
