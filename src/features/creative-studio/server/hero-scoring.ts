import 'server-only';
import type { ImageAnalysis, HeroScore } from '../types';

const PRODUCT_KEYWORDS = [
  'create', 'generate', 'dashboard', 'studio', 'campaign', 'campana', 'campana',
  'new', 'nuevo', 'nueva', 'workspace', 'project', 'proyecto', 'build', 'crear',
  'upload', 'subir', 'analyze', 'analizar', 'export', 'exportar', 'brand', 'marca',
];

const PLACEHOLDER_KEYWORDS = [
  'lorem', 'placeholder', 'test', 'demo', 'example', 'ejemplo',
];

/**
 * Deterministic hero scoring.
 * hero_score = UI_richness + content_clarity + product_keyword_bonus + brand_coherence - penalties
 *
 * Range: roughly -40 to +125
 */
export function scoreHeroCandidates(analyses: ImageAnalysis[]): HeroScore[] {
  const logoColors = new Set(
    analyses
      .filter((a) => a.role === 'logo')
      .flatMap((a) => a.dominantColors.map((c) => c.toLowerCase())),
  );

  return analyses
    .map((a) => {
      let score = 0;
      const reasons: string[] = [];

      // UI_richness (0-40)
      const uiCount = a.uiElements.length;
      if (uiCount >= 5) {
        score += 40;
        reasons.push('UI rich (+40)');
      } else if (uiCount >= 3) {
        score += 25;
        reasons.push('UI moderate (+25)');
      } else if (uiCount >= 1) {
        score += 10;
        reasons.push('UI minimal (+10)');
      }

      // content_clarity (0-30)
      const legibleText = a.visibleText.filter(
        (t) => t && !t.toLowerCase().includes('illegible'),
      );
      if (legibleText.length >= 3) {
        score += 30;
        reasons.push('Clear text (+30)');
      } else if (legibleText.length >= 1) {
        score += 15;
        reasons.push('Some text (+15)');
      }

      // product_keyword_bonus (0-15)
      const hasProductKeyword = legibleText.some((t) =>
        PRODUCT_KEYWORDS.some((k) => t.toLowerCase().includes(k)),
      );
      if (hasProductKeyword) {
        score += 15;
        reasons.push('Product keyword (+15)');
      }

      // brand_coherence (0-20)
      if (logoColors.size > 0) {
        const shared = a.dominantColors.filter((c) =>
          logoColors.has(c.toLowerCase()),
        ).length;
        if (shared >= 2) {
          score += 20;
          reasons.push('Brand match (+20)');
        } else if (shared === 1) {
          score += 10;
          reasons.push('Brand partial (+10)');
        }
      }

      // penalties
      if (a.role === 'logo') {
        score -= 30;
        reasons.push('Is logo (-30)');
      }
      if (a.role === 'lifestyle') {
        score -= 20;
        reasons.push('Lifestyle (-20)');
      }
      if (a.screenType === 'settings') {
        score -= 15;
        reasons.push('Settings page (-15)');
      }
      const hasPlaceholder = legibleText.some((t) =>
        PLACEHOLDER_KEYWORDS.some((k) => t.toLowerCase().includes(k)),
      );
      if (hasPlaceholder) {
        score -= 10;
        reasons.push('Placeholder content (-10)');
      }

      return { index: a.index, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Assign roles based on deterministic scoring.
 * Preserves existing logo detection from vision layer.
 * Highest non-logo score -> hero
 * Next 2 scores -> feature
 * Rest -> support
 */
export function assignRolesByScore(analyses: ImageAnalysis[]): ImageAnalysis[] {
  const scores = scoreHeroCandidates(analyses);
  const logoIdxs = new Set(
    analyses.filter((a) => a.role === 'logo').map((a) => a.index),
  );

  const nonLogo = scores.filter((s) => !logoIdxs.has(s.index));
  const heroIdx = nonLogo[0]?.index;
  const featureIdxs = new Set(nonLogo.slice(1, 3).map((s) => s.index));

  return analyses.map((a) => {
    if (logoIdxs.has(a.index)) return a;
    if (a.index === heroIdx) return { ...a, role: 'hero' as const };
    if (featureIdxs.has(a.index)) return { ...a, role: 'feature' as const };
    return { ...a, role: 'support' as const };
  });
}

export function hasQualityInputs(analyses: ImageAnalysis[]): {
  hasLogo: boolean;
  heroScore: number;
  featureCount: number;
  canDoFullPlan: boolean;
} {
  const scores = scoreHeroCandidates(analyses);
  const topScore = scores[0]?.score || 0;
  const goodCount = scores.filter((s) => s.score > 50).length;

  return {
    hasLogo: analyses.some((a) => a.role === 'logo'),
    heroScore: topScore,
    featureCount: Math.max(0, goodCount - 1),
    canDoFullPlan: topScore >= 50 && goodCount >= 2,
  };
}
