/**
 * CAPA 3 — Mega-Prompt Composer
 *
 * Construye prompts de 600-1000 palabras para gpt-image-1.
 * El modelo monta TODO dentro de la imagen (texto, CTA, iconos, trust signals).
 * No usamos Satori para anuncios completos — gpt-image-1 lo hace mejor en una sola pasada.
 *
 * Arquitectura:
 *   - 8 presets con DNA visual completo (no solo "atmosphere")
 *   - Slot system: hero / microCopy / headline / subheadline / featureIcons / cta / trust / footer
 *   - Conditional logic: si hay logo, si hay reference, si hay icons, etc.
 *   - Aspect-aware composition rules
 */

export type AdPreset =
  | 'luxury-minimal'
  | 'luxury-editorial'
  | 'aggressive-bold'
  | 'aggressive-sport'
  | 'clean-conversion'
  | 'product-demo'
  | 'tech-futuristic'
  | 'storytelling-warm'
  // Legacy aliases
  | 'aggressive'
  | 'product-demo';

export type AdAspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

interface PresetDNA {
  // Visual identity
  background: string;
  lighting: string;
  colorPalette: string;
  textureMood: string;
  // Typography rules
  headlineFont: string;
  headlineWeight: string;
  headlineColor: string;
  subheadlineFont: string;
  subheadlineColor: string;
  // CTA style
  ctaStyle: string;
  // Composition style
  layoutPhilosophy: string;
}

