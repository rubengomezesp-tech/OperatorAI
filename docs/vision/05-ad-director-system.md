# Ad Director System — Plan Maestro

Operator AI deja de ser generador → pasa a Director Creativo + Diseñador + Editor.

## OBJETIVO
Cuando user pide "créame una publicidad", Operator construye pieza publicitaria final premium usando assets reales (logo, screenshot, avatar, fondo) con dirección creativa, composición visual y edición post-generación.

## ARQUITECTURA POR CAPAS

### CAPA 1 — Análisis de Assets (Vision)
Endpoint: `/api/ads/analyze-assets`
Input: imagen(es) base64
Output:
```json
{
  "type": "logo|screenshot|avatar|background",
  "dominantColors": ["#000000", "#D4AF37"],
  "style": "luxury|aggressive|minimalist|tech|dark",
  "hasText": true,
  "suggestedFormat": "9:16|1:1|4:5|16:9"
}
```
Tech: GPT-4o Vision API

### CAPA 2 — Director Creativo
Endpoint: `/api/ads/brief`
LLM: Claude Sonnet 4.5 con system prompt estructurado

Output:
```json
{
  "objective": "free-trial|signup|download|sale",
  "audience": "creators|brands|entrepreneurs",
  "pain": "no-strategy|wasted-time|low-conversion",
  "concept": "1 idea central — máx 8 palabras",
  "preset": "luxury-minimal|aggressive|clean-conversion|product-demo",
  "copy": {
    "headline": "DEJA DE PENSAR. EJECUTA.",
    "subheadline": "Tu IA para campañas que convierten",
    "cta": "EMPIEZA AHORA →"
  }
}
```

### CAPA 3 — Generación Visual Base
Endpoint: `/api/images/generate` (existente, prompt mejorado)

Reglas del prompt:
- SOLO visual premium (fondo, iluminación, atmósfera)
- Espacio negativo para typography
- NO pedir texto al modelo
- Prompt estructurado por preset

### CAPA 4 — Composición HTML/SVG (LA CLAVE TÉCNICA)
Tech: Satori (Vercel OG) + Resvg-js para render PNG
Endpoint: `/api/ads/compose`

Input: `{ baseImageUrl, copy, logoUrl, preset, aspectRatio }`
Output: PNG final montado por capas

Capas:
1. Imagen base (background)
2. Vignette gradient
3. Logo del usuario (top-left/center)
4. Headline (typography premium)
5. Subheadline
6. CTA button
7. Safe area mobile/story

### CAPA 5 — Multi-Formato
Recomposición real (no recorte):
- Story 9:16: texto arriba, CTA abajo, visual centro
- Post 1:1: headline izquierda, mockup derecha, CTA inferior
- Feed 4:5: vertical optimizado IG Ads
- Landscape 16:9: heroína horizontal

Cada uno regenera composición con safe-area específica.

### CAPA 6 — Edición Conversacional
"Más luxury" → ajustar preset sin regenerar todo
"Centra el símbolo" → ajustar composición
"CTA más potente" → cambiar copy.cta + estilo

LLM interpreta intención + decide qué capa modificar:
- Solo copy → recomponer (rápido)
- Solo visual → regenerar base
- Ambos → flujo completo

### CAPA 7 — Autocorrección
Checklist post-generación con GPT-4o Vision:
- ¿Texto legible en 1 segundo?
- ¿CTA visible?
- ¿Logo limpio?
- ¿Palabras inventadas en imagen?
- ¿Funciona en mobile?

Si falla → regenerar capa específica automáticamente.

## PRESETS

### LUXURY MINIMAL
- Espacio negativo masivo
- Tipografía elegante (Playfair)
- Dorado suave sobre negro
- Mensaje aspiracional

### AGGRESSIVE ADS
- Alto contraste
- Headline grande Inter Black
- Dorado intenso
- CTA fuerte

### CLEAN CONVERSION
- Mockup app protagonista
- Mensaje directo
- Menos decoración
- Para Meta Ads

### PRODUCT DEMO
- Screenshot app centro
- Función concreta
- CTA claro

## REGLAS DE CONVERSIÓN
- Headline: máx 6-8 palabras
- 1 subheadline máx
- CTA grande contraste
- Sin frases genéricas
- Sin saturar iconos
- Lectura en 1 segundo

## FLUJO USUARIO
User: "créame una publicidad con esto" + sube imágenes ↓ Operator analiza assets (CAPA 1) ↓ Genera brief creativo (CAPA 2) — 3 conceptos, elige el mejor ↓ Genera visual base premium (CAPA 3) ↓ Compone con HTML/SVG (CAPA 4) ↓ Autocorrige si falla (CAPA 7) ↓ Devuelve PNG + ofrece variantes:
Más luxury / agresiva / minimal
Story / Post / Feed## SPRINTS PLANIFICADOS

- Sprint 5: CAPA 1 (análisis) — 3h
- Sprint 6: CAPA 2 (director) — 2h
- Sprint 7: CAPA 3 (prompt visual) — 1h
- Sprint 8: CAPA 4 (composición Satori) — 4h ★ clave
- Sprint 9: CAPA 5 (multi-formato) — 2h
- Sprint 10: CAPA 6 (edición conversacional) — 2h
- Sprint 11: CAPA 7 (autocorrección) — 2h

Total: ~16h en 3-4 sesiones.

## DEPENDENCIAS NUEVAS
- `satori` (HTML/JSX → SVG)
- `@resvg/resvg-js` (SVG → PNG buffer)
- `sharp` (composición + resize, ya instalado probablemente)

## ESTADO INICIAL
Pendiente: Sprint 5 (CAPA 1).
Foundation técnica: Satori + Resvg setup.
