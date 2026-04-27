/**
 * VERTICAL KNOWLEDGE — Visual DNA per industry
 *
 * This is the ACTUAL difference between a generic AI ad and a 
 * vertical-aware ad. Each industry has its own visual language —
 * lighting standards, composition rules, mood references, color
 * palettes. Without this, the model defaults to generic stock-like
 * outputs.
 *
 * Each vertical defines:
 *   - aestheticDNA: the visual signature (concrete, not abstract)
 *   - photographyStyle: how images of this category are shot in industry
 *   - lighting: industry-standard lighting language
 *   - composition: framing rules
 *   - moodReferences: real-world references the model can latch onto
 *   - colorPalettes: typical color treatments
 *   - avoidPatterns: what NEVER to do
 *   - ctaPatterns: typical CTA copy patterns
 *
 * Used by: premium-prompt-builder.ts (Layer 5: VERTICAL KNOWLEDGE)
 */

import type { VerticalSlug } from '../types';

export interface VerticalDNA {
  slug: VerticalSlug;
  name: string;
  aestheticDNA: string;
  photographyStyle: string;
  lighting: string;
  composition: string;
  moodReferences: string[];
  colorPalettes: string[];
  avoidPatterns: string[];
  ctaPatterns: string[];
}

// ─────────────────────────────────────────────────────────────────
// HOSPITALITY (Hotels, Resorts, Travel)
// ─────────────────────────────────────────────────────────────────
const HOSPITALITY: VerticalDNA = {
  slug: 'travel-hospitality',
  name: 'Hospitality & Travel',
  aestheticDNA:
    'Editorial luxury hospitality photography. Architectural framing emphasizing space and materials. Implicit human presence — viewers must feel they could BE there.',
  photographyStyle:
    'Magazine-quality editorial. Wide-angle architecture shots OR intimate detail moments. Never stock photo aesthetic. Reference: Cereal Magazine, Aman Resorts campaigns, Belmond Hotels editorial.',
  lighting:
    'Golden hour OR blue hour exclusively. Soft, warm, raking light revealing textures. Ambient lamp glow at dusk. Never harsh midday or flat fluorescent.',
  composition:
    'Rule of thirds with negative space upper or right. Architectural lines emphasized. Subjects partial or implied (a hand, footsteps), never frontal. Lots of breathing room for headline overlay.',
  moodReferences: [
    'Aman Resorts editorial campaigns',
    'Belmond Hotels Magazine',
    'Soho House visual language',
    'Cereal Magazine travel features',
    'Conde Nast Traveler photography',
  ],
  colorPalettes: [
    'Warm neutrals (camel, ivory, charcoal)',
    'Aegean (deep navy, white, sun gold)',
    'Tuscan (terracotta, cream, olive)',
    'Nordic (slate, oat, soft pine green)',
  ],
  avoidPatterns: [
    'NEVER bright primary colors',
    'NEVER frontal smiling staff',
    'NEVER cramped composition',
    'NEVER cartoon or illustration',
    'NEVER stock photo families',
  ],
  ctaPatterns: [
    'Reserve your stay',
    'Book direct & save',
    'Discover the suites',
    'Available this season',
  ],
};

// ─────────────────────────────────────────────────────────────────
// JEWELRY (Luxury accessories)
// ─────────────────────────────────────────────────────────────────
const JEWELRY: VerticalDNA = {
  slug: 'jewelry-luxury',
  name: 'Jewelry & Luxury',
  aestheticDNA:
    'Macro luxury product photography. Extreme attention to detail, materials, sparkle. Composition isolates the piece against premium contextual surfaces.',
  photographyStyle:
    'Macro lens photography. Shallow depth of field with bokeh sparkle. Reference: Tiffany & Co campaigns, Cartier editorial, Bvlgari product shots, Van Cleef & Arpels.',
  lighting:
    'Sidelight or backlight to reveal facets and create sparkle. Soft diffuse fill. Never flat lighting. Often single dramatic light source.',
  composition:
    'Macro framing of single hero piece. Negative space dominant (60%+). Premium contextual surfaces (velvet, marble, silk, dark leather). Optional: hand or neck partial showing scale.',
  moodReferences: [
    'Tiffany & Co campaign photography',
    'Cartier editorial spreads',
    'Bvlgari product imagery',
    'Van Cleef & Arpels visual language',
    'Vogue jewelry editorials',
  ],
  colorPalettes: [
    'Deep blacks with metallic accents',
    'Warm cream with gold sparkle',
    'Deep emerald or sapphire backgrounds',
    'Burgundy velvet with diamond brilliance',
  ],
  avoidPatterns: [
    'NEVER busy backgrounds',
    'NEVER flat clinical lighting',
    'NEVER multiple pieces competing for attention',
    'NEVER plastic-looking surfaces',
    'NEVER over-saturated colors',
  ],
  ctaPatterns: [
    'View collection',
    'Discover the piece',
    'Made to be worn',
    'Now available',
  ],
};

