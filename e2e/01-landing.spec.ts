import { test, expect } from '@playwright/test';

// Skip splash + invocation overlays
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.sessionStorage.setItem('operator-invoked', '1');
    window.sessionStorage.setItem('operator.splash', '1');
  });
});

/**
 * 🏠 LANDING PAGE
 *
 * Verifica que la página de inicio carga, tiene el branding
 * Operator AI, y los CTAs principales funcionan.
 */

test.describe('Landing page', () => {
  test('loads with brand and CTAs', async ({ page }) => {
    await page.goto('/');

    // Branding presente
    await expect(page.locator('text=/Operator/i').first()).toBeVisible();

    // CTA principal: link a signup o login (cualquiera)
    const ctaCount = await page
      .locator('a[href="/signup"], a[href="/login"], button:has-text("Get started"), button:has-text("Empezar")')
      .count();
    expect(ctaCount).toBeGreaterThan(0);
  });

  test('pricing page is reachable', async ({ page }) => {
    await page.goto('/pricing');

    // Algún tipo de plan/precio visible
    await expect(page.locator('text=/Starter|Pro|Studio|Agency|\\$|€/').first()).toBeVisible({ timeout: 10_000 });
  });

  test('privacy page is reachable', async ({ page }) => {
    const response = await page.goto('/privacy');
    expect(response?.status()).toBeLessThan(400);
  });
});
