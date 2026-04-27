# TestFlight + App Store Review Guide

> Manual steps to take this from code to App Store Review.
> Estimated time: 2-3 hours your work + 24-48h Apple Review.

## Prerequisites checklist

- [ ] Apple Developer account active ($99/year)
- [ ] Bundle ID `com.operatorai.app` registered in Apple Developer
- [ ] Provisioning profile generated (Xcode handles this automatically with auto-signing)
- [ ] App icon 1024x1024 PNG (no transparency, no rounded corners — Apple does that)
- [ ] Privacy policy URL public (already at https://www.operatoraiapp.com/legal/privacy)
- [ ] Support URL (e.g. https://www.operatoraiapp.com/support)

---

## Phase 1: Build for TestFlight (30-45 min)

### 1.1 Sync Capacitor
```bash
cd ~/Development/OperatorAI
pnpm build  # ensure web build is current (even though we use server.url)
npx cap sync ios
```

### 1.2 Open Xcode
```bash
npx cap open ios
```

### 1.3 In Xcode

**Signing & Capabilities tab:**
- Team: select your Apple Developer team
- Bundle Identifier: `com.operatorai.app`
- Auto-signing: ✓ enabled
- Capabilities: ensure these are added:
  - Sign in with Apple
  - Push Notifications (for later, when you configure APNs)

**Set version + build:**
- General tab → Identity:
  - Version: `1.0.0`
  - Build: `1`

**Set the build target:**
- Top toolbar → "Any iOS Device (arm64)" (NOT a simulator)

### 1.4 Archive
- Menu: `Product` → `Archive`
- Wait 3-5 min for build to complete
- Organizer window opens automatically

### 1.5 Upload to App Store Connect
- In Organizer window → select your archive → click `Distribute App`
- Method: `App Store Connect`
- Destination: `Upload`
- Re-sign options: keep defaults
- Click `Upload`
- Wait 10-15 min while Apple processes
- You'll get email when build is "Ready to test"

---

## Phase 2: TestFlight Internal Testing (15 min)

### 2.1 App Store Connect web

1. https://appstoreconnect.apple.com → Apps → Operator AI
2. TestFlight tab → wait for build to appear (status: "Processing" → "Ready to test")
3. Once ready, you may need to answer the **Export Compliance** question:
   - Does your app use encryption? → Usually **NO** if just HTTPS (which you do)
4. Build appears as "Ready to Test"

### 2.2 Internal Testing
- TestFlight → Internal Testing → "+" → New group "Internal Devs"
- Add your email + any team
- Apple sends invite within 1-2 min
- Open TestFlight app on your iPhone → Accept → Install

### 2.3 Test the app on real device
**Critical checks:**
- [ ] App opens without crash
- [ ] Web loads (https://www.operatoraiapp.com)
- [ ] Login works (Google/Apple)
- [ ] Camera permission asks → tap "Allow" → photo captures
- [ ] Photo upload to /campaigns/new works
- [ ] Variants generate
- [ ] Share button on variant opens native share sheet
- [ ] App backgrounds and resumes cleanly
- [ ] No "Untrusted Developer" errors

If any of these fail → fix before submitting Review.

---

## Phase 3: App Store listing (1-2 hours)

App Store Connect → Apps → Operator AI → "App Store" tab

### 3.1 App Information
- Name: `Operator AI`
- Subtitle (30 chars): `Your AI Marketing Agency`
- Category: Primary: `Business`, Secondary: `Productivity`
- Content Rights: ✓ "Does not contain, show, or access third-party content"

### 3.2 Pricing and Availability
- Price: Free (with IAP later) or set tier now
- Availability: All countries (or select)

### 3.3 Version Information (1.0.0)
**Description (4000 chars max):**
```
Operator AI is your in-pocket AI marketing agency. Upload a brief and 
your product photos — the agent researches your category, plans the 
campaign, generates 4 variants with vision-aware AI, critiques each 
result, and lets you edit any image with natural-language instructions.

What makes Operator AI different:
• Reads your actual product photos (not generic stock)
• Researches your real competitors (live web search)
• Self-evaluates each image and iterates if quality is low
• Agency-grade editor: "make it more cinematic", "warmer tones"
• 17 industry verticals with specialized aesthetics
• Bilingual: Spanish + English

Built for solo creators, small teams, and operators who need 
campaigns that look like they came from a $5k agency, not a 
template generator.
```

**Keywords (100 chars):**
```
ai,marketing,ads,campaign,creative,instagram,branding,social,studio,operator
```

**Support URL:** `https://www.operatoraiapp.com/support`
**Marketing URL** (optional): `https://www.operatoraiapp.com`

### 3.4 Screenshots

REQUIRED sizes:
- iPhone 6.7" (1290 x 2796): at least 3 screenshots
- iPhone 6.5" (1284 x 2778): at least 3 screenshots
- iPhone 5.5" (1242 x 2208): at least 3 screenshots

How to capture on real device:
1. Open app on iPhone 15 Pro Max (6.7")
2. Navigate to: dashboard, /campaigns/new, /campaigns (list), variant editor
3. Hold Volume Up + Side button → screenshot saved
4. AirDrop to Mac
5. For 6.5" and 5.5": use simulator
   - Xcode → Window → Devices and Simulators
   - Run on iPhone 11 Pro Max (6.5") and iPhone 8 Plus (5.5")
   - Cmd+S in simulator menu

### 3.5 App Icon
- Upload 1024x1024 PNG to "App Information"

### 3.6 Privacy
- Click "App Privacy" → walk through the questionnaire
- Honest answers: data collected = email, name (auth), photos (uploaded for processing)
- All linked to user identity? Yes (it's a personal account)
- Used for tracking? No

---

## Phase 4: Submit for Review (15 min)

1. App Store Connect → your app → Version 1.0.0
2. "Build" section → select your TestFlight build
3. Submit for Review
4. Apple may ask demo credentials if app needs login:
   - Username: `demo@operatoraiapp.com`
   - Password: `<temporary>`
   - Make sure this account works

5. Click `Submit for Review`

**Wait 24-72 hours.**

---

## Common Review rejections

- ❌ App is just a website wrapper → ✅ You have native value (Apple Sign-in, camera, share, IAP planned)
- ❌ No restore purchases button → ✅ Add when you wire IAP (Phase 5)
- ❌ Sign in with Apple missing → ✅ Already implemented
- ❌ Privacy descriptions missing → ✅ D2 patch adds them
- ❌ Crash on launch → ✅ Test thoroughly in TestFlight first

---

## Phase 5 (later): IAP

When ready:
1. Setup RevenueCat account (free tier)
2. Add `@capacitor-community/revenuecat` plugin
3. Create products in App Store Connect: `pro_monthly`, `pro_annual`
4. Configure in RevenueCat dashboard
5. Add restore purchases button
6. Submit version 1.1.0

---

## Quick reference

| Step | Time | Blocker |
|---|---|---|
| TestFlight build | 30-45 min | Xcode + Apple Dev |
| Test on device | 30 min | Real iPhone |
| Listing + screenshots | 1-2h | App Store Connect |
| Submit Review | 15 min | All above ready |
| Apple Review wait | 24-72h | None |

Total active time: ~3-4 hours your work.
