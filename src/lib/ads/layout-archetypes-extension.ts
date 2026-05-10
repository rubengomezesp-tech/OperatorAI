/**
 * 🎨 LAYOUT ARCHETYPES — Extension (Sprint 7)
 *
 * +16 archetypes adicionales que extienden el catálogo a 32 totales.
 * Cubren espacios no representados:
 *   - Vertical/Mobile-native (4)
 *   - Luxury/Premium (4)
 *   - Information/Education (4)
 *   - Experimental/Modern (4)
 *
 * Mismo schema que ARCHETYPES original.
 * Se mergea via Object.assign() en el catálogo principal.
 *
 * BRAND CONTEXT RULES (heredadas de Sprint 5 Sesión 3):
 *   - NEVER include real brand names visible in image
 *   - ONLY use brand text from user prompt context
 */

import type { LayoutArchetype } from './layout-archetypes';

// Extended ArchetypeId type — los 16 nuevos
export type ArchetypeIdExtension =
  // Group A: Vertical/Mobile-native
  | 'story-vertical-bold'
  | 'tiktok-pov-handheld'
  | 'reels-typography-hook'
  | 'carousel-swipe-narrative'
  // Group B: Luxury/Premium
  | 'auction-pedestal-spotlight'
  | 'atelier-craft-detail'
  | 'golden-hour-aspirational'
  | 'high-fashion-editorial'
  // Group C: Information/Education
  | 'step-by-step-numbered'
  | 'comparison-table-modern'
  | 'infographic-minimal-data'
  | 'faq-quote-conversational'
  // Group D: Experimental/Modern
  | '3d-render-hero-octane'
  | 'glassmorphism-app-mockup'
  | 'risograph-print-zine'
  | 'anti-design-deconstructed';

