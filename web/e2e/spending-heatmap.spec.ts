import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Spending Heatmap', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/spending-heatmap');
    await page.waitForLoadState('networkidle');
  });

  test('shows page with header', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Spending Heatmap/ })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('Visualize daily spending patterns')
    ).toBeVisible();
  });

  test('shows year selector with current year', async ({ page }) => {
    const currentYear = new Date().getFullYear().toString();
    await expect(page.getByText(currentYear)).toBeVisible({ timeout: 10000 });
  });

  test('shows stats cards', async ({ page }) => {
    await expect(page.getByText('Total Spent')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Daily Average')).toBeVisible();
    await expect(page.getByText('Spending Days')).toBeVisible();
    await expect(page.getByText('No-Spend Days')).toBeVisible();
  });

  test('shows daily spending heatmap section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Daily Spending' })).toBeVisible({ timeout: 10000 });
  });

  test('shows heatmap legend', async ({ page }) => {
    await expect(page.getByText('Less')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('More')).toBeVisible();
  });

  test('shows spending by day of week chart', async ({ page }) => {
    await expect(
      page.getByText('Spending by Day of Week')
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows monthly totals chart', async ({ page }) => {
    await expect(
      page.getByText('Monthly Totals')
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows category spending by month table', async ({ page }) => {
    await expect(
      page.getByText('Category Spending by Month')
    ).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to previous year', async ({ page }) => {
    const prevYear = (new Date().getFullYear() - 1).toString();
    const prevButton = page.getByLabel('Previous year');
    await expect(prevButton).toBeVisible({ timeout: 10000 });
    await prevButton.click();
    await expect(page.getByText(prevYear)).toBeVisible({ timeout: 5000 });
  });

  test('biggest day stat is displayed', async ({ page }) => {
    await expect(page.getByText('Biggest Day')).toBeVisible({ timeout: 10000 });
  });

  test('best streak stat is displayed', async ({ page }) => {
    await expect(page.getByText('Best Streak')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation link exists', async ({ page }) => {
    const navLink = page.getByRole('link', { name: 'Spending Heatmap' });
    await expect(navLink).toBeVisible({ timeout: 10000 });
  });
});
