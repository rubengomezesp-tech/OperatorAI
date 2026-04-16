# Operator AI — Patch 1: i18n global + Apple Sign-In

This patch **extends** what you already have. It does **not** replace your i18n library or your auth flow.

---

## What's in this zip

| File | What it does |
|---|---|
| `src/lib/i18n.tsx` | Your existing i18n + **auth & topbar keys** added |
| `src/components/auth/apple-button.tsx` | **NEW** – Apple HIG-compliant button |
| `src/app/(auth)/login/page.tsx` | Google + **Apple** + fully i18n-ed |
| `src/app/(auth)/signup/page.tsx` | Google + **Apple** + fully i18n-ed |

---

## 1. Drop in the files

Copy everything, preserving paths. Overwrites your existing `i18n.tsx`, `login/page.tsx`, `signup/page.tsx` (the replacements are supersets — nothing is lost).

---

## 2. Show the language toggle on every page

Open `src/components/layout/topbar.tsx`. Add the import:

```tsx
import { LanguageToggle } from '@/lib/i18n';
```

Drop `<LanguageToggle />` in the right-side controls of the topbar, next to your notifications / account menu:

```tsx
<div className="flex items-center gap-2">
  <LanguageToggle />
  {/* existing: notifications, avatar dropdown, etc. */}
</div>
```

The toggle is already styled to match your design (border/gold hover). On every page that renders the `Topbar`, it'll appear. Auth pages have their own toggle already baked in.

---

## 3. Use translations anywhere

```tsx
'use client';
import { useI18n } from '@/lib/i18n';

export function AnyComponent() {
  const { t, locale } = useI18n();
  return <h1>{t('dash.headline')}</h1>;
}
```

New keys added in this patch you can start using:
- `auth.welcome_back`, `auth.continue_with_apple`, `auth.continue_with_google`, `auth.email`, `auth.password`, `auth.sign_in`, `auth.create_account_link`, etc.
- `topbar.sign_out`, `topbar.account`, `topbar.notifications`, `topbar.search`

Add more keys to the `translations` object as you need them.

---

## 4. Apple Sign-In — set up in Apple Developer

This is the part with the most steps. Budget ~20 minutes. **You need a paid Apple Developer account ($99/yr).**

### 4.1 Create an App ID

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **+** → **App IDs** → **App**
3. Description: `Operator AI`
4. Bundle ID: `app.operatorai.web` (or your reverse-domain preference)
5. Under Capabilities, check **Sign In with Apple**
6. Register.

### 4.2 Create a Services ID (this is what Supabase uses)

1. Same page, click **+** → **Services IDs**
2. Description: `Operator AI Web Auth`
3. Identifier: `app.operatorai.auth` (must be **different** from the App ID above)
4. Register.
5. Now click on the just-created Services ID → enable **Sign In with Apple** → click **Configure**:
   - **Primary App ID:** the one you made in 4.1
   - **Domains and Subdomains:**
     ```
     YOUR_SUPABASE_PROJECT.supabase.co
     operatoraiapp.com
     www.operatoraiapp.com
     ```
     (replace `YOUR_SUPABASE_PROJECT` with your real Supabase project subdomain)
   - **Return URLs:**
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
6. Save → Continue → Save.

### 4.3 Create a Sign-In Key

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click **+** → Key Name: `Operator AI Sign In`
3. Check **Sign In with Apple** → Configure → Primary App ID → the App ID from 4.1
4. Continue → Register → **Download the `.p8` file** (you can only download it once — keep it safe)
5. Note down:
   - **Key ID** (shown after creation)
   - **Team ID** (top-right of the Apple Developer page)
   - The Services ID from 4.2 (this acts as your "Client ID" in Supabase)

---

## 5. Configure Apple in Supabase

1. Go to your Supabase project → **Authentication** → **Providers** → **Apple**
2. Toggle **Enable Sign in with Apple**
3. Fill in:
   - **Client IDs (Services ID):** `app.operatorai.auth` (from step 4.2)
   - **Secret Key (for OAuth):** Supabase now auto-generates this. Click **"Generate a new secret"** and paste:
     - **Team ID:** from Apple Developer top-right
     - **Key ID:** from step 4.3
     - **Private Key:** paste the full contents of the `.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Supabase computes the JWT client secret for you. It expires every 6 months — rotate when needed.
4. **Callback URL (for OAuth):** Supabase shows it at the top — it should be `https://YOUR_PROJECT.supabase.co/auth/v1/callback`. This is what you entered as Return URL in step 4.2.
5. Save.

---

## 6. CSP — already covered

Your `next.config.js` CSP already allows `https://*.supabase.co`. Apple's OAuth redirects to Supabase which then redirects back to your domain. **No CSP change needed.**

---

## 7. Test

```bash
pnpm dev
```

1. Go to `http://localhost:3000/login`
2. Click **Continue with Apple**
3. Apple popup → authenticate → redirects to your `/auth/callback?code=...` → session exchanged → lands on `/dashboard`
4. Click the `🇪🇸 ES` toggle → every label in `t(...)` flips to Spanish instantly. Reloads via localStorage.

---

## 8. Production checklist before going live

- [ ] In Supabase → Auth → URL Configuration → **Site URL** = `https://operatoraiapp.com`
- [ ] Redirect URLs whitelist includes `https://operatoraiapp.com/auth/callback`
- [ ] Apple Services ID has `operatoraiapp.com` + `www.operatoraiapp.com` in Domains
- [ ] Redeploy on Vercel
- [ ] Test a real Apple sign-in on production

---

## Known gotchas

**"Invalid_client" from Apple:** Services ID not configured, or domain mismatch. Re-check step 4.2.

**"Email hidden"** (user's email is relay `@privaterelay.appleid.com`): this is normal — Apple offers email masking. Your app receives a unique masked email. Store `auth.users.email` as-is; Supabase handles it.

**Secret expired (every 6 months):** regenerate in Supabase Dashboard → Apple provider → "Generate a new secret" with the same `.p8` file. Zero downtime.

**Sign-up requires name, Apple only returns name on first sign-in:** capture it from `auth.users.raw_user_meta_data.full_name` on the callback. If you need to enforce a name later, add a profile-completion step after first login.

---

## Next patches (coming)

- **Streaming chat** (SSE) — if your `/chat` isn't already streaming.
- **PDF parsing** in Files & Analysis — using `mammoth` (already in deps) for docx + `pdf-parse` for PDFs.
- **Multi-tone campaigns** — if Campaigns module needs it.

Ping me when this one is deployed.
