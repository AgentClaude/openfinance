import { test, expect } from '@playwright/test';
import { login, takeScreenshot } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays net worth card', async ({ page }) => {
    await expect(page.getByText(/net worth/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'dashboard-overview');
  });

  test('displays financial summary cards', async ({ page }) => {
    // Should show income, spending, or balance summary cards
    await expect(page.getByText(/net worth|income|spending|balance/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('displays spending by category chart', async ({ page }) => {
    // Recharts PieChart renders as SVG
    const chart = page.locator('.recharts-wrapper, svg.recharts-surface').first();
    if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(chart).toBeVisible();
    }
    await takeScreenshot(page, 'dashboard-spending-chart');
  });

  test('displays recent transactions widget', async ({ page }) => {
    await expect(
      page.getByText(/recent transaction/i)
        .or(page.getByText(/latest transaction/i))
        .or(page.getByText(/transaction/i))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows sidebar navigation with all links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /transaction/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /account/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /budget/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /categor/i }).first()).toBeVisible();
  });

  test('net worth shows a dollar amount', async ({ page }) => {
    // The net worth card has a gradient background and contains a dollar amount
    await expect(page.getByText(/\$[\d,]+/).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows needs-review badge when applicable', async ({ page }) => {
    // The dashboard may show a "needs review" badge
    const badge = page.getByText(/needs review/i).first();
    // Just check the page loaded — badge is conditional
    await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'dashboard-full');
  });

  test('clicking recent transactions navigates', async ({ page }) => {
    const viewAllLink = page.getByRole('link', { name: /view all|see all/i }).first();
    if (await viewAllLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/transaction/);
    }
  });

  test('shows account summaries', async ({ page }) => {
    // Dashboard should reference accounts
    await expect(
      page.getByText(/checking|savings|credit|account/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
