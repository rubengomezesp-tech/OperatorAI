/**
 * CAMPAIGN BRAIN — Orchestrator
 *
 * Combines vertical (industry) + campaign-type (mode) + angles (psychology)
 * to produce a Strategy Brief that feels like it came from a senior creative
 * director at a real agency.
 *
 * Flow:
 *   1. Validate intake
 *   2. Select vertical (smart selector)
 *   3. Select campaign type (smart selector)
 *   4. Select 3-4 best angles for this combo
 *   5. Run Claude with extended thinking → diagnostic + audience + strategy
 *   6. Generate variant briefs (one per angle × platform)
 *   7. Build vertical-aware prompts for each variant
 *   8. Return BrainOutput (saved as brain_output in campaigns row)
 */

import 'server-only';
import { serverEnv } from '@/lib/env';
import type {
  CampaignIntake,
  BrainOutput,
  VariantBrief,
  Vertical,
  CampaignType,
  Angle,
  PromptContext,
  Platform,
  AspectRatio,
} from '../types';
import { selectVertical, buildNegativePrompt } from '../verticals/_base';
import { selectCampaignType } from '../campaign-types/_base';
import { selectBestAngles, getAllAngles } from '../angles';
import { validateIntake } from './intake-validator';

const BRAIN_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 4000;

// ────────────────────────────────────────────────────────────────
// PUBLIC ENTRY POINT
// ────────────────────────────────────────────────────────────────

export async function runCampaignBrain(
  rawIntake: Partial<CampaignIntake>,
): Promise<BrainOutput> {
  // 1. Validate
  const validation = validateIntake(rawIntake);
  if (!validation.valid) {
    throw new Error(
      `Invalid intake: ${validation.errors.join('; ')}`,
    );
  }
  const intake = validation.normalized;

  // 2. Select vertical
  const verticalPick = selectVertical(intake);
  const vertical = verticalPick.vertical;

  // 3. Select campaign type
  const typePick = selectCampaignType(intake);
  const campaignType = typePick.type;

  // 4. Select best angles for this campaign type
  const angles = selectBestAngles(campaignType.recommendedAngles, 4);

  // 5. Run Brain with Claude
  const brainResult = await callBrainLLM(intake, vertical, campaignType, angles);

  // 6. Generate variant briefs (one per angle × selected platforms)
  const platforms: Platform[] =
    intake.platforms && intake.platforms.length > 0
      ? intake.platforms
      : ['instagram-feed', 'instagram-story'];

  const variantBriefs: VariantBrief[] = [];
  for (const angle of angles) {
    for (const platform of platforms.slice(0, 2)) {
      const aspectRatio = platformToAspectRatio(platform);
      const context: PromptContext = {
        productName: intake.productName,
        productDescription: intake.productDescription,
        brandName: intake.brandName ?? '',
        brandTone: intake.brandTone,
        brandColors: intake.brandColors as { primary?: string; accent?: string } | undefined,
        angle: angle.id,
        campaignType: campaignType.id,
        platform,
        aspectRatio,
        audience: intake.audienceDescription,
        audienceTriggers: brainResult.audience.triggers,
        hasOffer: Boolean(intake.offer),
        offerDetails: intake.offer,
        isLaunch:
          campaignType.id === 'product-launch' ||
          campaignType.id === 'waitlist-launch',
      };

      const prompt = vertical.generateBackgroundPrompt(context);
      const negativePrompt = buildNegativePrompt(vertical);

      // Pick a hook for this angle from brain output (first match)
      const hook =
        brainResult.hooks.find((h) => h.targetAngle === angle.id)?.text ??
        brainResult.hooks[0]?.text ??
        intake.productName;

      const cta =
        brainResult.ctas[0] ?? campaignType.ctaPatterns[0] ?? 'Learn more';

      variantBriefs.push({
        id: `${angle.id}-${platform}`,
        angle: angle.id,
        platform,
        aspectRatio,
        headline: hook,
        cta,
        backgroundPrompt: prompt,
        negativePrompt,
        reasoning: `Vertical: ${vertical.displayName}. Type: ${campaignType.displayName}. Angle: ${angle.displayName}. Why this angle here: ${angle.psychology}`,
      });
    }
  }

  // 7. Compose final output
  const output: BrainOutput = {
    reasoning: brainResult.reasoning,
    detectedVertical: vertical.id,
    detectedCampaignType: campaignType.id,
    confidence: Math.min(verticalPick.confidence, typePick.confidence),
    diagnostic: brainResult.diagnostic,
    audience: brainResult.audience,
    selectedAngles: {
      primary: angles[0]!.id,
      alternatives: angles.slice(1).map((a) => a.id),
      reasoning: `Top angle "${angles[0]!.displayName}" picked because it matches the campaign type "${campaignType.displayName}" psychology and the vertical "${vertical.displayName}" audience. Alternatives provide diversity for A/B testing.`,
    },
    visualDirection: {
      aesthetic: vertical.visualCodes.defaultAesthetic,
      lighting: vertical.visualCodes.defaultLighting,
      composition: vertical.visualCodes.defaultComposition,
      moodDescription: vertical.visualCodes.moodKeywords.join(', '),
    },
    hooks: brainResult.hooks,
    ctas: brainResult.ctas,
    variantBriefs,
    launchPlan: brainResult.launchPlan,
  };

  return output;
}

