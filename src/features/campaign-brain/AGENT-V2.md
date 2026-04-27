# Campaign Brain V2 — AGENT V2 (Vision-Aware)

> Internal docs for OperatorAI's agentic ad pipeline.
> Last updated: AG-1 through EN-5 complete.

## What this is

A **multi-step agent** that takes a marketing brief and produces ad
variants that respect the user's actual brand and product. Not a
text-to-image wrapper — an orchestrated pipeline that researches,
plans, generates, critiques, iterates and lets the user edit.

## Pipeline (high-level)

```
USER INTAKE  →  RESEARCH  →  BRAIN PLAN  →  RENDER  →  CRITIQUE  →  USER EDIT
   ▲                                                                    │
   └────────────────────────────────────────────────────────────────────┘
                         (auto-save + iteration)
```

## Components

### 1. Intake (`/campaigns/new`)
- Form with auto-save (1.5s debounce) → `campaigns` table
- Captures: product, audience, goal, vertical, type, platforms, tone
- All bilingual (ES/EN)

### 2. Strategy Brief
- Endpoint: `POST /api/campaign/strategize`
- Brain (`brain.ts`) orchestrates:
  - Validates intake
  - Selects vertical + campaign type + best angles
  - **AG-1**: builds Research Dossier (web search via OpenAI Responses API)
  - Calls Claude Sonnet 4.5 with system prompt enriched by dossier facts
  - Generates `BrainOutput` with diagnostic, audience, hooks, variantBriefs

### 3. Stage Assets (vision-aware uploads)
- User uploads product photos
- **EN-1**: each photo analyzed by Gemini 2.5 Pro Vision
- Extracts structured: productType, shape, materials, colors, branding,
  generationDescription
- Persisted to `draft.intake_data.productAnalyses`

### 4. Render (vision-aware generation)
- Endpoint: `POST /api/campaign/render-batch`
- Bridge (`brain-to-variant.ts`) builds `Variant[]` with:
  - `referenceImages` (uploaded photo URLs)
  - `renderPrompt` from premium prompt builder (9 layers)
- Engine selector (`engine-selector.ts`):
  - Has refs → **Nano Banana Pro** (`gemini-2.5-flash-image`)
  - No refs → GPT Image 1 high
  - Last resort → Flux 2 Pro
- Each variant rendered with **AG-4** agentic loop:
  - Render → Critique → if score < 70, augment prompt with feedback → re-render
  - Max 2 iterations per variant
  - Best result wins

### 5. Vision Critic (AG-3)
- File: `vision-critic.ts`
- Claude Sonnet 4.5 with Vision evaluates 5 axes (brandAlignment, audienceFit,
  angleExecution, composition, productionValue)
- Returns: `{ score: 0-100, verdict: pass|iterate|fail, issues[], suggestions[] }`

### 6. Stage Variants (presentation)
- Score badges on each image (green/amber/red)
- Click-to-expand critique (issues + suggestions)
- Success banner when all variants pass premium

### 7. Variant Editor (EN-4)
- Modal full-screen, agency-style layout
- AI chat panel: natural-language editing instructions
- Endpoint: `POST /api/campaign/edit-variant`
- Sends: current image + product analyses + instruction
- Nano Banana Pro edits while preserving product
- Versions strip with thumbnails

## Premium Prompt — 9 layers

The prompt sent to the image model is built in
`premium-prompt-builder.ts` and includes (when data available):

1. **Brand context** — name, tone, palette
2. **Brain diagnostic** — audience, hidden desire, angle
3. **Visual direction** — aesthetic, lighting, composition, mood
4. **Hook translation** — headline as visual concept
5. **Vertical knowledge** — industry-specific aesthetic cues
   (17 verticals mapped)
5.5. **Visual references** — from research dossier
6. **Brain backgroundPrompt** — vertical-aware base prompt
7. **Product reference** — uploaded photo URLs
7.5. **Product Vision** — Gemini's `generationDescription` + colors + materials
8. **Platform spec** — aspect ratio + safe zones
9. **Quality contract** — commercial-grade language

## Environment variables

```
ANTHROPIC_API_KEY    # Claude Sonnet 4.5 (Brain + Vision Critic)
OPENAI_API_KEY       # GPT Image 1 + Web search via Responses API
GEMINI_API_KEY       # Nano Banana Pro + Gemini Vision
GPT_IMAGE_QUALITY    # 'high' (premium default)
```

Optional (Vertex AI for Imagen 4 Ultra — not yet integrated):
```
GOOGLE_APPLICATION_CREDENTIALS_JSON
GOOGLE_CLOUD_PROJECT
GOOGLE_CLOUD_LOCATION
```

## Cost per campaign (4 variants)

- Web search dossier: ~$0.02
- Claude Brain plan: ~$0.15
- 4 × Nano Banana Pro generation: ~$0.16
- 4 × Vision Critic: ~$0.20
- 30% iterate (avg +0.4 renders): ~$0.05
- **Total: ~$0.55 per campaign**

## What sets this apart

- **Reads user images** (Gemini Vision) — not blind text-to-image
- **Uses real product photos** (Nano Banana multi-image reference)
- **Iterates on its own output** (Vision Critic feedback loop)
- **Agency-grade editor** (natural language, preserves product)
- **Vertical-specialized** (17 industries, not generic)
- **Bilingual UI** (ES + EN throughout)

## Future work

- AG-2 enrichment: Pinterest/Unsplash visual research
- Imagen 4 Ultra integration (via Vertex AI) for hero shots
- Performance feedback (post-publish metrics → next campaign)
- Multi-format auto-adaptation (one variant → Story/Reel/Feed)
- User memory (preferences across campaigns)