const PRESET_DNA: Record<string, PresetDNA> = {
  'luxury-minimal': {
    background: 'deep matte black background (#000000 to #0A0A0A gradient), vast negative space',
    lighting: 'single dramatic golden rim light from upper right, subtle radial gradient glow, cinematic depth, soft atmospheric haze',
    colorPalette: 'pure black + warm gold (#D4AF37) accents + cream white (#F5F1E8) for text, NO other colors',
    textureMood: 'subtle film grain, slight gold particle dust effect, ultra premium luxury watch advertisement aesthetic',
    headlineFont: 'elegant high-contrast serif typography (Playfair Display Black or Bodoni Moda style)',
    headlineWeight: 'extra bold weight with tight tracking, mixed weights for emphasis (e.g., regular + black)',
    headlineColor: 'cream white (#F5F1E8) — never pure white',
    subheadlineFont: 'thin elegant serif italic, smaller scale',
    subheadlineColor: 'warm gold (#D4AF37) for emphasis words, soft gray (#9A9A9A) for rest',
    ctaStyle: 'pill-shaped button with thin gold border (1.5px), transparent background, gold text, gold arrow icon, generous padding',
    layoutPhilosophy: 'asymmetric, off-center, vast breathing room (60% empty), subject anchored bottom-right, text left-aligned upper portion',
  },
  'luxury-editorial': {
    background: 'editorial fashion magazine layout, off-white (#F5F2EC) or deep charcoal (#1A1A1A) background',
    lighting: 'high fashion studio lighting, dramatic side light, deep shadows, runway-quality',
    colorPalette: 'monochromatic with single accent (gold OR deep red OR forest green)',
    textureMood: 'Vogue magazine spread aesthetic, high-end fashion photography, paper texture subtle',
    headlineFont: 'massive condensed serif (Bodoni Moda 900 or Didot Bold), magazine cover scale',
    headlineWeight: 'ultra bold, letter-spacing tight, multi-line poetic break',
    headlineColor: 'high contrast against background',
    subheadlineFont: 'small caps sans-serif, refined',
    subheadlineColor: 'muted, sophisticated',
    ctaStyle: 'minimal text-only CTA with thin underline, no button shape, like a magazine link',
    layoutPhilosophy: 'editorial grid, hero image dominates 2/3, text in corner, magazine cover composition',
  },
  'aggressive-bold': {
    background: 'deep gradient black (#0A0A0A to #1F1F1F), dynamic energy, slight motion blur on edges',
    lighting: 'harsh high-contrast key light, hard shadows, intense directional spotlight, electric atmosphere',
    colorPalette: 'pure black + intense gold (#FFD700) + stark white (#FFFFFF), high saturation',
    textureMood: 'high-energy advertising, action sport feel, urgency and tension',
    headlineFont: 'massive bold sans-serif (Inter Black, Anton, Bebas Neue), industrial weight',
    headlineWeight: 'maximum boldness, letter-spacing tight, mixed weights for visual rhythm (e.g., white + gold lines)',
    headlineColor: 'pure white for impact lines, gold for emphasis lines',
    subheadlineFont: 'medium weight sans-serif',
    subheadlineColor: 'gold or muted white',
    ctaStyle: 'large pill button, solid gold fill, black bold text inside, arrow icon, drop shadow for prominence',
    layoutPhilosophy: 'centered or left-aligned, headline dominates upper 50%, CTA visible in lower third, no wasted space',
  },
  'aggressive-sport': {
    background: 'dynamic sports environment (gym, track, urban) with cinematic darkness',
    lighting: 'rim lighting on subject, dramatic backlighting, sweat and intensity visible',
    colorPalette: 'high contrast: black + bright accent color (red/gold/electric blue)',
    textureMood: 'Nike-style athletic ad, motion energy, raw intensity',
    headlineFont: 'massive condensed sans-serif (Anton, Oswald, Fjalla One)',
    headlineWeight: 'compressed bold, military-grade impact',
    headlineColor: 'white or single bright accent',
    subheadlineFont: 'condensed medium',
    subheadlineColor: 'subdued',
    ctaStyle: 'bold rectangular button with strong border, action-color fill',
    layoutPhilosophy: 'subject hero shot dominates, text overlays diagonally, kinetic energy throughout',
  },
  'clean-conversion': {
    background: 'soft neutral gradient (#F5F5F7 to #FFFFFF) or subtle product context',
    lighting: 'soft even studio lighting, minimal shadows, friendly approachable',
    colorPalette: 'white + brand primary color + dark text',
    textureMood: 'Meta Ads / Apple style, clean professional, mobile-first conversion',
    headlineFont: 'modern sans-serif (Inter, SF Pro, Manrope) — readable, friendly',
    headlineWeight: 'semibold, comfortable, clear hierarchy',
    headlineColor: 'near-black (#1A1A1A)',
    subheadlineFont: 'regular sans-serif',
    subheadlineColor: 'medium gray (#666)',
    ctaStyle: 'solid rectangular button with brand color fill, white text, slight rounded corners, subtle shadow',
    layoutPhilosophy: 'centered or split layout, mockup/product on one side, text+CTA on other, clean grid',
  },
  'product-demo': {
    background: 'minimal neutral gradient or transparent product environment',
    lighting: 'product photography lighting, even and clean',
    colorPalette: 'product colors + white space',
    textureMood: 'tech showcase, product hero shot',
    headlineFont: 'modern geometric sans-serif',
    headlineWeight: 'medium to semibold',
    headlineColor: 'product accent or near-black',
    subheadlineFont: 'regular sans-serif',
    subheadlineColor: 'muted',
    ctaStyle: 'rectangular button, accent color',
    layoutPhilosophy: 'product centered or angled, feature callouts with icon+label, minimal copy',
  },
  'tech-futuristic': {
    background: 'deep navy (#0A0E27) or black with subtle geometric grid, neon glow accents',
    lighting: 'cyan/purple neon glow, holographic feel, sci-fi atmosphere',
    colorPalette: 'deep blue/black + neon cyan (#00E5FF) or electric purple (#9D4EDD)',
    textureMood: 'futuristic AI product, digital interface aesthetic, blade-runner-meets-apple',
    headlineFont: 'modern geometric sans (Space Grotesk, Outfit) or futuristic display',
    headlineWeight: 'medium-bold, slightly condensed',
    headlineColor: 'white or neon glow',
    subheadlineFont: 'mono or geometric sans',
    subheadlineColor: 'neon accent',
    ctaStyle: 'glass morphism button with neon border glow, blur backdrop',
    layoutPhilosophy: 'tech product centered with glowing aura, geometric framing, futuristic UI elements',
  },
  'storytelling-warm': {
    background: 'cinematic warm tones, golden hour, candid environment',
    lighting: 'natural warm light, golden hour, soft shadows, human atmosphere',
    colorPalette: 'warm earth tones, cream, terracotta, deep brown',
    textureMood: 'cinematic film still, candid documentary photography, human authenticity',
    headlineFont: 'elegant serif or refined sans (Cormorant, DM Serif Display)',
    headlineWeight: 'regular to medium, poetic',
    headlineColor: 'cream or deep brown',
    subheadlineFont: 'serif italic or refined sans',
    subheadlineColor: 'warm muted tone',
    ctaStyle: 'minimal text-link or thin-bordered pill, understated',
    layoutPhilosophy: 'human subject candid moment, text feels like caption, warm intimate composition',
  },
};

