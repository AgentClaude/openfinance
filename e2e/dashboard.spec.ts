import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('shows financial overview cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Net Worth')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Monthly Expenses')).toBeVisible();
    await expect(page.getByText('Cash Flow')).toBeVisible();
  });

  test('shows spending by category section', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Spending by Category')).toBeVisible();
  });

  test('shows account balances section', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Account Balances')).toBeVisible();
  });

  test('navigation sidebar has all links', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Transactions', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accounts', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Budget', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
  });

  test('clicking Transactions link navigates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Transactions', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions/);
  });
});
