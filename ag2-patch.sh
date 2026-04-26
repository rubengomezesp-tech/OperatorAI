#!/bin/bash
# ════════════════════════════════════════════════════════════════
# AG-2 patch — Plan refinado con dossier + visual refs en prompt
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching brain.ts — callBrainLLM accepts dossier"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/core/brain.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1A. Update callBrainLLM signature to accept dossier
old_sig = """async function callBrainLLM(
  intake: CampaignIntake,
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
): Promise<BrainLLMResult> {"""

new_sig = """async function callBrainLLM(
  intake: CampaignIntake,
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
  researchDossier?: {
    productFacts: string[];
    competitorSignals: string[];
    visualReferences: string[];
    trendingTopics: string[];
    sources: string[];
    synthesis: string;
    fromLiveSearch: boolean;
    durationMs: number;
  } | null,
): Promise<BrainLLMResult> {"""

if old_sig in content and "researchDossier?:" not in content.split("async function callBrainLLM")[1][:200]:
    content = content.replace(old_sig, new_sig)
    print("  ✅ callBrainLLM accepts dossier")
else:
    print("  ⚠️  callBrainLLM signature pattern not found / already patched")

# 1B. Update buildSystemPrompt signature too
old_sys_sig = """function buildSystemPrompt(
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
): string {"""

new_sys_sig = """function buildSystemPrompt(
  vertical: Vertical,
  campaignType: CampaignType,
  angles: Angle[],
  dossier?: {
    productFacts: string[];
    competitorSignals: string[];
    trendingTopics: string[];
    synthesis: string;
  } | null,
): string {"""

if old_sys_sig in content and "dossier?:" not in content.split("function buildSystemPrompt")[1][:200]:
    content = content.replace(old_sys_sig, new_sys_sig)
    print("  ✅ buildSystemPrompt accepts dossier")
else:
    print("  ⚠️  buildSystemPrompt pattern not found / already patched")

# 1C. Inject dossier into system prompt
old_sys_body = """You produce STRUCTURED JSON output ONLY. No prose outside the JSON."""

new_sys_body = """${dossier && dossier.fromLiveSearch ? `

REAL-WORLD RESEARCH (use this, do NOT invent):
${dossier.productFacts.length > 0 ? `Product facts:\n${dossier.productFacts.map((f) => `  • ${f}`).join('\\n')}\n` : ''}${dossier.competitorSignals.length > 0 ? `Competitors discovered:\n${dossier.competitorSignals.map((c) => `  • ${c}`).join('\\n')}\n` : ''}${dossier.trendingTopics.length > 0 ? `Current trends in this category:\n${dossier.trendingTopics.map((t) => `  • ${t}`).join('\\n')}\n` : ''}
Use these REAL facts in your strategic reasoning. Position the campaign vs the actual competitors named above. Do not invent competitor names.
` : ''}

You produce STRUCTURED JSON output ONLY. No prose outside the JSON."""

if old_sys_body in content:
    content = content.replace(old_sys_body, new_sys_body)
    print("  ✅ System prompt injects dossier facts")
else:
    print("  ⚠️  System prompt body anchor not found")

# 1D. Pass dossier from callBrainLLM to buildSystemPrompt
old_call = "const systemPrompt = buildSystemPrompt(vertical, campaignType, angles);"
new_call = "const systemPrompt = buildSystemPrompt(vertical, campaignType, angles, researchDossier);"

if old_call in content:
    content = content.replace(old_call, new_call)
    print("  ✅ buildSystemPrompt receives dossier")
else:
    print("  ⚠️  buildSystemPrompt call site not found")

# 1E. Pass dossier from runCampaignBrain to callBrainLLM
old_run = "const brainResult = await callBrainLLM(intake, vertical, campaignType, angles);"
new_run = "const brainResult = await callBrainLLM(intake, vertical, campaignType, angles, researchDossier);"

if old_run in content:
    content = content.replace(old_run, new_run)
    print("  ✅ callBrainLLM receives dossier")
