import { test, expect } from '@playwright/test';

// Skip splash + invocation overlays
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.sessionStorage.setItem('operator-invoked', '1');
    window.sessionStorage.setItem('operator.splash', '1');
  });
});

/**
 * 🔒 PROTECTED ROUTES
 *
 * Verifica que rutas autenticadas redirigen a login si
 * no hay sesión activa.
 */

test.describe('Protected routes', () => {
  const protectedRoutes = [
    '/chat',
    '/campaigns',
    '/knowledge',
    '/brand-os',
    '/settings/integrations',
    '/settings/billing',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login when not authenticated`, async ({ page }) => {
      await page.goto(route);

      // Should redirect to login (or similar auth page)
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
      const url = page.url();

      const isProtected =
        url.includes('/login') ||
        url.includes('/signup') ||
        url.includes('/welcome') ||
        url.includes('/auth');

      expect(isProtected).toBeTruthy();
    });
  }
});
