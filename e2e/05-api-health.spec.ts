import { test, expect } from '@playwright/test';

/**
 * ❤️ API HEALTH CHECKS
 *
 * Verifica que endpoints públicos responden, y que endpoints
 * protegidos rechazan correctamente cuando no hay auth.
 */

test.describe('API health', () => {
  test('public endpoints return 200 or 401 (not 500)', async ({ request }) => {
    const endpoints = [
      '/api/auth/session',
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(endpoint);
      expect(res.status()).toBeLessThan(500);
    }
  });

  test('protected endpoints reject unauthenticated', async ({ request }) => {
    const protectedEndpoints = [
      { path: '/api/campaigns/list', method: 'GET' },
      { path: '/api/knowledge/list', method: 'GET' },
      { path: '/api/integrations/list', method: 'GET' },
    ];

    for (const ep of protectedEndpoints) {
      const res = ep.method === 'GET'
        ? await request.get(ep.path)
        : await request.post(ep.path, { data: {} });

      // 401 Unauthorized OR 403 Forbidden expected
      // Should NOT be 500 (server error) or 200 (auth bypass)
      expect([401, 403]).toContain(res.status());
    }
  });

  test('invalid POST body returns 400 (not 500)', async ({ request }) => {
    // Endpoint que requiere auth — debe rechazar antes de validar body
    const res = await request.post('/api/integrations/connect', {
      data: { invalid: 'body' },
    });

    // Esperamos 401 (no auth) — NO 500
    expect(res.status()).toBeLessThan(500);
  });
});
