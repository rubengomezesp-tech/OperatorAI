# Orchestrator — Sprint 4

This module handles AI model orchestration and external tool execution.

## Structure

```
orchestrator/
├── run-chat-with-tools.ts       Anthropic Claude runner
├── run-openai-with-tools.ts     OpenAI runner (PRODUCTION MAIN)
├── coach/                       Qwen v3-specific orchestrator
│   ├── runner.ts                Main coach runner
│   ├── tool-router.ts           Parse + validate + execute tools
│   ├── tool-schemas.ts          Zod schemas + 50+ name aliases
│   ├── prompts.ts               System prompt builder
│   ├── intent-detector.ts       Classify user intent
│   ├── recovery-handler.ts      Auto-fix tool call errors
│   └── types.ts                 Type definitions
└── tools/                       External tools registry (Sprint 4)
    ├── types.ts
    ├── tools-registry.ts        Central registry
    ├── index.ts                 Public API + auto-imports
    ├── helpers/
    │   ├── http-client.ts
    │   └── error-handler.ts
    ├── auth/
    │   ├── token-store.ts       OAuth tokens in Supabase
    │   └── oauth-google.ts      Google OAuth2 flow
    └── adapters/
        ├── web-search.adapter.ts
        ├── web-fetch.adapter.ts
        ├── gmail.adapter.ts
        └── browser.adapter.ts
```

## How it works

### Entry point: `/api/chat`

The chat route imports a runner based on the model:

```typescript
import { runOpenAIWithTools } from '@/lib/orchestrator/run-openai-with-tools';
import { runChatWithTools } from '@/lib/orchestrator/run-chat-with-tools';
import { runCoach } from '@/lib/orchestrator/coach/runner';

if (model.startsWith('gpt')) {
  for await (const event of runOpenAIWithTools(...)) {
    yield event;
  }
} else if (model.startsWith('claude')) {
  for await (const event of runChatWithTools(...)) {
    yield event;
  }
} else if (model.startsWith('operator-qwen')) {
  for await (const event of runCoach(...)) {
    yield event;
  }
}
```

### Tool execution flow

```
1. Model emits tool_call:
   <tool_call>{"name":"web_search","arguments":{"query":"..."}}</tool_call>

2. tool-router parses the block

3. resolveToolName() maps aliases:
   "search_web" → "web_search"
   "google_search" → "web_search"

4. validateToolArgs() validates with Zod schema

5. executeTool() (in lib/chat/tools.ts) routes to:
   - Native tools (image, video, create_ad) → existing impls
   - External tools (web_search, send_email, etc.) → executeAdapter()

6. executeAdapter() (in tools/) runs the adapter and returns AdapterResult

7. Result is converted back to ToolResult and streamed to UI
```

## Adding a new external tool

### 1. Create the adapter

Create file `src/lib/orchestrator/tools/adapters/my-tool.adapter.ts`:

```typescript
import { z } from 'zod';
import { registerAdapter } from '../tools-registry';
import { withErrorHandling } from '../helpers/error-handler';
import type { AdapterDefinition } from '../types';

const InputSchema = z.object({
  query: z.string().min(1),
});

const myAdapter: AdapterDefinition<z.infer<typeof InputSchema>, { result: string }> = {
  name: 'my_tool',
  description: 'Does X. Use when user wants to do X.',
  inputSchema: InputSchema,
  requiresConfirmation: false,
  isAvailable: () => Boolean(process.env.MY_API_KEY),
  execute: async (input, ctx) => withErrorHandling(async () => {
    // call external API
    return { result: '...' };
  }),
};

registerAdapter(myAdapter);
export { myAdapter };
```

### 2. Register in `tools/index.ts`

Add: `import './adapters/my-tool.adapter';`

### 3. Add to `chat/types.ts` and `coach/types.ts`

Both `ToolKind` and `CoachToolName` types need the new tool name.

### 4. Add Zod schema to `coach/tool-schemas.ts`

```typescript
export const MyToolSchema = z.object({...});

const SCHEMA_BY_TOOL: Record<CoachToolName, z.ZodSchema> = {
  // ... existing ...
  my_tool: MyToolSchema,
};
```

### 5. Add aliases (optional)

```typescript
const TOOL_NAME_ALIASES: Record<string, CoachToolName> = {
  // ... existing ...
  'my_tool': 'my_tool',
  'doX': 'my_tool',
  'mytool': 'my_tool',
};
```

### 6. Add description block to `coach/prompts.ts`

```typescript
const TOOL_BLOCKS: Record<CoachToolName, string> = {
  // ... existing ...
  my_tool: `### my_tool — purpose
Use when ...
Required args:
  - query (string): ...
EXAMPLE:
<tool_call>{"name":"my_tool","arguments":{"query":"..."}}</tool_call>`,
};
```

### 7. Done

The tool is now available to all models that support tool calling.

## Current adapters (Sprint 4)

| Tool | Provider | Plan | Setup |
|------|----------|------|-------|
| `web_search` | Tavily | 1000 queries/mo free | API key |
| `web_fetch` | Tavily Extract | Included | API key |
| `send_email` | Gmail API | Free | OAuth2 |
| `read_emails` | Gmail API | Free | OAuth2 |
| `browser_action` | Browserbase | 50 sessions/mo free | API key + project ID |

## OAuth flow (Sprint 4)

```
1. User clicks "Connect Gmail"
   → GET /api/auth/google
   → Redirects to Google consent screen

2. User accepts scopes
   → Google redirects to /api/auth/google/callback?code=...

3. Backend exchanges code for tokens
   → exchangeCodeForTokens(code, userId)
   → Saves to oauth_tokens table

4. Future requests use:
   → getAuthenticatedClient(userId)
   → Auto-refresh on expiry
```

## Testing locally

```bash
# 1. Ensure .env.local has all required keys
# 2. Run dev server
npm run dev

# 3. In chat, try:
# "busca el mejor restaurante japonés en Miami"
# Should trigger web_search adapter

# 4. Check logs for:
# [tools-registry] 🚀 executing adapter: web_search
# [tools-registry] ✅ web_search done in 3000ms
```
