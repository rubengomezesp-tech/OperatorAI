#!/bin/bash
# ════════════════════════════════════════════════════════════════
# V3.0.0 — Sprint 3.3
# ActionCard inline en mensajes + prefill de campaign intake
# ════════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════"
echo "1. Patching message-bubble.tsx — render ActionCard cuando trigger"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/chat/components/message-bubble.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if "ActionCard" not in content:
    needle = "import { MessageActions } from './message-actions';"
    if needle in content:
        content = content.replace(
            needle,
            needle + "\nimport { ActionCard } from './action-card';\nimport { detectsCampaignGenerationIntent } from '@/lib/agents/action-detector';"
        )
        print("  ✅ Imports añadidos")

# Update Message interface to allow agent prompt context
old_interface = """interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}"""

new_interface = """interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Triggers that signal the agent is proposing a Premium Campaign
// (matches the proposal phrasing in creative-agent-prompt.ts)
const PROPOSAL_TRIGGERS = [
  'campaña completa',
  'puedo construir la campaña',
  'puedo generar la campaña',
  'puedo construir todo',
  'puedo armar todo',
  '~5 minutos',
  '~5 min',
  'full campaign',
  'i can build the full campaign',
  'i can generate',
  '~5 minutes',
];

function agentProposesCampaign(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROPOSAL_TRIGGERS.some((trig) => lower.includes(trig));
}"""

if old_interface in content and "PROPOSAL_TRIGGERS" not in content:
    content = content.replace(old_interface, new_interface)
    print("  ✅ PROPOSAL_TRIGGERS heuristic añadido")

# Add Props for prevUserMessage (to pass context to ActionCard)
old_props = """interface Props {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
}"""

new_props = """interface Props {
  message: Message;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
  /** The previous user message — used as context when ActionCard is tapped */
  previousUserContent?: string;
}"""

if old_props in content and "previousUserContent" not in content:
    content = content.replace(old_props, new_props)
    print("  ✅ Props extendido con previousUserContent")

# Update function signature
old_signature = "export function MessageBubble({ message, isLastAssistant, onRegenerate, regenDisabled }: Props) {"
new_signature = "export function MessageBubble({ message, isLastAssistant, onRegenerate, regenDisabled, previousUserContent }: Props) {"

if old_signature in content:
    content = content.replace(old_signature, new_signature)
    print("  ✅ Signature actualizada")

# Add ActionCard rendering AFTER the bubble closes.
# Strategy: inject right before the last </div> in the return, but only when
# agent message contains proposal trigger.
# Since the JSX is complex, inject after the text content section.

# Find the cleanContent block close and inject ActionCard right after
old_block = """        {/* Text content */}
        {cleanContent && (
          <div className={cn(
            'rounded-xl px-4 py-3',
            isUser
              ? 'bg-gold/15 border border-gold/20 text-fg'
              : 'bg-surface-2 border border-border text-fg',"""

# Just confirm the block exists - then inject ActionCard later in the JSX
# The actual injection: right after the closing of the text content rounded-xl div block
# We inject before the closing divs of the bubble

# Simpler: find the last </div> chain that closes the bubble structure
# and inject ActionCard before the closing of the inner space-y div
import re

# Find the JSX return area and inject ActionCard at the right spot.
# Pattern: just before the outer max-w div closes
# We'll use a more specific anchor: the closing of the message-actions div

# Look for: </div> followed by tail of the structure
# Easiest: append after the last text bubble closes within the inner div

# Strategy: find the markdown content rendering close and append ActionCard
# The ReactMarkdown renders the cleanContent — find that block.