// ────────────────────────────────────────────────────────────────
// LLM CALL
// ────────────────────────────────────────────────────────────────

interface BrainLLMResult {
  reasoning: string;
  diagnostic: BrainOutput['diagnostic'];
  audience: BrainOutput['audience'];
  hooks: BrainOutput['hooks'];
  ctas: string[];
  launchPlan?: BrainOutput['launchPlan'];
}

async function callBrainLLM(
  intake: CampaignIntake,
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
): Promise<BrainLLMResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  const systemPrompt = buildSystemPrompt(vertical, campaignType, angles);
  const userPrompt = buildUserPrompt(intake, vertical, campaignType, angles);

  try {
    const response = await claude.messages.create({
      model: BRAIN_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n');

    return parseBrainResponse(text, intake, campaignType, angles);
  } catch (err) {
    // Fallback — produce deterministic output if Claude fails
    return buildFallbackResult(intake, vertical, campaignType, angles);
  }
}

// ────────────────────────────────────────────────────────────────
// PROMPTS
// ────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
): string {
  return `You are a senior creative director at a top marketing agency. You think strategically before producing creative work — diagnostic first, strategy second, execution third.

Your specialty for this campaign:
  • Vertical: ${vertical.displayName} (${vertical.description})
  • Campaign type: ${campaignType.displayName} (${campaignType.description})
  • Psychology of this campaign: ${campaignType.psychology}

You have these angles available:
${angles.map((a) => `  • ${a.displayName} — ${a.psychology}`).join('\n')}

Visual codes you respect for this vertical:
  • Aesthetic: ${vertical.visualCodes.defaultAesthetic}
  • Mood keywords: ${vertical.visualCodes.moodKeywords.join(', ')}
  • References: ${vertical.visualCodes.references.slice(0, 4).join(', ')}

You produce STRUCTURED JSON output ONLY. No prose outside the JSON.

Schema:
{
  "reasoning": "2-3 sentences on why this strategy fits this brief",
  "diagnostic": {
    "pain": "specific painful problem the audience faces",
    "desire": "specific outcome the audience wants",
    "objection": "main reason they hesitate",
    "hiddenDesire": "deeper emotional desire underneath the surface want"
  },
  "audience": {
    "primaryPersona": "1-line description of the main persona",
    "secondaryPersonas": ["2 alternative personas"],
    "triggers": ["5 emotional/contextual triggers that move them"],
    "barriers": ["3 things that hold them back"]
  },
  "hooks": [
    {
      "text": "opening line of an ad — pattern interrupt + promise",
      "framework": "name of the framework used",
      "targetAngle": "one of: pain-point|desire|authority|luxury|viral|conversion|curiosity|urgency|social-proof"
    }
    // 4-6 hooks total, mix of angles
  ],
  "ctas": ["3-5 short CTAs aligned with campaign type"],
  "launchPlan": {  // optional, include for product-launch and waitlist-launch only
    "durationDays": 7,
    "posts": [
      {
        "day": 1,
        "platform": "instagram-feed",
        "contentType": "feed",
        "angle": "curiosity",
        "copyHint": "Tease the reveal — show outcome, hide method",
        "visualHint": "Partial product reveal, mysterious framing"
      }
      // 5-7 posts spread across the 7 days
    ]
  }
}

Constraints you respect:
  • Hooks under 90 chars when possible
  • CTAs under 20 chars
  • Specific > vague (use real numbers, named outcomes, concrete situations)
  • Avoid clichés ("revolutionary", "game-changing", "next level", "cutting-edge")
  • Voice matches brand tone if provided
  • If user provided "doNotInclude", strictly avoid those concepts/words`;
}

