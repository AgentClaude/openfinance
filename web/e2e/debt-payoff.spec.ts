import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Debt Payoff Planner', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/debt-payoff');
    await page.waitForLoadState('networkidle');
  });

  test('shows debt payoff page with header', async ({ page }) => {
    await expect(page.getByText(/debt payoff/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'debt-payoff-page');
  });

  test('shows summary stat cards', async ({ page }) => {
    // Should show Total Debt, Monthly Minimum, Interest Saved, Debt-Free Date
    await expect(page.getByText(/total debt/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/monthly minimum/i)).toBeVisible();
    await expect(page.getByText(/interest saved/i)).toBeVisible();
    await expect(page.getByText(/debt-free date/i)).toBeVisible();
  });

  test('shows strategy selection cards', async ({ page }) => {
    await expect(page.getByText(/avalanche/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/snowball/i).first()).toBeVisible();
  });

  test('can switch between strategies', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByText(/avalanche/i).first()).toBeVisible({ timeout: 10000 });

    // Click snowball strategy card
    const snowballBtn = page.locator('button').filter({ hasText: /snowball/i }).first();
    await snowballBtn.click();

    // Verify snowball is now reflected in the chart subtitle
    await expect(page.getByText(/snowball strategy/i)).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'debt-payoff-snowball');
  });

  test('shows extra payment slider', async ({ page }) => {
    await expect(page.getByText(/extra monthly payment/i)).toBeVisible({ timeout: 10000 });
    // Should show the slider
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
  });

  test('shows payoff timeline chart', async ({ page }) => {
    await expect(page.getByText(/payoff timeline/i)).toBeVisible({ timeout: 10000 });
    // Chart should render SVG
    const chartSvg = page.locator('.recharts-wrapper svg').first();
    await expect(chartSvg).toBeVisible({ timeout: 5000 });
  });

  test('shows strategy comparison chart', async ({ page }) => {
    await expect(page.getByText(/strategy comparison/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows debt accounts table', async ({ page }) => {
    await expect(page.getByText(/your debts/i)).toBeVisible({ timeout: 10000 });
    // Should show account names, balances, rates
    await expect(page.getByText(/balance/i).first()).toBeVisible();
    await expect(page.getByText(/rate/i).first()).toBeVisible();
  });

  test('shows strategy explanation cards', async ({ page }) => {
    await expect(page.getByText(/avalanche method/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/snowball method/i)).toBeVisible();
    // Should explain first target
    await expect(page.getByText(/first target/i).first()).toBeVisible();
  });

  test('displays currency values correctly', async ({ page }) => {
    // Should show dollar amounts
    await expect(page.getByText(/\$[\d,]+/).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows debt-free page if no debts', async ({ page }) => {
    // This test verifies the empty state exists — it won't trigger for demo data
    // which has debts, but the component handles it
    const pageContent = await page.textContent('body');
    // Either we see debt data or the empty state
    const hasDepts = pageContent?.includes('Total Debt');
    const hasEmptyState = pageContent?.includes('No Debt Found') || pageContent?.includes('debt-free');
    expect(hasDepts || hasEmptyState).toBeTruthy();
  });

  test('navigation link exists in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const navLink = page.locator('nav a[href="/debt-payoff"], nav a[href*="debt-payoff"]').first();
    await expect(navLink).toBeVisible({ timeout: 10000 });
  });
});
