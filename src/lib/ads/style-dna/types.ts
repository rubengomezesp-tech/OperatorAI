/**
 * 🎨 STYLE DNA SYSTEM — Type Definitions
 *
 * Sistema de "Creative DNA" inspirado en cómo piensa un Art Director
 * de élite (Pentagram, Sagmeister, Wieden+Kennedy):
 * 
 *   - Cada DNA es una identidad visual COMPLETA
 *   - No son "templates" — son filosofías estéticas
 *   - Se pueden COMPONER (fusión de 2-3 DNAs)
 *   - Capturan referencias culturales reales (marcas, eras, movimientos)
 *
 * Filosofía:
 *   "Un estilo no es un look, es un sistema de decisiones."
 *   — Massimo Vignelli
 */

export type StyleEra =
  | 'baroque-1600s'
  | 'art-nouveau-1890s'
  | 'art-deco-1920s'
  | 'bauhaus-1920s'
  | 'mid-century-1950s'
  | 'swiss-1960s'
  | 'memphis-1980s'
  | 'cyberpunk-1980s'
  | 'y2k-millennium'
  | 'minimalist-2010s'
  | 'contemporary-2020s'
  | 'timeless';

export type StyleMovement =
  | 'swiss-international'
  | 'japanese-minimalism'
  | 'memphis-group'
  | 'brutalism'
  | 'postmodernism'
  | 'vaporwave'
  | 'documentary-realism'
  | 'surrealism'
  | 'maximalism'
  | 'deconstructivism'
  | 'modernism'
  | 'cinematic-naturalism';

export type StyleIntensity = 'subtle' | 'moderate' | 'bold' | 'extreme';

export type StyleCategory =
  | 'design-movement'    // Bauhaus, Swiss, Memphis...
  | 'photographic'        // Fashion editorial, documentary, product...
  | 'cinematic'           // Wes Anderson, Kubrick, Villeneuve...
  | 'brand-reference'     // Apple, Nike, Pentagram, Yohji...
  | 'mood-emotional'      // Melancholy, euphoria, quiet...
  | 'cultural-regional'   // Japanese, Mexican folk, Nordic...
  | 'mixed-fusion'
  | 'era-historical';       // Combinaciones especiales

/**
 * STYLE DNA — La unidad fundamental del sistema.
 * 
 * Cada DNA es un objeto que codifica TODO lo que un Art Director
 * decidiría para una pieza con esa identidad visual:
 *   - Tipografía (referencias REALES)
 *   - Paleta cromática (con justificación)
 *   - Lighting cinematográfico
 *   - Composition rules
 *   - Cultural references (marcas/personas/eras)
 *   - Mood y semantics
 *   - Material treatments
 *   - Lo que REJECTS (igual de importante)
 */
export interface StyleDNA {
  /** Identifier único (ej: 'minimal-japanese-zen') */
  id: string;

  /** Nombre humano para display */
  name: string;

  /** Una línea que captura la esencia */
  tagline: string;

  /** Categoría taxonómica */
  category: StyleCategory;

  /** Era histórica de origen */
  era: StyleEra;

  /** Movimiento artístico */
  movement: StyleMovement;

  /** Intensidad visual (subtle = invisible, extreme = en tu cara) */
  intensity: StyleIntensity;

  /**
   * Aliases en lenguaje natural — palabras/frases que el usuario
   * podría usar para invocar este DNA.
   * 
   * Multilingüe: español + inglés + referencias culturales.
   * Ejemplo: ['minimalista', 'minimal', 'zen', 'kanso', 'wabi-sabi',
   *          'muji style', 'aesop minimal', 'apple keynote']
   */
  aliases: string[];

  /** Archetype base que mejor encaja con este DNA */
  archetypeBase: string;

