#!/bin/bash
# ════════════════════════════════════════════════════════════════
# PATCH: Add AI Mockup module to navigation
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching mobile-menu.tsx"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/components/layout/mobile-menu.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Shirt to imports if not present
if "Shirt" not in content:
    content = content.replace(
        "Target, Rocket, Palette, LogOut, HelpCircle, Zap",
        "Target, Rocket, Palette, LogOut, HelpCircle, Zap, Shirt"
    )

# Add AI Mockup entry inside the studio group, after voice mode
old = """    { href: '/voice', labelKey: 'nav.voice_mode', icon: Mic },
  ]},"""

new = """    { href: '/voice', labelKey: 'nav.voice_mode', icon: Mic },
    { href: '/ai-mockup', labelKey: 'nav.mockup_studio', icon: Shirt, badge: 'NEW' },
  ]},"""

if old in content and "/ai-mockup" not in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched mobile-menu.tsx")
else:
    if "/ai-mockup" in content:
        print("  ⚠️  Already has /ai-mockup — skipping")
    else:
        print("  ⚠️  Anchor pattern not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching sidebar.tsx"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/components/layout/sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Shirt to imports if not present
if "Shirt" not in content:
    content = content.replace(
        "  ChevronLeft,\n  type LucideIcon,",
        "  ChevronLeft,\n  Shirt,\n  type LucideIcon,"
    )

# Add AI Mockup entry inside the 'create' group, after voice
old = """        {
          href: '/voice',
          labelKey: 'nav.voice_mode',
          fallback: 'Voice',
          icon: Mic,
          badge: 'Beta',
        },
      ],
    },
    {
      id: 'library',"""

new = """        {
          href: '/voice',
          labelKey: 'nav.voice_mode',
          fallback: 'Voice',
          icon: Mic,
          badge: 'Beta',
        },
        {
          href: '/ai-mockup',
          labelKey: 'nav.mockup_studio',
          fallback: 'Mockup Studio',
          icon: Shirt,
          badge: 'New',
        },
      ],
    },
    {
      id: 'library',"""

if old in content and "/ai-mockup" not in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched sidebar.tsx")
else:
    if "/ai-mockup" in content:
        print("  ⚠️  Already has /ai-mockup — skipping")
    else:
        print("  ⚠️  Anchor pattern not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching i18n.tsx"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/lib/i18n.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert mockup_studio key after voice_mode
anchor = "  'nav.voice_mode': { en: 'Voice Mode', es: 'Modo Voz' },"
new_block = """  'nav.voice_mode': { en: 'Voice Mode', es: 'Modo Voz' },
  'nav.mockup_studio': { en: 'Mockup Studio', es: 'Estudio de Mockups' },"""

if "'nav.mockup_studio':" not in content and anchor in content:
    content = content.replace(anchor, new_block)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Added nav.mockup_studio to i18n")
else:
    if "'nav.mockup_studio':" in content:
        print("  ⚠️  Already has nav.mockup_studio")
    else:
        print("  ⚠️  Anchor not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patching topbar.tsx — add /ai-mockup title"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/components/layout/topbar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = "  '/assistants': 'Assistants',"
new = """  '/assistants': 'Assistants',
  '/ai-mockup': 'Mockup Studio',
  '/campaigns/new': 'Create Campaign',"""

if old in content and "/ai-mockup" not in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Patched topbar.tsx")
else:
    if "/ai-mockup" in content:
        print("  ⚠️  Already has /ai-mockup")
    else:
        print("  ⚠️  Anchor not found")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ All patches applied. Run pnpm build to verify."
echo "═══════════════════════════════════════════════"
