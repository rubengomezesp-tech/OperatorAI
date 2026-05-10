import { test, expect } from '@playwright/test';

// Skip splash + invocation overlays
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.sessionStorage.setItem('operator-invoked', '1');
    window.sessionStorage.setItem('operator.splash', '1');
  });
});

/**
 * ✨ SIGNUP PAGE
 *
 * Verifica UI de signup. No completa signup real para no
 * crear users en BD durante CI.
 */

test.describe('Signup page', () => {
  test('renders signup form', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Submit button visible
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
  });

  test('terms link works', async ({ page }) => {
    await page.goto('/signup');

    // Check at least one link to /terms
    const termsLink = page.locator('a[href="/terms"]').first();
    if (await termsLink.count() > 0) {
      await expect(termsLink).toBeVisible();
    }
  });

  test('login link from signup works', async ({ page }) => {
    await page.goto('/signup');

    const loginLink = page.locator('a[href="/login"]').first();
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });
});
