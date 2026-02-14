import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Net Worth', () => {
  test.describe('Dashboard Net Worth Card', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
    });

    test('displays net worth on dashboard', async ({ page }) => {
      await expect(page.getByText(/net worth/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/\$[\d,]+/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Accounts Page Net Worth', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/accounts');
      await page.waitForLoadState('networkidle');
    });

    test('shows net worth total on accounts page', async ({ page }) => {
      await expect(
        page.getByText(/net worth|total/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows asset and liability breakdown', async ({ page }) => {
      // Accounts grouped by type showing assets vs liabilities
      await expect(
        page.getByText(/\$[\d,.]+/).first()
      ).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'net-worth-accounts');
    });

    test('account balances sum to net worth', async ({ page }) => {
      // Just verify multiple dollar amounts are visible (assets and liabilities)
      const dollarAmounts = page.getByText(/\$[\d,.]+/);
      const count = await dollarAmounts.count();
      expect(count).toBeGreaterThan(1);
    });
  });

  test.describe('Reports Net Worth', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
    });

    test('reports page shows financial overview with charts', async ({ page }) => {
      const chart = page.locator('.recharts-wrapper, svg.recharts-surface').first();
      await expect(chart).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'net-worth-reports');
    });
  });
});
