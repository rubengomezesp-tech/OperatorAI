/**
 * 9 PSYCHOLOGICAL ANGLES
 *
 * The third dimension of the system. Combined with vertical (industry)
 * and campaign-type (mode), the angle is the EMOTIONAL/PSYCHOLOGICAL
 * lever the campaign pulls.
 *
 * Brain selects the best angle(s) for each variant based on intake signals.
 * Different ads in the same campaign can use different angles to reach
 * different segments of the same audience.
 */

import 'server-only';
import type { Angle, AngleSlug } from '../types';

// ────────────────────────────────────────────────────────────────
// PAIN POINT — "Stop the bleeding first"
// ────────────────────────────────────────────────────────────────
export const PainPointAngle: Angle = {
  id: 'pain-point',
  displayName: 'Pain Point',
  description: 'Acknowledge the problem first, position solution as relief',
  emoji: '😣',

  psychology:
    'Audience must feel "you understand my struggle" before they can hear your solution. Naming the specific pain first creates trust. Then the solution feels like obvious relief.',

  preferredHookFrameworks: [
    'pain-recognition',
    'problem-solver',
    'pain-of-stuck',
    'no-bs-truth',
  ],

  visualCues: [
    'before-state visualization (chaos, frustration, clutter)',
    'transition to after-state (calm, clarity, control)',
    'split composition or contrast lighting',
  ],

  emotionalColor: 'high-contrast',

  useWhen: [
    'Audience is aware of a specific painful problem',
    'Cold audience that needs context first',
    'B2B services solving operational pain',
  ],

  avoidWhen: [
    'Luxury positioning where pain feels "off-brand"',
    'Aspirational lifestyle products',
    'Audience already convinced — pain feels redundant',
  ],
};

// ────────────────────────────────────────────────────────────────
// DESIRE — "Show them the better life"
// ────────────────────────────────────────────────────────────────
export const DesireAngle: Angle = {
  id: 'desire',
  displayName: 'Desire',
  description: 'Paint the desired outcome — make them want to live this',
  emoji: '✨',

  psychology:
    'Audience already knows what they want — your job is to make it tangible and specific to your product. "After this, your day looks like ___." Specific aspirational future > vague benefits.',

  preferredHookFrameworks: [
    'transformation-promise',
    'before-after-style',
    'magic-moment',
    'occasion',
  ],

  visualCues: [
    'aspirational lifestyle context',
    'soft natural light suggesting calm/success',
    'subject in flow state or visible joy',
    'environmental cues of "made it" / "got it together"',
  ],

  emotionalColor: 'warm',

  useWhen: [
    'Lifestyle brands and aspirational products',
    'Audience already aware of category benefits',
    'Top-of-funnel awareness with emotional pull',
  ],

  avoidWhen: [
    'Ultra-rational B2B buyers (they want proof not aspiration)',
    'Pain-aware audiences who need recognition first',
  ],
};

// ────────────────────────────────────────────────────────────────
// AUTHORITY — "I know what I'm talking about"
// ────────────────────────────────────────────────────────────────
export const AuthorityAngle: Angle = {
  id: 'authority',
  displayName: 'Authority',
  description: 'Establish expertise — credentials, results, proven method',
  emoji: '🎓',

  psychology:
    'Trust transfer through demonstrated competence. Specific numbers, named methods, credentials, or visible expertise. The audience thinks "they actually know what they\'re doing."',

  preferredHookFrameworks: [
    'authority-credibility',
    'method-name',
    'numbers-credibility',
    'philosophy',
    'method-difference',
  ],

  visualCues: [
    'editorial portrait of expert in their environment',
    'professional but warm, not stiff',
    'visible signals of expertise (workspace, tools, awards subtly)',
    'considered styling',
  ],

  emotionalColor: 'cool',

  useWhen: [
    'High-ticket services or coaching',
    'Categories with skeptical audiences',
    'B2B and professional services',
    'Health/wellness/finance — categories needing trust',
  ],

  avoidWhen: [
    'Casual lifestyle products',
    'Viral consumer goods',
  ],
};

