#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V3.0.0 — CLEANUP de rutas y módulos antiguos
#
# Eliminamos:
#   - /(app)/dashboard       (HOME ahora es /chat)
#   - /(app)/creative-studio (reemplazado por chat agent)
#   - /(app)/missions        (no aplica al modelo nuevo)
#   - /(app)/projects        (no aplica)
#   - /(app)/files           (mover a settings o eliminar)
#   - /(app)/knowledge       (eliminar)
#   - /(app)/voice           (eliminar)
#   - /(app)/assistants      (eliminar)
#   - /(app)/ai-mockup       (eliminar - era prototype)
#   - /(app)/studio          (legacy, reemplazado por editor PRO)
#
# Y referencias a estos módulos en sidebar.
#
# IMPORTANTE: hace BACKUP en .legacy-backup/ por si algo necesita
# rescatarse después.
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

LEGACY_BACKUP=".legacy-backup-v3"
mkdir -p "$LEGACY_BACKUP"

echo "═══════════════════════════════════════════════"
echo "1. Backup de rutas antes de eliminar"
echo "═══════════════════════════════════════════════"

ROUTES_TO_REMOVE=(
  "src/app/(app)/dashboard"
  "src/app/(app)/creative-studio"
  "src/app/(app)/missions"
  "src/app/(app)/projects"
  "src/app/(app)/files"
  "src/app/(app)/knowledge"
  "src/app/(app)/voice"
  "src/app/(app)/assistants"
  "src/app/(app)/ai-mockup"
  "src/app/(app)/studio"
)

for route in "${ROUTES_TO_REMOVE[@]}"; do
  if [ -d "$route" ]; then
    base=$(basename "$route")
    echo "  📦 Backing up $route → $LEGACY_BACKUP/$base"
    cp -r "$route" "$LEGACY_BACKUP/$base"
    rm -rf "$route"
    echo "  🗑️  Removed $route"
  else
    echo "  ℹ️  $route not present"
  fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching sidebar — eliminar items obsoletos"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
import re

path = 'src/components/layout/sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove obsolete NavItems (entire object blocks)
OBSOLETE_LABELS = [
    'nav.video_studio',
    'nav.voice_mode',
    'nav.mockup_studio',
    'nav.projects',
    'nav.knowledge',
    'nav.files',
    'nav.image_studio',
    'nav.assistants',
    'nav.missions',
    'nav.overview',  # dashboard
]

removed = []
for label in OBSOLETE_LABELS:
    # Pattern matches a full NavItem object that contains this labelKey.
    # NavItems look like:
    #   {
    #     href: '/...',
    #     labelKey: 'nav.xxx',
    #     fallback: '...',
    #     icon: ...,
    #     [optional more lines]
    #   },
    pattern = re.compile(
        r'(\s*)\{\s*\n[^{}]*?labelKey:\s*[\'"]' + re.escape(label) + r'[\'"][^{}]*?\n\s*\},?',
        re.DOTALL
    )
    new_content, count = pattern.subn('', content, count=1)
    if count > 0:
        content = new_content
        removed.append(label)

# Clean up empty groups (groups with no items after removal)
# Pattern: items: [\s*\n\s*],
empty_items_pattern = re.compile(
    r'items:\s*\[\s*\],',
    re.DOTALL
)
content = empty_items_pattern.sub('items: [],', content)

# Clean up double blank lines
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"  ✅ Removed {len(removed)} obsolete nav items:")
for r in removed:
    print(f"     - {r}")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Buscar imports rotos y referencias huérfanas"
echo "═══════════════════════════════════════════════"

# Buscar imports rotos a las rutas eliminadas
BROKEN_IMPORTS=$(grep -rn "from '@/app/(app)/(dashboard\|creative-studio\|missions\|projects\|files\|knowledge\|voice\|assistants\|ai-mockup\|studio)'" src/ 2>/dev/null | grep -v ".legacy-backup" || true)

if [ -n "$BROKEN_IMPORTS" ]; then
  echo "  ⚠️  IMPORTS ROTOS encontrados:"
  echo "$BROKEN_IMPORTS"
  echo ""
  echo "     Estos archivos importan rutas eliminadas — revisar."
else
  echo "  ✅ No imports rotos a rutas eliminadas"
fi

# Buscar links Link href obsoletos
echo ""
BROKEN_LINKS=$(grep -rn "href=\"/dashboard\|href=\"/creative-studio\|href=\"/missions\|href=\"/projects\|href=\"/files\|href=\"/knowledge\|href=\"/voice\|href=\"/assistants\|href=\"/ai-mockup\|href=\"/studio\"" src/ 2>/dev/null | grep -v ".legacy-backup" || true)

if [ -n "$BROKEN_LINKS" ]; then
  echo "  ⚠️  LINKS HARDCODED a rutas eliminadas:"
  echo "$BROKEN_LINKS"
else
  echo "  ✅ No hay links hardcoded obsoletos"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Sumario"
echo "═══════════════════════════════════════════════"

REMAINING_APP_ROUTES=$(ls 'src/app/(app)/' 2>/dev/null)
echo "  Rutas (app)/ que quedan:"
for r in $REMAINING_APP_ROUTES; do
  echo "    - $r"
done

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Cleanup completed"
echo "═══════════════════════════════════════════════"
echo ""
echo "Backup en: $LEGACY_BACKUP/"
echo "  (añadido al .gitignore para no subirlo)"
echo ""
echo "Para ELIMINAR el backup definitivamente cuando estés seguro:"
echo "  rm -rf $LEGACY_BACKUP"

# Add to .gitignore
if [ -f ".gitignore" ] && ! grep -q "$LEGACY_BACKUP" ".gitignore"; then
  echo "" >> .gitignore
  echo "# V3 cleanup backup" >> .gitignore
  echo "$LEGACY_BACKUP/" >> .gitignore
  echo "  ✅ $LEGACY_BACKUP añadido a .gitignore"
fi