  /**
   * EL CORAZÓN DEL DNA — Prompt directive completo.
   * 
   * Este es un prompt cinematográfico extenso (300-600 palabras)
   * que se inyecta al gpt-image-2 para que genere con esta
   * identidad visual exacta.
   * 
   * Estructura recomendada:
   *   1. Aesthetic philosophy (1-2 frases conceptuales)
   *   2. Typography (display + body, weights, families REALES)
   *   3. Composition rules (grid, balance, hierarchy)
   *   4. Color palette (con justificación)
   *   5. Lighting specifications (si aplica)
   *   6. Camera/lens (si aplica)
   *   7. Cultural references (marcas/eras/personas)
   *   8. Movement/energy
   *   9. Texture/material
   *   10. What this style REJECTS
   */
  promptDirective: string;

  /**
   * Paleta de colores característica.
   * Usado tanto para inyectar al prompt como para previews UI.
   */
  palette: {
    foundation: string[];     // Colores base (background)
    primary: string[];         // Colores principales
    accent: string[];          // Colores de acento (uso limitado)
    forbidden?: string[];      // Colores que NUNCA aparecerían
  };

  /**
   * Tipografías de referencia (familias REALES).
   * El renderer las usa como inspiración semántica.
   */
  typography: {
    display: string[];         // Para headlines (ej: ['Inter Display', 'Söhne'])
    body: string[];            // Para body (ej: ['Inter', 'Helvetica Neue'])
    accent?: string[];         // Para detalles (ej: monospace, serif italic)
  };

  /**
   * Cultural touchstones — qué referencias evoca.
   * Usado para que el modelo entienda el "spiritual lineage".
   */
  references: {
    brands?: string[];         // Apple, Aesop, Muji...
    artists?: string[];        // Massimo Vignelli, Wes Anderson...
    eras?: string[];           // "Swiss design 1960s"
    works?: string[];          // "Penguin Classics covers"
  };

  /**
   * Mood/emotional keywords.
   * Lo que el viewer DEBE sentir al ver una pieza con este DNA.
   */
  moodKeywords: string[];

  /**
   * DNAs con los que combina BIEN (para fusiones).
   * Ejemplo: 'minimal-japanese-zen' + 'cinematic-tarkovsky' = poesía visual
   */
  pairsWellWith?: string[];

  /**
   * DNAs con los que CHOCA (no fusionar).
   * Ejemplo: 'minimal-japanese-zen' + 'memphis-80s-maximal' = caos estético
   */
  forbiddenCombinations?: string[];

  /**
   * Verticales para los que este DNA funciona MEJOR.
   * Ejemplo: ['fashion-luxury', 'tech-saas', 'beauty-clean']
   */
  bestForVerticals?: string[];

  /**
   * Verticales para los que este DNA NO funciona.
   * Ejemplo: 'minimal-japanese-zen' no encaja en 'food-fast' o 'kids-toys'
   */
  forbiddenForVerticals?: string[];
}

/**
 * Resultado de detectar multi-variant intent en un user prompt.
 */
export interface MultiVariantIntent {
  /** Si se detectó intent de múltiples estilos */
  detected: boolean;

  /** Número de variantes solicitadas (default 1) */
  variantCount: number;

  /** Style DNAs detectados en orden de aparición */
  styleDNAs: StyleDNA[];

  /** Si quedan slots después de los DNAs específicos */
  remainingSlots: number;

  /** Razón de detección (debug/logging) */
  reason: string;

  /** Texto original que disparó la detección (debug) */
  matchedPhrases: string[];
}

/**
 * Resultado de fusionar 2 o 3 DNAs en una identidad híbrida.
 */
export interface FusedDNA {
  /** ID compuesto (ej: 'minimal-japanese+cinematic-tarkovsky') */
  id: string;

  /** Nombre legible de la fusión */
  name: string;

  /** Los DNAs base que se fusionaron */
  sources: StyleDNA[];

  /** Prompt directive resultante (combinación inteligente) */
  promptDirective: string;

  /** Paleta combinada (intersección o blending) */
  palette: StyleDNA['palette'];

  /** Tipografía dominante */
  typography: StyleDNA['typography'];
}
