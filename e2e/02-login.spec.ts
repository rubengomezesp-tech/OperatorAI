import { test, expect } from '@playwright/test';

/**
 * 🔐 LOGIN PAGE
 *
 * Verifica UI de login (sin credenciales reales — solo flow visual).
 *
 * NOTE: Skips InvocationSequence cinematic overlay by setting
 * sessionStorage flag before navigation.
 */

// Skip Invocation Sequence overlay before each test
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.sessionStorage.setItem('operator-invoked', '1');
    window.sessionStorage.setItem('operator.splash', '1');
  });
});

test.describe('Login page', () => {
  test('renders email + password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
  });

  test('forgot password link works', async ({ page }) => {
    await page.goto('/login');

    const forgotLink = page.locator('a[href="/forgot-password"]');
    if (await forgotLink.count() > 0) {
      await forgotLink.first().click();
      await expect(page).toHaveURL(/forgot-password/);
    }
  });

  test('signup link from login works', async ({ page }) => {
    await page.goto('/login');

    const signupLink = page.locator('a[href="/signup"]').first();
    if (await signupLink.count() > 0) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup/);
    }
  });

  test('rejects invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.waitFor({ state: 'visible' });
    await passwordInput.waitFor({ state: 'visible' });

    await emailInput.fill('nonexistent@test-e2e.com');
    await passwordInput.fill('wrong-password-123');

    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    await submitButton.click();

    await page.waitForTimeout(2500);
    const url = page.url();
    expect(url).not.toContain('/chat');
    expect(url).not.toContain('/onboarding');
  });
});
