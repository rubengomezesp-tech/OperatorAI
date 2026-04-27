#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V2.0.0 SPRINT 1 patch
#
#   FIX 1A: premium-prompt-builder injecta TODO el brainOutput
#           - pain, desire, hiddenDesire, objection
#           - audience.triggers + barriers
#           - hook COMPLETO con framework
#           - strategic angle activa
#           - tone
#           - visualDirection completo
#
#   FIX 1B: campaigns/[id]/page.tsx llama al endpoint correcto
#
#   FIX 1C: stage-variants detecta variants ya renderizadas
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching premium-prompt-builder — BRIEF NUCLEAR"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/server/premium-prompt-builder.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace LAYER 2 (Campaign Intelligence) with FULL nuclear injection
old_layer_2 = """  // ─── LAYER 2: CAMPAIGN INTELLIGENCE ──────────────────────────
  const diagBits: string[] = [];

  if (brainOutput.audience?.primaryPersona) {
    diagBits.push(
      `Audience: ${brainOutput.audience.primaryPersona}`,
    );
  }
  if (brainOutput.diagnostic?.hiddenDesire) {
    diagBits.push(
      `Their unstated desire: "${brainOutput.diagnostic.hiddenDesire}"`,
    );
  }"""

new_layer_2 = """  // ─── LAYER 2: BRIEF NUCLEAR — FULL strategic context ─────────
  // The brain produces a comprehensive brief. We inject ALL of it
  // (not just snippets) so the image model executes the full strategy.
  const diagBits: string[] = [];

  // Audience deep
  if (brainOutput.audience?.primaryPersona) {
    diagBits.push(`Target persona: ${brainOutput.audience.primaryPersona}`);
  }
  if (brainOutput.audience?.triggers && brainOutput.audience.triggers.length > 0) {
    diagBits.push(
      `Emotional triggers: ${brainOutput.audience.triggers.slice(0, 3).join('; ')}`,
    );
  }

  // Diagnostic — psychology-driven imagery
  if (brainOutput.diagnostic?.pain) {
    diagBits.push(`Pain to acknowledge visually: "${brainOutput.diagnostic.pain}"`);
  }
  if (brainOutput.diagnostic?.desire) {
    diagBits.push(`Desire to evoke: "${brainOutput.diagnostic.desire}"`);
  }
  if (brainOutput.diagnostic?.hiddenDesire) {
    diagBits.push(
      `Unstated emotional driver: "${brainOutput.diagnostic.hiddenDesire}"`,
    );
  }
  if (brainOutput.diagnostic?.objection) {
    diagBits.push(
      `Objection the image must overcome: "${brainOutput.diagnostic.objection}"`,
    );
  }"""

if old_layer_2 in content:
    content = content.replace(old_layer_2, new_layer_2)
    print("  ✅ Layer 2 now BRIEF NUCLEAR (full context)")
else:
    print("  ⚠️  Layer 2 anchor not found — may already be patched")

# Add LAYER 2.5: Hook + Strategic angle execution (after Layer 2)
old_anchor_layer_3 = """  // ─── LAYER 3: VISUAL DIRECTION (Brain) ───────────────────────"""