if 'ReactMarkdown' in content and '<ActionCard' not in content:
    # Find where the markdown rendering ends (look for </ReactMarkdown> or similar pattern)
    # Inject a conditional ActionCard after the text-content div closes

    # Find a clear anchor: end of the cleanContent conditional block
    # The pattern is a closing )}\n then more JSX. We inject right before MessageActions.
    
    # Pattern to find: the closing of the text rendering, before MessageActions appears
    actions_pattern = re.search(r'(\s+)\{!isUser && isLastAssistant', content)
    if actions_pattern:
        injection_point = actions_pattern.start()
        injection = """
        {/* Premium Campaign CTA — when agent proposes generation */}
        {!isUser && agentProposesCampaign(cleanContent) && (
          <ActionCard contextPrompt={previousUserContent} />
        )}
"""
        content = content[:injection_point] + injection + content[injection_point:]
        print("  ✅ ActionCard injection point found and applied")
    else:
        # Fallback: inject before the very last closing div of the component
        # Find the last </div>\n  );\n} pattern
        last_closing = content.rfind('  );\n}')
        if last_closing > 0:
            # Find the </div> right before this
            div_close = content.rfind('</div>', 0, last_closing)
            if div_close > 0:
                injection = """
        {/* Premium Campaign CTA */}
        {!isUser && agentProposesCampaign(cleanContent) && (
          <ActionCard contextPrompt={previousUserContent} />
        )}
        """
                content = content[:div_close] + injection + content[div_close:]
                print("  ✅ ActionCard injected (fallback location)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "2. Patching message-list.tsx — pasar previousUserContent al bubble"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/chat/components/message-list.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find where MessageBubble is rendered inside the map and pass previousUserContent
# We need to find the previous user message in the array.
import re

bubble_pattern = re.search(
    r'<MessageBubble\s+([^/>]*?)\/?>',
    content,
    re.DOTALL
)

if bubble_pattern and 'previousUserContent' not in content:
    # Find the .map((m, ...) usage
    map_match = re.search(r'messages\.map\(\(([^)]+)\)\s*=>', content)
    if map_match:
        params = map_match.group(1)
        # Should be like (m) or (m, i)
        if ',' not in params:
            # Add index parameter
            new_params = params.strip() + ', i'
            content = content.replace(map_match.group(0), f'messages.map(({new_params}) =>', 1)
            print("  ✅ Map signature ahora incluye index i")

    # Inject previousUserContent prop
    bubble_content = bubble_pattern.group(0)
    if 'previousUserContent' not in bubble_content:
        # Add prop right before the closing
        new_bubble = bubble_content.rstrip('/>').rstrip() + '\n            previousUserContent={i > 0 && messages[i - 1].role === "user" ? messages[i - 1].content : undefined}\n          />'
        # Only do replacement if pattern is the self-closing version
        if bubble_content.endswith('/>'):
            content = content.replace(bubble_content, new_bubble, 1)
            print("  ✅ previousUserContent prop pasado a MessageBubble")
        else:
            print("  ⚠️  MessageBubble no es self-closing — verifica manualmente")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "3. Patching /campaigns/new — leer sessionStorage para prefill"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/(app)/campaigns/new/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useEffect to read sessionStorage on mount and update intake form
if 'agentCampaignContext' not in content:
    # Find useState imports
    if "import { useState } from 'react';" in content:
        content = content.replace(
            "import { useState } from 'react';",
            "import { useState, useEffect } from 'react';"
        )

    # After the existing state declarations, add the sessionStorage read effect
    old_state_block = """  const [stage, setStage] = useState<Stage>('intake');
  const [brainOutput, setBrainOutput] = useState<BrainOutput | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);"""

    new_state_block = """  const [stage, setStage] = useState<Stage>('intake');
  const [brainOutput, setBrainOutput] = useState<BrainOutput | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentContext, setAgentContext] = useState<string | null>(null);

  // Read context from chat (when user came from agent's ActionCard)
  useEffect(() => {
    try {
      const ctx = sessionStorage.getItem('agentCampaignContext');
      if (ctx) {
        setAgentContext(ctx);
        sessionStorage.removeItem('agentCampaignContext');
      }
    } catch {
      // ignore
    }
  }, []);"""

    if old_state_block in content:
        content = content.replace(old_state_block, new_state_block)
        print("  ✅ sessionStorage read effect añadido")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "4. Patching CampaignIntakeForm — recibir initialBrief"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/features/campaign-brain/components/campaign-intake-form.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add initialBrief prop
old_props = """interface CampaignIntakeFormProps {
  onStrategize: (draftId: string) => void;
}"""

new_props = """interface CampaignIntakeFormProps {
  onStrategize: (draftId: string) => void;
  /** Optional context from agent conversation to pre-fill */
  initialBrief?: string;
}"""

if old_props in content and 'initialBrief' not in content:
    content = content.replace(old_props, new_props)
    print("  ✅ initialBrief prop añadido")

# Update function signature
old_sig = "export function CampaignIntakeForm({ onStrategize }: CampaignIntakeFormProps) {"
new_sig = "export function CampaignIntakeForm({ onStrategize, initialBrief }: CampaignIntakeFormProps) {"

if old_sig in content:
    content = content.replace(old_sig, new_sig)
    print("  ✅ Signature actualizada")

# Add useEffect to prefill productDescription with initialBrief
import re
hook_section = re.search(
    r'(const \{ draft, intake, status, error, updateIntake, saveNow \} = useCampaignDraft\(\);)',
    content
)
if hook_section and 'initialBrief && intake' not in content:
    # Inject useEffect after the useCampaignDraft hook
    insertion = hook_section.group(1) + """

  // Pre-fill from agent context (when user came from chat)
  useEffect(() => {
    if (initialBrief && intake && !intake.productDescription?.trim()) {
      updateIntake({ productDescription: initialBrief });
    }
  }, [initialBrief, intake, updateIntake]);"""
    content = content.replace(hook_section.group(1), insertion, 1)
    print("  ✅ Effect prefill productDescription con initialBrief")

# Make sure useEffect is imported
if 'useEffect' in content and "import { useState, useEffect } from 'react';" not in content:
    if "import { useState } from 'react';" in content:
        content = content.replace(
            "import { useState } from 'react';",
            "import { useState, useEffect } from 'react';"
        )
    elif "import { useState," in content and "useEffect" not in content:
        content = re.sub(
            r"import \{ (useState[^}]*) \} from 'react';",
            r"import { \1, useEffect } from 'react';",
            content,
            count=1
        )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "5. Patching new/page.tsx — pasar agentContext al IntakeForm"
echo "═══════════════════════════════════════════════"

python3 << 'PYEOF'
path = 'src/app/(app)/campaigns/new/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find <CampaignIntakeForm and add initialBrief prop if not yet passed
import re

if 'initialBrief' not in content:
    pattern = re.compile(
        r'<CampaignIntakeForm\s+([^/>]*?)/>',
        re.DOTALL
    )
    match = pattern.search(content)
    if match:
        original = match.group(0)
        existing_props = match.group(1).rstrip()
        new_jsx = f'<CampaignIntakeForm\n          {existing_props}\n          initialBrief={{agentContext ?? undefined}}\n        />'
        content = content.replace(original, new_jsx, 1)
        print("  ✅ initialBrief={agentContext} pasado al form")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Sprint 3.3 applied. Run pnpm build."
echo "═══════════════════════════════════════════════"