// ─────────────────────────────────────────────────────────────────
// FOOD & BEVERAGE (Restaurants, products)
// ─────────────────────────────────────────────────────────────────
const FOOD_BEVERAGE: VerticalDNA = {
  slug: 'food-beverage',
  name: 'Food & Beverage',
  aestheticDNA:
    'Appetizing food photography that makes viewers HUNGRY. Steam, freshness, texture, color saturation in food itself with controlled environment.',
  photographyStyle:
    'Overhead flat-lay OR 45-degree hero angle. Macro details on textures (crusts, drops, garnish). Reference: Bon Appetit photography, Saveur magazine, Toast Magazine, Cereal food features.',
  lighting:
    'Soft directional natural light from window. Hard rim light to define edges. Steam catches light to suggest temperature. Never harsh flash.',
  composition:
    'Hero dish centered or rule of thirds. Surrounding context (linen napkin, silverware, ingredients) tells story. Negative space around edges for headline.',
  moodReferences: [
    'Bon Appetit food photography',
    'Saveur Magazine editorial',
    'Toast Magazine restaurant features',
    'Sweet Magazine food styling',
    'New York Times food columns',
  ],
  colorPalettes: [
    'Warm rustic (terracotta, cream, olive, charcoal grill marks)',
    'Modern minimal (white, black, single accent color)',
    'Heritage (deep wood, brass, aged copper)',
    'Vibrant fresh (greens, citrus yellows, tomato red)',
  ],
  avoidPatterns: [
    'NEVER overly styled or fake-looking food',
    'NEVER cold flat lighting',
    'NEVER cluttered overwhelming composition',
    'NEVER clinical white backgrounds (unless minimalist intent)',
    'NEVER plastic garnishes',
  ],
  ctaPatterns: [
    'Order now',
    'Book a table',
    'Try this week',
    'Available today',
  ],
};

// ─────────────────────────────────────────────────────────────────
// FITNESS & WELLNESS
// ─────────────────────────────────────────────────────────────────
const FITNESS: VerticalDNA = {
  slug: 'fitness-wellness',
  name: 'Fitness & Wellness',
  aestheticDNA:
    'Aspirational athletic energy. Motion, sweat, focus, transformation. Real bodies in real movement, not posed catalog. Show the WORK and the RESULT.',
  photographyStyle:
    'Action shots with motion blur OR after-moment portraits showing exhaustion+pride. Reference: Nike campaigns, Lululemon ads, GymShark editorial, Outside Magazine.',
  lighting:
    'Golden hour outdoor OR moody gym low-key with rim light. Dramatic side lighting on muscle definition. Never flat. Often high contrast.',
  composition:
    'Subject mid-action or at rest moment. Tight crop on emotion (face, hands gripping). Wide environmental shots showing scale. Sweat catches light.',
  moodReferences: [
    'Nike "Just Do It" campaigns',
    'Lululemon editorial',
    'GymShark athlete content',
    'Outside Magazine photography',
    'Mens Health / Womens Health editorials',
  ],
  colorPalettes: [
    'High contrast monochrome with single accent (red, electric blue)',
    'Earth tones (sweat, sand, dawn light)',
    'Studio black/white with chrome equipment',
    'Vibrant athletic (electric purple, lime, cyan)',
  ],
  avoidPatterns: [
    'NEVER catalog poses',
    'NEVER fake smile fitness',
    'NEVER stock photo gym',
    'NEVER overly polished — show grit',
    'NEVER clinical white gym',
  ],
  ctaPatterns: [
    'Start training',
    'Join the program',
    'Book your session',
    'Get started today',
  ],
};