function buildUserPrompt(
  intake: CampaignIntake,
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
): string {
  const parts: string[] = [];

  parts.push(`# Campaign Brief\n`);
  parts.push(`**Campaign name:** ${intake.campaignName}`);
  parts.push(`**Product:** ${intake.productName}`);
  parts.push(`**Description:** ${intake.productDescription}`);
  parts.push(`**Goal:** ${intake.goalDescription}`);

  if (intake.audienceDescription) {
    parts.push(`**Audience:** ${intake.audienceDescription}`);
  }

  if (intake.brandName) {
    parts.push(`**Brand:** ${intake.brandName}`);
  }

  if (intake.brandTone) {
    parts.push(`**Brand tone:** ${intake.brandTone}`);
  }

  if (intake.offer) {
    parts.push(`**Offer:** ${intake.offer}`);
  }

  if (intake.callToAction) {
    parts.push(`**Preferred CTA:** ${intake.callToAction}`);
  }

  if (intake.competitorReferences && intake.competitorReferences.length > 0) {
    parts.push(`**Competitor references:** ${intake.competitorReferences.join(', ')}`);
  }

  if (intake.doNotInclude) {
    parts.push(`**Do NOT include:** ${intake.doNotInclude}`);
  }

  parts.push(`\n# Strategic Constraints`);
  parts.push(`**Vertical:** ${vertical.displayName}`);
  parts.push(`**Campaign type:** ${campaignType.displayName}`);
  parts.push(`**Recommended angles for this campaign:** ${angles.map((a) => a.displayName).join(', ')}`);

  parts.push(`\n# Task`);
  parts.push(
    `Produce a complete strategic Brief in the JSON schema specified in the system prompt. Think hard about the diagnostic — that's what separates an agency from a tool. Make hooks specific to this product and audience, not generic templates. Reference at least one of the campaign type's recommended angles in each hook.`,
  );

  return parts.join('\n');
}

// ────────────────────────────────────────────────────────────────
// PARSER
// ────────────────────────────────────────────────────────────────

function parseBrainResponse(
  text: string,
  intake: CampaignIntake,
  campaignType: CampaignType,
  angles: Angle[],
): BrainLLMResult {
  // Extract JSON (handle markdown fences and prose around it)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Brain response');
  }
  const jsonText = jsonMatch[1] ?? jsonMatch[0];

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Brain returned invalid JSON');
  }

  return {
    reasoning: String(parsed.reasoning ?? 'Strategic brief generated.'),
    diagnostic: parsed.diagnostic as BrainOutput['diagnostic'],
    audience: parsed.audience as BrainOutput['audience'],
    hooks: (parsed.hooks ?? []) as BrainOutput['hooks'],
    ctas: (parsed.ctas ?? campaignType.ctaPatterns.slice(0, 3)) as string[],
    launchPlan: parsed.launchPlan as BrainOutput['launchPlan'] | undefined,
  };
}

// ────────────────────────────────────────────────────────────────
// FALLBACK (when Claude fails)
// ────────────────────────────────────────────────────────────────

function buildFallbackResult(
  intake: CampaignIntake,
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
): BrainLLMResult {
  return {
    reasoning: `Fallback strategy for ${intake.productName}: applying ${vertical.displayName} expertise to a ${campaignType.displayName} campaign. Using ${angles[0]?.displayName} as primary angle.`,
    diagnostic: {
      pain: `Audience struggles with: ${intake.goalDescription.toLowerCase()}`,
      desire: `Audience wants: outcome described in goal`,
      objection: 'Skepticism about whether this product works',
      hiddenDesire: 'Status, control, or peace of mind from the outcome',
    },
    audience: {
      primaryPersona: intake.audienceDescription || 'Primary target audience',
      secondaryPersonas: [],
      triggers: vertical.visualCodes.moodKeywords.slice(0, 5),
      barriers: ['Trust', 'Time', 'Past disappointment'],
    },
    hooks: angles.slice(0, 4).map((angle, i) => {
      const framework = vertical.hookFrameworks[i % vertical.hookFrameworks.length];
      return {
        text: framework?.example ?? `${intake.productName} for ${intake.audienceDescription}`,
        framework: framework?.name ?? 'Generic',
        targetAngle: angle.id,
      };
    }),
    ctas: campaignType.ctaPatterns.slice(0, 4),
    launchPlan: undefined,
  };
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function platformToAspectRatio(platform: Platform): AspectRatio {
  switch (platform) {
    case 'instagram-story':
    case 'instagram-reel':
    case 'tiktok':
      return '9:16';
    case 'instagram-feed':
    case 'meta-ads':
      return '4:5';
    case 'linkedin':
    case 'twitter':
    case 'pinterest':
    default:
      return '1:1';
  }
}
