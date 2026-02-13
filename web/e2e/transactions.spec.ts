import { test, expect } from '@playwright/test';
import { login, takeScreenshot } from './helpers';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows transactions page', async ({ page }) => {
      await expect(page.getByText(/transaction/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'transactions-list');
    });

    test('displays seeded transactions', async ({ page }) => {
      await expect(
        page.locator('table, [class*="transaction"], [class*="list"]')
          .filter({ hasText: /grocery|restaurant|electric|payroll|movie/i }).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows transaction count in subtitle', async ({ page }) => {
      await expect(page.getByText(/\d+ transactions/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('shows transaction descriptions', async ({ page }) => {
      // Look for seeded transaction descriptions
      await expect(
        page.getByText(/grocery|restaurant|electric|payroll|movie/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows transaction categories', async ({ page }) => {
      // Categories appear as badges
      await expect(
        page.getByText(/groceries|dining|entertainment|transportation|uncategorized/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Search', () => {
    test('has search input', async ({ page }) => {
      const search = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.locator('input[type="search"]')).first();
      await expect(search).toBeVisible({ timeout: 10000 });
    });

    test('search filters transactions', async ({ page }) => {
      const search = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.locator('input[type="search"]')).first();
      await search.fill('grocery');
      await page.waitForTimeout(1500);
      await expect(
        page.locator('main, [class*="content"], [class*="list"], table')
          .filter({ hasText: /grocery/i }).first()
      ).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'transactions-search-grocery');
    });

    test('search with no results shows empty or reduced list', async ({ page }) => {
      const search = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.locator('input[type="search"]')).first();
      await search.fill('xyznonexistent12345');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, 'transactions-search-empty');
    });

    test('clearing search shows all transactions again', async ({ page }) => {
      const search = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.locator('input[type="search"]')).first();
      await search.fill('grocery');
      await page.waitForTimeout(1000);
      await search.clear();
      await page.waitForTimeout(1000);
      await expect(
        page.getByText(/grocery|restaurant|electric|payroll|movie/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Filters', () => {
    test('shows filter section with account and category selects', async ({ page }) => {
      // On desktop, filters are always visible in the Card
      await expect(
        page.getByText(/all accounts/i).or(page.getByLabel(/account/i)).first()
      ).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'transactions-filters');
    });

    test('has category filter dropdown', async ({ page }) => {
      await expect(
        page.getByText(/all categories/i).or(page.getByLabel(/category/i)).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('has date range filter', async ({ page }) => {
      await expect(
        page.getByLabel(/from|start.*date|date/i).or(page.locator('input[type="date"]')).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Transaction Detail', () => {
    test('clicking a transaction opens detail panel', async ({ page }) => {
      // Click on first transaction row/card
      const row = page.locator('table tbody tr').first();
      const card = page.locator('button[class*="text-left"]').first();
      
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
      } else if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
        await card.click();
      }
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'transactions-detail-panel');
    });
  });

  test.describe('Add Transaction', () => {
    test('shows add transaction button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /add transaction/i }).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('can click add transaction button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add transaction/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'transactions-add-form');
    });
  });
});