// ─────────────────────────────────────────────────────────────────
// BEAUTY & COSMETICS
// ─────────────────────────────────────────────────────────────────
const BEAUTY: VerticalDNA = {
  slug: 'beauty-cosmetics',
  name: 'Beauty & Cosmetics',
  aestheticDNA:
    'Glow, texture, color. Skin must look LIKE skin (real pores, real texture) not airbrushed plastic. Product hero shots with sensorial detail.',
  photographyStyle:
    'Beauty editorial portraiture OR macro product on textured surface. Reference: Glossier campaigns, Charlotte Tilbury editorial, Aesop product imagery, Drunk Elephant shots.',
  lighting:
    'Soft diffuse beauty dish frontal OR window-soft side. Skin glow emphasized. Product lighting from above with soft shadows. Never harsh.',
  composition:
    'Tight portrait framing on skin/lips/eyes OR hero product on minimal premium surface. Negative space generous. Often vertical 4:5 or 9:16.',
  moodReferences: [
    'Glossier editorial campaigns',
    'Charlotte Tilbury campaign imagery',
    'Aesop product photography',
    'Drunk Elephant editorial',
    'Vogue Beauty features',
  ],
  colorPalettes: [
    'Skin-toned warm neutrals (peach, blush, cream)',
    'Bold modern (black, white, single jewel tone)',
    'Earth science (sage, terra, sand)',
    'Pastels (lavender, mint, butter yellow)',
  ],
  avoidPatterns: [
    'NEVER airbrushed plastic skin',
    'NEVER cartoonish makeup colors',
    'NEVER cluttered surfaces',
    'NEVER harsh flash photography',
    'NEVER stock photo women smiling at product',
  ],
  ctaPatterns: [
    'Shop the collection',
    'Discover your shade',
    'Add to routine',
    'Try it now',
  ],
};

// ─────────────────────────────────────────────────────────────────
// FASHION & APPAREL
// ─────────────────────────────────────────────────────────────────
const FASHION: VerticalDNA = {
  slug: 'fashion-apparel',
  name: 'Fashion & Apparel',
  aestheticDNA:
    'Editorial fashion photography. Garment as hero with model embodying lifestyle. Movement, attitude, environmental context.',
  photographyStyle:
    'Editorial portrait/full-body OR flat-lay garment styling. Reference: Vogue editorials, COS campaigns, Acne Studios imagery, The Row campaigns, Aritzia.',
  lighting:
    'Natural light editorial OR studio with controlled key+fill+rim. Often window light at golden hour. Never flat e-commerce lighting.',
  composition:
    'Full-body or 3/4 with environmental context. Movement implied (mid-stride, hair caught). Garment details visible but mood-first.',
  moodReferences: [
    'Vogue editorial fashion',
    'COS campaign imagery',
    'Acne Studios visual language',
    'The Row campaigns',
    'Aritzia editorial',
  ],
  colorPalettes: [
    'Muted tonal (oat, ecru, slate)',
    'Bold high-contrast (cobalt, crimson, charcoal)',
    'Earth heritage (camel, brown, cream, oxblood)',
    'Modern monochrome (full black or full white)',
  ],
  avoidPatterns: [
    'NEVER e-commerce catalog white-bg',
    'NEVER frontal staring poses',
    'NEVER stock photo aesthetics',
    'NEVER cluttered studio',
    'NEVER overly saturated unrealistic colors',
  ],
  ctaPatterns: [
    'Shop the look',
    'New arrivals',
    'Available now',
    'Explore the collection',
  ],
};

