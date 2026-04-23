[ROUTES_AUDIT.md](https://github.com/user-attachments/files/26995028/ROUTES_AUDIT.md)
# OperatorAI — Routes Audit

Reference for the current `(app)` route tree after UX restructuring.
All routes remain live; this document classifies visibility and lists redirect recommendations.

## 1. Primary (visible in sidebar — Create group)

| Route | Component | Purpose | Status |
|---|---|---|---|
| `/creative-studio` | `CreativeStudioView` | v2 flagship: upload -> analyze -> brief -> 5 variants | active |
| `/chat` | Chat + conversation view | Conversational surface | active |
| `/studio/video` | `VideoStudio` | AI video generation | active |
| `/voice` | `VoiceConversation` | Voice mode | beta (badged) |

## 2. Secondary (visible in sidebar — Library / Automate)

| Route | Component | Purpose | Status |
|---|---|---|---|
| `/brand-os` | Brand OS view | Identity, palette, voice | active |
| `/projects` | Projects list | Organization by project | active |
| `/knowledge` | `KnowledgeView` | RAG / document memory | active |
| `/files` | `FilesView` | General asset storage | active |
| `/studio/image` | `ImageStudioView` | Standalone image generation | active |
| `/assistants` | Assistants list | Agent configuration | active |
| `/missions` | `MissionsContent` | Workflows / automation | active |

## 3. System (fixed positions)

| Route | Position | Visibility |
|---|---|---|
| `/dashboard` | Top of sidebar | always visible |
| `/settings` | Bottom of sidebar | always visible |
| `/admin` | Bottom of sidebar | only if `isAdmin(user.email)` returns true |

**Admin detection**: uses `isAdmin(email)` from `@/lib/admin` (email whitelist, not a role column).
To display the Admin link, `AppShell` must resolve this and pass `isAdmin` to `Sidebar`.
Until that wiring is added, the Admin link is hidden from the sidebar but
`/admin` itself still enforces access via its own layout.

## 4. HIDDEN from sidebar (routes remain live)

These routes still respond. They are simply not exposed through primary navigation.

| Route | Reason | Recommended action |
|---|---|---|
| `/studio` | Hub page with cards linking to Image Studio + Video Studio. Redundant — both destinations are directly in the sidebar now. | **Redirect** to `/creative-studio` |
| `/billing` | Duplicates `/settings/billing`. Kept live as Stripe success-page landing. | **Redirect** to `/settings/billing` (preserve `/billing/success`) |
| `/memory` | Duplicates `/settings/memory`. | **Redirect** to `/settings/memory` |

### Redirect implementation pattern

Replace the `page.tsx` body with a server-side `redirect()`:

```tsx
// src/app/(app)/billing/page.tsx
import { redirect } from 'next/navigation';
export default function BillingPage() {
  redirect('/settings/billing');
}
```

Same for `/memory/page.tsx` and `/studio/page.tsx`.
**Do NOT modify** `/billing/success/page.tsx` — Stripe lands there.

## 5. Duplicates to consolidate

| Duplicate pair | Action |
|---|---|
| `/billing` + `/settings/billing` | Redirect `/billing` -> `/settings/billing`. Keep `/billing/success`. |
| `/memory` + `/settings/memory` | Redirect `/memory` -> `/settings/memory`. |
| `/studio` + Image Studio / Video Studio links in sidebar | Redirect `/studio` -> `/creative-studio`. |

## 6. API duplication flags (out of scope, flag only)

Not touched in this task. Flag for a separate cleanup pass.

| Observation | Note |
|---|---|
| `/api/image/*` and `/api/images/*` | Two parallel sets of image endpoints. Verify which is canonical. |
| `/api/video/*` and `/api/videos/*` | Same pattern. Verify which is canonical. |
| `/api/create/*` (compose, campaign, creative) | Legacy v1 endpoints. `creative-studio-view` now uses `/api/creative/*`. Consider deprecating. |
| `/api/creative/regenerative-variant` | **Typo in folder name.** Frontend (Tanda 3) calls `/api/creative/regenerate-variant`. One of the two is dead code. Audit to confirm which is active and rename. |

## 7. Gray-area routes (kept for now)

| Route | Consideration |
|---|---|
| `/voice` | Beta badged. Promote to full primary when the flow is verified end-to-end. |
| `/missions` | Currently under Automate. If it proves indistinguishable from `/assistants` in practice, consolidate into a single Automation hub. |
| `/studio/image` | Clearly distinct from Creative Studio (single-image generation vs campaign flow). Kept in Library as a power-user tool. Do NOT move to Create group — would overlap with Creative Studio. |

## 8. Summary of changes in this restructuring

**Sidebar (`src/components/layout/sidebar.tsx`)**
- 3 logical groups: Create / Library / Automate
- Dashboard pinned top, Settings pinned bottom, Admin conditional on `isAdmin` prop
- Creative Studio flagged as primary (subtle gold dot indicator)
- Voice explicitly badged "Beta"
- Uses existing `useI18n` hook with fallback strings
- Uses only verified design tokens: `bg-surface`, `bg-surface-2`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-gold`, `border-border`, `gold-grad`

**Dashboard (`src/app/(app)/dashboard/page.tsx`)**
- Greeting with firstname (from `public.users.full_name`, fallback to email prefix)
- 3 primary action cards (Creative Studio, Chat, Brand OS)
- Recent images row (via `/api/images/list` — signed URLs handled by API)
- Organization quick links: Projects, Knowledge, Assistants, Video
- All empty states include a CTA
- Bilingual via `public.users.locale`

**Client component (`src/app/(app)/dashboard/dashboard-recent.tsx`)**
- Handles the async image fetch on the dashboard
- Does not duplicate signed URL logic — reuses `/api/images/list`

**Routes hidden**
- `/studio`, `/billing`, `/memory` — redirects recommended above

## 9. What was NOT touched

- No new top-level routes created
- No existing routes renamed
- No API routes modified
- Creative Studio v2 server layer untouched
- `ad-editor.tsx`, `reference-composer.tsx` untouched
- Stripe / i18n / auth / RLS untouched
- `AppShell` / `AppLayout` untouched (see Follow-ups)

## 10. Follow-ups (separate tasks, not in this delivery)

1. **Apply the 3 redirect patches** listed in section 4.
2. **Wire `isAdmin` into Sidebar**: in `src/app/(app)/layout.tsx` import `isAdmin` from `@/lib/admin` and pass to `AppShell` -> `Sidebar`:
   ```tsx
   import { isAdmin } from '@/lib/admin';
   ...
   const admin = isAdmin(me?.email ?? user.email ?? '');
   <AppShell ... isAdmin={admin}>...</AppShell>
   ```
   Then `AppShell` forwards to `<Sidebar isAdmin={isAdmin} />`.
3. **Audit API duplication** flagged in section 6.
4. **Rename** `/api/creative/regenerative-variant` -> `/api/creative/regenerate-variant` (verify which one the frontend currently hits).
5. **Create campaigns table** (migration 0016 referenced in Creative Studio v2 Tanda 1). Until then, the dashboard shows only recent images. Once present, add a "Recent campaigns" section above the images row in `dashboard/page.tsx`.
6. **i18n keys**: add translations for the new sidebar group labels if you want to override the English fallbacks:
   - `nav.create`, `nav.library`, `nav.automate`
   - `nav.admin`, `nav.brand_os`
   - The other keys (`nav.create_campaigns`, `nav.creative_agent`, `nav.video_studio`, `nav.voice_mode`, `nav.projects`, `nav.knowledge`, `nav.files`, `nav.image_studio`, `nav.assistants`, `nav.missions`, `nav.overview`, `nav.settings`) already exist in your i18n bundle.
