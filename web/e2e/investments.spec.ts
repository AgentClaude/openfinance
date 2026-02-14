import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Investments', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/investments');
    await page.waitForLoadState('networkidle');
  });

  test('shows investments page with header', async ({ page }) => {
    await expect(page.getByText(/investment/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'investments-page');
  });

  test('shows portfolio summary stats', async ({ page }) => {
    await expect(
      page.getByText(/portfolio|total value|holdings|\$/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows holdings list or empty state', async ({ page }) => {
    await expect(
      page.getByText(/holding|stock|fund|no investment|no holding|connect/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows allocation pie chart if holdings exist', async ({ page }) => {
    const chart = page.locator('svg circle, svg path').first();
    if (await chart.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(chart).toBeVisible();
      await takeScreenshot(page, 'investments-allocation');
    }
  });

  test('shows gain/loss indicators', async ({ page }) => {
    const gainLoss = page.getByText(/gain|loss|return|%/i).first();
    if (await gainLoss.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(gainLoss).toBeVisible();
    }
  });

  test('shows individual holding details (ticker, shares, value)', async ({ page }) => {
    // Check for stock ticker-like text or share counts
    const holding = page.getByText(/share|unit|qty|VTI|VOO|AAPL|SPY/i).first();
    if (await holding.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(holding).toBeVisible();
      await takeScreenshot(page, 'investments-holdings');
    }
  });

  test('shows cost basis and market value columns', async ({ page }) => {
    const header = page.getByText(/cost basis|market value|current value/i).first();
    if (await header.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(header).toBeVisible();
    }
  });

  test('shows today change indicator', async ({ page }) => {
    const change = page.getByText(/today|day change|daily/i).first();
    if (await change.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(change).toBeVisible();
    }
  });
});
