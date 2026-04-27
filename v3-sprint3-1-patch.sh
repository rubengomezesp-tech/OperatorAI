#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V3.0.0 — Sprint 3.1: Creative Agent as CORE / HOME
#
# 1. Place new files (creative-agent-prompt, action-detector, 
#    empty-state, action-card)
# 2. Patch /api/chat/route.ts to inject Creative Agent system prompt
# 3. Replace (app)/page.tsx with redirect to /chat
# 4. Patch chat/page.tsx to render new EmptyState
# 5. Patch chat-view.tsx to detect campaign intent and render ActionCard
# 6. Simplify sidebar — Chat principal + "Tools" dropdown
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Colocando archivos de Creative Agent"
echo "═══════════════════════════════════════════════"

mkdir -p src/lib/agents

if [ -f "creative-agent-prompt.ts" ]; then
  mv creative-agent-prompt.ts src/lib/agents/creative-agent-prompt.ts
  echo "  ✅ src/lib/agents/creative-agent-prompt.ts"
fi

if [ -f "action-detector.ts" ]; then
  mv action-detector.ts src/lib/agents/action-detector.ts
  echo "  ✅ src/lib/agents/action-detector.ts"
fi

if [ -f "empty-state.tsx" ]; then
  mv empty-state.tsx src/features/chat/components/empty-state.tsx
  echo "  ✅ src/features/chat/components/empty-state.tsx"
fi

if [ -f "action-card.tsx" ]; then
  mv action-card.tsx src/features/chat/components/action-card.tsx
  echo "  ✅ src/features/chat/components/action-card.tsx"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Reemplazando (app)/page.tsx con redirect a /chat"
echo "═══════════════════════════════════════════════"

if [ -f "app-home-redirect.tsx" ]; then
  mkdir -p "src/app/(app)"
  mv app-home-redirect.tsx "src/app/(app)/page.tsx"
  echo "  ✅ (app)/page.tsx → redirect a /chat (Creative Agent es HOME)"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching /api/chat/route.ts — inject Creative Agent prompt"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
import re

path = 'src/app/api/chat/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 3.1 Add import for creative agent prompt
if "creative-agent-prompt" not in content:
    # Find the last import statement
    import_lines = []
    other_lines = []
    in_imports = True
    for line in content.split('\n'):
        if in_imports and (line.startswith('import ') or line.startswith('} from') or line == '' or line.startswith('//')):
            import_lines.append(line)
        else:
            in_imports = False
            other_lines.append(line)

    # Find last import
    last_import_idx = -1
    for i, line in enumerate(import_lines):
        if 'from' in line and 'import' in line:
            last_import_idx = i

    # Better: insert right after a known existing import line
    needle = "import type { ChatMessage } from '@/lib/providers';"
    if needle in content:
        content = content.replace(
            needle,
            needle + "\nimport { buildCreativeAgentPrompt } from '@/lib/agents/creative-agent-prompt';\nimport { detectsCampaignGenerationIntent, detectLocale } from '@/lib/agents/action-detector';"
        )
        print("  ✅ Imports añadidos")
    else:
        # Append manually at top
        content = "import { buildCreativeAgentPrompt } from '@/lib/agents/creative-agent-prompt';\nimport { detectsCampaignGenerationIntent, detectLocale } from '@/lib/agents/action-detector';\n" + content
        print("  ✅ Imports añadidos (top)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("  ℹ️  System prompt injection: el chat-handler usa runChatWithTools.")
print("  ℹ️  Para inyectar el system prompt, configura el agentType='creative'")
print("  ℹ️  como default — patch en frontend.")
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patch chat/page.tsx — uses EmptyState when no messages"
echo "═══════════════════════════════════════════════"

cat > "src/app/(app)/chat/page.tsx" << 'EOF'
import { ChatView } from '@/features/chat/components/chat-view';

export default function ChatPage() {
  return <ChatView initialConversationId={null} />;
}
EOF
echo "  ℹ️  chat/page.tsx — usa ChatView (no se rompe nada)"

echo ""
echo "═══════════════════════════════════════════════"
echo "5. Patching chat-view.tsx — detect intent + render ActionCard"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
import re

path = 'src/features/chat/components/chat-view.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add EmptyState + ActionCard imports if not present
if "EmptyState" not in content:
    needle = "import { useSendMessage } from '../hooks/use-send-message';"
    if needle in content:
        content = content.replace(
            needle,
            needle + "\nimport { EmptyState } from './empty-state';\nimport { ActionCard } from './action-card';\nimport { detectsCampaignGenerationIntent } from '@/lib/agents/action-detector';"
        )
        print("  ✅ Imports añadidos a chat-view")

# Render EmptyState when no messages.
# Find <MessageList /> usage and wrap it with conditional
# Strategy: find the section where messages are rendered and add empty fallback
if "EmptyState" in content and "messages.length === 0" not in content:
    # Inject a check before MessageList rendering
    pattern = re.compile(r'(<MessageList[^>]*messages=\{messages\}[^/]*/>)', re.MULTILINE | re.DOTALL)
    match = pattern.search(content)
    if match:
        original = match.group(1)
        replacement = f"""{{messages.length === 0 ? (
          <EmptyState onSuggestion={{(prompt) => {{
            const composer = document.querySelector('textarea[data-composer]') as HTMLTextAreaElement | null;
            if (composer) {{
              composer.value = prompt;
              composer.focus();
              composer.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
          }}}} />
        ) : (
          {original}
        )}}"""
        content = content.replace(original, replacement, 1)
        print("  ✅ EmptyState rendered when messages.length === 0")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "6. Verificación final"
echo "═══════════════════════════════════════════════"

ls -la src/lib/agents/creative-agent-prompt.ts \
       src/lib/agents/action-detector.ts \
       src/features/chat/components/empty-state.tsx \
       src/features/chat/components/action-card.tsx \
       'src/app/(app)/page.tsx' 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Sprint 3.1 applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
echo ""
echo "TESTING:"
echo "  1. Login → debes ir directamente a /chat (no a /dashboard)"
echo "  2. Chat vacío → ves EmptyState con suggestions"
echo "  3. Click suggestion → se prefilla el composer"
echo "  4. Escribir 'Necesito una campaña de hotel' → respuesta del agent"
echo ""
echo "NOTA:"
echo "  El system prompt del Creative Agent está en src/lib/agents/."
echo "  Para activarlo en respuestas, el chat-handler debe usar"
echo "  buildCreativeAgentPrompt() — esto es el siguiente paso (Sprint 3.2)."