// ────────────────────────────────────────────────────────────────
// LUXURY — "Premium positioning"
// ────────────────────────────────────────────────────────────────
export const LuxuryAngle: Angle = {
  id: 'luxury',
  displayName: 'Luxury',
  description: 'Premium positioning — craftsmanship, exclusivity, taste',
  emoji: '🏛️',

  psychology:
    'Audience signals identity through choice. Luxury isn\'t about features — it\'s about who they become by choosing this. Restraint > excess. The brand whispers, doesn\'t shout.',

  preferredHookFrameworks: [
    'statement-piece',
    'philosophy',
    'gift-positioning',
    'method-name',
  ],

  visualCues: [
    'museum-quality lighting',
    'premium material textures',
    'considered minimalism — single hero',
    'editorial framing',
    'no clutter, no rush',
  ],

  emotionalColor: 'neutral',

  useWhen: [
    'Premium pricing strategy',
    'Brands competing on identity not features',
    'Audiences valuing quality and taste over deals',
  ],

  avoidWhen: [
    'Volume-driven D2C',
    'Flash sales',
    'Mass-market positioning',
  ],
};

// ────────────────────────────────────────────────────────────────
// VIRAL — "Stop the scroll"
// ────────────────────────────────────────────────────────────────
export const ViralAngle: Angle = {
  id: 'viral',
  displayName: 'Viral / Scroll-Stopping',
  description: 'Pattern interrupt — stop the scroll with energy or surprise',
  emoji: '🔥',

  psychology:
    'In a feed, you have 0.4 seconds to break pattern. Movement, contrast, surprise, or unexpected framing wins. Once they\'ve stopped, the rest of the ad does its job.',

  preferredHookFrameworks: [
    'demo-reveal',
    'magic-moment',
    'unboxing-tease',
    'before-after-product',
  ],

  visualCues: [
    'high-energy composition',
    'motion or implied movement',
    'unexpected framing or angle',
    'high contrast lighting',
    'satisfying detail or transformation moment',
  ],

  emotionalColor: 'high-contrast',

  useWhen: [
    'TikTok / Instagram Reels / shorts',
    'Cold audience needing pattern interrupt',
    'Consumer products with visual demo potential',
  ],

  avoidWhen: [
    'Premium luxury (clashes with restraint)',
    'B2B enterprise (feels gimmicky)',
    'Sensitive categories (health, finance)',
  ],
};

// ────────────────────────────────────────────────────────────────
// CONVERSION — "Just close the sale"
// ────────────────────────────────────────────────────────────────
export const ConversionAngle: Angle = {
  id: 'conversion',
  displayName: 'Conversion / Direct Response',
  description: 'Direct ask — clear product, clear offer, clear CTA',
  emoji: '🎯',

  psychology:
    'Warm or pre-qualified audience already knows the category. They don\'t need education — they need a clear product, clear price, clear path to buy. Friction-removal > persuasion.',

  preferredHookFrameworks: [
    'tool-stack-replacement',
    'comparison',
    'free-value',
    'demo-reveal',
  ],

  visualCues: [
    'clean product hero shot',
    'minimal distractions',
    'clear focal point',
    'composition leaves obvious space for offer/CTA',
  ],

  emotionalColor: 'neutral',

  useWhen: [
    'Bottom-funnel / warm audience',
    'Retargeting cart abandoners',
    'Direct response performance ads',
  ],

  avoidWhen: [
    'Cold audiences needing introduction',
    'Brand awareness phases',
    'Pre-launch teasing',
  ],
};

// ────────────────────────────────────────────────────────────────
// CURIOSITY — "Wait, what?"
// ────────────────────────────────────────────────────────────────
export const CuriosityAngle: Angle = {
  id: 'curiosity',
  displayName: 'Curiosity Gap',
  description: 'Open a loop — make them need to know what you\'re showing',
  emoji: '🔮',

  psychology:
    'Information gaps create discomfort. Audience MUST close the loop. Tease enough to intrigue but not enough to satisfy. Click is the relief.',

  preferredHookFrameworks: [
    'demo-reveal',
    'magic-moment',
    'method-name',
    'unboxing-tease',
  ],

  visualCues: [
    'partial reveal — show some, hide some',
    'mysterious framing',
    'unfinished visual narrative',
    'unusual angle that begs explanation',
  ],

  emotionalColor: 'cool',

  useWhen: [
    'Pre-launch / waitlist campaigns',
    'New category products needing intrigue',
    'Editorial awareness campaigns',
  ],

  avoidWhen: [
    'Direct response where clarity wins',
    'Trust-required categories (health, finance)',
  ],
};