// Legacy aliases
PRESET_DNA['aggressive'] = PRESET_DNA['aggressive-bold'];

const ASPECT_GUIDE: Record<AdAspectRatio, string> = {
  '9:16': 'vertical 9:16 (1080×1920) — Instagram Story / TikTok / Reels. Top 25% reserved for visual breathing room. Headline in upper-middle (30-50% from top). Subheadline directly below headline. CTA pill at 75% from top. Trust signals or microCopy in bottom 10%.',
  '1:1': 'square 1:1 (1080×1080) — Instagram Feed / LinkedIn. Centered or asymmetric split. Headline takes 30% of canvas. CTA in lower third with clear separation.',
  '4:5': 'vertical 4:5 (1080×1350) — Instagram Feed optimized. Slightly compressed vertical. Headline upper portion, hero visual middle, CTA lower.',
  '16:9': 'horizontal 16:9 (1920×1080) — YouTube / Web banner / Landing hero. Split composition: text on left third, hero visual on right two-thirds.',
};

interface BuildPromptInput {
  preset: string;
  aspectRatio: AdAspectRatio;
  copy: { headline: string; subheadline?: string; cta: string };
  microCopy?: string;
  featureIcons?: Array<{ icon: string; label: string }>;
  trustSignals?: string[];
  hasReference?: boolean;
  brandName?: string;
  customAtmosphere?: string;
  composition?: string;
  typography?: string;
  colorStrategy?: string;
  framework?: 'before-after' | 'social-proof' | 'problem-agitation' | 'lifestyle' | 'direct-offer' | 'demo' | 'awareness';
}

