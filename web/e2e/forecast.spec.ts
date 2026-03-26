import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Cash Flow Forecast Page', () => {
  test.describe('unauthenticated', () => {
    test('redirects to login', async ({ page }) => {
      await page.goto('/forecast');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/forecast');
      await page.waitForLoadState('networkidle');
    });

    test('renders forecast page', async ({ page }) => {
      await expect(
        page.getByText(/cash flow forecast/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows summary stat cards', async ({ page }) => {
      await expect(page.getByText('Current Balance').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Projected Income').first()).toBeVisible();
      await expect(page.getByText('Projected Expenses').first()).toBeVisible();
    });

    test('displays forecast chart', async ({ page }) => {
      const chart = page.locator('[data-testid="forecast-chart"]');
      await expect(chart).toBeVisible({ timeout: 10000 });
    });

    test('has time range selector', async ({ page }) => {
      await expect(page.getByText('30 days')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('90 days')).toBeVisible();
      await expect(page.getByText('1 year')).toBeVisible();
    });

    test('can toggle time range', async ({ page }) => {
      await page.getByText('30 days').click();
      await page.waitForTimeout(1000);
      // Subtitle should update
      await expect(
        page.getByText(/30-day projection/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('can toggle estimates on/off', async ({ page }) => {
      const toggleBtn = page.locator('[data-testid="toggle-estimates"]');
      await expect(toggleBtn).toBeVisible({ timeout: 10000 });
      await toggleBtn.click();
      await page.waitForTimeout(500);
      // Should still render without error
      await expect(page.getByText('Current Balance').first()).toBeVisible();
    });

    test('shows projected events section', async ({ page }) => {
      await expect(
        page.getByText(/projected events/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows event filter tabs', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'all', exact: true })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: 'recurring', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'estimated', exact: true })).toBeVisible();
    });

    test('shows forecast summary sidebar', async ({ page }) => {
      await expect(page.getByText('Forecast Summary').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Net Cash Flow').first()).toBeVisible();
      await expect(page.getByText('Lowest Balance').first()).toBeVisible();
      await expect(page.getByText('Highest Balance').first()).toBeVisible();
    });

    test('shows about section', async ({ page }) => {
      await expect(
        page.getByText(/about this forecast/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('is accessible via sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const forecastLink = page.getByRole('link', { name: 'Forecast' });
      await expect(forecastLink).toBeVisible({ timeout: 10000 });
      await forecastLink.click();
      await expect(page).toHaveURL(/\/forecast/);
    });
  });
});
