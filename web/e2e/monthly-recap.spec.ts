import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Monthly Recap', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/monthly-recap');
    await page.waitForLoadState('networkidle');
  });

  test('shows monthly recap page with header', async ({ page }) => {
    await expect(page.getByText(/monthly recap/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'monthly-recap-page');
  });

  test('shows month navigation', async ({ page }) => {
    await expect(page.getByLabel(/previous month/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/next month/i)).toBeVisible();
  });

  test('shows summary stat cards', async ({ page }) => {
    await expect(page.getByText(/income/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/expenses/i).first()).toBeVisible();
    await expect(page.getByText(/saved/i).first()).toBeVisible();
    await expect(page.getByText(/savings rate/i).first()).toBeVisible();
  });

  test('shows net worth section', async ({ page }) => {
    await expect(page.getByText(/net worth/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/assets/i).first()).toBeVisible();
    await expect(page.getByText(/liabilities/i).first()).toBeVisible();
  });

  test('shows spending by category', async ({ page }) => {
    await expect(page.getByText(/spending by category/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows daily spending chart', async ({ page }) => {
    await expect(page.getByText(/daily spending/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows top merchants', async ({ page }) => {
    await expect(page.getByText(/top merchants/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows recurring bills section', async ({ page }) => {
    await expect(page.getByText(/recurring bills/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/monthly recurring/i)).toBeVisible();
    await expect(page.getByText(/bills due/i)).toBeVisible();
  });

  test('shows highlights section', async ({ page }) => {
    await expect(page.getByText(/highlights/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows month-over-month comparison', async ({ page }) => {
    await expect(page.getByText(/month-over-month/i)).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to previous month', async ({ page }) => {
    await expect(page.getByText(/monthly recap/i).first()).toBeVisible({ timeout: 10000 });
    const prevButton = page.getByLabel(/previous month/i);
    await prevButton.click();
    // Page should re-render with new data
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/monthly recap/i).first()).toBeVisible();
    await takeScreenshot(page, 'monthly-recap-previous-month');
  });

  test('next month button is disabled on current month', async ({ page }) => {
    await expect(page.getByText(/monthly recap/i).first()).toBeVisible({ timeout: 10000 });
    const nextButton = page.getByLabel(/next month/i);
    await expect(nextButton).toBeDisabled();
  });

  test('shows links to detail pages', async ({ page }) => {
    await expect(page.getByText(/monthly recap/i).first()).toBeVisible({ timeout: 10000 });
    // Should have links to reports, net worth, budget, recurring
    await expect(page.getByRole('link', { name: /view details/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /reports/i }).first()).toBeVisible();
  });

  test('appears in sidebar navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: /monthly recap/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