new_layer_25 = """  // ─── LAYER 2.5: STRATEGIC ANGLE EXECUTION ───────────────────
  // The strategic angle determines visual mood and emphasis.
  // Inject the explicit instruction so the model executes that angle.
  const angle = (variantBrief.angle ?? '').toString();
  const angleInstructions: Record<string, string> = {
    'pain-point': 'Convey pre-relief tension. Subject visibly carries the burden the audience knows.',
    'desire': 'Show the post-state outcome. Subject confidently embodies the goal achieved.',
    'authority': 'Editorial portrait framing. Subject in element, expert posture, confident gaze.',
    'luxury': 'Cinematic depth-of-field, premium materials, restrained palette, considered shadows.',
    'viral': 'Scroll-stopping unexpected composition or color contrast. Pattern interrupt.',
    'conversion': 'Crystal-clear product utility. Single focal point. Before-after reading clear.',
    'curiosity': 'Mystery framing. Partially revealed subject. Intriguing angle that demands a second look.',
    'urgency': 'Kinetic motion. Action mid-stride. Time-pressured framing.',
    'social-proof': 'Group dynamic energy. Multiple subjects in shared moment of validation.',
  };
  if (angleInstructions[angle]) {
    parts.push(
      `Strategic angle "${angle}" must be executed visually: ${angleInstructions[angle]}`,
    );
  }

  // ─── LAYER 2.6: HOOK TRANSLATION (concrete copy → image cue) ─
  // Inject the actual hook copy + framework so visuals reinforce it
  if (brainOutput.hooks && brainOutput.hooks.length > 0) {
    const primaryHook = brainOutput.hooks.find(
      (h) => h.targetAngle === angle,
    ) ?? brainOutput.hooks[0];
    if (primaryHook?.text) {
      parts.push(
        `Headline this image must support: "${primaryHook.text}"${primaryHook.framework ? ` (${primaryHook.framework} framework)` : ''}.`,
      );
    }
  }

  // ─── LAYER 3: VISUAL DIRECTION (Brain) ───────────────────────"""

if old_anchor_layer_3 in content and "LAYER 2.5: STRATEGIC ANGLE" not in content:
    content = content.replace(old_anchor_layer_3, new_layer_25)
    print("  ✅ Layer 2.5 + 2.6 (angle + hook execution) added")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Fixing /campaigns/[id]/page.tsx — endpoint correcto"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/(app)/campaigns/[id]/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# El endpoint correcto es /api/campaigns/[id], no /api/campaigns/draft?id=
old_fetch = """        const res = await fetch(`/api/campaigns/draft?id=${encodeURIComponent(params.id)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed: ${res.status}`);
        }
        const body = await res.json();
        const draft = body.draft;
        if (!draft) {
          throw new Error('Campaign not found');
        }
        if (!draft.brain_output) {
          throw new Error('This campaign has no Strategy Brief yet');
        }
        if (!cancelled) {
          setCampaign({
            id: draft.id,
            brain_output: draft.brain_output,
            intake_data: draft.intake ?? {},
          });
        }"""

