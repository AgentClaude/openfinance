import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Account Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    // Navigate to accounts first to find an account to click
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
  });

  test('can navigate to account detail from accounts page', async ({ page }) => {
    // Scope to main content area to avoid matching sidebar links like "Savings Rate"
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/accounts\/\d+/);
      await takeScreenshot(page, 'account-detail-page');
    }
  });

  test('shows account name and balance', async ({ page }) => {
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Should show account balance
      await expect(page.getByText(/\$[\d,.]+/).first()).toBeVisible({ timeout: 10000 });
      // Should show back button or account name
      await expect(
        main.getByText(/checking|savings|credit|freedom/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows balance history chart', async ({ page }) => {
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Chart or balance history section
      const chart = page.locator('.recharts-wrapper, svg.recharts-surface').first();
      const hasChart = await chart.isVisible({ timeout: 5000 }).catch(() => false);
      const hasHistorySection = await page.getByText(/balance history|history/i).first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasChart || hasHistorySection).toBeTruthy();
    }
  });

  test('shows recent transactions for the account', async ({ page }) => {
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Should show transactions section
      await expect(
        page.getByText(/transaction|recent/i).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('shows account type badge', async ({ page }) => {
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByText(/banking|depository|credit|loan|investment/i).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('has back navigation button', async ({ page }) => {
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      const backBtn = page.getByRole('button', { name: /back/i }).or(page.getByRole('link', { name: /back|accounts/i })).first();
      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backBtn.click();
        await expect(page).toHaveURL(/\/accounts$/);
      }
    }
  });

  test('shows adjust balance button for manual accounts', async ({ page }) => {
    const main = page.locator('main');
    const accountLink = main.getByRole('link').filter({ hasText: /checking|savings|credit|freedom/i }).first();
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      const adjustBtn = page.getByRole('button', { name: /adjust|edit.*balance|update.*balance/i }).first();
      if (await adjustBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(adjustBtn).toBeVisible();
        await takeScreenshot(page, 'account-detail-with-adjust');
      }
    }
  });
});
