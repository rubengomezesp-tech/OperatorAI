# 🎨 Style DNA System

> Sistema de identidades visuales nivel ChatGPT-pipeline para Operator AI.

## Filosofía

```
"Un estilo no es un look, es un sistema de decisiones."
                                    — Massimo Vignelli
```

Cada **Style DNA** es una identidad visual COMPLETA. No son templates ni mapeos
simplistas — son filosofías estéticas curadas con la profundidad de un Art
Director senior. Cada DNA contiene:

- **Tipografía** (familias reales, weights, tracking)
- **Paleta cromática** (foundation, primary, accent, forbidden)
- **Lighting** cinematográfico
- **Composition rules**
- **Cultural references** (marcas, artistas, eras, obras)
- **Mood semantics**
- **Material treatments**
- **Lo que el estilo RECHAZA** (igual de importante)

## Estructura

```
style-dna/
├── types.ts                          # Interfaces TypeScript
├── index.ts                          # API pública (entry point)
├── detector.ts                       # Multi-variant intent parser
├── composer.ts                       # Fusion engine (combinar 2-3 DNAs)
├── cultural-reference-engine.ts      # Resolver referencias libres
├── library/
│   ├── index.ts                      # Registry central
│   ├── design-movements.ts           # Bauhaus, Swiss, Memphis, Brutalism, Y2K
│   ├── brand-references.ts           # Apple, Nike, Pentagram, Yohji, Aesop
│   ├── cinematic.ts                  # Wes Anderson, Kubrick, Villeneuve, Ghibli, Tarkovsky
│   └── mood-emotional.ts             # Melancholy, Euphoria, Quiet, Urgent, Nostalgic
└── README.md                         # Este archivo
```

## DNAs Disponibles (20)

### Design Movements (5)
| DNA | Tagline | Intensity |
|-----|---------|-----------|
| `design-bauhaus-geometric` | Form follows function — primary shapes | bold |
| `design-swiss-international` | The grid is god. Helvetica is gospel. | moderate |
| `design-memphis-group-80s` | Color crimes, geometric chaos, postmodern joy | extreme |
| `design-brutalist-architectural` | Raw concrete. Bestial typography. | extreme |
| `design-y2k-chrome-millennium` | Liquid chrome, blob shapes, blue gradients | bold |

### Brand References (5)
| DNA | Tagline | Intensity |
|-----|---------|-----------|
| `brand-apple-keynote-minimal` | A black void. A product. Light from heaven. | subtle |
| `brand-nike-cinematic-athletic` | Sweat. Drama. Triumph. | bold |
| `brand-pentagram-systematic` | Type, system, intelligence. | moderate |
| `brand-yohji-yamamoto-noir` | Black is modest and arrogant at the same time | subtle |
| `brand-aesop-apothecary-minimal` | Scientific apothecary meets literary salon | subtle |

### Cinematic (5)
| DNA | Tagline | Intensity |
|-----|---------|-----------|
| `cinematic-wes-anderson-symmetric` | Pastel symmetry. Twee melancholy. | bold |
| `cinematic-kubrick-symmetric` | One-point perspective. Beauty as horror. | bold |
| `cinematic-villeneuve-vast` | Tiny human in vast brutalist landscape | extreme |
| `cinematic-studio-ghibli-painterly` | Watercolor skies. Wind through grass. | moderate |
| `cinematic-tarkovsky-poetic` | Long takes. Slow water. Time made visible. | moderate |

### Mood / Emotional (5)
| DNA | Tagline | Intensity |
|-----|---------|-----------|
| `mood-melancholy-rainy` | Edward Hopper meets Sofia Coppola | subtle |
| `mood-euphoria-celebration` | Confetti explosion. Glitter sweat. | extreme |
| `mood-quiet-contemplation` | Library at midnight. Time stopped. | subtle |
| `mood-urgent-revolutionary` | Protest poster. Type as scream. | extreme |
| `mood-nostalgic-polaroid` | Sun-bleached memory. Summer that already passed. | subtle |

## API Pública

### Detección de intent en user prompt

```typescript
import { detectMultiVariantIntent } from '@/lib/ads/style-dna';

const intent = detectMultiVariantIntent(
  "Hazme 3 ads: Wes Anderson, Yamamoto, y Memphis 80s"
);
// {
//   detected: true,
//   variantCount: 3,
//   styleDNAs: [wesAnderson, yohjiYamamoto, memphis],
//   remainingSlots: 0,
//   reason: "User requested 3 variants with 3 explicit DNAs",
//   matchedPhrases: ["wes anderson", "yamamoto", "memphis 80s"]
// }
```

### Búsqueda directa por alias

```typescript
import { findDNAByAlias } from '@/lib/ads/style-dna';

const dna = findDNAByAlias("brutalismo");
// → design-brutalist-architectural

const dna2 = findDNAByAlias("estilo Apple");
// → brand-apple-keynote-minimal
```

### Resolver referencias culturales libres

