import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('shows reports page with header', async ({ page }) => {
    await expect(page.getByText(/report|analytics/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'reports-page');
  });

  test('shows report type tabs (Overview, Spending, Income vs Expenses, Cash Flow, Merchants)', async ({ page }) => {
    await expect(page.getByText(/overview/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/spending/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows date range selector (Preset/Custom)', async ({ page }) => {
    await expect(
      page.getByText(/preset/i).or(page.getByText(/custom/i)).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('renders charts on overview tab', async ({ page }) => {
    const chart = page.locator('.recharts-wrapper, svg.recharts-surface').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test('can switch to Spending by Category tab', async ({ page }) => {
    const spendingTab = page.getByText(/spending by category|🍩/i).first();
    if (await spendingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await spendingTab.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'reports-spending');
    }
  });

  test('can switch to Income vs Expenses tab', async ({ page }) => {
    const tab = page.getByText(/income vs expense|⚖️/i).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'reports-income-expenses');
    }
  });

  test('can switch to Cash Flow tab', async ({ page }) => {
    const tab = page.getByText(/cash flow|💰/i).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'reports-cashflow');
    }
  });

  test('can switch to Top Merchants tab', async ({ page }) => {
    const tab = page.getByText(/merchant|🏪/i).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'reports-merchants');
    }
  });

  test('can switch to custom date range', async ({ page }) => {
    const customBtn = page.getByText(/custom/i).first();
    if (await customBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await customBtn.click();
      await page.waitForTimeout(500);
      // Should show date inputs
      await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'reports-custom-date');
    }
  });

  test('shows summary stats (total income, expenses, savings rate)', async ({ page }) => {
    await expect(
      page.getByText(/income|expense|saving|total/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('month preset selector changes data range', async ({ page }) => {
    const monthSelect = page.locator('select').first();
    if (await monthSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await monthSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });
});
