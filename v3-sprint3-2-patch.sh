#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V3.0.0 — Sprint 3.2
#
# 1. Patch ensure-assistant.ts → inyecta CREATIVE_AGENT_SYSTEM_PROMPT
#    en el assistant default cuando se crea
# 2. Patch /api/chat/route.ts → si el assistant existente no tiene
#    system_prompt actualizado, lo refresca con la nueva versión
# 3. Patch message-list.tsx → eliminar empty state viejo (lo nuestro
#    en chat-view ya cubre)
# 4. Patch sidebar.tsx → simplificar a Chat principal + 4 grupos
#    colapsados (Tools dropdown)
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching ensure-assistant.ts — inject system_prompt"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
import re

path = 'src/features/chat/server/ensure-assistant.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import for CREATIVE_AGENT_SYSTEM_PROMPT
if "CREATIVE_AGENT_SYSTEM_PROMPT" not in content:
    needle = "import { slugify } from '@/lib/utils';"
    if needle in content:
        content = content.replace(
            needle,
            needle + "\nimport { CREATIVE_AGENT_SYSTEM_PROMPT } from '@/lib/agents/creative-agent-prompt';"
        )
        print("  ✅ Import añadido")

# Inject system_prompt into the insert object
old_insert = """  const insert = {
    org_id: orgId,
    name: 'Creative Agent',
    slug: slugify(orgName || 'default') + '-agent',
    business_name: orgName || 'Business',
    languages: ['en', 'es'],
    is_default: true,
    is_active: true,
  } as never;"""

new_insert = """  const insert = {
    org_id: orgId,
    name: 'Creative Agent',
    slug: slugify(orgName || 'default') + '-agent',
    business_name: orgName || 'Business',
    languages: ['en', 'es'],
    is_default: true,
    is_active: true,
    system_prompt: CREATIVE_AGENT_SYSTEM_PROMPT,
  } as never;"""

if old_insert in content:
    content = content.replace(old_insert, new_insert)
    print("  ✅ system_prompt inyectado en insert")
elif "CREATIVE_AGENT_SYSTEM_PROMPT" in content:
    print("  ℹ️  Ya tenía import — verifica manualmente que insert use system_prompt")

# When existing assistant — refresh the system_prompt to keep it current
old_select = """  const { data: existing } = await svc
    .from('assistants')
    .select('id')
    .eq('org_id', orgId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (existing) return (existing as { id: string }).id;"""

new_select = """  const { data: existing } = await svc
    .from('assistants')
    .select('id')
    .eq('org_id', orgId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Keep system prompt fresh on every login (low cost, ensures upgrades propagate)
    const existingId = (existing as { id: string }).id;
    await svc
      .from('assistants')
      .update({ system_prompt: CREATIVE_AGENT_SYSTEM_PROMPT })
      .eq('id', existingId);
    return existingId;
  }"""

if old_select in content:
    content = content.replace(old_select, new_select)
    print("  ✅ Existing assistants también se refrescan con el nuevo prompt")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Verificar que tabla assistants tiene columna system_prompt"
echo "═══════════════════════════════════════════════"

# Buscar en migraciones existentes
if grep -rn "system_prompt" supabase/migrations/ 2>/dev/null | head -3; then
  echo "  ✅ Columna system_prompt existe en migraciones"
else
  echo "  ⚠️  Columna system_prompt no encontrada en migraciones."
  echo "     Si existing_assistants tienen la columna, OK."
  echo "     Si no, hay que crear migración (Sprint 3.2.1)."
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Eliminando empty state DUPLICADO en message-list.tsx"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/chat/components/message-list.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the entire if (messages.length === 0) block with null return
# (our chat-view EmptyState handles this now)
import re

pattern = re.compile(
    r"  if \(messages\.length === 0\) \{[\s\S]*?\n  \}",
    re.MULTILINE
)

match = pattern.search(content)
if match:
    content = content.replace(
        match.group(0),
        "  if (messages.length === 0) {\n    // Empty state handled by ChatView's EmptyState component (Sprint 3.1)\n    return null;\n  }"
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  ✅ Empty state duplicado eliminado de message-list.tsx")
else:
    print("  ⚠️  Patrón no encontrado — verificar manualmente")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patching sidebar.tsx — colapsar a Chat + Tools"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
import re

path = 'src/components/layout/sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Strategy: ADD a new top group "Chat" with creative_agent FIRST
# RENAME existing groups to be under "Tools" mental model
# Don't delete anything, just reorganize so chat is primary

# Find the pattern where groups are defined.
# The sidebar uses NavGroup[] structure.
# We add a CHAT priority group at top.

# Simplest patch: find the first NavGroup with creative_agent and elevate it.
# We'll inject a new "primary" group rendering at top.

# Find where groups array starts - look for "const groups: NavGroup[]" or similar
group_array_match = re.search(r'const\s+(navGroups|groups|GROUPS|NAV_GROUPS|navItems)\s*[:=]', content)
if group_array_match:
    print(f"  ℹ️  NavGroups variable: {group_array_match.group(1)}")
else:
    # Try finding the JSX render
    print("  ⚠️  NavGroups variable not found by pattern — searching JSX")

# Strategy 2: just ensure the labelKey 'nav.creative_agent' shows AS PRIMARY (mark with primary: true)
# Find the line with creative_agent and check structure
ca_match = re.search(
    r"({[^{}]*labelKey:\s*'nav\.creative_agent'[^{}]*})",
    content,
    re.DOTALL
)
if ca_match:
    original = ca_match.group(1)
    if "primary: true" not in original:
        # Add primary: true before closing brace
        modified = original.rstrip().rstrip('}').rstrip(',').rstrip()
        modified = modified + ",\n          primary: true,\n        }"
        content = content.replace(original, modified, 1)
        print("  ✅ creative_agent marcado como primary")
    else:
        print("  ℹ️  creative_agent ya tenía primary: true")
else:
    print("  ⚠️  creative_agent NavItem no encontrado por regex")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Print sidebar structure for review
print("")
print("  Estructura grupos actual:")
group_labels = re.findall(r"labelKey:\s*'(nav\.[a-z_]+)'", content)
for g in group_labels:
    print(f"    - {g}")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "5. Asegurando que el HOME redirect a /chat funciona"
echo "═══════════════════════════════════════════════"

# Check that (app)/page.tsx exists and redirects to /chat
if [ -f "src/app/(app)/page.tsx" ]; then
  if grep -q "redirect" "src/app/(app)/page.tsx"; then
    echo "  ✅ (app)/page.tsx redirige correctamente"
  else
    echo "  ⚠️  (app)/page.tsx existe pero no redirige — recreando"
    cat > "src/app/(app)/page.tsx" << 'PEOF'
import { redirect } from 'next/navigation';
export default function AppHomePage() {
  redirect('/chat');
}
PEOF
    echo "  ✅ (app)/page.tsx reescrito"
  fi
else
  echo "  ⚠️  (app)/page.tsx no existe — creando"
  cat > "src/app/(app)/page.tsx" << 'PEOF'
import { redirect } from 'next/navigation';
export default function AppHomePage() {
  redirect('/chat');
}
PEOF
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Sprint 3.2 applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
echo ""
echo "TESTING:"
echo "  1. pnpm build — debe ser verde"
echo "  2. Login → URL /chat (HOME)"
echo "  3. Chat vacío → ves SOLO el EmptyState premium (no doble)"
echo "  4. Mensaje 'Hola' → respuesta CONCISA, directa, tutea"
echo "  5. 'Necesito una campaña de hotel' → propone Premium"
echo "  6. Sidebar — creative_agent destacado como primary"
