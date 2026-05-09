# OperatorAI

> AI-powered marketing platform that turns ideas into agency-grade ads, in minutes.

**Production:** https://operatoraiapp.com
**Status:** Production · Active development

---

## Overview

OperatorAI is an end-to-end marketing automation platform powered by a multi-model AI orchestrator. It generates premium ads, manages campaigns, and orchestrates external tools (web search, email, browser) — all from a single conversational interface.

**Core capabilities:**
- 16 layout archetypes for agency-grade ad design
- Multi-model orchestration (GPT-5.4, Claude, Qwen v3 fine-tuned)
- External tools: Gmail, web search, browser automation
- Real-time streaming with auto-recovery
- Brand-aware: respects user's brand assets and voice

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.6 + Turbopack |
| Language | TypeScript 5.9 |
| UI | React 19, Tailwind CSS, Radix UI, Framer Motion |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI Models | OpenAI (GPT-5.4), Anthropic (Claude), Google (Gemini), Qwen v3 (local) |
| Image Gen | gpt-image-2, Flux, Recraft, Ideogram |
| Video Gen | Replicate, Fal.ai |
| Web Search | Tavily |
| Browser | Browserbase |
| Email | Gmail API + Resend |
| Payments | Stripe |
| Cache/RateLimit | Upstash Redis |
| Background Jobs | Inngest |
| Observability | Sentry, Langfuse, PostHog |
| Hosting | Vercel |

---

## Setup

### Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase project
- API keys (see Environment Variables below)

### Install

```bash
git clone https://github.com/rubengomezesp-tech/OperatorAI.git
cd OperatorAI
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

Server runs at http://localhost:3000

### Required Environment Variables

Critical groups (full list in `.env.local`):

**Supabase**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**AI Models**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

**Image/Video Generation**
- `REPLICATE_API_TOKEN`
- `FAL_API_KEY`

**External Tools (Sprint 4)**
- `TAVILY_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`

**Rate Limiting + Cache**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Payments**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Observability**
- `SENTRY_DSN`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`

---

## Scripts

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run start    # Production server (after build)
npm run lint     # ESLint
```

---

## Project Structure

See `ARCHITECTURE.md` for detailed system architecture.

```
src/
  app/                      Next.js 16 app router
    (app)/                  Authenticated layout
    api/                    100+ API routes
  features/                 Feature-based components
    chat/                   Conversational interface
    creative-studio/        Image/video generation UI
    billing/                Stripe integration
  lib/
    ads/                    Ads pipeline (16 archetypes)
    orchestrator/           AI model orchestration
      coach/                Qwen-specific orchestrator
      tools/                External tools (Sprint 4)
    models/                 Model provider clients
    chat/                   Chat tool execution
    rag/                    Knowledge base / embeddings
```

---

## Key Features

### 1. Ads Pipeline
Generates production-ready ads using a sophisticated orchestrator:
- 16 layout archetypes (Apple-minimal, Cinematic, Bento Grid, Pentagram-style brand book, SaaS announcement, etc.)
- Anti-repetition tracker (different archetype each request)
- Auto-routing semántico (detects intent → forces specific archetype)
- Brand-aware (respects user's logo, palette, voice)
- Multiple aspect ratios (1:1, 9:16, 16:9, 4:5)

See `src/lib/ads/`.

### 2. Multi-Model Orchestrator
Routes requests to the optimal model based on task:
- **GPT-5.4**: tool calling, complex reasoning (production)
- **Claude**: long context, creative writing
- **Qwen v3 (local)**: fine-tuned for Operator persona (development)
- **Gemini**: multimodal tasks

See `src/lib/orchestrator/` and `src/lib/models/`.

### 3. External Tools (Sprint 4)
Modular adapter system for external integrations:
- `web_search` — Tavily AI search
- `web_fetch` — URL content extraction
- `send_email` / `read_emails` — Gmail API + OAuth2
- `browser_action` — Browserbase Chrome cloud

See `src/lib/orchestrator/tools/`.

### 4. Knowledge Base (RAG)
Users can upload PDFs/docs and the AI retrieves relevant context.
Embeddings via Nomic.

See `src/lib/rag/`.

### 5. Memory System
Persistent memory across conversations:
- Style learning (voice fingerprint)
- Explicit memories ("remember that...")
- Auto-extraction from turns

See `src/features/memory/`.

---

## API Routes

100+ endpoints organized by domain:

| Domain | Endpoints | Purpose |
|--------|-----------|---------|
| `/api/chat` | 1 + variants | Main conversation endpoint |
| `/api/admin/*` | 14 | Admin panel (protected by isAdmin check) |
| `/api/billing/*` | 5 | Stripe subscriptions |
| `/api/creative/*` | 5 | Ads pipeline |
| `/api/images/*` | 7 | Image generation/management |
| `/api/videos/*` | 4 | Video generation/management |
| `/api/knowledge/*` | 5 | RAG documents |
| `/api/memory/*` | 5 | Memory CRUD |
| `/api/auth/google/*` | 2 | OAuth flow (Sprint 4) |
| `/api/integrations/*` | 4 | External tool connections |

**Rate-limited endpoints (Upstash Redis):**
- `/api/chat`: 30 req/min
- `/api/images/generate`: 10 req/min
- `/api/videos/generate`: 5 req/min
- `/api/billing/checkout`: 5 req/min

---

## Security

- **Auth**: Supabase Auth with RLS policies on all tables
- **Admin**: `isAdmin(email)` check on all `/api/admin/*` routes
- **Rate Limiting**: Upstash Redis (Vercel-compatible)
- **OAuth Tokens**: Stored in `oauth_tokens` table with RLS
- **Secret Management**: All keys in Vercel env vars (never in code)
- **Debug Endpoints**: `devOnly()` guard (returns 403 in production)

---

## Deployment

Vercel auto-deploys on push to `main`:

```bash
git push origin main
# Vercel detects push
# Builds with Turbopack
# Deploys to operatoraiapp.com
# Cache propagated globally (~2-3 min)
```

Database migrations are applied manually via Supabase Dashboard SQL Editor.

---

## Documentation

- `README.md` — This file (overview)
- `ARCHITECTURE.md` — System architecture and design decisions
- `src/lib/orchestrator/README.md` — External tools (Sprint 4) docs

---

## License

Proprietary © 2026 Ruben Gómez. All rights reserved.

---

## Support

For issues or questions: ruben@operatoraiapp.com
