// Creative Studio v2 — Product Intelligence
//
// Responsibility:
// 1. Detect the product category from brief + analyses
// 2. Provide concrete ad scenarios per category
// 3. Scenarios feed the planner and renderer to produce RELEVANT ads
//    (t-shirt brand → fashion scenes, NOT abstract dark backgrounds)

import type {
  ProductBrief,
  ImageAnalysis,
  ProductCategory,
  AdScenario,
  VisualStyle,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// CATEGORY DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Detects product category from brief and image analyses.
 * Uses keyword matching + vertical hint + analysis descriptions.
 * Confidence is heuristic but stable.
 */
export function detectProductCategory(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
): ProductCategory {
  const haystack = buildSearchText(brief, analyses).toLowerCase();

  // Run all detectors, return first match with highest priority
  for (const detector of CATEGORY_DETECTORS) {
    if (detector.match(haystack, brief, analyses)) {
      return detector.category;
    }
  }

  // Fallback based on vertical
  switch (brief.vertical) {
    case 'apparel':
      return 'fashion_apparel';
    case 'saas_app':
      return 'saas_productivity';
    case 'ecommerce':
      return 'ecommerce_general';
    case 'physical':
      return 'consumer_tech';
    default:
      return 'unknown';
  }
}

function buildSearchText(
  brief: ProductBrief,
  analyses: ImageAnalysis[],
): string {
  const parts = [
    brief.name || '',
    brief.oneLiner,
    brief.valueProposition,
    brief.target,
    ...brief.features,
    ...brief.benefits,
    ...brief.voiceCues,
    ...analyses.map((a) => a.description),
    ...analyses.flatMap((a) => a.visibleText),
    ...analyses.flatMap((a) => a.uiElements),
  ];
  return parts.filter(Boolean).join(' ');
}

// ─── Detector rules ────────────────────────────────────────
// Order matters: more specific first

interface CategoryDetector {
  category: ProductCategory;
  match: (
    text: string,
    brief: ProductBrief,
    analyses: ImageAnalysis[],
  ) => boolean;
}

const CATEGORY_DETECTORS: CategoryDetector[] = [
  // Fashion - apparel specific
  {
    category: 'streetwear',
    match: (t) =>
      /\b(streetwear|street wear|hoodie|sneaker|oversized|graphic tee)\b/.test(t),
  },
  {
    category: 'fashion_apparel',
    match: (t) =>
      /\b(t[- ]?shirt|tee|clothing|apparel|fashion|wear|shirt|dress|jacket|pants|outfit|collection|drop|model|garment)\b/.test(t),
  },

  // Fitness specific
  {
    category: 'fitness_equipment',
    match: (t) =>
      /\b(dumbbell|barbell|gym equipment|treadmill|weights|resistance band|kettlebell)\b/.test(t),
  },
  {
    category: 'fitness_service',
    match: (t) =>
      /\b(gym|personal trainer|coaching|workout plan|fitness program|bootcamp|crossfit|yoga studio|pilates)\b/.test(t),
  },

  // Health / food
  {
    category: 'health_supplements',
    match: (t) =>
      /\b(supplement|protein|vitamin|pre[- ]?workout|creatine|collagen|omega|nutrition powder|bcaa)\b/.test(t),
  },
  {
    category: 'food_beverage',
    match: (t) =>
      /\b(food|drink|beverage|coffee|tea|snack|kitchen|restaurant|recipe|chef|meal|organic)\b/.test(t),
  },

  // Beauty
  {
    category: 'beauty_cosmetics',
    match: (t) =>
      /\b(beauty|cosmetic|skincare|makeup|serum|cream|lipstick|mascara|fragrance|perfume)\b/.test(t),
  },

  // Tech - developer tools
  {
    category: 'saas_developer',
    match: (t) =>
      /\b(api|sdk|developer|code editor|ide|cli|terminal|github|deployment|devops|engineer)\b/.test(t),
  },

  // SaaS (after developer tools)
  {
    category: 'saas_productivity',
    match: (t, brief) =>
      brief.vertical === 'saas_app' ||
      /\b(saas|dashboard|productivity|workflow|automation|no[- ]?code|platform|software)\b/.test(t),
  },

  // Consumer tech (hardware)
  {
    category: 'consumer_tech',
    match: (t) =>
      /\b(headphone|speaker|camera|drone|smartwatch|earbuds|keyboard|mouse|laptop|gadget|device|charger)\b/.test(t),
  },

  // Home goods
  {
    category: 'home_goods',
    match: (t) =>
      /\b(furniture|home decor|candle|bedding|kitchen|ceramic|vase|lamp|sofa|interior)\b/.test(t),
  },

  // Luxury
  {
    category: 'luxury_goods',
    match: (t) =>
      /\b(luxury|jewelry|watch|timepiece|leather|premium brand|haute|fine|high[- ]?end)\b/.test(t),
  },

  // Automotive
  {
    category: 'automotive',
    match: (t) =>
      /\b(car|vehicle|automotive|suv|sedan|electric vehicle|ev charging|dealership)\b/.test(t),
  },

  // Digital products
  {
    category: 'digital_product',
    match: (t) =>
      /\b(ebook|course|template|preset|pdf guide|online training|masterclass|bootcamp)\b/.test(t),
  },

  // Entertainment
  {
    category: 'entertainment_media',
    match: (t) =>
      /\b(podcast|streaming|film|music|album|video game|gaming|movie|show)\b/.test(t),
  },

  // Local service (broad)
  {
    category: 'local_service',
    match: (t) =>
      /\b(barber|salon|clinic|dentist|lawyer|accountant|plumber|electrician|local business|service appointment)\b/.test(t),
  },
];

// ═══════════════════════════════════════════════════════════════════
// AD SCENARIOS PER CATEGORY
// ═══════════════════════════════════════════════════════════════════

/**
 * Returns 5-7 distinct ad scenarios for a given product category.
 * The planner picks 5 of these to assign to variants.
 */
export function getScenariosForCategory(
  category: ProductCategory,
): AdScenario[] {
  return SCENARIOS[category] ?? SCENARIOS.unknown;
}

const SCENARIOS: Record<ProductCategory, AdScenario[]> = {
  // ────────────────────────────────────────────────────────────
  // FASHION / APPAREL
  // ────────────────────────────────────────────────────────────
  fashion_apparel: [
    {
      id: 'model_lifestyle_outdoor',
      name: 'Model lifestyle outdoor',
      sceneDescription:
        'A model wearing the garment in a natural outdoor setting, window light or golden hour, authentic candid pose, lifestyle fashion photography',
      subjectFraming:
        'Three-quarter body shot, subject off-center left, urban or nature backdrop softly blurred',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'lifestyle_product'],
      summary: 'Model wearing the garment in real life',
    },
    {
      id: 'studio_ghost_mannequin',
      name: 'Studio ghost mannequin',
      sceneDescription:
        'Garment photographed alone on a clean seamless backdrop, invisible mannequin effect, natural drape visible, detail of stitching and fabric texture',
      subjectFraming:
        'Centered garment, generous top and bottom space, crisp product focus',
      overlaySpace: 'top',
      preferredStyles: ['clean_bright', 'tech_product_white'],
      summary: 'Clean product shot on white background',
    },
    {
      id: 'flat_lay_fabric',
      name: 'Flat lay with accessories',
      sceneDescription:
        'Overhead flat lay of garment arranged on a textured surface with complementary accessories nearby, natural diffused light from above, editorial styling',
      subjectFraming:
        'Top-down composition, garment occupying center-left third, accessories filling negative space',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Top-down flat lay with styling',
    },
    {
      id: 'streetwear_editorial',
      name: 'Streetwear editorial',
      sceneDescription:
        'Street fashion shot with urban concrete or brick backdrop, hard directional light, model in dynamic pose, cinematic color grade, slight motion energy',
      subjectFraming:
        'Medium shot at low angle, subject framed against architectural lines, bold presence',
      overlaySpace: 'bottom',
      preferredStyles: ['dark_cinematic', 'editorial_magazine'],
      summary: 'Urban streetwear editorial',
    },
    {
      id: 'ecommerce_hero_clean',
      name: 'E-commerce hero',
      sceneDescription:
        'Clean e-commerce product hero with garment presented on a contemporary backdrop with subtle color, bright even lighting, aspirational but accessible feel',
      subjectFraming:
        'Garment or model centered, color backdrop complementing the product, professional shoppable feel',
      overlaySpace: 'centered_safe',
      preferredStyles: ['bold_startup', 'clean_bright'],
      summary: 'Shoppable hero with color backdrop',
    },
    {
      id: 'detail_texture_macro',
      name: 'Detail texture macro',
      sceneDescription:
        'Extreme close-up of fabric texture, stitching detail, material quality, soft directional light revealing weave and craftsmanship',
      subjectFraming:
        'Macro framing, shallow depth of field, fabric filling most of frame',
      overlaySpace: 'top',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Macro fabric texture',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // STREETWEAR (a subset with its own energy)
  // ────────────────────────────────────────────────────────────
  streetwear: [
    {
      id: 'urban_alley_attitude',
      name: 'Urban alley attitude',
      sceneDescription:
        'Model in streetwear against graffiti or industrial urban wall, hard shadows, high contrast, attitude-forward pose',
      subjectFraming:
        'Medium shot, slightly off-center, strong vertical lines from architecture',
      overlaySpace: 'bottom',
      preferredStyles: ['dark_cinematic', 'social_media_ad'],
      summary: 'Urban attitude with hard light',
    },
    {
      id: 'crew_group_shot',
      name: 'Crew group shot',
      sceneDescription:
        'Group of models wearing the collection together, candid street setting, natural light, community vibe',
      subjectFraming: 'Wide shot with group centered, breathing room above for copy',
      overlaySpace: 'top',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Crew wearing the collection',
    },
    {
      id: 'detail_graphic_macro',
      name: 'Graphic print macro',
      sceneDescription:
        'Close-up of graphic print or logo on the garment, crisp detail, subtle fabric texture, bold visual statement',
      subjectFraming: 'Extreme close-up, graphic filling most of frame',
      overlaySpace: 'bottom',
      preferredStyles: ['bold_startup', 'social_media_ad'],
      summary: 'Graphic print close-up',
    },
    {
      id: 'product_laydown_streetwear',
      name: 'Product laydown streetwear',
      sceneDescription:
        'Garment laid flat on concrete or urban surface with subtle accessories, hard shadow, editorial styling',
      subjectFraming: 'Top-down with garment off-center, negative space one side',
      overlaySpace: 'right',
      preferredStyles: ['dark_cinematic', 'editorial_magazine'],
      summary: 'Streetwear laydown on concrete',
    },
    {
      id: 'campaign_cover',
      name: 'Campaign cover',
      sceneDescription:
        'Hero cover shot for a drop, strong framing, bold composition with brand-driven palette, feels like a magazine campaign cover',
      subjectFraming: 'Subject dominant, composition feels like a magazine cover',
      overlaySpace: 'centered_safe',
      preferredStyles: ['editorial_magazine', 'bold_startup'],
      summary: 'Drop campaign cover',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // SAAS — PRODUCTIVITY / GENERAL
  // ────────────────────────────────────────────────────────────
  saas_productivity: [
    {
      id: 'laptop_workspace_context',
      name: 'Laptop workspace context',
      sceneDescription:
        'Modern minimal workspace with laptop open, soft natural window light, subtle depth of field, clean desk with one or two focal objects',
      subjectFraming:
        'Laptop slightly off-center, workspace elements providing context, space for headline above',
      overlaySpace: 'top',
      preferredStyles: ['clean_bright', 'minimal_swiss'],
      summary: 'Laptop on minimal desk',
    },
    {
      id: 'product_device_floating',
      name: 'Product device floating',
      sceneDescription:
        'Laptop or phone device floating against a gradient or solid soft-color backdrop, clean studio lighting, subtle shadow underneath',
      subjectFraming:
        'Device centered or slightly angled, negative space around, subtle color backdrop',
      overlaySpace: 'top',
      preferredStyles: ['bold_startup', 'tech_product_white'],
      summary: 'Device floating on gradient',
    },
    {
      id: 'abstract_tech_geometry',
      name: 'Abstract tech geometry',
      sceneDescription:
        'Abstract composition with geometric shapes, subtle color gradients, modern tech aesthetic without showing a literal device',
      subjectFraming:
        'Geometric focal element off-center, clean negative space',
      overlaySpace: 'left',
      preferredStyles: ['bold_startup', 'minimal_swiss'],
      summary: 'Abstract tech shapes',
    },
    {
      id: 'founder_portrait_workspace',
      name: 'Founder portrait workspace',
      sceneDescription:
        'Professional portrait of a person at their workspace, natural light, authentic not stocky, modern office environment softly out of focus',
      subjectFraming:
        'Portrait framing, subject off-center, workspace context visible',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'lifestyle_product'],
      summary: 'Operator at workspace',
    },
    {
      id: 'clean_stage_launch',
      name: 'Clean stage launch',
      sceneDescription:
        'Product mockup on a clean solid-color stage with soft shadow, Apple-style product page aesthetic, minimal and precise',
      subjectFraming: 'Centered product on seamless stage, minimal environment',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Clean product stage',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // SAAS — DEVELOPER TOOLS
  // ────────────────────────────────────────────────────────────
  saas_developer: [
    {
      id: 'dark_terminal_aesthetic',
      name: 'Dark terminal aesthetic',
      sceneDescription:
        'Developer workspace with dark interface visible, moody ambient lighting, subtle glow from screen, technical atmosphere',
      subjectFraming: 'Screen slightly angled, subject off-center',
      overlaySpace: 'right',
      preferredStyles: ['dark_cinematic', 'bold_startup'],
      summary: 'Dark dev workspace',
    },
    {
      id: 'clean_code_product',
      name: 'Clean code product',
      sceneDescription:
        'Laptop with clean code editor visible on soft-color backdrop, modern developer tool aesthetic',
      subjectFraming: 'Laptop angled, clean backdrop',
      overlaySpace: 'top',
      preferredStyles: ['bold_startup', 'clean_bright'],
      summary: 'Laptop with clean code',
    },
    {
      id: 'abstract_tech',
      name: 'Abstract tech',
      sceneDescription:
        'Abstract composition suggesting data, infrastructure, or code flow, geometric with subtle color, no literal screen',
      subjectFraming: 'Geometric shapes creating focal point',
      overlaySpace: 'left',
      preferredStyles: ['minimal_swiss', 'bold_startup'],
      summary: 'Abstract infrastructure',
    },
    {
      id: 'developer_workspace_lifestyle',
      name: 'Developer workspace lifestyle',
      sceneDescription:
        'Developer at their setup, multiple monitors, natural light, authentic environment',
      subjectFraming: 'Portrait with workspace, natural posture',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Developer at their setup',
    },
    {
      id: 'minimal_launch',
      name: 'Minimal launch',
      sceneDescription:
        'Minimal product launch composition with geometric element and product name space, Swiss design influenced',
      subjectFraming: 'Geometric grid composition',
      overlaySpace: 'centered_safe',
      preferredStyles: ['minimal_swiss', 'tech_product_white'],
      summary: 'Minimal launch composition',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // HEALTH SUPPLEMENTS
  // ────────────────────────────────────────────────────────────
  health_supplements: [
    {
      id: 'product_gym_lifestyle',
      name: 'Product in gym lifestyle',
      sceneDescription:
        'Supplement container in a gym environment with natural light, gym floor or equipment subtly visible, aspirational fitness context',
      subjectFraming: 'Product slightly off-center, gym context softly blurred',
      overlaySpace: 'top',
      preferredStyles: ['lifestyle_product', 'bold_startup'],
      summary: 'Supplement in gym setting',
    },
    {
      id: 'kitchen_nutrition_scene',
      name: 'Kitchen nutrition scene',
      sceneDescription:
        'Supplement on a kitchen counter alongside fresh ingredients, natural window light, healthy lifestyle atmosphere',
      subjectFraming: 'Product with ingredients around, breakfast-time warmth',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'luxury_beige'],
      summary: 'Kitchen with ingredients',
    },
    {
      id: 'packaging_hero_clean',
      name: 'Packaging hero clean',
      sceneDescription:
        'Product packaging centered on clean background, studio lighting showing label detail, premium package aesthetic',
      subjectFraming: 'Centered product, clean seamless backdrop',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Packaging on clean background',
    },
    {
      id: 'ingredient_macro',
      name: 'Ingredient macro',
      sceneDescription:
        'Macro shot of product powder or pill alongside natural ingredients, shallow depth of field, ingredient-forward story',
      subjectFraming: 'Macro detail, shallow DOF',
      overlaySpace: 'bottom',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Ingredient close-up',
    },
    {
      id: 'athlete_action',
      name: 'Athlete action',
      sceneDescription:
        'Athletic subject mid-workout with product nearby, high energy, natural gym light, performance narrative',
      subjectFraming: 'Dynamic athlete shot with product visible',
      overlaySpace: 'left',
      preferredStyles: ['social_media_ad', 'dark_cinematic'],
      summary: 'Athlete with product',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // FOOD & BEVERAGE
  // ────────────────────────────────────────────────────────────
  food_beverage: [
    {
      id: 'table_editorial',
      name: 'Table editorial',
      sceneDescription:
        'Food or drink on a styled table setting, natural window light, editorial food photography, appetizing styling',
      subjectFraming: 'Overhead or 45-degree, product center-left',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Styled table editorial',
    },
    {
      id: 'kitchen_context',
      name: 'Kitchen context',
      sceneDescription:
        'Product in authentic kitchen environment, ingredients visible, warm homey atmosphere',
      subjectFraming: 'Product with environmental context, warm light',
      overlaySpace: 'top',
      preferredStyles: ['lifestyle_product', 'luxury_beige'],
      summary: 'Real kitchen setting',
    },
    {
      id: 'clean_product_hero',
      name: 'Clean product hero',
      sceneDescription:
        'Product centered on clean bright backdrop, studio lighting, crisp packaging presentation',
      subjectFraming: 'Centered product, seamless background',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Clean packaging hero',
    },
    {
      id: 'hand_interaction',
      name: 'Hand interaction',
      sceneDescription:
        'Hands holding, pouring, or opening the product in natural light, intimate interaction shot',
      subjectFraming: 'Hand and product with shallow DOF',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Hands with product',
    },
    {
      id: 'splash_energy',
      name: 'Splash energy',
      sceneDescription:
        'Drink or ingredient with splash, high-speed capture, energetic commercial shot',
      subjectFraming: 'Dynamic splash centered, bold contrast',
      overlaySpace: 'bottom',
      preferredStyles: ['social_media_ad', 'bold_startup'],
      summary: 'Energetic splash shot',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // CONSUMER TECH
  // ────────────────────────────────────────────────────────────
  consumer_tech: [
    {
      id: 'product_seamless_white',
      name: 'Product seamless white',
      sceneDescription:
        'Tech product on seamless white cyclorama, overhead soft lighting, precision product shot',
      subjectFraming: 'Centered product, zero background distraction',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Pure white product shot',
    },
    {
      id: 'device_gradient_hero',
      name: 'Device gradient hero',
      sceneDescription:
        'Tech device on soft gradient backdrop with subtle color, modern product launch aesthetic',
      subjectFraming: 'Device angled, gradient backdrop complementary',
      overlaySpace: 'top',
      preferredStyles: ['bold_startup', 'tech_product_white'],
      summary: 'Device on gradient',
    },
    {
      id: 'in_use_lifestyle',
      name: 'In-use lifestyle',
      sceneDescription:
        'Product being used in a real environment, person partially visible, natural light, authentic use case',
      subjectFraming: 'Product in hand or in context, shallow DOF',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Product being used',
    },
    {
      id: 'dramatic_hero',
      name: 'Dramatic hero',
      sceneDescription:
        'Tech product with dramatic single-light setup, rim light revealing edges, premium commercial feel',
      subjectFraming: 'Centered product with dramatic lighting',
      overlaySpace: 'bottom',
      preferredStyles: ['dark_cinematic', 'editorial_magazine'],
      summary: 'Dramatic tech hero',
    },
    {
      id: 'macro_detail',
      name: 'Macro detail',
      sceneDescription:
        'Extreme close-up of product material or interface detail, showcasing quality and craftsmanship',
      subjectFraming: 'Macro with shallow DOF',
      overlaySpace: 'left',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Material macro detail',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // BEAUTY / COSMETICS
  // ────────────────────────────────────────────────────────────
  beauty_cosmetics: [
    {
      id: 'beauty_editorial_light',
      name: 'Beauty editorial light',
      sceneDescription:
        'Beauty product with soft window light, minimal styling, editorial color palette, refined composition',
      subjectFraming: 'Product center-left, negative space right for copy',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Soft editorial beauty shot',
    },
    {
      id: 'splash_texture',
      name: 'Splash texture',
      sceneDescription:
        'Beauty product with splash or texture element nearby, high-end commercial shot, sensual tactile feel',
      subjectFraming: 'Product with texture burst, dynamic',
      overlaySpace: 'bottom',
      preferredStyles: ['bold_startup', 'luxury_beige'],
      summary: 'Splash and texture',
    },
    {
      id: 'marble_luxury',
      name: 'Marble luxury',
      sceneDescription:
        'Product on marble or refined surface, soft directional light, luxury beauty aesthetic',
      subjectFraming: 'Product on textured surface, refined placement',
      overlaySpace: 'top',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Luxury surface beauty',
    },
    {
      id: 'model_application',
      name: 'Model application',
      sceneDescription:
        'Close-up of beauty product being applied, natural skin, soft light, intimate commercial feel',
      subjectFraming: 'Close-up of hand and product on skin',
      overlaySpace: 'left',
      preferredStyles: ['editorial_magazine', 'lifestyle_product'],
      summary: 'Product in application',
    },
    {
      id: 'clean_product_hero',
      name: 'Clean product hero',
      sceneDescription:
        'Beauty product centered on clean backdrop, soft studio light, minimal modern aesthetic',
      subjectFraming: 'Centered product on seamless backdrop',
      overlaySpace: 'top',
      preferredStyles: ['clean_bright', 'tech_product_white'],
      summary: 'Clean beauty product shot',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // HOME GOODS
  // ────────────────────────────────────────────────────────────
  home_goods: [
    {
      id: 'interior_context',
      name: 'Interior context',
      sceneDescription:
        'Product in a beautifully styled interior scene, natural light, lifestyle home editorial',
      subjectFraming: 'Product in room setting, environmental context',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'luxury_beige'],
      summary: 'Product in styled room',
    },
    {
      id: 'styled_shelf',
      name: 'Styled shelf',
      sceneDescription:
        'Product on a styled shelf with complementary objects, curated editorial placement',
      subjectFraming: 'Product on shelf, curated objects around',
      overlaySpace: 'top',
      preferredStyles: ['editorial_magazine', 'minimal_swiss'],
      summary: 'Curated shelf styling',
    },
    {
      id: 'clean_studio',
      name: 'Clean studio',
      sceneDescription:
        'Product on seamless backdrop, studio lighting, crisp product shot',
      subjectFraming: 'Centered product, minimal environment',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Clean product shot',
    },
    {
      id: 'tabletop_warm',
      name: 'Tabletop warm',
      sceneDescription:
        'Product on warm wooden or linen surface with soft natural light, intimate still life',
      subjectFraming: 'Product with textured surface, close warmth',
      overlaySpace: 'right',
      preferredStyles: ['luxury_beige', 'lifestyle_product'],
      summary: 'Warm tabletop still life',
    },
    {
      id: 'macro_material',
      name: 'Macro material',
      sceneDescription:
        'Close-up of material, texture, or craftsmanship detail, showcasing quality',
      subjectFraming: 'Macro detail with shallow DOF',
      overlaySpace: 'bottom',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Material macro',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // FITNESS EQUIPMENT
  // ────────────────────────────────────────────────────────────
  fitness_equipment: [
    {
      id: 'gym_product_hero',
      name: 'Gym product hero',
      sceneDescription:
        'Fitness equipment in a modern gym setting, clean architectural space, directional light',
      subjectFraming: 'Product centered in gym space, architectural context',
      overlaySpace: 'top',
      preferredStyles: ['dark_cinematic', 'clean_bright'],
      summary: 'Equipment in modern gym',
    },
    {
      id: 'home_workout_context',
      name: 'Home workout context',
      sceneDescription:
        'Equipment in a home setting, natural light, aspirational home fitness lifestyle',
      subjectFraming: 'Product in home environment, lifestyle feel',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'clean_bright'],
      summary: 'Home fitness setting',
    },
    {
      id: 'athlete_in_use',
      name: 'Athlete in use',
      sceneDescription:
        'Athlete using the equipment mid-exercise, dynamic pose, action energy, commercial fitness',
      subjectFraming: 'Dynamic athlete shot, equipment in use',
      overlaySpace: 'bottom',
      preferredStyles: ['social_media_ad', 'dark_cinematic'],
      summary: 'Athlete training',
    },
    {
      id: 'product_clean_hero',
      name: 'Product clean hero',
      sceneDescription:
        'Equipment on clean seamless backdrop, studio lighting showing material and form',
      subjectFraming: 'Centered product, studio backdrop',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Product studio shot',
    },
    {
      id: 'dramatic_low_angle',
      name: 'Dramatic low angle',
      sceneDescription:
        'Low angle shot of equipment with dramatic lighting, heroic presence, strong contrast',
      subjectFraming: 'Low angle, product looming, dramatic light',
      overlaySpace: 'top',
      preferredStyles: ['dark_cinematic', 'bold_startup'],
      summary: 'Heroic low angle',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // FITNESS SERVICE (gym, coaching)
  // ────────────────────────────────────────────────────────────
  fitness_service: [
    {
      id: 'training_in_action',
      name: 'Training in action',
      sceneDescription:
        'Person training with energy and focus, natural gym light, authentic not posed',
      subjectFraming: 'Subject mid-exercise, motion energy',
      overlaySpace: 'right',
      preferredStyles: ['social_media_ad', 'lifestyle_product'],
      summary: 'Authentic training moment',
    },
    {
      id: 'coach_client_moment',
      name: 'Coach-client moment',
      sceneDescription:
        'Coach and client interaction, authentic coaching moment, natural gym environment',
      subjectFraming: 'Two-person shot, genuine interaction',
      overlaySpace: 'top',
      preferredStyles: ['editorial_magazine', 'lifestyle_product'],
      summary: 'Coach guiding client',
    },
    {
      id: 'gym_space_atmosphere',
      name: 'Gym space atmosphere',
      sceneDescription:
        'Architectural shot of the gym space, good light, premium facility feel, no people or silhouettes only',
      subjectFraming: 'Wide architectural view of gym',
      overlaySpace: 'centered_safe',
      preferredStyles: ['dark_cinematic', 'minimal_swiss'],
      summary: 'Architectural gym shot',
    },
    {
      id: 'transformation_portrait',
      name: 'Results portrait',
      sceneDescription:
        'Confident portrait of a fit subject, natural light, inspirational result-oriented framing, dignified',
      subjectFraming: 'Portrait framing, confident pose',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'dark_cinematic'],
      summary: 'Results-focused portrait',
    },
    {
      id: 'group_class_energy',
      name: 'Group class energy',
      sceneDescription:
        'Group workout class with energy, community vibe, well-lit studio',
      subjectFraming: 'Group in motion, community spirit',
      overlaySpace: 'top',
      preferredStyles: ['social_media_ad', 'lifestyle_product'],
      summary: 'Group class in motion',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // LOCAL SERVICE (trust-building)
  // ────────────────────────────────────────────────────────────
  local_service: [
    {
      id: 'professional_portrait',
      name: 'Professional portrait',
      sceneDescription:
        'Confident portrait of the service provider in their professional environment, warm natural light, trust-building',
      subjectFraming: 'Portrait with workspace context',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'lifestyle_product'],
      summary: 'Professional at work',
    },
    {
      id: 'service_in_action',
      name: 'Service in action',
      sceneDescription:
        'Service being performed authentically, natural environment, documentary feel',
      subjectFraming: 'Action shot with context',
      overlaySpace: 'top',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Service in progress',
    },
    {
      id: 'location_architecture',
      name: 'Location architecture',
      sceneDescription:
        'Architectural shot of the business location, warm welcoming exterior or interior',
      subjectFraming: 'Wide architectural shot',
      overlaySpace: 'centered_safe',
      preferredStyles: ['clean_bright', 'luxury_beige'],
      summary: 'Business location',
    },
    {
      id: 'happy_client_moment',
      name: 'Happy client moment',
      sceneDescription:
        'Client satisfaction moment, authentic reaction, warm natural light',
      subjectFraming: 'Client in genuine moment',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Satisfied client',
    },
    {
      id: 'tools_detail',
      name: 'Tools and craftsmanship',
      sceneDescription:
        'Close-up of professional tools or craftsmanship detail, signaling expertise and quality',
      subjectFraming: 'Tools close-up with warm light',
      overlaySpace: 'top',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Tools of the trade',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // E-COMMERCE GENERAL (fallback for ecommerce when no subcategory fits)
  // ────────────────────────────────────────────────────────────
  ecommerce_general: [
    {
      id: 'product_hero_white',
      name: 'Product hero white',
      sceneDescription:
        'Product on clean white cyclorama, studio soft light, crisp shoppable feel',
      subjectFraming: 'Centered product',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Clean product shot',
    },
    {
      id: 'lifestyle_use_case',
      name: 'Lifestyle use case',
      sceneDescription:
        'Product in authentic use case with person in scene, natural light',
      subjectFraming: 'Product being used, lifestyle context',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'In-use lifestyle',
    },
    {
      id: 'gradient_hero',
      name: 'Gradient hero',
      sceneDescription:
        'Product on soft color gradient backdrop, modern commerce aesthetic',
      subjectFraming: 'Product centered on gradient',
      overlaySpace: 'top',
      preferredStyles: ['bold_startup', 'clean_bright'],
      summary: 'Gradient product hero',
    },
    {
      id: 'detail_quality',
      name: 'Detail quality',
      sceneDescription:
        'Macro detail of product material or feature, showcasing quality',
      subjectFraming: 'Macro detail shot',
      overlaySpace: 'bottom',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Quality detail',
    },
    {
      id: 'offer_bold',
      name: 'Offer bold',
      sceneDescription:
        'Product with bold color block background suggesting promotional energy, high contrast',
      subjectFraming: 'Product on color block',
      overlaySpace: 'left',
      preferredStyles: ['social_media_ad', 'bold_startup'],
      summary: 'Bold promotional',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // DIGITAL PRODUCT (courses, ebooks, templates)
  // ────────────────────────────────────────────────────────────
  digital_product: [
    {
      id: 'device_mockup_content',
      name: 'Device mockup with content',
      sceneDescription:
        'Laptop or tablet mockup showing the digital product, on a clean or subtle gradient backdrop',
      subjectFraming: 'Device slightly angled, content visible',
      overlaySpace: 'right',
      preferredStyles: ['bold_startup', 'clean_bright'],
      summary: 'Digital product on device',
    },
    {
      id: 'person_learning_context',
      name: 'Person learning',
      sceneDescription:
        'Person engaged with content on device in natural environment, aspirational learning moment',
      subjectFraming: 'Person with device, lifestyle context',
      overlaySpace: 'top',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Person engaging with product',
    },
    {
      id: 'abstract_knowledge',
      name: 'Abstract knowledge',
      sceneDescription:
        'Abstract visual metaphor for knowledge or transformation, geometric composition',
      subjectFraming: 'Geometric focal element',
      overlaySpace: 'centered_safe',
      preferredStyles: ['minimal_swiss', 'bold_startup'],
      summary: 'Abstract knowledge visual',
    },
    {
      id: 'book_tabletop',
      name: 'Book tabletop',
      sceneDescription:
        'Physical book or printed guide on warm tabletop, natural light, intimate',
      subjectFraming: 'Book on textured surface',
      overlaySpace: 'right',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Printed material warmth',
    },
    {
      id: 'creator_portrait',
      name: 'Creator portrait',
      sceneDescription:
        'Portrait of the creator/author in their environment, authentic and confident',
      subjectFraming: 'Creator portrait with context',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'lifestyle_product'],
      summary: 'Creator portrait',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // LUXURY GOODS
  // ────────────────────────────────────────────────────────────
  luxury_goods: [
    {
      id: 'product_on_marble',
      name: 'Product on marble',
      sceneDescription:
        'Luxury product on marble or refined surface, soft directional light, refined editorial',
      subjectFraming: 'Centered product on textured surface',
      overlaySpace: 'top',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Luxury surface product',
    },
    {
      id: 'macro_detail_craft',
      name: 'Macro craftsmanship',
      sceneDescription:
        'Extreme close-up of craftsmanship detail, material quality, artisan feel',
      subjectFraming: 'Macro with shallow DOF',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Craftsmanship macro',
    },
    {
      id: 'dark_luxury_hero',
      name: 'Dark luxury hero',
      sceneDescription:
        'Luxury product with dramatic lighting against dark refined backdrop, haute aesthetic',
      subjectFraming: 'Hero product, dramatic light',
      overlaySpace: 'bottom',
      preferredStyles: ['dark_cinematic', 'editorial_magazine'],
      summary: 'Haute luxury hero',
    },
    {
      id: 'wearable_lifestyle',
      name: 'Wearable lifestyle',
      sceneDescription:
        'Luxury item being worn or carried in refined lifestyle context',
      subjectFraming: 'Subject with product, refined environment',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Luxury in lifestyle',
    },
    {
      id: 'atelier_context',
      name: 'Atelier context',
      sceneDescription:
        'Product in an atelier or workshop environment, suggesting craftsmanship origin',
      subjectFraming: 'Product with atelier context',
      overlaySpace: 'top',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Atelier craftsmanship',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // AUTOMOTIVE
  // ────────────────────────────────────────────────────────────
  automotive: [
    {
      id: 'dramatic_hero_shot',
      name: 'Dramatic hero shot',
      sceneDescription:
        'Vehicle with dramatic cinematic lighting, atmospheric, commercial automotive feel',
      subjectFraming: 'Three-quarter vehicle angle, dramatic',
      overlaySpace: 'top',
      preferredStyles: ['dark_cinematic', 'editorial_magazine'],
      summary: 'Cinematic vehicle shot',
    },
    {
      id: 'driving_in_motion',
      name: 'Driving in motion',
      sceneDescription:
        'Vehicle in motion on road, motion blur, dynamic composition',
      subjectFraming: 'Vehicle in motion, road context',
      overlaySpace: 'bottom',
      preferredStyles: ['dark_cinematic', 'social_media_ad'],
      summary: 'Motion driving shot',
    },
    {
      id: 'interior_craftsmanship',
      name: 'Interior craftsmanship',
      sceneDescription:
        'Close-up of vehicle interior showing materials and craftsmanship',
      subjectFraming: 'Interior detail, material focus',
      overlaySpace: 'right',
      preferredStyles: ['luxury_beige', 'editorial_magazine'],
      summary: 'Interior detail',
    },
    {
      id: 'urban_parked',
      name: 'Urban parked',
      sceneDescription:
        'Vehicle parked in architectural urban setting, clean lines, editorial feel',
      subjectFraming: 'Vehicle in urban context',
      overlaySpace: 'top',
      preferredStyles: ['editorial_magazine', 'dark_cinematic'],
      summary: 'Urban editorial',
    },
    {
      id: 'studio_product',
      name: 'Studio product',
      sceneDescription:
        'Vehicle in studio on seamless with controlled lighting, precision product shot',
      subjectFraming: 'Centered vehicle on studio backdrop',
      overlaySpace: 'top',
      preferredStyles: ['tech_product_white', 'clean_bright'],
      summary: 'Studio vehicle shot',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // ENTERTAINMENT
  // ────────────────────────────────────────────────────────────
  entertainment_media: [
    {
      id: 'editorial_cover',
      name: 'Editorial cover',
      sceneDescription:
        'Cover-style composition with bold subject placement, feels like a magazine or album cover',
      subjectFraming: 'Magazine cover composition',
      overlaySpace: 'centered_safe',
      preferredStyles: ['editorial_magazine', 'dark_cinematic'],
      summary: 'Cover composition',
    },
    {
      id: 'cinematic_still',
      name: 'Cinematic still',
      sceneDescription:
        'Cinematic film still aesthetic with layered depth and atmospheric lighting',
      subjectFraming: 'Cinematic framing, atmospheric',
      overlaySpace: 'bottom',
      preferredStyles: ['dark_cinematic', 'editorial_magazine'],
      summary: 'Film still aesthetic',
    },
    {
      id: 'abstract_emotion',
      name: 'Abstract emotion',
      sceneDescription:
        'Abstract composition suggesting the emotional tone of the content',
      subjectFraming: 'Abstract focal element',
      overlaySpace: 'right',
      preferredStyles: ['bold_startup', 'minimal_swiss'],
      summary: 'Abstract emotional visual',
    },
    {
      id: 'artist_portrait',
      name: 'Artist portrait',
      sceneDescription:
        'Portrait of the creator or artist in atmospheric environment',
      subjectFraming: 'Portrait with atmosphere',
      overlaySpace: 'top',
      preferredStyles: ['editorial_magazine', 'dark_cinematic'],
      summary: 'Artist portrait',
    },
    {
      id: 'bold_graphic',
      name: 'Bold graphic',
      sceneDescription:
        'Bold graphic poster-style composition with strong color contrast',
      subjectFraming: 'Graphic poster composition',
      overlaySpace: 'centered_safe',
      preferredStyles: ['bold_startup', 'social_media_ad'],
      summary: 'Bold graphic poster',
    },
  ],

  // ────────────────────────────────────────────────────────────
  // UNKNOWN / FALLBACK — generic but still category-aware
  // ────────────────────────────────────────────────────────────
  unknown: [
    {
      id: 'product_clean',
      name: 'Product clean',
      sceneDescription:
        'Subject on clean backdrop with studio lighting, crisp professional commercial shot',
      subjectFraming: 'Centered subject, clean backdrop',
      overlaySpace: 'top',
      preferredStyles: ['clean_bright', 'tech_product_white'],
      summary: 'Clean product shot',
    },
    {
      id: 'lifestyle_context',
      name: 'Lifestyle context',
      sceneDescription:
        'Subject in authentic lifestyle environment with natural light',
      subjectFraming: 'Subject in real context',
      overlaySpace: 'right',
      preferredStyles: ['lifestyle_product', 'editorial_magazine'],
      summary: 'Lifestyle scene',
    },
    {
      id: 'editorial_refined',
      name: 'Editorial refined',
      sceneDescription:
        'Editorial composition with refined styling and considered lighting',
      subjectFraming: 'Editorial placement',
      overlaySpace: 'right',
      preferredStyles: ['editorial_magazine', 'luxury_beige'],
      summary: 'Editorial styling',
    },
    {
      id: 'bold_hero',
      name: 'Bold hero',
      sceneDescription:
        'Bold hero composition with strong color and clear focal subject',
      subjectFraming: 'Hero subject, bold color',
      overlaySpace: 'top',
      preferredStyles: ['bold_startup', 'social_media_ad'],
      summary: 'Bold hero shot',
    },
    {
      id: 'minimal_precise',
      name: 'Minimal precise',
      sceneDescription:
        'Minimal precise composition with generous negative space and geometric clarity',
      subjectFraming: 'Minimal grid composition',
      overlaySpace: 'centered_safe',
      preferredStyles: ['minimal_swiss', 'clean_bright'],
      summary: 'Minimal composition',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// SCENARIO ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Assigns N distinct scenarios from the category pool.
 * If pool < N, wraps around (repeats from start) — rare, only if category has < 5 scenarios.
 */
export function assignScenarios(
  category: ProductCategory,
  count: number,
): AdScenario[] {
  const pool = getScenariosForCategory(category);
  const result: AdScenario[] = [];

  for (let i = 0; i < count; i++) {
    result.push(pool[i % pool.length]);
  }

  return result;
}

/**
 * Returns preferred visual styles for this category, aggregated from all scenarios.
 * Used as a sanity check when the diversity-style pass assigns styles.
 */
export function getPreferredStylesForCategory(
  category: ProductCategory,
): VisualStyle[] {
  const pool = getScenariosForCategory(category);
  const styles = new Set<VisualStyle>();
  pool.forEach((s) => s.preferredStyles.forEach((st) => styles.add(st)));
  return Array.from(styles);
}