else:
    print("  ⚠️  callBrainLLM call site not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching premium-prompt-builder.ts"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/server/premium-prompt-builder.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 2A. Add researchDossier to PremiumPromptInput
old_input = """export interface PremiumPromptInput {
  variantBrief: VariantBrief;
  brainOutput: BrainOutput;
  vertical: VerticalSlug;
  brandKit?: BrandKitForPrompt | null;
  /** Optional URLs of reference photos uploaded by user (Stage Assets) */
  productPhotoUrls?: string[];
}"""

new_input = """export interface PremiumPromptInput {
  variantBrief: VariantBrief;
  brainOutput: BrainOutput;
  vertical: VerticalSlug;
  brandKit?: BrandKitForPrompt | null;
  /** Optional URLs of reference photos uploaded by user (Stage Assets) */
  productPhotoUrls?: string[];
  /** Optional research dossier with visual references */
  researchDossier?: {
    visualReferences: string[];
    productFacts: string[];
  } | null;
}"""

if old_input in content:
    content = content.replace(old_input, new_input)
    print("  ✅ PremiumPromptInput accepts researchDossier")
else:
    print("  ⚠️  PremiumPromptInput shape not found / already patched")

# 2B. Add visualReferences layer flag
old_layers = """  const layers = {
    brand: false,
    brainDiagnostic: false,
    visualDirection: false,
    hookTranslation: false,
    vertical: false,
    platform: false,
    productReference: false,
  };"""

new_layers = """  const layers = {
    brand: false,
    brainDiagnostic: false,
    visualDirection: false,
    hookTranslation: false,
    vertical: false,
    platform: false,
    productReference: false,
    visualReferences: false,
  };"""

if old_layers in content:
    content = content.replace(old_layers, new_layers)
    print("  ✅ Added visualReferences layer flag")

# 2C. Update destructuring of input
old_destr = "const { variantBrief, brainOutput, vertical, brandKit, productPhotoUrls } = input;"
new_destr = "const { variantBrief, brainOutput, vertical, brandKit, productPhotoUrls, researchDossier } = input;"

if old_destr in content:
    content = content.replace(old_destr, new_destr)
    print("  ✅ Destructure researchDossier from input")

# 2D. Insert visual references layer after vertical knowledge layer
old_layer_5 = """  // ─── LAYER 5: VERTICAL KNOWLEDGE ─────────────────────────────
  const verticalCue = VERTICAL_AESTHETIC_CUES[vertical];
  if (verticalCue) {
    parts.push(verticalCue);
    layers.vertical = true;
  }"""

new_layer_5 = """  // ─── LAYER 5: VERTICAL KNOWLEDGE ─────────────────────────────
  const verticalCue = VERTICAL_AESTHETIC_CUES[vertical];
  if (verticalCue) {
    parts.push(verticalCue);
    layers.vertical = true;
  }

  // ─── LAYER 5.5: VISUAL REFERENCES (from research dossier) ────
  if (researchDossier?.visualReferences && researchDossier.visualReferences.length > 0) {
    const refs = researchDossier.visualReferences.slice(0, 5);
    parts.push(
      `Aesthetic references — match the production quality and visual language of: ${refs.join('; ')}.`,
    );
    layers.visualReferences = true;
  }"""

if old_layer_5 in content and "LAYER 5.5" not in content:
    content = content.replace(old_layer_5, new_layer_5)
    print("  ✅ Inserted Layer 5.5 visual references")

# 2E. Update the type `PremiumPromptResult.layers` to include visualReferences
old_layers_type = """  /** Debug info about which layers were active */
  layers: {
    brand: boolean;
    brainDiagnostic: boolean;
    visualDirection: boolean;
    hookTranslation: boolean;
    vertical: boolean;
    platform: boolean;
    productReference: boolean;
  };"""

new_layers_type = """  /** Debug info about which layers were active */
  layers: {
    brand: boolean;
    brainDiagnostic: boolean;
    visualDirection: boolean;
    hookTranslation: boolean;
    vertical: boolean;
    platform: boolean;
    productReference: boolean;
    visualReferences: boolean;
  };"""

if old_layers_type in content:
    content = content.replace(old_layers_type, new_layers_type)
    print("  ✅ Added visualReferences to PremiumPromptResult.layers type")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching brain-to-variant.ts — pass dossier"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/server/brain-to-variant.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 3A. Pass researchDossier into buildPremiumImagePrompt — async path
old_async_call = """  const premium = buildPremiumImagePrompt({
    variantBrief: brief,
    brainOutput,
    vertical,
    brandKit,
    productPhotoUrls,
  });"""

new_async_call = """  const premium = buildPremiumImagePrompt({
    variantBrief: brief,
    brainOutput,
    vertical,
    brandKit,
    productPhotoUrls,
    researchDossier: brainOutput.researchDossier
      ? {
          visualReferences: brainOutput.researchDossier.visualReferences,
          productFacts: brainOutput.researchDossier.productFacts,
        }
      : null,
  });"""

if old_async_call in content:
    content = content.replace(old_async_call, new_async_call, 1)
    print("  ✅ Async bridge passes researchDossier")
else:
    print("  ⚠️  Async path pattern not found")

# 3B. Sync path (legacy fallback)
old_sync_call = """    const premium = buildPremiumImagePrompt({
      variantBrief: brief,
      brainOutput,
      vertical,
      brandKit: null,
      productPhotoUrls: undefined,
    });"""

new_sync_call = """    const premium = buildPremiumImagePrompt({
      variantBrief: brief,
      brainOutput,
      vertical,
      brandKit: null,
      productPhotoUrls: undefined,
      researchDossier: brainOutput.researchDossier
        ? {
            visualReferences: brainOutput.researchDossier.visualReferences,
            productFacts: brainOutput.researchDossier.productFacts,
          }
        : null,
    });"""

if old_sync_call in content:
    content = content.replace(old_sync_call, new_sync_call, 1)
    print("  ✅ Sync bridge passes researchDossier")
else:
    print("  ⚠️  Sync path pattern not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ AG-2 patch applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