// ─────────────────────────────────────────────────────────────────
// TECH / SAAS / APP
// ─────────────────────────────────────────────────────────────────
const TECH_SAAS: VerticalDNA = {
  slug: 'tech-saas-app',
  name: 'Tech, SaaS & Apps',
  aestheticDNA:
    'Modern minimalist productivity aesthetic. Clean surfaces, abstract data visualizations, devices in elegant context. Often human element showing the WHY.',
  photographyStyle:
    'Minimalist product photography on clean surfaces OR lifestyle showing user benefit. Reference: Apple campaigns, Notion landing pages, Linear marketing, Stripe imagery, Figma.',
  lighting:
    'Soft diffuse studio OR natural daylight on minimalist desk. Often slightly cool color temperature. Sharp clean shadows.',
  composition:
    'Centered hero device OR rule of thirds with workspace context. Negative space dominant. Often isometric or 3/4 device angles.',
  moodReferences: [
    'Apple product launch imagery',
    'Notion landing page photography',
    'Linear marketing visuals',
    'Stripe brand imagery',
    'Figma campaigns',
  ],
  colorPalettes: [
    'Modern neutrals (white, light gray, single brand accent)',
    'Tech dark (deep navy, charcoal, electric blue)',
    'Warm minimal (cream, oat, single bold accent)',
    'Brand-monochrome (single hue with whites and blacks)',
  ],
  avoidPatterns: [
    'NEVER cluttered desks',
    'NEVER stock photo people smiling at laptops',
    'NEVER cartoon illustrations',
    'NEVER outdated 2010s flat design aesthetic',
    'NEVER overly literal interpretations of features',
  ],
  ctaPatterns: [
    'Start free trial',
    'Try it free',
    'Request demo',
    'Get started',
  ],
};

// ─────────────────────────────────────────────────────────────────
// REAL ESTATE
// ─────────────────────────────────────────────────────────────────
const REAL_ESTATE: VerticalDNA = {
  slug: 'real-estate',
  name: 'Real Estate',
  aestheticDNA:
    'Architectural photography emphasizing space, light, and lifestyle. Property as protagonist with implied dwelling.',
  photographyStyle:
    'Wide architectural exterior OR interior with sense of scale. Reference: Architectural Digest, Dezeen, Dwell magazine, Sothebys International Realty.',
  lighting:
    'Twilight blue hour with interior lights glowing OR golden hour exterior. Interior natural light from large windows. Never harsh midday.',
  composition:
    'One-point perspective hallways/rooms OR exterior framed by landscape. People absent or small/implied. Strong leading lines.',
  moodReferences: [
    'Architectural Digest features',
    'Dezeen architecture photography',
    'Dwell magazine imagery',
    'Sothebys International Realty marketing',
    'Modern Sanctuary editorial',
  ],
  colorPalettes: [
    'Twilight blues with warm interior glow',
    'Modern minimal (white, charcoal, wood)',
    'Heritage warmth (terracotta, brick, oak)',
    'Coastal (white, navy, sand)',
  ],
  avoidPatterns: [
    'NEVER agent-with-clipboard stock photos',
    'NEVER over-saturated HDR look',
    'NEVER cluttered staging',
    'NEVER frontal dead-center boring composition',
    'NEVER busy people in shot',
  ],
  ctaPatterns: [
    'Schedule a viewing',
    'Tour the property',
    'Inquire today',
    'Available now',
  ],
};

// ─────────────────────────────────────────────────────────────────
// HOME DECOR
// ─────────────────────────────────────────────────────────────────
const HOME_DECOR: VerticalDNA = {
  slug: 'home-decor',
  name: 'Home & Decor',
  aestheticDNA:
    'Lived-in editorial interiors. Objects in context with patina, materials, and intentional styling. Never showroom-perfect.',
  photographyStyle:
    'Editorial interior styling OR macro product on contextual surface. Reference: Kinfolk Magazine, Cereal Home, Apartment Therapy, Domino Magazine, Studio McGee.',
  lighting:
    'Soft natural window light. Lamp glow at dusk creating mood pools. Never flat overhead. Often slight warm cast.',
  composition:
    'Vignette styling — corner, shelf, table moment. Layers of texture (linen, wood, ceramic, plant). Hero product anchored in context.',
  moodReferences: [
    'Kinfolk Magazine editorial',
    'Cereal Home features',
    'Apartment Therapy photography',
    'Domino Magazine spreads',
    'Studio McGee imagery',
  ],
  colorPalettes: [
    'Warm neutrals (oat, cream, terracotta, walnut)',
    'Sage and olive earth tones',
    'Deep heritage (forest green, oxblood, navy)',
    'Soft pastels (sage, butter, dusty rose)',
  ],
  avoidPatterns: [
    'NEVER showroom-perfect overly staged',
    'NEVER cold modern white',
    'NEVER cluttered chaotic',
    'NEVER fluorescent lighting',
    'NEVER stock photo families on couch',
  ],
  ctaPatterns: [
    'Shop the collection',
    'Bring it home',
    'New arrivals',
    'Discover more',
  ],
};

