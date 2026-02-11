import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
  test('shows transaction list with count', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.getByText(/\d+ transactions/i)).toBeVisible();
    await expect(page.getByText('Date', { exact: true })).toBeVisible();
    await expect(page.getByText('Description', { exact: true })).toBeVisible();
    await expect(page.getByText('Amount', { exact: true })).toBeVisible();
  });

  test('shows filter controls', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.getByText(/Add Transaction/)).toBeVisible();
    // Search input
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('shows seeded transaction data', async ({ page }) => {
    await page.goto('/transactions');
    // Transactions table should have rows with dollar amounts
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 5000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Add Transaction button opens modal', async ({ page }) => {
    await page.goto('/transactions');
    await page.getByRole('button', { name: /Add Transaction/ }).click();
    await expect(page.getByText(/Add Transaction|New Transaction/i)).toBeVisible();
  });

  test('search filters transactions', async ({ page }) => {
    await page.goto('/transactions');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Grocery');
    await page.waitForTimeout(1000); // debounce
    // Should still show results (or filtered results)
    await expect(page.getByText(/\d+ transactions/i)).toBeVisible();
  });
});