new_fetch = """        const res = await fetch(`/api/campaigns/${encodeURIComponent(params.id)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed: ${res.status}`);
        }
        const body = await res.json();
        const camp = body.campaign;
        if (!camp) {
          throw new Error('Campaign not found');
        }
        // brain_output may live under different shapes — normalise
        const brainOutput = camp.brain_output || camp.brainOutput || null;
        if (!brainOutput) {
          throw new Error('This campaign has no Strategy Brief yet');
        }
        if (!cancelled) {
          setCampaign({
            id: camp.id,
            brain_output: brainOutput,
            intake_data: camp.intake_data || camp.intake || {},
            renderedImages: camp.rendered_images || camp.renderedImages || {},
            critiques: camp.critiques || {},
          });
        }"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    print("  ✅ campaigns/[id] now calls /api/campaigns/[id]")
else:
    print("  ⚠️  Fetch pattern not found — may already be patched")

# Update LoadedCampaign type to include rendered images + critiques
old_type = """interface LoadedCampaign {
  id: string;
  brain_output: BrainOutput;
  intake_data: Record<string, unknown>;
}"""

new_type = """interface LoadedCampaign {
  id: string;
  brain_output: BrainOutput;
  intake_data: Record<string, unknown>;
  renderedImages: Record<string, string>;
  critiques: Record<string, unknown>;
}"""

if old_type in content:
    content = content.replace(old_type, new_type)
    print("  ✅ LoadedCampaign type extended")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching /api/campaigns/[id] — devuelve brain_output"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/api/campaigns/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Verificar si ya devuelve brain_output
if 'brain_output' in content and 'rendered_images' in content:
    print("  ✅ Already returns brain_output + rendered_images")
else:
    # Hacer un replace mínimo: asegurar que el objeto returned incluye TODO
    # En vez de patches frágiles, añadir un return alternativo en la response final
    
    old_return = """    const row = data as any;
    return NextResponse.json({
      ok: true,
      campaign: {"""
    
    new_return = """    const row = data as any;
    return NextResponse.json({
      ok: true,
      campaign: {
        // Spread full row first to keep all DB fields available
        ...row,
        // Explicit fields (override with consistent naming)"""
    
    if old_return in content:
        content = content.replace(old_return, new_return)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  ✅ /api/campaigns/[id] now spreads full row")
    else:
        print("  ⚠️  Anchor not found — manual review")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patching stage-variants — detecta variants ya renderizadas"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/components/stage-variants.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add optional pre-rendered props
old_props = """interface StageVariantsProps {
  draftId: string;
  brainOutput: BrainOutput;
  onSaveCampaign: () => void;
}"""

new_props = """interface StageVariantsProps {
  draftId: string;
  brainOutput: BrainOutput;
  onSaveCampaign: () => void;
  /** If provided, skip auto-render and use these images (saved campaign) */
  preRenderedImages?: Record<string, string>;
  preRenderedCritiques?: Record<string, unknown>;
}"""

if old_props in content and "preRenderedImages?:" not in content:
    content = content.replace(old_props, new_props)
    print("  ✅ Props extended with preRenderedImages")

# Update component signature destructuring
old_sig = """export function StageVariants({
  draftId,
  brainOutput,
  onSaveCampaign,
}: StageVariantsProps) {"""

new_sig = """export function StageVariants({
  draftId,
  brainOutput,
  onSaveCampaign,
  preRenderedImages,
  preRenderedCritiques,
}: StageVariantsProps) {"""

if old_sig in content:
    content = content.replace(old_sig, new_sig)
    print("  ✅ Component signature updated")

# Modify useEffect to skip render if preRenderedImages present
old_effect = """  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/campaign/render-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ draftId, maxVariants: 4 }),
        });"""

new_effect = """  useEffect(() => {
    let cancelled = false;

    // If we have pre-rendered images (saved campaign view) — use them directly
    if (preRenderedImages && Object.keys(preRenderedImages).length > 0) {
      const reconstructed: BatchVariantResult[] = brainOutput.variantBriefs
        .map((b) => {
          const url = preRenderedImages[b.id];
          if (!url) return null;
          const crit = preRenderedCritiques?.[b.id] as
            | VariantCritique
            | undefined;
          return {
            id: b.id,
            imageUrl: url,
            composedV2: false,
            critique: crit,
          };
        })
        .filter((v): v is BatchVariantResult => v !== null);
      setVariants(reconstructed);
      setLoading(false);
      return () => {};
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/campaign/render-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ draftId, maxVariants: 4 }),
        });"""

if old_effect in content and "preRenderedImages && Object.keys" not in content:
    content = content.replace(old_effect, new_effect)
    print("  ✅ useEffect supports preRenderedImages shortcut")

# Update useEffect dependency array
old_dep = """    return () => {
      cancelled = true;
    };
  }, [draftId]);"""

new_dep = """    return () => {
      cancelled = true;
    };
  }, [draftId, preRenderedImages, preRenderedCritiques, brainOutput]);"""

if old_dep in content and "[draftId, preRenderedImages" not in content:
    content = content.replace(old_dep, new_dep)
    print("  ✅ useEffect deps updated")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "5. Patching campaigns/[id]/page.tsx — pasa preRenderedImages"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/(app)/campaigns/[id]/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update StageVariants usage to pass pre-rendered data
old_usage = """      <StageVariants
        draftId={campaign.id}
        brainOutput={campaign.brain_output}
        onSaveCampaign={handleSaveCampaign}
      />"""

new_usage = """      <StageVariants
        draftId={campaign.id}
        brainOutput={campaign.brain_output}
        onSaveCampaign={handleSaveCampaign}
        preRenderedImages={campaign.renderedImages}
        preRenderedCritiques={campaign.critiques as Record<string, unknown>}
      />"""

if old_usage in content and "preRenderedImages={campaign.renderedImages}" not in content:
    content = content.replace(old_usage, new_usage)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ campaigns/[id] passes preRenderedImages")
else:
    if "preRenderedImages={campaign.renderedImages}" in content:
        print("  ⚠️  Already passing preRenderedImages")
    else:
        print("  ⚠️  StageVariants usage anchor not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Sprint 1 patch applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