// ─────────────────────────────────────────────────────────────────
// HEALTH & MEDICAL
// ─────────────────────────────────────────────────────────────────
const HEALTH: VerticalDNA = {
  slug: 'health-medical',
  name: 'Health & Medical',
  aestheticDNA:
    'Modern healthcare aesthetic. Clean, hopeful, human. Show people in moments of relief, care, or capability — not stock medical theater.',
  photographyStyle:
    'Editorial portraiture in natural settings OR minimalist product on clean surface. Reference: One Medical campaigns, Hims/Hers imagery, Modern Fertility, Ro Health.',
  lighting:
    'Bright soft natural daylight. Window light or outdoor diffuse. Often slightly cool but warmth in skin. Hopeful brightness.',
  composition:
    'Subject in candid moment of care or capability. Negative space generous. Avoid clinical settings unless specifically relevant.',
  moodReferences: [
    'One Medical brand campaigns',
    'Hims/Hers editorial imagery',
    'Modern Fertility marketing',
    'Ro Health visual language',
    'Headspace app imagery',
  ],
  colorPalettes: [
    'Clean modern (white, sage, soft blue accent)',
    'Warm human (peach, cream, terracotta)',
    'Trustworthy navy with cream',
    'Calming pastels (mint, lavender, butter)',
  ],
  avoidPatterns: [
    'NEVER stock photo doctors with clipboards',
    'NEVER clinical fluorescent settings',
    'NEVER fake-smile patients',
    'NEVER overly serious or scary',
    'NEVER cliched stethoscope/pills imagery',
  ],
  ctaPatterns: [
    'Book consultation',
    'Get started',
    'Schedule appointment',
    'Learn more',
  ],
};

// ─────────────────────────────────────────────────────────────────
// EDUCATION (Online courses, training)
// ─────────────────────────────────────────────────────────────────
const EDUCATION: VerticalDNA = {
  slug: 'education-online',
  name: 'Education & Online Courses',
  aestheticDNA:
    'Aspirational learning aesthetic. Show the OUTCOME of mastery — not stock photo students. Capability, focus, transformation.',
  photographyStyle:
    'Editorial portraiture of learners in their element OR clean product/UI imagery. Reference: MasterClass, Skillshare, Domestika, edX campaigns.',
  lighting:
    'Warm natural light at workspace OR golden hour outdoor for outcome shots. Never harsh classroom fluorescent. Often slightly moody.',
  composition:
    'Subject mid-action of mastery (cooking, designing, painting). Tools of the craft visible. Wide environmental OR tight detail shots.',
  moodReferences: [
    'MasterClass instructor portraits',
    'Skillshare campaigns',
    'Domestika editorial',
    'edX marketing imagery',
    'Audible audiobook portraits',
  ],
  colorPalettes: [
    'Warm focus (oat, walnut, deep forest)',
    'Modern academia (cream, navy, brass)',
    'Creative studio (white, single bold accent)',
    'Heritage learning (leather brown, cream, forest)',
  ],
  avoidPatterns: [
    'NEVER stock photo students at laptops smiling',
    'NEVER cartoon illustrations',
    'NEVER classroom cliches (chalkboards, apples)',
    'NEVER overly corporate',
    'NEVER frontal posed teachers',
  ],
  ctaPatterns: [
    'Enroll now',
    'Start learning',
    'Join the course',
    'Watch lesson 1',
  ],
};

