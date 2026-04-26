#!/bin/bash
# ════════════════════════════════════════════════════════════════
# MENSAJE 3 — Final patch
#
# 1. Remove /creative-studio from mobile-menu.tsx
# 2. Remove /creative-studio from sidebar.tsx
# 3. Update topbar.tsx with i18n titles
# 4. Add missing campaign topbar title
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching mobile-menu.tsx — remove legacy creative-studio"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/components/layout/mobile-menu.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the legacy entry
old = """    { href: '/campaigns/new', labelKey: 'nav.create_campaign', icon: Zap, badge: 'BETA' },
    { href: '/creative-studio', labelKey: 'nav.legacy_studio', icon: Sparkles },"""
new = """    { href: '/campaigns/new', labelKey: 'nav.create_campaign', icon: Zap, badge: 'BETA' },"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Removed creative-studio from mobile-menu")
else:
    print("  ⚠️  Pattern not found — checking alternate")
    # Try alternate (maybe just the legacy line alone)
    old2 = "    { href: '/creative-studio', labelKey: 'nav.legacy_studio', icon: Sparkles },\n"
    if old2 in content:
        content = content.replace(old2, "")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  ✅ Removed (alternate pattern)")
    else:
        print("  ⚠️  Already clean")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching sidebar.tsx — remove legacy creative-studio"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/components/layout/sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the legacy creative-studio entry
old = """        {
          href: '/creative-studio',
          labelKey: 'nav.legacy_studio',
          fallback: 'Creative Studio',
          icon: ImageIcon,
        },"""

if old in content:
    content = content.replace(old, "")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Removed creative-studio from sidebar")
else:
    print("  ⚠️  Pattern not found — already clean")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching topbar.tsx — i18n titles"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/components/layout/topbar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update the title block to use i18n
# We replace the static map with i18n lookup
old_block = """const TITLES: Record<string, string> = {
  '/dashboard': 'Studio',
  '/chat': 'Creative Agent',
  '/creative-studio': 'Creative Studio',
  '/studio/image': 'Image Studio',
  '/studio/video': 'Video Studio',
  '/voice': 'Voice Mode',
  '/files': 'Files & Analysis',
  '/projects': 'Projects',
  '/knowledge': 'Knowledge',
  '/memory': 'Memory',
  '/assistants': 'Assistants',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/integrations': 'Integrations',
  '/settings/memory': 'Memory',
  '/settings/billing': 'Billing',
  '/assistants': 'Assistants',
  '/ai-mockup': 'Mockup Studio',
  '/campaigns/new': 'Create Campaign',
};"""

new_block = """// Path -> i18n key map. Resolved at render with t().
const TITLES: Record<string, string> = {
  '/dashboard': 'topbar.title.dashboard',
  '/chat': 'topbar.title.chat',
  '/campaigns/new': 'topbar.title.create_campaign',
  '/studio/image': 'topbar.title.image_studio',
  '/studio/video': 'topbar.title.video_studio',
  '/voice': 'topbar.title.voice_mode',
  '/files': 'topbar.title.files',
  '/projects': 'topbar.title.projects',
  '/knowledge': 'topbar.title.knowledge',
  '/memory': 'topbar.title.memory',
  '/assistants': 'topbar.title.assistants',
  '/settings': 'topbar.title.settings',
  '/settings/profile': 'topbar.title.profile',
  '/settings/integrations': 'topbar.title.integrations',
  '/settings/memory': 'topbar.title.memory',
  '/settings/billing': 'topbar.title.billing',
  '/ai-mockup': 'topbar.title.mockup_studio',
  '/brand-os': 'topbar.title.brand_os',
};"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("  ✅ Replaced TITLES map with i18n keys")
elif "'/dashboard': 'Studio'" in content:
    # Different structure — try minimal replacement
    print("  ⚠️  Map shape differs slightly — manual review may be needed")

# Make Topbar use t() — replace the title resolution
old_resolve = """  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
  const title = key ? TITLES[key] : '';"""

new_resolve = """  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
  const titleKey = key ? TITLES[key] : '';
  // Fall back to the literal key if i18n doesn't have a translation
  const resolved = titleKey ? t(titleKey) : '';
  const title = resolved && resolved !== titleKey ? resolved : '';"""

if old_resolve in content:
    content = content.replace(old_resolve, new_resolve)
    print("  ✅ Updated title resolution to use t()")

# Add useI18n import if not present
if "useI18n" not in content:
    # Add after first 'use client'
    content = content.replace(
        "'use client';\n\nimport { useState }",
        "'use client';\n\nimport { useState }\nimport { useI18n } from '@/lib/i18n';\n// removed: ",
        1,
    )
    # Cleaner: actually insert properly
if "import { useI18n } from '@/lib/i18n';" not in content:
    content = content.replace(
        "import { LanguageToggle } from '@/lib/i18n';",
        "import { LanguageToggle, useI18n } from '@/lib/i18n';",
    )
    print("  ✅ Added useI18n import")

# Add `const { t } = useI18n();` inside Topbar component
if "const { t } = useI18n();" not in content:
    content = content.replace(
        "  const pathname = usePathname();\n  const [menuOpen, setMenuOpen] = useState(false);",
        "  const pathname = usePathname();\n  const { t } = useI18n();\n  const [menuOpen, setMenuOpen] = useState(false);",
    )
    print("  ✅ Added const { t } inside Topbar")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patching i18n.tsx — add topbar title keys"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/lib/i18n.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert topbar keys after Campaign Brain section
anchor = "  'cb.variants.save_campaign': { en: 'Save campaign', es: 'Guardar campana' },"

new_keys = """  'cb.variants.save_campaign': { en: 'Save campaign', es: 'Guardar campana' },

  // Topbar titles
  'topbar.title.dashboard': { en: 'Dashboard', es: 'Panel' },
  'topbar.title.chat': { en: 'Creative Agent', es: 'Agente Creativo' },
  'topbar.title.create_campaign': { en: 'Create Campaign', es: 'Crear Campana' },
  'topbar.title.image_studio': { en: 'Image Studio', es: 'Estudio de Imagen' },
  'topbar.title.video_studio': { en: 'Video Studio', es: 'Estudio de Video' },
  'topbar.title.voice_mode': { en: 'Voice Mode', es: 'Modo Voz' },
  'topbar.title.files': { en: 'Files & Analysis', es: 'Archivos y Analisis' },
  'topbar.title.projects': { en: 'Projects', es: 'Proyectos' },
  'topbar.title.knowledge': { en: 'Knowledge', es: 'Conocimiento' },
  'topbar.title.memory': { en: 'Memory', es: 'Memoria' },
  'topbar.title.assistants': { en: 'Assistants', es: 'Asistentes' },
  'topbar.title.settings': { en: 'Settings', es: 'Ajustes' },
  'topbar.title.profile': { en: 'Profile', es: 'Perfil' },
  'topbar.title.integrations': { en: 'Integrations', es: 'Integraciones' },
  'topbar.title.billing': { en: 'Billing', es: 'Facturacion' },
  'topbar.title.mockup_studio': { en: 'Mockup Studio', es: 'Estudio de Mockups' },
  'topbar.title.brand_os': { en: 'Brand OS', es: 'Brand OS' },"""

if "'topbar.title.dashboard':" not in content and anchor in content:
    content = content.replace(anchor, new_keys)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Added topbar i18n keys")
else:
    if "'topbar.title.dashboard':" in content:
        print("  ⚠️  Already has topbar keys")
    else:
        print("  ⚠️  Anchor not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ All patches applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