const FRAMEWORK_INSTRUCTIONS: Record<string, string> = {
  'before-after': 'FRAMEWORK: BEFORE/AFTER — Split the canvas vertically into two halves. LEFT half: desaturated, low-key lighting, "BEFORE" / "ANTES" label in small caps top-left, showing the problem state. RIGHT half: vibrant, well-lit, "AFTER" / "DESPUÉS" label, showing the transformation. The contrast between the two halves must be IMMEDIATELY visible. Headline spans across both halves at top or bottom.',
  'social-proof': 'FRAMEWORK: SOCIAL PROOF — Center the product/subject. Add a horizontal row of 5 gold filled stars below the product. Render a customer testimonial in italic quotes (under 10 words) below the stars. Include a small attribution line ("— [Name], [Role]") below the quote. Brand logo prominent in corner.',
  'problem-agitation': 'FRAMEWORK: PROBLEM/AGITATION — Use desaturated, low-key, slightly dark cinematic lighting. The visual subject should convey frustration or struggle (body language, environment). The HEADLINE must hit the pain hard and direct (e.g., "TIRED OF X?"). Subheadline hints at the solution but does not reveal it fully. Mood: tension, unresolved.',
  'lifestyle': 'FRAMEWORK: LIFESTYLE — Place the product/brand in a real-life aspirational context. Show a human subject naturally interacting with the product (using, wearing, holding). Use golden-hour or natural daylight, candid documentary photography feel. NO studio sterility. The headline should feel like a manifesto, not a sales pitch.',
  'direct-offer': 'FRAMEWORK: DIRECT OFFER — The OFFER itself is the dominant visual element. Render the discount or offer ("50% OFF", "2x1", "DESDE 19€", or whatever the copy specifies) in MASSIVE typography — comparable in size to the headline, in the brand accent color. Product centered. CTA pill must be the second-largest element. Pure conversion energy.',
  'demo': 'FRAMEWORK: PRODUCT DEMO — Center a device mockup (phone, laptop, app screen) showing the product UI. Add 2-4 feature callouts around the device — each with a small line icon + 1-2 word label, connected to the device with thin lines or arrows. Clean, technical, conversion-oriented. White or neutral background.',
  'awareness': 'FRAMEWORK: AWARENESS — Brand-first composition. Single powerful hero image of the subject/product. Brand logo prominent (top center or top left). Headline reads as a manifesto or brand statement, not a sales line. Minimal supporting copy. Premium, confident, statement-piece energy.',
};


/**
 * Builds the mega-prompt for gpt-image-1.
 * Output: 600-1000 word structured prompt that produces a finished ad.
 */
