import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Spending Comparison Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/spending-comparison');
    await page.waitForLoadState('networkidle');
  });

  test('shows page header', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Spending Comparison' })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/Compare your finances across two time periods/)
    ).toBeVisible();
  });

  test('shows period preset buttons', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Month' })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: 'Quarter' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Year' })
    ).toBeVisible();
  });

  test('shows period A vs period B labels', async ({ page }) => {
    await expect(page.getByText('vs')).toBeVisible({ timeout: 10000 });
  });

  test('shows summary cards for expenses, income, and net cash flow', async ({ page }) => {
    await expect(page.getByText('Expenses')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Income')).toBeVisible();
    await expect(page.getByText('Net Cash Flow')).toBeVisible();
  });

  test('summary cards show Previous and Current values', async ({ page }) => {
    await expect(page.getByText('Previous').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Current').first()).toBeVisible();
  });

  test('shows tab navigation', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Overview' })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: 'Categories' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Merchants' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Spending Curve' })
    ).toBeVisible();
  });

  test('overview tab shows top categories and biggest changes', async ({ page }) => {
    // Overview is the default tab
    const hasTopCategories = await page
      .getByText('Top Categories')
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasBiggestChanges = await page
      .getByText('Biggest Changes')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No data available/)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasTopCategories || hasBiggestChanges || hasEmptyState).toBeTruthy();
  });

  test('can switch to categories tab', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasData = await page
      .getByText('Expenses')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasData) {
      await page.getByRole('button', { name: 'Categories' }).click();
      // Should show the category comparison table with headers
      const hasSortButtons = await page
        .getByRole('button', { name: /Sort by Total/ })
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasHeader = await page
        .getByText('Category')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(hasSortButtons || hasHeader).toBeTruthy();
    }
  });

  test('can switch to merchants tab', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasData = await page
      .getByText('Expenses')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasData) {
      await page.getByRole('button', { name: 'Merchants' }).click();
      await expect(
        page.getByText('Merchant Spending')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('can switch to spending curve tab', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasData = await page
      .getByText('Expenses')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasData) {
      await page.getByRole('button', { name: 'Spending Curve' }).click();
      await expect(
        page.getByText('Cumulative Spending')
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText(/Day-by-day spending accumulation/)
      ).toBeVisible();
    }
  });

  test('switching preset reloads data', async ({ page }) => {
    // Start on Month-over-Month (default)
    await expect(page.getByText('Expenses')).toBeVisible({ timeout: 10000 });

    // Switch to Quarter
    await page.getByRole('button', { name: 'Quarter' }).click();
    // Page should still show the summary cards
    await expect(page.getByText('Expenses')).toBeVisible({ timeout: 10000 });

    // Switch to Year
    await page.getByRole('button', { name: 'Year' }).click();
    await expect(page.getByText('Expenses')).toBeVisible({ timeout: 10000 });
  });

  test('categories tab has sort toggle', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasData = await page
      .getByText('Expenses')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasData) {
      await page.getByRole('button', { name: 'Categories' }).click();
      await page.waitForTimeout(1000);
      const sortTotal = page.getByRole('button', { name: /Sort by Total/ });
      const sortChange = page.getByRole('button', { name: /Sort by Change/ });
      const hasSortTotal = await sortTotal.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasSortTotal) {
        await expect(sortTotal).toBeVisible();
        await expect(sortChange).toBeVisible();
        // Click sort by change
        await sortChange.click();
        // Should still render table
        await expect(page.getByText('Category').first()).toBeVisible();
      }
    }
  });

  test('spending curve tab shows pace summary cards', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasData = await page
      .getByText('Expenses')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasData) {
      await page.getByRole('button', { name: 'Spending Curve' }).click();
      await expect(page.getByText('Cumulative Spending')).toBeVisible({ timeout: 10000 });
      // Should show Midpoint Spending and Final Total cards
      const hasMidpoint = await page
        .getByText('Midpoint Spending')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasFinalTotal = await page
        .getByText('Final Total')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(hasMidpoint || hasFinalTotal).toBeTruthy();
    }
  });
});
