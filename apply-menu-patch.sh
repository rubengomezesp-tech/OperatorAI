#!/bin/bash
# ════════════════════════════════════════════════════════════════
# PATCH: Conectar Campaign Brain V2 al menú
# ════════════════════════════════════════════════════════════════
#
# Cambios:
# 1. mobile-menu.tsx — Añadir entry "Create Campaign" con badge BETA
#    (mantiene la legacy de Creative Studio)
# 2. sidebar.tsx — Añadir entry "Create Campaign" como primary destacado
# 3. i18n.tsx — Añadir keys: nav.create_campaign, nav.legacy_studio,
#    nav.create_campaign_desc
#
# Ejecuta este script desde la raíz del repo:
#   cd ~/Development/OperatorAI
#   bash apply-menu-patch.sh
# ════════════════════════════════════════════════════════════════

set -e

cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching mobile-menu.tsx"
echo "═══════════════════════════════════════════════"

# En mobile-menu.tsx: REEMPLAZAR la línea de creative-studio
# Antes: { href: '/creative-studio', labelKey: 'nav.create_campaigns', icon: Zap, badge: 'NEW' },
# Después: dos líneas — la nueva premium + la legacy

python3 << 'PYEOF'
import re
path = 'src/components/layout/mobile-menu.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the legacy creative-studio line and replace with two lines
old = "{ href: '/creative-studio', labelKey: 'nav.create_campaigns', icon: Zap, badge: 'NEW' },"
new = """{ href: '/campaigns/new', labelKey: 'nav.create_campaign', icon: Zap, badge: 'BETA' },
    { href: '/creative-studio', labelKey: 'nav.legacy_studio', icon: Sparkles },"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched mobile-menu.tsx")
else:
    print("  ⚠️  Pattern not found — already patched?")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching sidebar.tsx"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
import re
path = 'src/components/layout/sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the creative-studio item in the 'create' group and replace it
old = """        {
          href: '/creative-studio',
          labelKey: 'nav.create_campaigns',
          fallback: 'Creative Studio',
          icon: Sparkles,
          primary: true,
        },"""

new = """        {
          href: '/campaigns/new',
          labelKey: 'nav.create_campaign',
          fallback: 'Create Campaign',
          icon: Sparkles,
          primary: true,
          badge: 'Beta',
        },
        {
          href: '/creative-studio',
          labelKey: 'nav.legacy_studio',
          fallback: 'Creative Studio',
          icon: ImageIcon,
        },"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched sidebar.tsx")
else:
    print("  ⚠️  Pattern not found — already patched?")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching i18n.tsx — adding nav keys"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/lib/i18n.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Anchor: insert NEW keys right after 'nav.creative_agent'
anchor = "  'nav.creative_agent': { en: 'Creative Agent', es: 'Agente Creativo' },"

new_keys = """  'nav.creative_agent': { en: 'Creative Agent', es: 'Agente Creativo' },
  'nav.create_campaign': { en: 'Create Campaign', es: 'Crear Campaña' },
  'nav.legacy_studio': { en: 'Creative Studio (legacy)', es: 'Creative Studio (legacy)' },
  'nav.create_campaigns': { en: 'Create Campaigns', es: 'Crear Campañas' },
  'nav.create': { en: 'Create', es: 'Crear' },
  'nav.library': { en: 'Library', es: 'Biblioteca' },
  'nav.brand_os': { en: 'Brand OS', es: 'Brand OS' },
  'nav.admin': { en: 'Admin', es: 'Admin' },"""

if "'nav.create_campaign':" not in content and anchor in content:
    content = content.replace(anchor, new_keys)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched i18n.tsx — added nav.create_campaign + 6 more keys")
else:
    if "'nav.create_campaign':" in content:
        print("  ⚠️  Already has nav.create_campaign — skipping")
    else:
        print("  ⚠️  Anchor not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ All patches applied. Run pnpm build to verify."
echo "═══════════════════════════════════════════════"
