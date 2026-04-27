#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V2 Sprint 2B-MVP — Editor Pro setup
#
# 1. Instalar deps adicionales (nanoid, use-image)
# 2. Crear estructura editor-pro
# 3. Patch variant-editor.tsx para usar EditorPro
# 4. Patch stage-variants.tsx para pasar vertical + brand
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Instalando dependencias adicionales"
echo "═══════════════════════════════════════════════"
pnpm add nanoid use-image 2>&1 | tail -5

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Creando estructura editor-pro"
echo "═══════════════════════════════════════════════"

mkdir -p src/features/editor-pro/lib
mkdir -p src/features/editor-pro/components

# Mover archivos
if [ -f "editor-types.ts" ]; then
  mv editor-types.ts src/features/editor-pro/types.ts
  echo "  ✅ types.ts"
fi
if [ -f "editor-auto-layout.ts" ]; then
  mv editor-auto-layout.ts src/features/editor-pro/lib/auto-layout.ts
  echo "  ✅ lib/auto-layout.ts"
fi
if [ -f "editor-canvas.tsx" ]; then
  mv editor-canvas.tsx src/features/editor-pro/components/editor-canvas.tsx
  echo "  ✅ components/editor-canvas.tsx"
fi
if [ -f "editor-pro.tsx" ]; then
  mv editor-pro.tsx src/features/editor-pro/components/editor-pro.tsx
  echo "  ✅ components/editor-pro.tsx"
fi

# Index re-export
cat > src/features/editor-pro/index.ts << 'EOF'
export { EditorPro } from './components/editor-pro';
export type { EditorProject, Layer, AspectRatio } from './types';
EOF
echo "  ✅ index.ts"

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching variant-editor.tsx — wrap EditorPro"
echo "═══════════════════════════════════════════════"

cat > src/features/campaign-brain/components/variant-editor.tsx << 'EOF'
'use client';

/**
 * VariantEditor — thin wrapper around EditorPro
 *
 * The old AI-only modal has been replaced with a full canvas editor.
 * This wrapper keeps the existing call sites working while delegating
 * to the new EditorPro component.
 */

import { EditorPro } from '@/features/editor-pro/components/editor-pro';
import type { VerticalSlug } from '@/features/campaign-brain/types';
import type { AspectRatio } from '@/features/editor-pro/types';

interface VariantEditorProps {
  draftId: string;
  variantId: string;
  initialImageUrl: string;
  briefHeadline?: string;
  briefAngle?: string;
  briefPlatform?: string;
  /** From brain output */
  briefCta?: string;
  vertical?: VerticalSlug;
  /** Brand kit */
  logoUrl?: string;
  brandPrimary?: string;
  /** Aspect ratio */
  initialAspectRatio?: AspectRatio;
  onClose: () => void;
  onSave: (newUrl: string) => void;
}

export function VariantEditor({
  draftId,
  variantId,
  initialImageUrl,
  briefHeadline,
  briefCta,
  vertical,
  logoUrl,
  brandPrimary,
  initialAspectRatio,
  onClose,
  onSave,
}: VariantEditorProps) {
  return (
    <EditorPro
      draftId={draftId}
      variantId={variantId}
      initialImageUrl={initialImageUrl}
      vertical={vertical ?? 'other'}
      briefHeadline={briefHeadline}
      briefCta={briefCta}
      logoUrl={logoUrl}
      brandPrimary={brandPrimary}
      initialAspectRatio={initialAspectRatio ?? '4:5'}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
EOF
echo "  ✅ variant-editor.tsx ahora usa EditorPro"

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patch stage-variants.tsx — pasa vertical + cta al editor"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/components/stage-variants.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add briefCta prop to VariantEditor invocation if not present
# Find the VariantEditor JSX and ensure it has the new props
import re

# Pattern: find <VariantEditor ... /> and ensure new props
# Simple approach: find the VariantEditor open and check for vertical=
if '<VariantEditor' in content:
    if 'vertical=' not in content[content.index('<VariantEditor'):]:
        # Inject before /> or />
        pattern = r'(<VariantEditor[\s\S]*?)(\s*onSave=)'
        replacement = (
            r"\1"
            r"\n              vertical={brainOutput.detectedVertical}"
            r"\n              briefCta={brainOutput.ctas?.[0]}"
            r"\n              initialAspectRatio={(brainOutput.variantBriefs.find(b => b.id === editingVariantId)?.aspectRatio ?? '4:5') as any}"
            r"\2"
        )
        new_content = re.sub(pattern, replacement, content, count=1)
        if new_content != content:
            content = new_content
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("  ✅ stage-variants pasa vertical + cta + aspectRatio al editor")
        else:
            print("  ⚠️  Pattern not matched — review manually")
    else:
        print("  ⚠️  Already has vertical prop")
else:
    print("  ⚠️  VariantEditor not found in stage-variants")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Sprint 2B-MVP applied. Ahora correr pnpm build."
echo "═══════════════════════════════════════════════"
echo ""
echo "Estructura creada:"
echo "  src/features/editor-pro/"
echo "    ├── index.ts"
echo "    ├── types.ts"
echo "    ├── lib/auto-layout.ts"
echo "    └── components/"
echo "        ├── editor-canvas.tsx"
echo "        └── editor-pro.tsx"
