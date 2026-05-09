# OperatorAI — System Architecture

This document describes the architecture, data flows, and key design decisions of OperatorAI.

**Last updated:** May 2026 (Sprint 4)

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                         │
│   React 19 + Tailwind + Framer Motion                            │
│   Streaming UI · Optimistic updates · Konva canvases             │
└──────────────────────────────────────────────────────────────────┘
                              ↓ ↑ SSE / fetch
┌──────────────────────────────────────────────────────────────────┐
│                    EDGE / SERVERLESS (Vercel)                    │
│   Next.js 16 API routes (100+)                                   │
│   Middleware: Auth · Rate limit · Sentry                         │
└──────────────────────────────────────────────────────────────────┘
        ↓                ↓                ↓                ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  ORCHESTRATOR│ │   ADS PIPE   │ │   EXT TOOLS  │ │     RAG      │
│              │ │              │ │              │ │              │
│ Multi-model  │ │ 16 archetype │ │ web_search   │ │ Embeddings   │
│ routing      │ │ system       │ │ gmail        │ │ (Nomic)      │
│              │ │              │ │ browser      │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       ↓                ↓                ↓                ↓
┌──────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  OpenAI · Anthropic · Google · Replicate · Fal.ai · Tavily       │
│  Browserbase · Gmail API · Stripe · Resend · Upstash · Sentry    │
└──────────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  Supabase Postgres (27 migrations)                               │
│  - Users / Orgs / Conversations / Messages / Memories            │
│  - Brand profiles / Knowledge / Documents / Embeddings           │
│  - Ad jobs / Campaigns / OAuth tokens / Subscriptions            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 Orchestrator

**Location:** `src/lib/orchestrator/`

The orchestrator is the brain that decides:
- Which model to use (GPT-5.4 / Claude / Qwen / Gemini)
- Which tools are available
- How to handle errors and recovery
- Whether to stream or batch

**Key files:**

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
    └── (see section 2.3)
```

### 2.2 Ads Pipeline

**Location:** `src/lib/ads/`

Generates production-ready ads using a multi-stage pipeline:

```
USER MESSAGE
     ↓
brain-bridge.ts ───── selects archetype (one of 16)
     ↓
   layout-randomizer.ts (anti-repetition + intent detection)
     ↓
job-processor.ts ───── enriches prompt with archetype rules
     ↓
gpt-image-2 / Flux ──── generates final image
     ↓
job-manager.ts ───── persists to Supabase Storage
     ↓
Result back to user
```

**16 archetypes:**
1. `hero-typographic-apple`
2. `full-bleed-cinematic`
3. `split-screen-comparison`
4. `editorial-magazine`
5. `spotify-duotone-diagonal`
6. `brutalist-text-hero`
7. `bento-grid-modular`
8. `vercel-blueprint-dark`
9. `type-collage-mixed-media`
10. `surreal-sculptural-product`
11. `documentary-honest`
12. `data-viz-hero-stat`
13. `y2k-liquid-chrome`
14. `testimonial-quote-product`
15. `brand-system-document` (Sprint 3 — Pentagram-style)
16. `premium-saas-announcement` (Sprint 3 — Apple/Linear style)

**Auto-routing detectors:**
- `EXPLORATION_INTENT_RX` → forces `brand-system-document`
- `SAAS_LAUNCH_INTENT_RX` → forces `premium-saas-announcement`
- Otherwise: weighted random selection (anti-repetition by org_id)

### 2.3 External Tools (Sprint 4)

**Location:** `src/lib/orchestrator/tools/`

Modular adapter system. See `src/lib/orchestrator/README.md`.

```
tools/
├── types.ts                Adapter interface
├── tools-registry.ts       Central registry (auto-register pattern)
├── index.ts                Public API
├── helpers/
│   ├── http-client.ts      Fetch wrapper with retry + timeout
│   └── error-handler.ts    Standardized AdapterResult
├── auth/
│   ├── token-store.ts      OAuth tokens in Supabase
│   └── oauth-google.ts     Google OAuth2 flow + auto-refresh
└── adapters/
    ├── web-search.adapter.ts   Tavily search
    ├── web-fetch.adapter.ts    Tavily Extract
    ├── gmail.adapter.ts        Gmail API (read + send)
    └── browser.adapter.ts      Browserbase Chrome cloud
