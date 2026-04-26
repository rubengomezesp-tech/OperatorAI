#!/bin/bash
# AG-1 patch: add ResearchDossier to brain types + extend BrainOutput
set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "Patching campaign-brain/types.ts"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/types.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Re-export ResearchDossier from this types module so other modules can import it
new_import = """// Research dossier (AG-1) — re-exported for convenience
export type { ResearchDossier } from '../server/research-dossier';
"""

if "from '../server/research-dossier'" not in content:
    content = new_import + content
    print("  ✅ Added ResearchDossier re-export at top of types.ts")
else:
    print("  ⚠️  ResearchDossier import already present")

# 2. Extend BrainOutput interface to optionally carry the dossier
old_brain_output = "export interface BrainOutput {"
if old_brain_output in content and "researchDossier?:" not in content:
    # Insert at top of interface
    content = content.replace(
        old_brain_output,
        old_brain_output + """
  /** Optional research dossier (web search + visual refs) */
  researchDossier?: import('../server/research-dossier').ResearchDossier | null;
""",
    )
    print("  ✅ Added researchDossier? field to BrainOutput")
else:
    if "researchDossier?:" in content:
        print("  ⚠️  researchDossier already in BrainOutput")
    else:
        print("  ⚠️  BrainOutput interface anchor not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "Patching brain.ts to call buildResearchDossier"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/core/brain.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
import_line = "import { buildResearchDossier } from '../server/research-dossier';"
if import_line not in content:
    # Add after validateIntake import
    anchor = "import { validateIntake } from './intake-validator';"
    if anchor in content:
        content = content.replace(
            anchor,
            anchor + "\n" + import_line,
        )
        print("  ✅ Added buildResearchDossier import")
    else:
        print("  ⚠️  Anchor not found for import")

# 2. Insert dossier call after step 4 (selectBestAngles)
anchor2 = "  // 5. Run Brain with Claude"
if anchor2 in content and "researchDossier" not in content.split(anchor2)[0]:
    insertion = """  // 4.5 Research dossier (web search + visual refs)
  let researchDossier = null;
  try {
    researchDossier = await buildResearchDossier({
      productName: intake.productName,
      productDescription: intake.productDescription,
      audienceDescription: intake.audienceDescription,
      vertical: vertical.id,
      campaignType: campaignType.id,
      primaryAngle: angles[0]?.id ?? 'desire',
    });
    console.log('[brain] research dossier built', {
      fromLiveSearch: researchDossier.fromLiveSearch,
      durationMs: researchDossier.durationMs,
      productFacts: researchDossier.productFacts.length,
      competitors: researchDossier.competitorSignals.length,
      visualRefs: researchDossier.visualReferences.length,
    });
  } catch (err) {
    console.warn('[brain] research dossier failed (non-fatal)', {
      error: (err as Error).message,
    });
  }

"""
    content = content.replace(anchor2, insertion + anchor2)
    print("  ✅ Inserted research dossier call in brain orchestrator")

# 3. Pass researchDossier into callBrainLLM (best-effort: append parameter to brainResult assembly)
# Find "return {" in BrainOutput assembly and add researchDossier
# Most safe: append in the final return of runCampaignBrain
old_return_pat = "    variantBriefs,"
if "researchDossier," not in content and old_return_pat in content:
    content = content.replace(
        old_return_pat,
        "    variantBriefs,\n    researchDossier,",
        1,
    )
    print("  ✅ Added researchDossier to BrainOutput return")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ AG-1 patch applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
