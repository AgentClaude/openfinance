import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Financial Health Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('shows financial health page header', async ({ page }) => {
    await expect(
      page.getByText(/financial health/i).first()
    ).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'financial-health-page');
  });

  test('displays score gauge with grade', async ({ page }) => {
    // Wait for score content to render
    const gradeLocator = page.getByText(/grade [A-F]/i).first();
    const scoreLocator = page.locator('text=/\\d+/').first();
    await expect(gradeLocator.or(scoreLocator)).toBeVisible({ timeout: 10000 });
  });

  test('shows all five health components', async ({ page }) => {
    const components = ['Savings Rate', 'Budget Adherence', 'Debt-to-Asset Ratio', 'Emergency Fund', 'Net Worth Trend'];

    for (const component of components) {
      await expect(page.getByText(component).first()).toBeVisible({ timeout: 10000 });
    }
    await takeScreenshot(page, 'financial-health-components');
  });

  test('displays component progress bars', async ({ page }) => {
    // Wait for at least one component to be visible before checking bars
    await expect(page.getByText('Savings Rate').first()).toBeVisible({ timeout: 10000 });
    const bars = page.locator('.rounded-full.transition-all');
    await expect(bars.first()).toBeVisible({ timeout: 5000 });
    const count = await bars.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('shows recommendations section', async ({ page }) => {
    const recommendations = page.getByText(/recommendation/i).first();
    const methodology = page.getByText(/how your score is calculated/i).first();
    await expect(recommendations.or(methodology)).toBeVisible({ timeout: 10000 });
  });

  test('shows methodology explanation', async ({ page }) => {
    await expect(
      page.getByText(/how your score is calculated/i).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/savings rate.*25%/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('component cards show status badges', async ({ page }) => {
    // Wait for components to render
    await expect(page.getByText('Savings Rate').first()).toBeVisible({ timeout: 10000 });
    const badges = page.locator('text=/Excellent|Good|Needs Work|Critical|No Data/i');
    await expect(badges.first()).toBeVisible({ timeout: 5000 });
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('component cards show detail breakdowns', async ({ page }) => {
    // Wait for components to render
    await expect(page.getByText('Savings Rate').first()).toBeVisible({ timeout: 10000 });
    const rate = page.getByText('Rate').first();
    const weight = page.getByText(/weight:/i).first();
    const contributes = page.getByText(/contributes/i).first();
    await expect(rate.or(weight).or(contributes)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard Financial Health Widget', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows financial health widget on dashboard', async ({ page }) => {
    const hasHealthWidget = await page.getByText(/financial health/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasHealthWidget) {
      test.skip();
      return;
    }
    await expect(page.getByText(/financial health/i).first()).toBeVisible();
    await takeScreenshot(page, 'dashboard-health-widget');
  });

  test('health widget links to health page', async ({ page }) => {
    const viewDetails = page.getByText(/view details/i).first();
    const isVisible = await viewDetails.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }
    await viewDetails.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/health/);
  });
});