```

**Adapter pattern (TypeScript):**

```typescript
const myAdapter: AdapterDefinition<TInput, TOutput> = {
  name: 'my_tool',
  description: '...',
  inputSchema: z.object({...}),
  isAvailable: () => Boolean(process.env.MY_API_KEY),
  execute: async (input, ctx) => withErrorHandling(async () => {
    // call external API
    return result;
  }),
};
registerAdapter(myAdapter);
```

### 2.4 Chat Pipeline

**Entry point:** `/api/chat`

```
1. Parse request body (Zod validation)
2. Auth: Supabase user.id
3. Rate limit: 30 req/min per user (Upstash)
4. Resolve org context
5. Check usage quota (per plan)
6. Select runner (GPT/Claude/Qwen based on body.model)
7. Build context: RAG chunks + memories + brand
8. Stream response via SSE
9. Tool calls → executeTool() → adapters
10. Persist message + tool_parts to Supabase
```

### 2.5 Models Catalog

**Location:** `src/lib/models/`

Single source of truth for available models:

```typescript
// catalog.ts
export const MODELS_CATALOG = {
  'gpt-5.4': { provider: 'openai', tier: 'premium' },
  'claude-sonnet-4': { provider: 'anthropic', tier: 'premium' },
  'operator-qwen-v3': { provider: 'local', tier: 'free' },
};
```

**Smart routing:**
- `smart-generate.ts` selects best image model for the task
- `router.ts` routes text generation requests
- `local-operator-client.ts` connects to Qwen via LM Studio

---

## 3. Data Model

### 3.1 Core Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Auth (Supabase Auth) |
| `orgs` | Multi-tenant orgs |
| `org_members` | User ↔ Org membership + role |
| `conversations` | Chat threads |
| `messages` | Individual messages with tool_parts JSONB |
| `assistants` | Per-org AI personalities |
| `brand_profiles` | Logo, colors, fonts, voice |
| `knowledge_documents` | RAG sources |
| `knowledge_chunks` | Embedded chunks (pgvector) |
| `memories` | Persistent user memories |
| `voice_fingerprints` | Style learning |
| `ad_jobs` | Async ad generation jobs |
| `campaigns` | Multi-asset campaigns |
| `subscriptions` | Stripe sync |
| `usage_events` | Per-user usage tracking |
| `oauth_tokens` | External integrations (Sprint 4) |

### 3.2 RLS Policies

All tables have Row Level Security enabled:
- Users can only see their own data
- Org admins can see org-wide data
- Service role bypasses RLS (used by backend only)

---

## 4. Key Design Decisions

### 4.1 Why Next.js 16 (App Router)?
- Server Components for fast initial loads
- Streaming UI for AI responses
- Edge functions for low latency
- Built-in API routes

### 4.2 Why Supabase?
- Postgres + Auth + Storage in one
- Real-time subscriptions out-of-the-box
- pgvector for embeddings
- RLS for security

### 4.3 Why Multi-Model?
- GPT-5.4: best for tool calling and complex reasoning
- Claude: best for long-form creative writing
- Qwen v3 (local): fine-tuned for Operator persona, future cost reduction
- Gemini: multimodal tasks

### 4.4 Why Modular Adapters (Sprint 4)?
- Each external tool is independent
- Easy to add new ones (just create a file)
- Works with any model (GPT, Claude, Qwen)
- No vendor lock-in

### 4.5 Why Upstash Redis (not in-memory)?
- Vercel serverless = each function arrives in fresh VM
- In-memory cache resets on cold start
- Upstash is edge-distributed, persistent, low-latency

---

## 5. Performance Considerations

### 5.1 Hot Paths
- `/api/chat` — main entry, target p95 < 5s for first token
- `/api/images/generate` — 30-90s acceptable (UX shows progress)
- `/api/videos/generate` — 60-180s (background job + push notification)

### 5.2 Optimization Patterns
- Server Components for static parts
- Streaming SSE for AI responses
- Optimistic UI updates
- Background jobs (Inngest) for long tasks
- Vercel Edge Cache for static assets

---

## 6. Security Posture

| Layer | Protection |
|-------|------------|
| **Auth** | Supabase Auth, JWT cookies, secure |
| **Authorization** | RLS on all tables, isAdmin() for admin |
| **Rate limiting** | Upstash Redis, per user_id |
| **Input validation** | Zod schemas on all API routes |
| **Secret management** | Vercel env vars, never in code |
| **OAuth tokens** | Supabase RLS-protected |
| **Debug endpoints** | devOnly() guard (403 in prod) |
| **CORS** | Default Next.js (same-origin) |
| **CSRF** | Supabase Auth handles via cookies |

---

## 7. Observability

| Signal | Tool |
|--------|------|
| Errors | Sentry |
| LLM observability | Langfuse |
| Product analytics | PostHog |
| Server logs | Vercel Logs + console.log |
| Database queries | Supabase Dashboard |

---

## 8. Roadmap

### Sprint 5 (Next)
- Multi-variant intent ("hazme 3 enfoques diferentes")
- Adapter: Slack send_message
- Adapter: Supabase queries

### Sprint 6
- Adapter: Google Calendar
- Adapter: GitHub
- Migration: Qwen v3 to RunPod (production)

### Sprint 7
- Adapter: Stripe queries
- Adapter: Notion pages
- Computer Use API (Anthropic) for advanced browser tasks

---

## Maintainers

- **Founder/CTO**: Ruben Gómez (ruben@operatoraiapp.com)

---

## Glossary

- **Archetype**: Layout template with strict composition rules (16 in total)
- **Coach**: Qwen v3-specific orchestrator
- **Adapter**: Modular external tool wrapper (Sprint 4 pattern)
- **CreativePlan**: Output of brain-bridge with all metadata to render an ad
- **brand_profile**: User's brand identity (logo, colors, voice)
- **org**: Multi-tenant organization (1 user = 1 default org)
