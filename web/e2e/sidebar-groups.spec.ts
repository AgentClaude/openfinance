import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Sidebar Navigation Groups', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    // Clear localStorage to reset group collapse state
    await page.evaluate(() => localStorage.removeItem('openfinance-sidebar-groups'));
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('renders group headers', async ({ page }) => {
    const expectedGroups = ['Money', 'Wealth', 'Analytics', 'Summaries', 'Tools'];
    for (const group of expectedGroups) {
      await expect(
        page.locator(`nav button:has-text("${group}")`)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('all nav links visible by default', async ({ page }) => {
    const links = [
      'Dashboard', 'Transactions', 'Accounts', 'Budget', 'Recurring', 'Goals',
      'Net Worth', 'Investments', 'Debt Payoff',
      'Reports', 'Insights', 'Forecast',
      'Monthly Recap', 'Year in Review', 'Tax Summary', 'FIRE Calculator',
      'Import', 'Categories', 'Rules', 'Merchants', 'Activity',
      'Settings',
    ];
    for (const linkName of links) {
      await expect(
        page.getByRole('link', { name: linkName, exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('can collapse and expand a group', async ({ page }) => {
    // Collapse the Tools group
    const toolsButton = page.locator('nav button:has-text("Tools")');
    await expect(toolsButton).toBeVisible({ timeout: 5000 });
    await toolsButton.click();

    // Import link should be hidden
    await expect(
      page.getByRole('link', { name: 'Import', exact: true }).first()
    ).not.toBeVisible({ timeout: 3000 });

    // Re-expand
    await toolsButton.click();

    // Import link should be visible again
    await expect(
      page.getByRole('link', { name: 'Import', exact: true }).first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('collapsed state persists after page reload', async ({ page }) => {
    // Collapse Analytics
    const analyticsButton = page.locator('nav button:has-text("Analytics")');
    await analyticsButton.click();

    // Verify Reports is hidden
    await expect(
      page.getByRole('link', { name: 'Reports', exact: true }).first()
    ).not.toBeVisible({ timeout: 3000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Reports should still be hidden (persisted via localStorage)
    await expect(
      page.getByRole('link', { name: 'Reports', exact: true }).first()
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('clicking a link in a group navigates correctly', async ({ page }) => {
    const investLink = page.getByRole('link', { name: 'Investments', exact: true }).first();
    await expect(investLink).toBeVisible({ timeout: 5000 });
    await investLink.click();
    await expect(page).toHaveURL(/investments/);
  });

  test('active group auto-expands on navigation', async ({ page }) => {
    // Collapse Wealth group
    const wealthButton = page.locator('nav button:has-text("Wealth")');
    await wealthButton.click();

    // Net Worth should be hidden
    await expect(
      page.getByRole('link', { name: 'Net Worth', exact: true }).first()
    ).not.toBeVisible({ timeout: 3000 });

    // Navigate directly to Net Worth
    await page.goto('/net-worth');
    await page.waitForLoadState('networkidle');

    // Wealth group should auto-expand, Net Worth link visible
    await expect(
      page.getByRole('link', { name: 'Net Worth', exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Dashboard is always visible (flat group)', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Dashboard', exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Settings is always visible (flat group)', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Settings', exact: true }).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
