# Operator AI — App Store Submission Guide

## Prerequisites
- Mac with Xcode 15+ installed
- Apple Developer account ($99/year) — https://developer.apple.com/account
- CocoaPods: `sudo gem install cocoapods`
- Capacitor already installed (done)

---

## Step 1: Prepare Xcode Project

```bash
cd ~/operator-ai
npx cap sync ios
npx cap open ios
```

## Step 2: Configure in Xcode

1. **Select your Team**: Click on the project root (App) in the left sidebar → Signing & Capabilities → select your Apple Developer Team
2. **Bundle Identifier**: `com.operatorai.app`
3. **Display Name**: `Operator AI`
4. **Deployment Target**: iOS 16.0
5. **Device Orientation**: Portrait (recommended for first release)

## Step 3: App Icons

In Xcode → Assets.xcassets → AppIcon:
- Use the icons from `public/icons/` folder
- You need: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024 sizes
- Or use https://appicon.co to generate all sizes from `public/icon-512.png`

## Step 4: Launch Screen

In Xcode → LaunchScreen.storyboard:
- Set background color to #0A0A0B (dark)
- Add your logo centered
- Or keep the default Capacitor splash

## Step 5: Build & Test

1. Connect your iPhone via USB
2. Select your device in Xcode toolbar
3. Click ▶ Run
4. Test the full app on device

## Step 6: Archive & Upload

1. In Xcode: Product → Archive
2. Wait for archive to complete
3. Click "Distribute App" → App Store Connect → Upload
4. Wait for processing (10-30 min)

## Step 7: App Store Connect

Go to https://appstoreconnect.apple.com

### Create New App
- Platform: iOS
- Name: Operator AI
- Primary Language: English (U.S.)
- Bundle ID: com.operatorai.app
- SKU: operatorai-ios

### App Information
- Category: Business
- Secondary Category: Productivity
- Content Rights: Does not contain third-party content
- Age Rating: 4+ (no objectionable content)

### Privacy Policy
- URL: https://www.operatoraiapp.com/privacy

### App Privacy
- Data collected: Name, Email, Usage Data
- Purpose: App Functionality, Analytics
- Data linked to user: Yes

### Pricing
- Price: Free (in-app purchases for subscriptions)
- Availability: All territories

### In-App Purchases
If using Stripe (web-based billing):
- Apple requires that digital content purchased IN the app uses their IAP
- HOWEVER: SaaS/business tools can use external billing (Stripe) under "reader" rule
- Add a note in review notes explaining this is a business SaaS tool

### Screenshots Required
- 6.7" (iPhone 15 Pro Max): 1290 x 2796 px — AT LEAST 3
- 6.1" (iPhone 15 Pro): 1179 x 2556 px — AT LEAST 3
- Take screenshots of: Landing, Dashboard, Chat with image, Studio, Billing

### App Description (English)
```
Operator AI is the autonomous operations platform for brands and businesses.

Deploy missions — not prompts. One AI creative director that knows your brand, generates content, runs workflows, and tracks outcomes.

FEATURES:
• AI Creative Agent — chat, generate images, videos, and copy in one conversation
• Image Studio — editorial-grade imagery powered by Flux 2 Pro (1-4 variations per prompt)
• Video Studio — cinematic AI video with Google Veo 3.1
• Voice Mode — talk to your AI with push-to-talk and memory
• Brand OS — enforce your brand identity on every output
• Workflows — multi-step automations with real integrations
• Knowledge Base — upload documents, get AI-powered semantic search
• Integrations — Gmail, Calendar, Notion, Slack, and more
• Multilingual — full English and Spanish support

PLANS:
• Starter: $29/month — 500 messages, 50 images, 10 videos
• Pro: $99/month — 3,000 messages, 300 images, 100 videos
• Studio: $299/month — 15,000 messages, 1,500 images, team seats
• Agency: $999/month — unlimited, white-label, dedicated support

Start with a 7-day free trial. No credit card required.
```

### App Description (Spanish)
```
Operator AI es la plataforma de operaciones autonomas para marcas y empresas.

Despliega misiones, no prompts. Un director creativo de IA que conoce tu marca, genera contenido, ejecuta flujos de trabajo y mide resultados.

CARACTERISTICAS:
• Agente Creativo IA — chat, genera imagenes, videos y copy en una conversacion
• Estudio de Imagen — imagenes profesionales con Flux 2 Pro (1-4 variaciones por prompt)
• Estudio de Video — video cinematografico con Google Veo 3.1
• Modo Voz — habla con tu IA con push-to-talk y memoria
• Brand OS — aplica tu identidad de marca en cada salida
• Flujos de Trabajo — automatizaciones multi-paso con integraciones reales
• Base de Conocimiento — sube documentos, busqueda semantica con IA
• Integraciones — Gmail, Calendar, Notion, Slack y mas
• Multilingue — soporte completo en ingles y espanol

PLANES:
• Starter: 29 $/mes — 500 mensajes, 50 imagenes, 10 videos
• Pro: 99 $/mes — 3.000 mensajes, 300 imagenes, 100 videos
• Studio: 299 $/mes — 15.000 mensajes, 1.500 imagenes, asientos de equipo
• Agency: 999 $/mes — ilimitado, white-label, soporte dedicado

Empieza con una prueba gratis de 7 dias. Sin tarjeta de credito.
```

### Keywords (max 100 chars)
```
AI,branding,marketing,automation,content,image,video,creative,campaigns,social,copywriting,workflow
```

### Review Notes (for Apple reviewer)
```
Demo account for review:
Email: review@operatorai.app
Password: [create this account before submitting]

This is a SaaS business tool. Subscriptions are managed via Stripe (web-based billing portal) as permitted for business/SaaS applications under App Store guidelines 3.1.3(a) - "reader" apps and multi-platform services.

The app requires an internet connection to function as it connects to AI services (OpenAI, Anthropic, Google, Replicate) for content generation.

Privacy Policy: https://www.operatoraiapp.com/privacy
Terms of Service: https://www.operatoraiapp.com/terms
Support: https://www.operatoraiapp.com/support
Account Deletion: https://www.operatoraiapp.com/delete-account
```

---

## Checklist Before Submission

- [ ] App does not crash on any screen
- [ ] All navigation works (no dead ends)
- [ ] Login/Signup works
- [ ] Google OAuth works
- [ ] Chat generates responses
- [ ] Image generation works + images display
- [ ] Language toggle works (EN/ES)
- [ ] Billing page shows plans
- [ ] Privacy Policy accessible
- [ ] Terms of Service accessible
- [ ] Support page accessible
- [ ] Account deletion available
- [ ] No placeholder text visible
- [ ] No "coming soon" or "Week 8" text
- [ ] Screenshots taken on real device
- [ ] Review account created (review@operatorai.app)
- [ ] App icon displays correctly
- [ ] Splash screen shows on launch
