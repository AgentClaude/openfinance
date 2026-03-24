import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  timeout: isCI ? 20000 : 30000,
  fullyParallel: true,
  workers: isCI ? 3 : undefined,
  retries: isCI ? 1 : 1,
  outputDir: './e2e/results/test-artifacts',
  /* Exclude debug/utility tests that aren't meant for CI */
  testIgnore: isCI
    ? [
        '**/a11y-debug.spec.ts',
        '**/a11y-fix-check.spec.ts',
        '**/a11y-recheck.spec.ts',
        '**/marketing-screenshots.spec.ts',
        '**/recurring-screenshots.spec.ts',
        '**/design-qa.spec.ts',
      ]
    : [],
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
    screenshot: 'only-on-failure',
    video: isCI ? 'off' : 'retain-on-failure',
    trace: isCI ? 'off' : 'retain-on-failure',
    /* Prefer domcontentloaded over networkidle to avoid hangs */
    navigationTimeout: isCI ? 15000 : 30000,
    actionTimeout: isCI ? 10000 : 15000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  reporter: isCI
    ? [['list']]
    : [
        ['list'],
        ['html', { outputFolder: './e2e/results/html-report', open: 'never' }],
      ],
});