// ─────────────────────────────────────────────────────────────────
// AUTOMOTIVE
// ─────────────────────────────────────────────────────────────────
const AUTOMOTIVE: VerticalDNA = {
  slug: 'automotive',
  name: 'Automotive',
  aestheticDNA:
    'Vehicle as hero with cinematic environmental context. Speed, power, design language. Never dealership lot.',
  photographyStyle:
    'Cinematic vehicle photography in dramatic locations. Reference: Porsche campaigns, BMW editorial, Tesla marketing, Range Rover lifestyle.',
  lighting:
    'Golden hour or blue hour exclusively. Side rim light revealing body lines. Never flat midday. Often slight motion blur on environment.',
  composition:
    '3/4 hero angle OR dramatic side profile. Vehicle in landscape context (mountain road, urban architecture, coast). Lots of negative space.',
  moodReferences: [
    'Porsche campaign photography',
    'BMW editorial campaigns',
    'Tesla marketing imagery',
    'Range Rover lifestyle shots',
    'Lexus visual language',
  ],
  colorPalettes: [
    'Cinematic moody (deep blacks, vehicle accent, dusk sky)',
    'Cool industrial (steel, asphalt, sky blue)',
    'Warm desert (terracotta, cream, vehicle pop)',
    'Forest highway (deep greens, mist, vehicle metal)',
  ],
  avoidPatterns: [
    'NEVER dealership lot setting',
    'NEVER overly saturated colors',
    'NEVER frontal centered boring',
    'NEVER stock photo families with cars',
    'NEVER fake compositions',
  ],
  ctaPatterns: [
    'Configure yours',
    'Book test drive',
    'Discover the model',
    'Available now',
  ],
};

// ─────────────────────────────────────────────────────────────────
// PETS
// ─────────────────────────────────────────────────────────────────
const PETS: VerticalDNA = {
  slug: 'pets',
  name: 'Pets & Pet Care',
  aestheticDNA:
    'Authentic emotional pet portraiture. Real pets in real moments — never stiff catalog. Show the bond, personality, daily life.',
  photographyStyle:
    'Candid pet portraiture OR lifestyle product shots. Reference: Chewy campaigns, Modern Tails editorial, Pretty Litter brand imagery, BarkBox.',
  lighting:
    'Soft natural window light OR golden hour outdoor. Never harsh flash. Often slight warmth to emphasize fur texture.',
  composition:
    'Eye-level pet POV OR from-above showing scale. Pet in context of home/outdoor environment. Negative space for headline.',
  moodReferences: [
    'Chewy campaign imagery',
    'Modern Tails editorial',
    'Pretty Litter brand photography',
    'BarkBox content',
    'The Wildest editorial',
  ],
  colorPalettes: [
    'Warm home (cream, oat, soft browns)',
    'Vibrant playful (single bold accent on neutral)',
    'Earth nature (sage, sand, terracotta)',
    'Modern minimal (white, single accent)',
  ],
  avoidPatterns: [
    'NEVER stiff catalog pet poses',
    'NEVER overly cute cartoon aesthetic',
    'NEVER cluttered chaotic shots',
    'NEVER fake-looking pet expressions',
    'NEVER stock photo aesthetics',
  ],
  ctaPatterns: [
    'Try it for your pet',
    'Order today',
    'Shop for them',
    'Learn more',
  ],
};

