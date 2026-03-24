import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: isCI ? 3 : undefined,
  timeout: 30000,
  retries: 1,
  outputDir: './e2e/results/test-artifacts',
  testIgnore: isCI
    ? [
        '**/a11y-debug*',
        '**/a11y-fix-check*',
        '**/a11y-recheck*',
        '**/marketing-screenshots*',
        '**/recurring-screenshots*',
        '**/design-qa*',
      ]
    : [],
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
    screenshot: 'only-on-failure',
    video: isCI ? 'off' : 'retain-on-failure',
    trace: isCI ? 'off' : 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: './e2e/results/html-report', open: 'never' }],
  ],
});
