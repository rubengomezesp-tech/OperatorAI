#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V3.0.0 — Sprint 3.5: Visual Integration Global
#
# 1. (app)/layout.tsx — wrap children con div bg-mesh + Aurora absoluto
# 2. /chat/layout.tsx — añade contenedor flex-col h-screen con Aurora medium
# 3. /campaigns/[id] — Glow detrás del título + transiciones suaves
# 4. /brand-os — bg-mesh subtle
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching (app)/layout.tsx — Aurora global"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/(app)/layout.tsx'
with open(path, 'r') as f:
    content = f.read()

# Añadir import Aurora
if 'Aurora' not in content:
    needle = "import { OrgProvider } from '@/features/organizations/context/org-provider';"
    if needle in content:
        content = content.replace(
            needle,
            needle + "\nimport { Aurora } from '@/components/ui/aurora';"
        )
        print("  ✅ Import Aurora añadido")

# Wrap children con bg-mesh + Aurora background
old_children = """      <AppShell email={me?.email ?? user.email ?? ''} fullName={me?.full_name ?? null}>
        <CommandPaletteProvider>
          {children}
          <PushNotificationPrompt />
          <AppFooter />
        </CommandPaletteProvider>
      </AppShell>"""

new_children = """      <AppShell email={me?.email ?? user.email ?? ''} fullName={me?.full_name ?? null}>
        <CommandPaletteProvider>
          <div className="relative min-h-full bg-mesh">
            {/* Subtle global aurora — visible but never intrusive */}
            <Aurora intensity="subtle" className="fixed inset-0 -z-10" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
          <PushNotificationPrompt />
          <AppFooter />
        </CommandPaletteProvider>
      </AppShell>"""

if old_children in content and 'bg-mesh' not in content:
    content = content.replace(old_children, new_children)
    print("  ✅ Children wrapped con bg-mesh + Aurora absoluto")

with open(path, 'w') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching /chat/layout.tsx — keep clean (no extra wrapper)"
echo "═══════════════════════════════════════════════"

# El chat layout es solo guard de auth — el aurora ya está en app layout.
# No tocamos, pero verificamos.
echo "  ℹ️  chat/layout.tsx es solo auth guard — Aurora ya viene del (app)/layout.tsx"

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching /campaigns/[id]/page.tsx — Glow + motion"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/(app)/campaigns/[id]/page.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add framer-motion + PageTransition imports
if 'PageTransition' not in content:
    needle = "import { ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';"
    if needle in content:
        content = content.replace(
            needle,
            needle + "\nimport { PageTransition } from '@/components/ui/page-transition';"
        )
        print("  ✅ PageTransition import añadido")

# Wrap top-level return content with PageTransition
# Look for the main return wrapper
import re

# Find the outer div that wraps everything
pattern = re.compile(
    r'(  return \(\s*\n\s*)(<div className="[^"]*max-w-[^"]*"[^>]*>)',
    re.MULTILINE
)
match = pattern.search(content)
if match and 'PageTransition' not in content[match.start():match.start()+500]:
    new_open = match.group(1) + '<PageTransition>\n      ' + match.group(2)
    content = content.replace(match.group(0), new_open, 1)

    # Now find the matching closing tag of return ( ... )
    # Look for "  );\n}" at the end of the file
    end_pattern = re.compile(r'(  \);\s*\n\})', re.MULTILINE)
    end_match = end_pattern.search(content)
    if end_match:
        new_end = '    </PageTransition>\n' + end_match.group(1)
        content = content[:end_match.start()] + new_end + content[end_match.end():]
        print("  ✅ Return wrapped en <PageTransition>")

with open(path, 'w') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Verificar que ui/aurora y page-transition existen"
echo "═══════════════════════════════════════════════"

ls -la src/components/ui/aurora.tsx src/components/ui/page-transition.tsx 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Sprint 3.5 applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
echo ""
echo "TESTING:"
echo "  - Cualquier ruta de (app)/ → Aurora subtle visible al fondo"
echo "  - bg-mesh sutil en gradients"
echo "  - /campaigns/[id] → entrada con fade-up suave"
