/**
 * Operator AI — Premium Composer
 * Phase 1.4 / Prompt Cleanup
 *
 * When Composer V2 is enabled, the AI should generate ONLY the background.
 * Text/CTA/logo are added in post-processing.
 *
 * This helper strips text-rendering instructions from the original prompt
 * so the AI focuses on the scene/aesthetic only.
 *
 * Example:
 *   IN:  "A modern coffee shop with the headline 'Best Coffee in Town' on top"
 *   OUT: "A modern coffee shop scene"
 */

const TEXT_INSTRUCTION_PATTERNS = [
  // English
  /\bwith\s+(?:the\s+)?(?:text|headline|caption|title|label|copy|wordmark|tagline)\s+["'][^"']*["']/gi,
  /\b(?:reading|saying|that says)\s+["'][^"']*["']/gi,
  /\b(?:include|add|place|put)\s+(?:the\s+)?(?:text|headline|caption|title)\b[^.,]*/gi,
  /\b(?:the\s+)?(?:text|headline|caption)\s+(?:should\s+say|says|reads)\s+["'][^"']*["']/gi,

  // Spanish
  /\bcon\s+(?:el\s+)?(?:texto|titular|lema|t[ií]tulo)\s+["'][^"']*["']/gi,
  /\b(?:que\s+(?:dice|diga))\s+["'][^"']*["']/gi,
  /\b(?:incluir|a[ñn]adir|poner|colocar)\s+(?:el\s+)?(?:texto|titular|t[ií]tulo)\b[^.,]*/gi,

  // CTA-related
  /\b(?:with\s+a\s+)?(?:cta|call[\s-]?to[\s-]?action|button)\s+(?:that\s+says|saying|reading)\s+["'][^"']*["']/gi,
  /\b(?:con\s+un\s+)?bot[oó]n\s+(?:que\s+(?:dice|diga))\s+["'][^"']*["']/gi,

  // Logo-related
  /\b(?:with|including|featuring)\s+(?:the\s+)?(?:brand\s+)?logo\b[^.,]*/gi,
  /\bcon\s+(?:el\s+)?logo\b[^.,]*/gi,
];

const CLEANUP_TRIM = [
  /\s{2,}/g, // collapse multiple spaces
  /^\s*[,.;]+/g, // leading punctuation
  /[,.;]+\s*$/g, // trailing punctuation
];

/**
 * Strip text/CTA/logo instructions from a prompt.
 * Always preserves the core scene description.
 */
export function stripTextFromPrompt(prompt: string): string {
  let cleaned = prompt;

  for (const pattern of TEXT_INSTRUCTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  for (const trim of CLEANUP_TRIM) {
    cleaned = cleaned.replace(trim, ' ');
  }

  cleaned = cleaned.trim();

  // Add explicit "no text" suffix to reinforce intent
  if (!/no\s+text|sin\s+texto/i.test(cleaned)) {
    cleaned += ', no text, no captions, no watermark, clean background composition';
  }

  return cleaned;
}

/**
 * Build a negative prompt that suppresses text/letters in the output.
 * Used as the `negative_prompt` parameter for Flux/Imagen.
 */
export function buildNoTextNegativePrompt(): string {
  return [
    'text',
    'letters',
    'words',
    'typography',
    'caption',
    'subtitle',
    'watermark',
    'logo',
    'signature',
    'writing',
    'inscription',
    'label',
    'title',
    'headline',
    'gibberish text',
    'distorted letters',
  ].join(', ');
}
