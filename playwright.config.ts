import { defineConfig, devices } from '@playwright/test';

/**
 * 🧪 PLAYWRIGHT CONFIG
 *
 * Run: pnpm test:e2e
 * UI:  pnpm test:e2e:ui
 *
 * Test files: e2e/*.spec.ts
 * Base URL: PLAYWRIGHT_BASE_URL or http://localhost:3000
 */

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Fail build on CI if test.only left in
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Single worker locally for predictability; parallel in CI
  workers: process.env.CI ? 4 : 1,

  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Slow expectation: app might be slow on dev
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start dev server if base URL is localhost
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
