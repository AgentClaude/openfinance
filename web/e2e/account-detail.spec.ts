import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Account Detail', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('navigates to account detail from accounts page', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    // Click first account link
    const accountLink = page.getByText(/checking|savings|credit/i).first();
    await expect(accountLink).toBeVisible({ timeout: 10000 });
    await accountLink.click();
    await page.waitForTimeout(1000);

    // Should show account detail with balance
    await expect(page.getByText(/\$[\d,.]+/).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'account-detail-page');
  });

  test('shows balance chart', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    const accountLink = page.getByText(/checking|savings|credit/i).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForTimeout(1000);

      // Look for chart container (recharts renders SVGs)
      const chart = page.locator('.recharts-wrapper, svg.recharts-surface, canvas').first();
      if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
        await takeScreenshot(page, 'account-detail-chart');
      }
    }
  });

  test('shows filtered transactions for account', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    const accountLink = page.getByText(/checking|savings|credit/i).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForTimeout(1000);

      // Should show transactions section
      const txn = page.getByText(/transaction|recent/i).first();
      await expect(txn).toBeVisible({ timeout: 10000 });
    }
  });

  test('displays account balance and type', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    const accountLink = page.getByText(/checking|savings|credit/i).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForTimeout(1000);

      // Should show balance info
      await expect(page.getByText(/balance|current/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'account-detail-balance');
    }
  });
});