// ────────────────────────────────────────────────────────────────
// URGENCY — "Now or never"
// ────────────────────────────────────────────────────────────────
export const UrgencyAngle: Angle = {
  id: 'urgency',
  displayName: 'Urgency',
  description: 'Time-bound — act now or lose the opportunity',
  emoji: '⏰',

  psychology:
    'Loss aversion is stronger than gain. Audience that "might" buy later won\'t buy at all unless given a reason to act now. Specific deadline > vague urgency. Real scarcity > manufactured panic.',

  preferredHookFrameworks: [
    'drop-hype',
    'beta-waitlist',
    'cohort-scarcity',
    'commitment-call',
  ],

  visualCues: [
    'bold contrast composition',
    'sense of decisive action',
    'space for prominent countdown or limited overlay',
  ],

  emotionalColor: 'warm',

  useWhen: [
    'Flash sales',
    'Cohort enrollments with deadlines',
    'Limited inventory drops',
    'Webinar registrations approaching date',
  ],

  avoidWhen: [
    'No real urgency (audience smells fake scarcity)',
    'Premium luxury (urgency clashes with restraint)',
    'Brand awareness phases',
  ],
};

// ────────────────────────────────────────────────────────────────
// SOCIAL PROOF — "People like me chose this"
// ────────────────────────────────────────────────────────────────
export const SocialProofAngle: Angle = {
  id: 'social-proof',
  displayName: 'Social Proof',
  description: 'Specific numbers, real customers, peer validation',
  emoji: '💬',

  psychology:
    'Decisions are validated by similar others. Specific numbers > vague "everyone loves it". Named customers > anonymous quotes. Visible community > claimed popularity.',

  preferredHookFrameworks: [
    'social-proof-results',
    'review-driven',
    'numbers-credibility',
    'before-this-realized',
  ],

  visualCues: [
    'real customer aesthetic',
    'multiple users / community feel',
    'authentic context — their workspace, their environment',
    'space for testimonial quote overlay',
  ],

  emotionalColor: 'warm',

  useWhen: [
    'Established products with real customer base',
    'Categories with high decision-friction (high-ticket, B2B)',
    'Convert undecided fence-sitters',
  ],

  avoidWhen: [
    'Brand new products with no social proof yet',
    'Pre-launch (no proof to share)',
  ],
};

// ────────────────────────────────────────────────────────────────
// REGISTRY + SELECTOR
// ────────────────────────────────────────────────────────────────

const ANGLES_REGISTRY: Record<AngleSlug, Angle> = {
  'pain-point': PainPointAngle,
  'desire': DesireAngle,
  'authority': AuthorityAngle,
  'luxury': LuxuryAngle,
  'viral': ViralAngle,
  'conversion': ConversionAngle,
  'curiosity': CuriosityAngle,
  'urgency': UrgencyAngle,
  'social-proof': SocialProofAngle,
};

export function getAngle(slug: AngleSlug): Angle {
  return ANGLES_REGISTRY[slug];
}

export function getAllAngles(): Angle[] {
  return Object.values(ANGLES_REGISTRY);
}

/**
 * Selects best 3-5 angles for a campaign given vertical + campaign type recommendations.
 * Returns ordered list (most relevant first).
 */
export function selectBestAngles(
  campaignTypeRecommended: AngleSlug[],
  count: number = 4,
): Angle[] {
  // Take top N from campaign type recommendations
  const angles = campaignTypeRecommended
    .slice(0, count)
    .map((slug) => ANGLES_REGISTRY[slug])
    .filter(Boolean);

  return angles;
}
