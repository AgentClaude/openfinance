import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Spending Insights Page', () => {
  test.describe('unauthenticated', () => {
    test('redirects to login', async ({ page }) => {
      await page.goto('/insights');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/insights');
      await page.waitForLoadState('networkidle');
    });

    test('renders insights page with header', async ({ page }) => {
      await expect(
        page.getByText(/spending insights/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows severity summary cards', async ({ page }) => {
      await expect(page.getByText('Critical').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Warnings').first()).toBeVisible();
      await expect(page.getByText('Info').first()).toBeVisible();
      await expect(page.getByText('Good News').first()).toBeVisible();
    });

    test('shows filter buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /All/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('shows empty state or insights list', async ({ page }) => {
      // Either show insights or the empty state
      const emptyState = page.getByText(/No insights yet|patterns emerge/i).first();
      const insightsList = page.locator('[data-testid="insights-list"]');
      await expect(emptyState.or(insightsList).first()).toBeVisible({ timeout: 10000 });
    });

    test('refresh button works', async ({ page }) => {
      const refreshBtn = page.getByRole('button', { name: /refresh/i });
      await expect(refreshBtn).toBeVisible({ timeout: 10000 });
      await refreshBtn.click();
      // Page should still be stable after refresh
      await expect(
        page.getByText(/spending insights/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('is accessible via sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const insightsLink = page.getByRole('link', { name: /insights/i });
      await expect(insightsLink).toBeVisible({ timeout: 10000 });
      await insightsLink.click();
      await expect(page).toHaveURL(/\/insights/);
      await expect(
        page.getByText(/spending insights/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('filter buttons toggle correctly', async ({ page }) => {
      // Wait for page to load
      await expect(page.getByText('Critical').first()).toBeVisible({ timeout: 10000 });

      // Click Critical filter
      const criticalBtn = page.getByRole('button', { name: /Critical/i }).first();
      await criticalBtn.click();

      // Click All filter to reset
      const allBtn = page.getByRole('button', { name: /All/i }).first();
      await allBtn.click();

      // Page should still be stable
      await expect(
        page.getByText(/spending insights/i).first()
      ).toBeVisible();
    });
  });
});
