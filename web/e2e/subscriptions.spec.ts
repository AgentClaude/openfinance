import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Subscriptions Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/subscriptions');
    await page.waitForLoadState('networkidle');
  });

  test('shows page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Subscriptions/ })).toBeVisible({ timeout: 10000 });
  });

  test('shows subscription summary stats or empty state', async ({ page }) => {
    const main = page.locator('main');
    // Either shows summary stats or empty state
    const hasSummary = await main.getByText(/Monthly Cost|Annual Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await main.getByText(/No subscriptions found/).isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasSummary || hasEmpty).toBeTruthy();
  });

  test('shows tabs for overview, savings, and changes', async ({ page }) => {
    const main = page.locator('main');
    // If subscriptions exist, tabs should be visible
    const hasData = await main.getByText(/Monthly Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    if (hasData) {
      await expect(page.getByRole('button', { name: /Overview/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Savings/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Price Changes/ })).toBeVisible();
    }
  });

  test('can switch between list and grid view', async ({ page }) => {
    const main = page.locator('main');
    const hasData = await main.getByText(/Monthly Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    if (hasData) {
      const listBtn = page.getByRole('button', { name: /List view/ });
      const gridBtn = page.getByRole('button', { name: /Grid view/ });
      await expect(listBtn).toBeVisible({ timeout: 5000 });
      await expect(gridBtn).toBeVisible({ timeout: 5000 });

      // Switch to grid view
      await gridBtn.click();
      await expect(page.locator('.grid.grid-cols-1')).toBeVisible({ timeout: 5000 });

      // Switch back to list view
      await listBtn.click();
      await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
    }
  });

  test('can navigate to savings tab', async ({ page }) => {
    const main = page.locator('main');
    const hasData = await main.getByText(/Monthly Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    if (hasData) {
      const savingsTab = page.getByRole('button', { name: /Savings/ });
      await savingsTab.click();

      // Should show savings content or empty state
      const hasSavings = await main.getByText(/Potential Monthly Savings/).isVisible({ timeout: 5000 }).catch(() => false);
      const hasNoSavings = await main.getByText(/No savings opportunities/).isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasSavings || hasNoSavings).toBeTruthy();
    }
  });

  test('can navigate to price changes tab', async ({ page }) => {
    const main = page.locator('main');
    const hasData = await main.getByText(/Monthly Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    if (hasData) {
      const changesTab = page.getByRole('button', { name: /Price Changes/ });
      await changesTab.click();

      // Should show changes or empty state
      const hasChanges = await main.getByText(/→/).first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasNoChanges = await main.getByText(/No price changes/).isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasChanges || hasNoChanges).toBeTruthy();
    }
  });

  test('shows category filter and sort controls', async ({ page }) => {
    const main = page.locator('main');
    const hasData = await main.getByText(/Monthly Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    if (hasData) {
      // Filter dropdown should exist
      const categoryFilter = page.locator('select').filter({ hasText: /All Categories/ });
      await expect(categoryFilter).toBeVisible({ timeout: 5000 });

      // Sort dropdown should exist
      const sortSelect = page.locator('select').filter({ hasText: /Sort by/ });
      await expect(sortSelect).toBeVisible({ timeout: 5000 });
    }
  });

  test('has sidebar navigation link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Subscriptions' })).toBeVisible({ timeout: 5000 });
  });

  test('shows charts when subscriptions exist', async ({ page }) => {
    const main = page.locator('main');
    const hasData = await main.getByText(/Monthly Cost/).first().isVisible({ timeout: 10000 }).catch(() => false);
    if (hasData) {
      // Should show category charts
      const hasChart = await page.locator('.recharts-wrapper').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasCostByCategory = await main.getByText(/Cost by Category/).isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasChart || hasCostByCategory).toBeTruthy();
    }
  });
});