```typescript
import { resolveReference } from '@/lib/ads/style-dna';

const dna = resolveReference("Royal Tenenbaums");
// → cinematic-wes-anderson-symmetric (matched via references.works)

const dna2 = resolveReference("Edward Hopper");
// → mood-melancholy-rainy (matched via references.artists)

const dna3 = resolveReference("Spirited Away vibes");
// → cinematic-studio-ghibli-painterly (matched via references.works)
```

### Fusionar 2-3 DNAs

```typescript
import { fuseDNAs, findDNAByAlias } from '@/lib/ads/style-dna';

const apple = findDNAByAlias("apple")!;
const tarkovsky = findDNAByAlias("tarkovsky")!;

const result = fuseDNAs([apple, tarkovsky]);
if (result.ok) {
  console.log(result.fused.promptDirective);
  // → Apple's structure + Tarkovsky's poetic mood
}
```

### Stats de la library

```typescript
import { getLibraryStats } from '@/lib/ads/style-dna';

const stats = getLibraryStats();
// {
//   total: 20,
//   byCategory: { 'design-movement': 5, 'brand-reference': 5, ... },
//   byEra: { 'contemporary-2020s': 8, 'mid-century-1950s': 3, ... },
//   totalAliases: 320+
// }
```

## Reglas de fusión

1. **Máximo 3 DNAs** por fusión (más es caos visual).
2. **El primero es DOMINANTE** (su composición y tipografía mandan).
3. **Los demás aportan flavor** (paleta accent, mood, materiales).
4. **Forbidden combinations** se respetan estrictamente:
   - `design-memphis-group-80s` + `design-bauhaus-geometric` → ❌ rechazado
   - `mood-melancholy-rainy` + `mood-euphoria-celebration` → ❌ rechazado
5. **Pairs well with** se respetan como sugerencias positivas.

## Cómo añadir un nuevo DNA

1. Elige la categoría (`design-movements.ts`, `brand-references.ts`, etc.)
2. Crea el objeto siguiendo el interface `StyleDNA`:

```typescript
const NEW_DNA: StyleDNA = {
  id: 'category-name-variant',
  name: 'Display Name',
  tagline: 'One-line essence.',
  category: 'design-movement',
  era: 'contemporary-2020s',
  movement: 'modernism',
  intensity: 'bold',
  aliases: ['alias1', 'alias2', 'alias3', /* ES + EN */],
  archetypeBase: 'hero-typographic-apple',
  promptDirective: `
    Aesthetic philosophy: ...
    Typography: ...
    Composition: ...
    Color palette: ...
    Lighting: ...
    Cultural references: ...
    What this style REJECTS: ...
  `,
  palette: { foundation: [], primary: [], accent: [] },
  typography: { display: [], body: [] },
  references: { artists: [], works: [], eras: [] },
  moodKeywords: [],
  pairsWellWith: [],
  forbiddenCombinations: [],
  bestForVerticals: [],
};
```

3. Añade al export del archivo:

```typescript
export const DESIGN_MOVEMENT_DNAS = [
  // ...existing
  NEW_DNA,
];
```

4. El registry central (`library/index.ts`) lo recoge automáticamente.

## Roadmap

| Sprint | DNAs | Estado |
|--------|------|--------|
| Sprint 5 — Sesión 1 | 20 (foundation + core) | ✅ Done |
| Sprint 5 — Sesión 2 | +20 (fotográficos, marcas extra, eras) | ⏳ Pending |
| Sprint 5 — Sesión 3 | +20 (cinematográficos restantes, regionales) | ⏳ Pending |
| Sprint 5 — Sesión 4 | +20 (movimientos restantes, edge cases) | ⏳ Pending |
| Sprint 5 — Sesión 5 | Refinamiento + A/B testing real | ⏳ Pending |
| **Total objetivo** | **80+ DNAs** | |

## Integración con vertical-knowledge.ts

El sistema **NO sustituye** `vertical-knowledge.ts` (DNA por industria).
Son **complementarios**:

```
┌────────────────────────────────────────────────────────────┐
│  USER PROMPT                                               │
│  "Hazme un ad de relojería de lujo estilo Wes Anderson"    │
└────────────────────────────────────────────────────────────┘
                  ↓                      ↓
       ┌─────────────────────┐   ┌─────────────────────┐
       │ vertical-knowledge  │   │ style-dna           │
       │                     │   │                     │
       │ → "luxury watch"    │   │ → wes-anderson DNA  │
       │   industry context  │   │   visual identity   │
       │   photography refs  │   │   typography rules  │
       │   lighting standards│   │   palette           │
       │   composition norms │   │   cultural refs     │
       └─────────────────────┘   └─────────────────────┘
                  ↓                      ↓
       ┌────────────────────────────────────────────┐
       │  brain-bridge.ts (orchestrator)            │
       │  Combina ambos en un prompt enriquecido    │
       └────────────────────────────────────────────┘
                            ↓
                     gpt-image-2 / Flux
                            ↓
                       Generated Ad
```

## License

Internal Operator AI module. Not for redistribution.