export function buildAdVisualPrompt(input: BuildPromptInput): { prompt: string; negativePrompt: string } {
  const dna = PRESET_DNA[input.preset] ?? PRESET_DNA['luxury-minimal'];
  const aspect = ASPECT_GUIDE[input.aspectRatio];

  const sections: string[] = [];

  // ─── 1. ROLE + GOAL ───
  sections.push(`Generate a complete, premium, ready-to-publish advertising image. This is the FINAL ad — text, CTA, and all visual elements must be inside the image. Do not return a placeholder or background-only output.`);

  // ─── 2. OVERALL AESTHETIC ───
  sections.push(`AESTHETIC DIRECTION:
- Background: ${dna.background}.
- Lighting: ${dna.lighting}.
- Color palette: ${input.colorStrategy ?? dna.colorPalette}.
- Mood and texture: ${dna.textureMood}.
- Quality: photorealistic, ultra-high resolution, magazine-print quality, sharp details, no blur except intentional depth-of-field.`);

  // ─── 3. ASPECT + COMPOSITION ───
  sections.push(`FORMAT AND COMPOSITION:
- Aspect ratio: ${aspect}
- Layout philosophy: ${input.composition ?? dna.layoutPhilosophy}.`);

  // ─── 3.5. CREATIVE FRAMEWORK (overrides composition if set) ───
  if (input.framework && FRAMEWORK_INSTRUCTIONS[input.framework]) {
    sections.push(FRAMEWORK_INSTRUCTIONS[input.framework]);
  }

  // ─── 4. REFERENCE HANDLING ───
  if (input.hasReference) {
    sections.push(`REFERENCE IMAGE HANDLING (CRITICAL):
The provided reference image is the central visual subject. Preserve it sharp, photorealistic, fully visible, at 100% opacity — DO NOT fade, blur, or wash it out. Place it according to the layout philosophy. The lighting and color treatment described above should integrate around the reference, not replace it.`);
  }

  // ─── 5. TYPOGRAPHY ───
  sections.push(`TYPOGRAPHY (render text DIRECTLY inside the image — do NOT leave blank space):
- Headline font: ${input.typography ?? dna.headlineFont}, ${dna.headlineWeight}.
- Headline color: ${dna.headlineColor}.
- Subheadline font: ${dna.subheadlineFont}, color ${dna.subheadlineColor}.
- Hierarchy: headline must dominate visually (largest), subheadline 30-40% of headline size, CTA medium prominent.
- Letter spacing tight on headline for impact, normal on subheadline.
- Render exactly the text strings provided — do NOT alter, paraphrase, translate, or add words.`);

  // ─── 6. EXACT TEXT TO RENDER ───
  const textBlock: string[] = ['EXACT TEXT TO RENDER IN THE IMAGE:'];

  if (input.brandName) {
    textBlock.push(`- Brand mark area (top-left or top-center): "${input.brandName}" in elegant logotype style. If a logo image is also provided, place the logo there instead.`);
  }
  if (input.microCopy) {
    textBlock.push(`- Micro-tagline (above headline, small caps, letter-spaced): "${input.microCopy}"`);
  }
  textBlock.push(`- HEADLINE (largest text, primary visual weight): "${input.copy.headline}"`);
  if (input.copy.subheadline) {
    textBlock.push(`- Subheadline (below headline, smaller, secondary weight): "${input.copy.subheadline}"`);
  }
  if (input.featureIcons && input.featureIcons.length > 0) {
    textBlock.push(`- Feature row (3 small icon+label items, evenly spaced, between subheadline and CTA):`);
    input.featureIcons.forEach((f, i) => {
      textBlock.push(`    ${i + 1}. Minimalist line icon "${f.icon}" + small uppercase label "${f.label}"`);
    });
  }
  textBlock.push(`- CTA button: "${input.copy.cta}" rendered as ${dna.ctaStyle}, with right-pointing arrow icon next to text.`);
  if (input.trustSignals && input.trustSignals.length > 0) {
    textBlock.push(`- Trust signals row at bottom (small caps, separated by " • "): "${input.trustSignals.join(' • ')}"`);
  }
  sections.push(textBlock.join('\n'));

  // ─── 7. ANTI-PATTERNS ───
  sections.push(`STRICT ANTI-PATTERNS — DO NOT:
- Do NOT generate placeholder text like "Lorem ipsum", "Headline here", or invented words
- Do NOT add brand names to clothing, products, or surfaces unless they were in the reference image
- Do NOT misspell or alter the provided text strings
- Do NOT add stock-photo watermarks or AI artifacts
- Do NOT add extra UI elements (buttons, browser frames, phone bezels) unless explicitly requested
- Do NOT make the image look generic, templated, or like a Canva preset
- Do NOT generate cartoon, illustration, or stylized rendering — must be photorealistic premium advertising
- Do NOT add small print, fine print, or legal disclaimers
- Do NOT crop or cut off text awkwardly`);

  // ─── 8. QUALITY CHECKLIST ───
  sections.push(`FINAL QUALITY CHECK BEFORE OUTPUT:
- All text strings rendered exactly as specified, perfectly legible
- Visual hierarchy: eye flows headline → subheadline → CTA in under 2 seconds
- CTA is unmistakably the action element
- Color palette is restrained and premium
- Composition has intentional negative space, nothing crowded
- Looks like a real ad from a top creative agency, not an AI generation`);

  return {
    prompt: sections.join('\n\n'),
    negativePrompt: 'lorem ipsum, placeholder text, invented words, misspelled text, watermark, ai artifacts, busy background, cluttered, generic, templated, canva, stock photo aesthetic, cartoon, illustration, low quality, blur, pixelated',
  };
}

/**
 * Legacy export for compatibility with /api/ads/create route.
 */
export function presetToImagePresetId(preset: string): string | undefined {
  const map: Record<string, string> = {
    'luxury-minimal': 'luxury',
    'luxury-editorial': 'luxury',
    'aggressive-bold': 'editorial',
    'aggressive-sport': 'editorial',
    'aggressive': 'editorial',
    'clean-conversion': 'startup',
    'product-demo': 'startup',
    'tech-futuristic': 'editorial',
    'storytelling-warm': 'editorial',
  };
  return map[preset];
}
