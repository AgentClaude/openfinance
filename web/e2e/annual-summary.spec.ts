import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Annual Summary / Year in Review', () => {
  test.describe('unauthenticated', () => {
    test('redirects to login', async ({ page }) => {
      await page.goto('/year-in-review');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/year-in-review');
      await page.waitForLoadState('networkidle');
    });

    test('renders the page with header', async ({ page }) => {
      await expect(
        page.getByText(/Year in Review/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows year selector with navigation arrows', async ({ page }) => {
      const currentYear = new Date().getFullYear().toString();
      await expect(page.getByText(currentYear).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel('Previous year')).toBeVisible();
      await expect(page.getByLabel('Next year')).toBeVisible();
    });

    test('shows KPI stat cards or empty state', async ({ page }) => {
      const kpis = page.locator('[data-testid="kpi-cards"]');
      const emptyState = page.getByText(/No data for/i).first();
      await expect(kpis.or(emptyState).first()).toBeVisible({ timeout: 10000 });
    });

    test('navigates to previous year', async ({ page }) => {
      await page.waitForTimeout(2000); // Wait for data to load
      const prevButton = page.getByLabel('Previous year');
      await prevButton.click();
      const prevYear = (new Date().getFullYear() - 1).toString();
      await expect(page.getByText(prevYear).first()).toBeVisible({ timeout: 5000 });
    });

    test('shows annual summary content when data exists', async ({ page }) => {
      // Either shows the full summary or an empty state
      const summary = page.locator('[data-testid="annual-summary-page"]');
      await expect(summary).toBeVisible({ timeout: 10000 });
    });

    test('disables next year button when at current year', async ({ page }) => {
      await page.waitForTimeout(1000);
      const nextButton = page.getByLabel('Next year');
      await expect(nextButton).toBeDisabled();
    });

    test('accessible via sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const sidebarLink = page.getByRole('link', { name: /Year in Review/i });
      await expect(sidebarLink).toBeVisible({ timeout: 10000 });
      await sidebarLink.click();
      await expect(page).toHaveURL(/\/year-in-review/);
    });
  });
});