export const ARCHETYPES_EXTENSION: Record<ArchetypeIdExtension, LayoutArchetype> = {
  // ═══════════════════════════════════════════════════════════════
  // GROUP A — VERTICAL/MOBILE-NATIVE
  // ═══════════════════════════════════════════════════════════════

  // ─── 17. STORY VERTICAL BOLD ───
  'story-vertical-bold': {
    id: 'story-vertical-bold' as never,
    name: 'Story Vertical Bold (IG/TikTok)',
    promptDirective:
      'Vertical 9:16 mobile-first ad. Hero element fills upper 60% of frame. Bold headline 3-5 words mid-frame, large scale. Brand mark + CTA bottom 15% safe zone. Optimized for IG Stories / TikTok / Reels — thumb-stop in <1s.',
    compositionRules: [
      'Vertical 9:16 — never horizontal',
      'Hero subject in upper 60% (visible above fold on mobile)',
      'Safe zones: top 15% + bottom 15% reserved for platform UI overlays',
      'Center 70% is the action zone',
      'Bold typography readable at thumb-scroll speed',
    ],
    typographyCharacter:
      'condensed bold sans-serif, weight 700-900, large scale, high contrast against background, 3-5 words max',
    paletteDirective:
      'high-contrast 2-color palette: bold background (saturated brand color or black) + bright text (white or accent gold). Pop colors that stop the scroll.',
    lightingDirective:
      'flat directional light or solid color flood. No subtle gradients (won\'t register on mobile screens).',
    cameraDirective:
      'eye-level or slight low-angle (hero feel). Frame tight on subject. Vertical 9:16 native composition.',
    bestForVerticals: ['fashion', 'beauty', 'fitness', 'food', 'tech-saas-app', 'entertainment'],
    forbiddenForVerticals: ['print-magazine', 'b2b-enterprise-formal'],
    bestForCampaignTypes: ['product-launch', 'sale', 'announcement', 'event-promotion'],
    forbidPatterns: [
      'horizontal compositions cropped to vertical (poor adaptation)',
      'tiny text not readable at thumb-scroll speed',
      'critical content in safe zones (top/bottom 15%)',
      'busy multi-element layouts',
    ],
  },

  // ─── 18. TIKTOK POV HANDHELD ───
  'tiktok-pov-handheld': {
    id: 'tiktok-pov-handheld' as never,
    name: 'TikTok POV Handheld',
    promptDirective:
      'Authentic UGC-style vertical 9:16 ad. POV (point-of-view) handheld phone shot. Subject feels real, unstaged. Slightly off-kilter framing, natural light, lo-fi quality. The "anti-ad" that converts on TikTok. Optional: text overlay typed in TikTok\'s native font style.',
    compositionRules: [
      'Vertical 9:16 — phone-camera native',
      'Slightly off-kilter framing (NOT studio-perfect)',
      'POV/handheld feeling — like user-generated',
      'Subject in center but with natural imperfection',
      'Text overlay (if any) in TikTok caption style — small, top or bottom',
    ],
    typographyCharacter:
      'system fonts that mimic TikTok captions — slight off-white, drop shadow, casual feel. NOT designed-looking.',
    paletteDirective:
      'natural color grading. No fake saturation. Looks like a real phone camera. Optional: very slight VSCO-style filter.',
    lightingDirective:
      'natural ambient light (window, outdoor, indoor practical). Imperfect but real. No studio lighting.',
    cameraDirective:
      'phone-camera POV, slight shake/handheld feel, vertical 9:16. Wide-ish lens (selfie-style or environmental).',
    bestForVerticals: ['fashion', 'beauty', 'food', 'fitness', 'lifestyle', 'travel'],
    forbiddenForVerticals: ['luxury-watches', 'private-banking', 'b2b-enterprise'],
    bestForCampaignTypes: ['ugc-campaign', 'brand-awareness', 'authenticity-driven', 'gen-z-targeting'],
    forbidPatterns: [
      'studio-perfect lighting (kills authenticity)',
      'designed graphics overlays',
      'centered "advertorial" composition',
      'high production value that screams "ad"',
    ],
  },

  // ─── 19. REELS TYPOGRAPHY HOOK ───
  'reels-typography-hook': {
    id: 'reels-typography-hook' as never,
    name: 'Reels Typography Hook',
    promptDirective:
      'Vertical 9:16 ad where TYPOGRAPHY IS THE IMAGE. Massive headline fills 70% of frame. One bold question or statement — designed to hook in first 0.5 seconds. Optional minimal supporting graphic. Inspired by Aesop, Glossier, Off-White vertical campaigns.',
    compositionRules: [
      'Vertical 9:16 — typography-first design',
      'Hero copy = 70% of frame height',
      'One word or short phrase (1-7 words max)',
      'Question or declarative statement (no soft language)',
      'Minimal or zero secondary elements',
    ],
    typographyCharacter:
      'ultra-bold display weight (Druk, Helvetica Black, custom condensed). Tight tracking. Aggressive scale. Could be all-caps or mixed.',
    paletteDirective:
      'monochrome (black bg + white text, or color flood + white text). High contrast guaranteed. No gradients.',
    lightingDirective:
      'N/A (pure typography composition, no photographic elements)',
    cameraDirective:
      'N/A (typography-first, no camera concept)',
    bestForVerticals: ['fashion', 'beauty', 'art-galleries', 'music', 'tech-saas-app', 'manifesto-driven-brands'],
    forbiddenForVerticals: ['food-detail-shots', 'product-photography-required'],
    bestForCampaignTypes: ['brand-statement', 'manifesto-launch', 'tease-campaign', 'cultural-moment'],
    forbidPatterns: [
      'photography or product imagery as primary (this is PURE TYPE)',
      'multiple competing typographic styles',
      'decorative borders or frames',
      'tiny supporting copy that distracts',
    ],
  },

  // ─── 20. CAROUSEL SWIPE NARRATIVE ───
  'carousel-swipe-narrative': {
    id: 'carousel-swipe-narrative' as never,
    name: 'Carousel Swipe Narrative (IG)',
    promptDirective:
      'Single-frame design that suggests "swipe for more" — usually first slide of an IG carousel. Shows part of an image that continues off-frame, OR features a clear "→ swipe" hint. Editorial feel. Cliffhanger composition that demands the swipe.',
    compositionRules: [
      'Square 1:1 or vertical 4:5 (IG carousel native)',
      'Composition implies continuation (image bleeds right edge)',
      'OR: clear "→" or "01/05" indicator showing it\'s page 1',
      'Hero element placed left/center, with empty space implying next slide',
      'Typography reveals only part of the message',
    ],
    typographyCharacter:
      'editorial sans or serif, mid-weight. Headline cuts off OR has chapter mark like "01" or "Part one".',
    paletteDirective:
      'cohesive palette designed for multi-slide visual continuity. 2-3 dominant colors max.',
    lightingDirective:
      'editorial controlled lighting (matches multi-slide series consistency)',
    cameraDirective:
      'composition shot wide enough that subject continues "off-screen" implying next slide',
    bestForVerticals: ['fashion', 'lifestyle', 'travel', 'food-editorial', 'art', 'magazines', 'creators'],
    forbiddenForVerticals: ['quick-product-sale', 'CTA-driven-direct-response'],
    bestForCampaignTypes: ['storytelling', 'product-reveal-multi-stage', 'brand-narrative', 'editorial-content'],
    forbidPatterns: [
      'self-contained single-image composition',
      'CTA in center (this is just slide 1 of more)',
      'no visual indication of continuation',
      'overcrowded design with all info',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GROUP B — LUXURY/PREMIUM
  // ═══════════════════════════════════════════════════════════════

  // ─── 21. AUCTION PEDESTAL SPOTLIGHT ───
  'auction-pedestal-spotlight': {
    id: 'auction-pedestal-spotlight' as never,
    name: 'Auction Pedestal Spotlight',
    promptDirective:
      'Product treated like a museum artifact or auction item. Single dramatic spotlight from top. Deep velvet black or dark jewel-tone background. Massive negative space (60-70%). Inspired by Sotheby\'s and Christie\'s catalog photography. The product is unquestionably PRECIOUS.',
    compositionRules: [
      'Product centered or 60/40 off-center',
      '60-70% negative space — reverent silence around it',
      'Single hero subject (no clutter)',
      'Eye drawn DIRECTLY to product',
      'Optional: small refined typography bottom or top corner',
    ],
    typographyCharacter:
      'thin display serif (Caslon, GT Sectra Light) or refined modern sans. Small caps with generous tracking. Whisper-quiet type.',
    paletteDirective:
      'deep velvet black (#0A0A0A) or jewel tone (forest green, sapphire blue, burgundy). Product highlights warm gold or cool silver.',
    lightingDirective:
      'ONE primary spotlight (top-front 45° or top-down). Soft fill very low (1:8 ratio). Falloff dramatic — light fades into darkness around product.',
    cameraDirective:
      'eye-level or slightly elevated (looking down respectfully). Subject fills 30-40% of frame. Macro detail visible.',
    bestForVerticals: ['jewelry-watches', 'fragrance-luxury', 'fine-art', 'collectibles', 'premium-tech', 'wine-spirits-luxury'],
    forbiddenForVerticals: ['fast-food', 'kids-toys', 'gaming', 'streetwear-rebel'],
    bestForCampaignTypes: ['luxury-product-reveal', 'exclusivity-campaign', 'collector-edition', 'auction-house'],
    forbidPatterns: [
      'bright/airy backgrounds (must be DARK)',
      'multiple light sources causing complex shadows',
      'cluttered styling with multiple objects',
      'cartoon/CG rendering (this is REAL photography)',
    ],
  },

  // ─── 22. ATELIER CRAFT DETAIL ───
  'atelier-craft-detail': {
    id: 'atelier-craft-detail' as never,
    name: 'Atelier Craft Detail',
    promptDirective:
      'Macro-detail shot of craftsmanship process or material. Hands working, leather being stitched, fabric texture, wood grain, ceramic glazing. Premium artisan storytelling. Soft natural light, shallow depth of field. Conveys "made by humans who care".',
    compositionRules: [
      'Extreme close-up or macro shot',
      'Hands or tools in frame (suggests human craft)',
      'Subject 70-80% of frame with shallow DOF',
      'Background blurred warmly out of focus',
      'Texture is the hero',
    ],
    typographyCharacter:
      'editorial serif or refined sans, light weight, generous tracking. Often in lower third only.',
    paletteDirective:
      'warm earth tones, natural materials. Brown, cream, deep beige, warm grey. Sometimes with single color accent (gold, terracotta).',
    lightingDirective:
      'soft natural light (window light or diffused studio mimicking natural). Side-lit to reveal texture. Warm color temperature (3200K).',
    cameraDirective:
      'macro 100mm lens, f/2.8-f/4 shallow depth of field. Frame extreme close on detail.',
    bestForVerticals: ['fashion-luxury', 'jewelry-watches', 'leather-goods', 'food-artisan', 'home-craftsman', 'wine-spirits'],
    forbiddenForVerticals: ['tech-saas', 'fast-food', 'gaming', 'crypto'],
    bestForCampaignTypes: ['heritage-storytelling', 'craft-positioning', 'maker-narrative', 'authenticity-campaign'],
    forbidPatterns: [
      'wide environmental shots (must be macro)',
      'cold corporate lighting',
      'digital/synthetic feeling',
      'multiple subjects (this is single-detail focus)',
    ],
  },

  // ─── 23. GOLDEN HOUR ASPIRATIONAL ───
  'golden-hour-aspirational': {
    id: 'golden-hour-aspirational' as never,
    name: 'Golden Hour Aspirational',
    promptDirective:
      'Cinematic golden hour lighting on subject. Person or product bathed in warm sunset glow. Lifestyle aspirational tone. Wide environmental context. Feels like a film still from a Sofia Coppola movie or perfume campaign. The "moment of grace" feeling.',
    compositionRules: [
      'Subject placed in cinematic environment (location, lifestyle scene)',
      'Wide framing to capture light atmosphere',
      'Subject silhouetted or rim-lit by golden hour',
      'Environmental context tells story',
      'Negative space filled with atmospheric light',
    ],
    typographyCharacter:
      'editorial serif (GT Sectra, Caslon) light weight, generous tracking. Often white type laid over the warm scene.',
    paletteDirective:
      'warm sunset palette: amber, gold, peach, dusty rose, warm purple shadows. Saturated but cinematic.',
    lightingDirective:
      'golden hour sunlight (low angle, warm color, long shadows). Rim light separating subject from background. Lens flare optional.',
    cameraDirective:
      'wide-ish lens (35-50mm), shallow depth of field. Often slight low angle. Cinematic 16:9 or 4:5 ratio.',
    bestForVerticals: ['fashion', 'beauty-luxury', 'travel-luxury', 'fragrance', 'lifestyle-aspirational', 'real-estate-luxury'],
    forbiddenForVerticals: ['tech-saas-direct', 'b2b-corporate', 'fast-food', 'industrial'],
    bestForCampaignTypes: ['emotional-campaign', 'lifestyle-aspirational', 'fragrance-launch', 'brand-mood'],
    forbidPatterns: [
      'flat noon-day lighting (must be golden hour)',
      'studio fluorescent feel',
      'tightly cropped subject (need environmental context)',
      'cool color temperature',
    ],
  },

  // ─── 24. HIGH FASHION EDITORIAL ───
  'high-fashion-editorial': {
    id: 'high-fashion-editorial' as never,
    name: 'High Fashion Editorial',
    promptDirective:
      'Vogue/Numéro/Self Service magazine spread aesthetic. Avant-garde fashion photography. Subject styled with sculptural quality. Unusual poses, dramatic location or seamless studio. Editorial typography integrated into composition. The "page from a fashion magazine" feel.',
    compositionRules: [
      'Subject (model/object) treated sculpturally — non-obvious poses',
      'Editorial framing (often 3:4 or 4:5 vertical)',
      'Composition feels "shot for a magazine spread"',
      'Type integrated as editorial element (caption, page number, header)',
      'Negative space deliberate, not accidental',
    ],
    typographyCharacter:
      'fashion editorial serif (Didot, Bodoni, GT Sectra) — high contrast strokes. Or contemporary editorial sans (Söhne, GT America). Often italic for accent.',
    paletteDirective:
      'editorial neutrals (cream, ivory, charcoal, deep black) with one bold accent (red, royal blue, bright yellow). Sometimes monochrome.',
    lightingDirective:
      'controlled studio lighting (beauty dish, soft box, dramatic sculpting) OR controlled natural light. Always intentional.',
    cameraDirective:
      'medium format aesthetic (Hasselblad feel). Lens 50mm-85mm. Sharp focus on subject, slight DOF.',
    bestForVerticals: ['fashion-luxury', 'beauty-luxury', 'jewelry', 'fragrance-editorial', 'art-galleries', 'magazines'],
    forbiddenForVerticals: ['budget-fashion', 'tech-saas', 'food-fast', 'kids-toys'],
    bestForCampaignTypes: ['fashion-campaign', 'editorial-content', 'magazine-feature', 'brand-prestige'],
    forbidPatterns: [
      'casual lifestyle vibe (this is HIGH fashion)',
      'standard product shots',
      'overly cheerful/casual mood',
      'budget studio lighting',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GROUP C — INFORMATION/EDUCATION
  // ═══════════════════════════════════════════════════════════════

  // ─── 25. STEP-BY-STEP NUMBERED ───
  'step-by-step-numbered': {
    id: 'step-by-step-numbered' as never,
    name: 'Step-by-Step Numbered',
    promptDirective:
      'Visual how-to or process explanation. 3-5 numbered steps shown clearly. Each step has icon/illustration + brief copy. Inspired by recipe cards, IKEA instructions evolved. Editorial polish — not childish infographic style.',
    compositionRules: [
      'Vertical or horizontal grid showing 3-5 steps',
      'Each step has clear number (01, 02, 03...) prominent',
      'Step-icon + brief copy per slot',
      'Visual rhythm: same size/style for all steps',
      'Hierarchy: title → steps → optional CTA',
    ],
    typographyCharacter:
      'modern sans-serif (Söhne, Inter, GT America). Step numbers oversized in display weight. Body text mid-weight.',
    paletteDirective:
      'limited palette (2-3 colors). Often: neutral background + brand color for numbers/accents + one supporting color.',
    lightingDirective:
      'flat editorial design (no photographic lighting). Or if using photos: consistent lighting across all steps.',
    cameraDirective:
      'N/A (graphic design + illustration) OR consistent photo angle across all steps.',
    bestForVerticals: ['food-recipe', 'tech-saas-onboarding', 'beauty-tutorial', 'fitness-routine', 'education', 'wellness'],
    forbiddenForVerticals: ['luxury-emotional-campaigns', 'manifesto-driven-brands'],
    bestForCampaignTypes: ['tutorial-content', 'product-onboarding', 'how-to-marketing', 'educational-content'],
    forbidPatterns: [
      'inconsistent step sizes (visual rhythm broken)',
      'too many steps (max 5)',
      'cluttered overlapping graphics',
      'childish illustration style (must feel editorial)',
    ],
  },

  // ─── 26. COMPARISON TABLE MODERN ───
  'comparison-table-modern': {
    id: 'comparison-table-modern' as never,
    name: 'Comparison Table Modern',
    promptDirective:
      'Visual comparison table or matrix. 2-4 columns showing options/products/features. Clean grid system. Feature checkmarks/x-marks or filled bars. Inspired by SaaS pricing pages and consumer reports. Editorial polish over raw data.',
    compositionRules: [
      'Grid: 2-4 columns + 4-8 rows of features',
      'Header row: option names',
      'Each row: feature name + status (✓/✗/value) per column',
      'Visual hierarchy: best option highlighted (column tinted)',
      'Type sized for readability',
    ],
    typographyCharacter:
      'modern sans (Inter, Söhne) for clarity. Tabular figures for numbers. Bold for option names, regular for features.',
    paletteDirective:
      'mostly neutral (off-white background, charcoal text). Highlighted column: brand color tint (10-15% opacity). Checkmarks: brand accent.',
    lightingDirective:
      'N/A (this is graphic/data design)',
    cameraDirective:
      'N/A (graphic composition)',
    bestForVerticals: ['tech-saas-app', 'fintech', 'consumer-electronics', 'b2b-software', 'ecommerce-product'],
    forbiddenForVerticals: ['fashion-emotional', 'fragrance', 'art-emotional-campaigns'],
    bestForCampaignTypes: ['feature-comparison', 'pricing-page', 'product-vs-competitor', 'tier-comparison'],
    forbidPatterns: [
      'cluttered busy table',
      'no clear visual hierarchy',
      'too many columns (>4) impossible to read',
      'hand-drawn/casual design',
    ],
  },

  // ─── 27. INFOGRAPHIC MINIMAL DATA ───
  'infographic-minimal-data': {
    id: 'infographic-minimal-data' as never,
    name: 'Infographic Minimal Data',
    promptDirective:
      'Single hero statistic or insight visualized minimally. Big number + supporting context. Editorial chart (bar, line, donut) minimal style. Inspired by FT/Bloomberg infographics evolved for social. The "one stat that stops scroll" approach.',
    compositionRules: [
      'ONE hero statistic dominant (60% of frame)',
      'Supporting label/context smaller below',
      'Optional: minimal chart accompanying number',
      'Lots of negative space',
      'Headline interpreting the data top or bottom',
    ],
    typographyCharacter:
      'massive display sans for the number (Söhne, Inter, GT America heavy weight). Tabular figures. Body editorial sans regular weight.',
    paletteDirective:
      'editorial: neutral background (off-white or charcoal) + 1 data-driven accent color. Sometimes monochrome.',
    lightingDirective:
      'N/A (graphic design)',
    cameraDirective:
      'N/A (graphic composition)',
    bestForVerticals: ['fintech', 'analytics', 'consulting', 'b2b-thought-leadership', 'media-publishing', 'ai-products'],
    forbiddenForVerticals: ['emotional-fashion', 'fragrance', 'kids-toys'],
    bestForCampaignTypes: ['thought-leadership', 'data-driven-marketing', 'industry-report', 'social-proof-stat'],
    forbidPatterns: [
      'multiple competing stats (must be ONE hero)',
      'busy chart with too much data',
      'cartoonish data viz style',
      'hidden hero number behind decoration',
    ],
  },

  // ─── 28. FAQ QUOTE CONVERSATIONAL ───
  'faq-quote-conversational': {
    id: 'faq-quote-conversational' as never,
    name: 'FAQ Quote Conversational',
    promptDirective:
      'Q&A format treated editorially. Question prominent, answer below. Visual quote-mark or chat-bubble metaphor. Conversational tone but designed sophisticatedly. Inspired by NYT interview pull quotes + modern messaging UI.',
    compositionRules: [
      'Question on top (medium-large size)',
      'Answer below (smaller but readable)',
      'Visual quote marks or bubble metaphor as accent',
      'Optional: image of person who answered (small portrait)',
      'Series feeling (this is one of multiple Q&As)',
    ],
    typographyCharacter:
      'editorial serif for Q (Caslon, GT Sectra, Tiempos) + modern sans for A (Söhne, Inter). Or all-sans with weight contrast.',
    paletteDirective:
      'editorial neutrals + 1 brand accent for quote marks or highlights. Soft cream/off-white background works well.',
    lightingDirective:
      'N/A or soft natural if photo of person',
    cameraDirective:
      'N/A or simple portrait headshot if person involved',
    bestForVerticals: ['publishing-media', 'b2b-services', 'consulting', 'authors-creators', 'podcasts', 'professional-services'],
    forbiddenForVerticals: ['fast-fashion-emotional', 'fragrance-mood', 'gaming-rebel'],
    bestForCampaignTypes: ['interview-content', 'thought-leadership', 'expert-positioning', 'community-Q&A'],
    forbidPatterns: [
      'sales-y "BUY NOW" energy',
      'cluttered with multiple Q&As (one at a time)',
      'casual chat-app screenshot feel (must be designed)',
      'tiny illegible Q or A',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GROUP D — EXPERIMENTAL/MODERN
  // ═══════════════════════════════════════════════════════════════

  // ─── 29. 3D RENDER HERO OCTANE ───
  '3d-render-hero-octane': {
    id: '3d-render-hero-octane' as never,
    name: '3D Render Hero (Octane Premium)',
    promptDirective:
      'Hyperreal 3D rendered product or object. Octane/Cinema 4D quality. Liquid metal, polished surface, dripping material. Single hero element on cinematic background. Inspired by Beeple, Apple WWDC graphics, premium product reveals.',
    compositionRules: [
      'Single hero 3D object centered or 60/40',
      'Generous negative space around object',
      'Background: cinematic black or gradient mesh',
      'No text initially (or minimal at bottom)',
      'Composition built around material reveal',
    ],
    typographyCharacter:
      'minimal modern sans (Helvetica Now, Söhne) — single line low in frame. Light to regular weight.',
    paletteDirective:
      'liquid metal aesthetic: chrome silver, gold molten, mercurial reflections. Or single-tone color flood. Optional cinematic teal-orange grade.',
    lightingDirective:
      'HDR studio environment with 1-2 dramatic light sources. Ray-traced reflections — surfaces MIRROR environment. Caustics visible.',
    cameraDirective:
      '3D render camera — slight low angle (hero feel). Subject 50-70% of frame. Sharp focus on hero.',
    bestForVerticals: ['tech-hardware', 'crypto-web3', 'beauty-luxury-3d', 'jewelry-modern', 'automotive-electric', 'gaming-hardware'],
    forbiddenForVerticals: ['food-traditional', 'kids-toys', 'rural-agriculture'],
    bestForCampaignTypes: ['premium-tech-launch', 'NFT-drop', 'luxury-reveal', 'automotive-reveal'],
    forbidPatterns: [
      '2D illustration aesthetic',
      'cartoon Disney-style 3D',
      'low-poly stylized renders',
      'flat matte finishes (this is HIGHLY POLISHED)',
    ],
  },

  // ─── 30. GLASSMORPHISM APP MOCKUP ───
  'glassmorphism-app-mockup': {
    id: 'glassmorphism-app-mockup' as never,
    name: 'Glassmorphism App Mockup',
    promptDirective:
      'Premium app/UI mockup with glassmorphism (frosted glass) effects. Translucent cards floating on vibrant gradient background. Inspired by macOS Big Sur, Apple Vision Pro, Linear app aesthetic. Tech-forward but optimistic.',
    compositionRules: [
      'Hero device or UI mockup centered or 60/40',
      'Translucent glass cards floating with depth',
      'Background: vibrant gradient mesh blurred behind glass',
      'Layered z-depth (foreground glass, midground subject, background blur)',
      'Subtle white/light borders on glass elements',
    ],
    typographyCharacter:
      'SF Pro, Inter, Söhne — modern system stack. Light-Regular-Semibold. High contrast against glass.',
    paletteDirective:
      'vibrant gradient bg (purple-pink-blue or sunset) + frosted glass softens 30-40% + accent in UI elements (brand color).',
    lightingDirective:
      'soft directional light from top-left causing subtle shimmer on glass edges. Soft drop shadows long and low opacity.',
    cameraDirective:
      'flat 2D composition (UI mockup) OR slight 3D perspective on device. No photographic lighting needed.',
    bestForVerticals: ['tech-saas-app', 'fintech', 'productivity', 'app-launches', 'web3-elegant', 'ai-products'],
    forbiddenForVerticals: ['heavy-machinery', 'food-rustic', 'farming', 'streetwear-rebel'],
    bestForCampaignTypes: ['saas-feature-launch', 'app-reveal', 'tech-product-marketing', 'feature-highlight'],
    forbidPatterns: [
      'heavy 3D extrusion (this is FLAT depth)',
      'sharp solid borders without blur',
      'dark/heavy overall mood',
      'skeumorphism beyond glass',
    ],
  },

  // ─── 31. RISOGRAPH PRINT ZINE ───
  'risograph-print-zine': {
    id: 'risograph-print-zine' as never,
    name: 'Risograph Print Zine',
    promptDirective:
      'Risograph-printed aesthetic. Vibrant 2-3 spot colors with slight misregistration. Halftone dot patterns. Hand-drawn illustration mixed with bold typography. Indie zine culture, art print, music poster aesthetic. Tactile and intentionally imperfect.',
    compositionRules: [
      'Bold composition with strong visual hierarchy',
      'Mixed media: illustration + typography + photo (treated)',
      'Slight misregistration (printed multi-pass feel)',
      '2-3 spot colors only (not full CMYK)',
      'Halftone dot patterns visible',
    ],
    typographyCharacter:
      'bold display fonts with character (custom hand-drawn, condensed sans, slab serif). Mixed sizes for visual rhythm.',
    paletteDirective:
      'risograph spot colors: fluorescent pink, electric blue, hot orange, lime green, purple, gold. Always 2-3 colors max — saturated but limited.',
    lightingDirective:
      'N/A (this is illustration/print design — no photographic lighting)',
    cameraDirective:
      'N/A (graphic illustration design)',
    bestForVerticals: ['music-indie', 'art-galleries', 'streetwear-art', 'magazines-zines', 'creative-events', 'indie-publishing'],
    forbiddenForVerticals: ['luxury-watches', 'private-banking', 'enterprise-software'],
    bestForCampaignTypes: ['art-exhibition', 'music-event', 'indie-launch', 'cultural-moment', 'zine-release'],
    forbidPatterns: [
      'clean digital aesthetic (must feel printed)',
      'subtle gradients (riso is FLAT spot colors)',
      'corporate restraint',
      'photorealistic imagery untreated',
    ],
  },

  // ─── 32. ANTI-DESIGN DECONSTRUCTED ───
  'anti-design-deconstructed': {
    id: 'anti-design-deconstructed' as never,
    name: 'Anti-Design Deconstructed',
    promptDirective:
      'Intentional ugly/broken aesthetic. Default system fonts, rotated elements, broken grid, mixed type styles. Inspired by Balenciaga, MSCHF, web brutalism, David Carson. Refuses polish — every break is calculated.',
    compositionRules: [
      'Broken grid: elements off-aligned, overlapping unexpectedly',
      'Text rotated at odd angles',
      'Multiple typography systems collide',
      'Elements bleed off-edges, partially cropped',
      'Negative space used unconventionally',
    ],
    typographyCharacter:
      'mix DEFAULT system fonts (Times New Roman, Arial, Courier) with high-end ones for jarring contrast. Inconsistent sizing on purpose.',
    paletteDirective:
      'aggressive contrast or aggressive flatness. Default web colors: blue (#0000EE), red (#FF0000). Or extreme: black + white + 1 jarring accent.',
    lightingDirective:
      'N/A (graphic design) OR low-quality photographic content (intentional)',
    cameraDirective:
      'N/A or low-fi photography (intentional imperfection)',
    bestForVerticals: ['streetwear', 'music-indie', 'art-galleries', 'subculture-fashion', 'web3-rebel', 'youth-brands'],
    forbiddenForVerticals: ['luxury-jewelry', 'private-banking', 'medical', 'corporate-b2b'],
    bestForCampaignTypes: ['streetwear-drop', 'music-album', 'art-event', 'cultural-statement', 'anti-establishment'],
    forbidPatterns: [
      'symmetry and balance (must be intentionally off)',
      'beautiful typography pairings',
      'polished retouching',
      '"tastefulness" of any kind',
    ],
  },
};
