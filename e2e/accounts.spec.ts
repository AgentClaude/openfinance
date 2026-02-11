import { test, expect } from '@playwright/test';

test.describe('Accounts', () => {
  test('lists accounts grouped by type', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page.getByRole('heading', { name: 'Banking' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Credit' })).toBeVisible();
    await expect(page.getByText('Main Checking')).toBeVisible();
    await expect(page.getByText('Chase Freedom Card')).toBeVisible();
  });

  test('shows net worth in header', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page.getByText(/Net Worth/)).toBeVisible();
  });

  test('Add Account button opens modal', async ({ page }) => {
    await page.goto('/accounts');
    await page.getByRole('button', { name: /Add Account/ }).click();
    await expect(page.getByText('Manual Account')).toBeVisible();
    await expect(page.getByText('Connect Bank')).toBeVisible();
  });

  test('can create a manual account', async ({ page }) => {
    const uniqueName = `E2E Account ${Date.now()}`;
    await page.goto('/accounts');
    await page.getByRole('button', { name: /Add Account/ }).click();
    
    await page.getByLabel('Account Name').fill(uniqueName);
    await page.getByLabel('Current Balance').fill('500.00');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    await expect(page.getByRole('heading', { name: uniqueName })).toBeVisible({ timeout: 10000 });
  });

  test('account cards show balance amounts', async ({ page }) => {
    await page.goto('/accounts');
    // Should show dollar amounts on account cards
    await expect(page.getByText(/\$[\d,]+\.\d{2}/).first()).toBeVisible();
  });
});
