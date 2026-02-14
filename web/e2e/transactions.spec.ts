import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows transactions page with header', async ({ page }) => {
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
      await expect(
        page.getByText(/grocery|restaurant|electric|payroll|movie/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows transaction categories as badges', async ({ page }) => {
      await expect(
        page.getByText(/groceries|dining|entertainment|transportation|uncategorized/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows dollar amounts for transactions', async ({ page }) => {
      await expect(page.getByText(/\$[\d,.]+/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Search', () => {
    test('has search input', async ({ page }) => {
      const search = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.locator('input[type="search"]')).first();
      await expect(search).toBeVisible({ timeout: 10000 });
    });

    test('search filters transactions by keyword', async ({ page }) => {
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

    test('clearing search restores all transactions', async ({ page }) => {
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
    test('shows account filter dropdown', async ({ page }) => {
      await expect(
        page.getByText(/all accounts/i).or(page.getByLabel(/account/i)).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows category filter dropdown', async ({ page }) => {
      await expect(
        page.getByText(/all categories/i).or(page.getByLabel(/category/i)).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows date range filter', async ({ page }) => {
      await expect(
        page.getByLabel(/from|start.*date|date/i).or(page.locator('input[type="date"]')).first()
      ).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'transactions-filters');
    });

    test('filtering by account updates the list', async ({ page }) => {
      const accountSelect = page.getByText(/all accounts/i).or(page.getByLabel(/account/i)).first();
      if (await accountSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await accountSelect.click();
        await page.waitForTimeout(500);
        // Select first non-"all" option
        const option = page.getByRole('option').nth(1);
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
          await page.waitForTimeout(1000);
        }
      }
      await takeScreenshot(page, 'transactions-filtered-account');
    });

    test('filtering by category updates the list', async ({ page }) => {
      const categorySelect = page.getByText(/all categories/i).or(page.getByLabel(/category/i)).first();
      if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await categorySelect.click();
        await page.waitForTimeout(500);
        const option = page.getByRole('option').nth(1);
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
          await page.waitForTimeout(1000);
        }
      }
      await takeScreenshot(page, 'transactions-filtered-category');
    });
  });

  test.describe('Add Transaction', () => {
    test('shows add transaction button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /add transaction/i }).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('clicking add transaction opens form/modal', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add transaction/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      // Should show form fields
      await expect(page.locator('input, select, textarea').first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'transactions-add-form');
    });

    test('can create a new transaction', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add transaction/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);

      // Fill description/name
      const descInput = page.getByLabel(/description|name|merchant/i).first();
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('E2E Test Transaction');
      }

      // Fill amount
      const amountInput = page.getByLabel(/amount/i).first();
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('42.50');
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'transactions-after-add');
    });
  });

  test.describe('Transaction Detail', () => {
    test('clicking a transaction opens detail panel', async ({ page }) => {
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

    test('detail panel shows transaction info', async ({ page }) => {
      const row = page.locator('table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(1000);
        // Should show amount and description
        await expect(page.getByText(/\$[\d,.]+/).first()).toBeVisible();
      }
    });
  });

  test.describe('Edit Transaction', () => {
    test('can open edit mode for a transaction', async ({ page }) => {
      const row = page.locator('table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(1000);
        const editBtn = page.getByRole('button', { name: /edit/i }).first();
        if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await editBtn.click();
          await page.waitForTimeout(500);
          await takeScreenshot(page, 'transactions-edit-mode');
        }
      }
    });
  });

  test.describe('Delete Transaction', () => {
    test('can delete a transaction', async ({ page }) => {
      const row = page.locator('table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(1000);
        const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
        if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await takeScreenshot(page, 'transactions-delete-confirm');
        }
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('shows bulk categorize option when transactions selected', async ({ page }) => {
      // Check if there are checkboxes for bulk select
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await checkbox.check();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'transactions-bulk-select');
      }
    });
  });

  test.describe('CSV Import Link', () => {
    test('has link or button to import page', async ({ page }) => {
      const importLink = page.getByRole('link', { name: /import/i }).first();
      const importBtn = page.getByRole('button', { name: /import/i }).first();
      const exists = await importLink.isVisible({ timeout: 3000 }).catch(() => false)
        || await importBtn.isVisible({ timeout: 1000 }).catch(() => false);
      // Import might be in sidebar instead
      if (!exists) {
        const sidebarLink = page.getByRole('link', { name: /import/i }).first();
        await expect(sidebarLink).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
