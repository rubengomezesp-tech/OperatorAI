#!/bin/bash
# V3.0.0 — Sprint 3.13: UX Critical Fixes (zoom iOS + landing + chat type)

set -e
cd "$(dirname "$0")"

echo "A) FIX ZOOM iOS — viewport"
python3 << 'PYEOF'
import re
path = 'src/app/layout.tsx'
with open(path, 'r') as f:
    content = f.read()

old_pattern = re.compile(r'export const viewport: Viewport = \{[^}]*?\};', re.DOTALL)
new_viewport = """export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0c',
};"""

m = old_pattern.search(content)
if m:
    content = content.replace(m.group(0), new_viewport)
    with open(path, 'w') as f:
        f.write(content)
    print("  OK viewport actualizado")
PYEOF

echo ""
echo "A.2) FIX ZOOM CSS"
python3 << 'PYEOF'
path = 'src/styles/globals.css'
with open(path, 'r') as f:
    content = f.read()

anti_zoom = """

/* iOS anti-zoom */
input, textarea, select {
  font-size: 16px !important;
  -webkit-text-size-adjust: 100%;
  -webkit-appearance: none;
}
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; }
html, body { overscroll-behavior-y: none; }
"""

if 'iOS anti-zoom' not in content:
    content += anti_zoom
    with open(path, 'w') as f:
        f.write(content)
    print("  OK CSS anti-zoom")
PYEOF

echo ""
echo "B) ELIMINAR REDIRECT del middleware"
python3 << 'PYEOF'
import re
path = 'src/middleware.ts'
with open(path, 'r') as f:
    content = f.read()

pattern = re.compile(r"\n  // V3: Redirect bare /[^}]+?\n  \}\n", re.DOTALL)
new_content, count = pattern.subn('\n', content)
if count > 0:
    with open(path, 'w') as f:
        f.write(new_content)
    print("  OK redirect eliminado")
else:
    print("  - no redirect")
PYEOF

echo ""
echo "C) CHAT TYPOGRAPHY"
python3 << 'PYEOF'
path = 'src/features/chat/components/message-bubble.tsx'
with open(path, 'r') as f:
    content = f.read()

old = 'className="prose prose-sm prose-invert max-w-none text-[14px] leading-relaxed"'
new = 'className="prose prose-sm prose-invert max-w-none text-[15.5px] leading-[1.7]"'
if old in content:
    content = content.replace(old, new)
    print("  OK bubble 14 -> 15.5")

content = content.replace('rounded-xl px-4 py-3', 'rounded-xl px-4 py-3.5')
print("  OK padding +")

with open(path, 'w') as f:
    f.write(content)
PYEOF

echo ""
echo "C.2) COMPOSER 16px"
python3 << 'PYEOF'
import re
path = 'src/features/chat/components/composer.tsx'
with open(path, 'r') as f:
    content = f.read()

textarea_match = re.search(r'(<textarea[^>]*className=")([^"]*)"', content, re.DOTALL)
if textarea_match:
    classes = textarea_match.group(2)
    new_classes = re.sub(r'text-\[\d+(\.\d+)?px\]', 'text-[16px]', classes)
    if 'text-[16px]' not in new_classes:
        new_classes = new_classes + ' text-[16px]'
    new_str = textarea_match.group(1) + new_classes + '"'
    content = content.replace(textarea_match.group(0), new_str, 1)
    with open(path, 'w') as f:
        f.write(content)
    print("  OK composer 16px")
PYEOF

echo ""
echo "D) LANDING - Open app si logueado"
python3 << 'PYEOF'
import re
path = 'src/app/page.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add useState/useEffect import if missing
if 'useState' not in content[:200]:
    content = content.replace(
        "import Link from 'next/link';",
        "import Link from 'next/link';\nimport { useState, useEffect } from 'react';",
        1
    )

# Add isAuthenticated hook in component
if 'setIsAuthenticated' not in content:
    old_setup = "export default function LandingPage() {\n  const { locale } = useI18n();"
    new_setup = """export default function LandingPage() {
  const { locale } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hasSession = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
    setIsAuthenticated(hasSession);
  }, []);"""
    if old_setup in content:
        content = content.replace(old_setup, new_setup)
        print("  OK hook isAuthenticated")

# Replace nav signup button with conditional
nav_pattern = re.compile(
    r'(<Link\s+href="/signup"\s+className="text-\[13\.5px\]\s+gold-grad[^>]*>)\s*\{t\(\'nav_signup\'\)\}\s*(</Link>)',
    re.DOTALL
)
m = nav_pattern.search(content)
if m:
    new_link = """<Link
            href={isAuthenticated ? "/chat" : "/signup"}
            className="text-[13.5px] gold-grad text-bg px-3.5 py-1.5 rounded-md font-medium hover:brightness-110 transition-all shadow-[0_4px_20px_-4px_rgb(201_168_99_/_0.4)]"
          >
            {isAuthenticated ? (locale === 'es' ? 'Abrir app' : 'Open app') : t('nav_signup')}
          </Link>"""
    content = content.replace(m.group(0), new_link)
    print("  OK CTA dinamico nav")

with open(path, 'w') as f:
    f.write(content)
PYEOF

echo ""
echo "DONE Sprint 3.13. Run pnpm build"