// ─────────────────────────────────────────────────────────────────
// FINANCE & FINTECH
// ─────────────────────────────────────────────────────────────────
const FINANCE: VerticalDNA = {
  slug: 'finance-fintech',
  name: 'Finance & Fintech',
  aestheticDNA:
    'Trust, capability, calm. Modern fintech aesthetic — never stock photo financial advisors. Show outcomes (peace, freedom) or product elegantly.',
  photographyStyle:
    'Minimalist UI screens in elegant context OR lifestyle outcome portraits. Reference: Cash App campaigns, Wise marketing, Robinhood editorial, Stripe brand imagery.',
  lighting:
    'Bright clean modern OR moody confident dark. Soft directional light. Never harsh. Often single warm accent in cool environment.',
  composition:
    'Product UI elegantly framed OR subject in moment of capability. Negative space generous. Numbers/data abstract not literal.',
  moodReferences: [
    'Cash App campaign imagery',
    'Wise marketing photography',
    'Robinhood editorial',
    'Stripe brand visuals',
    'Klarna campaigns',
  ],
  colorPalettes: [
    'Modern fintech (white, charcoal, brand accent)',
    'Trust navy with warm cream accents',
    'Bold modern (single bold color, monochrome rest)',
    'Confidence dark (deep navy, gold accent, cream)',
  ],
  avoidPatterns: [
    'NEVER stock photo handshakes',
    'NEVER suit-and-tie business cliches',
    'NEVER literal money/coins imagery',
    'NEVER spreadsheet screenshots',
    'NEVER fake-smile financial advisors',
  ],
  ctaPatterns: [
    'Get started',
    'Open account',
    'Try free',
    'Learn more',
  ],
};

// ─────────────────────────────────────────────────────────────────
// SERVICES & COACHING
// ─────────────────────────────────────────────────────────────────
const SERVICES_COACHING: VerticalDNA = {
  slug: 'services-coaching',
  name: 'Services & Coaching',
  aestheticDNA:
    'Authority + warmth. Show the coach/expert as approachable but capable. Outcomes-focused imagery showing transformation, not stock business cliches.',
  photographyStyle:
    'Editorial portraiture of expert in their element OR client transformation shots. Reference: Marie Forleo brand, Tony Robbins campaigns, Brene Brown imagery, James Clear marketing.',
  lighting:
    'Warm natural window light. Often editorial portrait with shallow DOF. Never harsh fluorescent. Confidence + warmth.',
  composition:
    'Subject 3/4 portrait with environmental context (office, studio, outdoor). Negative space for testimonial/headline. Eye contact for trust.',
  moodReferences: [
    'Marie Forleo brand photography',
    'Tony Robbins campaign imagery',
    'Brene Brown editorial',
    'James Clear marketing',
    'Atomic Habits launch campaign',
  ],
  colorPalettes: [
    'Warm authority (cream, oat, brand accent)',
    'Modern professional (white, charcoal, single warm accent)',
    'Heritage trust (deep navy, cream, brass)',
    'Approachable warm (terracotta, sage, cream)',
  ],
  avoidPatterns: [
    'NEVER stock photo handshakes',
    'NEVER generic office settings',
    'NEVER overly corporate aesthetic',
    'NEVER fake-smile testimonials',
    'NEVER cliched success imagery (mountains, sunsets unless contextually right)',
  ],
  ctaPatterns: [
    'Book a call',
    'Apply now',
    'Schedule consultation',
    'Get started',
  ],
};

// ─────────────────────────────────────────────────────────────────
// ECOMMERCE PHYSICAL
// ─────────────────────────────────────────────────────────────────
const ECOMMERCE: VerticalDNA = {
  slug: 'ecommerce-physical',
  name: 'E-commerce (Physical Goods)',
  aestheticDNA:
    'Product as hero in editorial context. Lifestyle integration showing use-case. Never pure white-bg catalog (unless brand intent).',
  photographyStyle:
    'Editorial product photography with lifestyle context OR styled flat-lay. Reference: Allbirds campaigns, Outdoor Voices editorial, Away luggage marketing, Mejuri.',
  lighting:
    'Soft natural directional light. Often window light at golden hour. Sharp clean shadows revealing texture. Never flat overhead.',
  composition:
    'Hero product in lifestyle context OR styled vignette with related objects. Rule of thirds. Negative space for headline overlay.',
  moodReferences: [
    'Allbirds brand campaigns',
    'Outdoor Voices editorial',
    'Away luggage marketing',
    'Mejuri jewelry campaigns',
    'Everlane product imagery',
  ],
  colorPalettes: [
    'Warm minimal (cream, oat, single brand accent)',
    'Modern bold (white, single jewel tone)',
    'Earth neutral (sand, terracotta, sage)',
    'Heritage warm (deep brown, cream, brass)',
  ],
  avoidPatterns: [
    'NEVER pure white catalog (unless intentional brand)',
    'NEVER stock photo people holding products',
    'NEVER over-saturated unrealistic colors',
    'NEVER cluttered staging',
    'NEVER plastic-looking products',
  ],
  ctaPatterns: [
    'Shop now',
    'Add to cart',
    'New arrivals',
    'Available today',
  ],
};

