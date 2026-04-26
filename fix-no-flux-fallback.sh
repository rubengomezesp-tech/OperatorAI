#!/bin/bash
# ════════════════════════════════════════════════════════════════
# FIX: Remove Flux fallback from render-router
# Now if gpt-image fails, returns explicit error instead of ugly Flux
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "Patching render-router.ts — remove Flux fallback"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/creative-studio/server/render-router.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Match the gpt-image-with-fallback block and replace with no-fallback version
import re

# Find the if (primary === 'gpt-image') { ... } block
# We replace from "if (primary === 'gpt-image')" to its corresponding closing
# This is fragile but predictable given the file we saw

old_block = """  if (primary === 'gpt-image') {
    try {
      return await renderGptImage(input);
    } catch (err) {
      console.warn('[render-router] gpt-image failed, falling back to flux', {
        variantId: input.variant.id,
        error: err instanceof Error ? err.message : String(err),
      });

      try {
        const fluxResult = await renderFlux(input);
        return {
          ...fluxResult,
          retried: true,"""

# We just want to comment out / change behavior — but a full replacement is safer
# Strategy: find this block and replace with NO-FALLBACK version

# Read full content as string. Find the START
start_marker = "if (primary === 'gpt-image') {"
start_idx = content.find(start_marker)

if start_idx == -1:
    print("  ⚠️  Pattern not found — already patched?")
else:
    # Find the matching end of this if-block. We assume it ends with a } that
    # closes the function-level brace OR the next "return" at function level.
    # Safer: replace just the try/catch with renderFlux fallback.
    
    # Find the inner try { return await renderGptImage(input); } catch... renderFlux
    inner_old = """if (primary === 'gpt-image') {
    try {
      return await renderGptImage(input);
    } catch (err) {
      console.warn('[render-router] gpt-image failed, falling back to flux', {
        variantId: input.variant.id,
        error: err instanceof Error ? err.message : String(err),
      });"""
    
    if inner_old in content:
        inner_new = """if (primary === 'gpt-image') {
    try {
      return await renderGptImage(input);
    } catch (err) {
      // NO FALLBACK to Flux — premium-only mode.
      // If gpt-image fails, surface the error so render-batch shows it
      // and user can retry. Better than serving inconsistent low-quality output.
      console.error('[render-router] gpt-image failed (no fallback)', {
        variantId: input.variant.id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // Disabled fallback block below (kept for legacy reference):
  if (false) {"""
        
        content = content.replace(inner_old, inner_new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  ✅ gpt-image now throws on failure — no Flux fallback")
    else:
        print("  ⚠️  Inner pattern not found — file may have been edited")
PYEOF

echo ""
echo "✅ Done. Run pnpm build to verify."