// ─────────────────────────────────────────────────────────────────
// OTHER (default fallback - smarter than nothing)
// ─────────────────────────────────────────────────────────────────
const OTHER: VerticalDNA = {
  slug: 'other',
  name: 'General Brand',
  aestheticDNA:
    'Modern editorial brand photography. Lifestyle-driven, emotionally resonant. Avoid stock photo cliches at all costs.',
  photographyStyle:
    'Editorial brand photography. Reference: Kinfolk Magazine general aesthetic, modern brand campaigns from Awwwards-winning sites.',
  lighting:
    'Soft natural light or golden hour. Never harsh. Always intentional and mood-creating.',
  composition:
    'Rule of thirds with intentional negative space. Subject in environmental context. Lots of breathing room.',
  moodReferences: [
    'Kinfolk Magazine editorial',
    'Awwwards-winning brand campaigns',
    'Cereal Magazine general aesthetic',
    'Modern editorial brand work',
  ],
  colorPalettes: [
    'Warm neutrals with single brand accent',
    'Modern minimal (white, charcoal, accent)',
    'Earth tones (cream, sage, terracotta)',
    'Bold modern (single bold color, neutrals)',
  ],
  avoidPatterns: [
    'NEVER stock photo aesthetics',
    'NEVER cluttered overwhelming compositions',
    'NEVER harsh flash lighting',
    'NEVER cartoon or illustration unless intentional',
    'NEVER fake-smile corporate',
  ],
  ctaPatterns: [
    'Learn more',
    'Discover more',
    'Get started',
    'Try it now',
  ],
};

// ─────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────
export const VERTICAL_REGISTRY: Record<VerticalSlug, VerticalDNA> = {
  'travel-hospitality': HOSPITALITY,
  'jewelry-luxury': JEWELRY,
  'food-beverage': FOOD_BEVERAGE,
  'fitness-wellness': FITNESS,
  'beauty-cosmetics': BEAUTY,
  'fashion-apparel': FASHION,
  'tech-saas-app': TECH_SAAS,
  'real-estate': REAL_ESTATE,
  'home-decor': HOME_DECOR,
  'health-medical': HEALTH,
  'education-online': EDUCATION,
  'automotive': AUTOMOTIVE,
  'pets': PETS,
  'finance-fintech': FINANCE,
  'services-coaching': SERVICES_COACHING,
  'ecommerce-physical': ECOMMERCE,
  'other': OTHER,
};

/**
 * Get vertical DNA by slug. Falls back to OTHER if not found.
 */
export function getVerticalDNA(slug: VerticalSlug | string | undefined): VerticalDNA {
  if (!slug) return OTHER;
  return VERTICAL_REGISTRY[slug as VerticalSlug] ?? OTHER;
}

/**
 * Build the prompt cue for a given vertical.
 * This is what gets injected into the image generation prompt.
 */
export function buildVerticalCue(slug: VerticalSlug | string | undefined): string {
  const dna = getVerticalDNA(slug);
  const parts: string[] = [];

  parts.push(`Vertical: ${dna.name}.`);
  parts.push(`Aesthetic: ${dna.aestheticDNA}`);
  parts.push(`Photography: ${dna.photographyStyle}`);
  parts.push(`Lighting: ${dna.lighting}`);
  parts.push(`Composition: ${dna.composition}`);

  if (dna.moodReferences.length > 0) {
    parts.push(`Mood references: ${dna.moodReferences.slice(0, 3).join('; ')}.`);
  }

  if (dna.colorPalettes.length > 0) {
    parts.push(`Color treatment: ${dna.colorPalettes[0]}.`);
  }

  if (dna.avoidPatterns.length > 0) {
    parts.push(`AVOID: ${dna.avoidPatterns.slice(0, 3).join('; ')}.`);
  }

  return parts.join(' ');
}
