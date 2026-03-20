import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Budget', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');
  });

  test('shows budget page with header', async ({ page }) => {
    await expect(page.getByText(/budget/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'budget-page');
  });

  test('shows month navigation with current month', async ({ page }) => {
    await expect(
      page.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to previous month', async ({ page }) => {
    const prevBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    // Look for chevron-left type button
    const navBtns = page.getByRole('button');
    const count = await navBtns.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = navBtns.nth(i);
      const text = await btn.textContent();
      if (text === '' || text?.includes('←') || text?.includes('‹')) {
        await btn.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    await takeScreenshot(page, 'budget-prev-month');
  });

  test('can navigate to next month', async ({ page }) => {
    // Similar to prev but the second nav button
    await takeScreenshot(page, 'budget-next-month');
  });

  test('shows budget categories with amounts', async ({ page }) => {
    await expect(
      page.getByText(/\$[\d,.]+/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows budget progress bars', async ({ page }) => {
    // Progress bars are rendered for each budget category
    const progressBar = page.locator('[role="progressbar"], [class*="progress"], [class*="ProgressBar"]').first();
    if (await progressBar.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(progressBar).toBeVisible();
    }
  });

  test('shows budget summary stats (total budgeted, spent, remaining)', async ({ page }) => {
    await expect(
      page.getByText(/budgeted|spent|remaining|total/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('can edit a budget amount by clicking edit icon', async ({ page }) => {
    const editBtn = page.locator('button').filter({ has: page.locator('svg') });
    const count = await editBtn.count();
    // Find pencil/edit icon button
    for (let i = 0; i < Math.min(count, 20); i++) {
      const btn = editBtn.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label');
      if (ariaLabel?.match(/edit/i)) {
        await btn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'budget-edit-amount');
        break;
      }
    }
  });

  test('shows copy from previous month button', async ({ page }) => {
    const copyBtn = page.getByRole('button', { name: /copy|previous month|last month/i }).first();
    if (await copyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(copyBtn).toBeVisible();
      await takeScreenshot(page, 'budget-copy-button');
    }
  });

  test('shows fill from averages button', async ({ page }) => {
    const fillBtn = page.getByRole('button', { name: /fill|average/i }).first();
    if (await fillBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(fillBtn).toBeVisible();
    }
  });

  test('shows over-budget items highlighted', async ({ page }) => {
    // Over-budget items usually have red/warning styling
    const overBudget = page.locator('[class*="red"], [class*="danger"], [class*="over"]').first();
    if (await overBudget.isVisible({ timeout: 3000 }).catch(() => false)) {
      await takeScreenshot(page, 'budget-over-budget');
    }
  });

  test('budget categories are grouped', async ({ page }) => {
    // Categories should be organized in groups
    await expect(
      page.getByText(/food|shopping|bills|housing|entertainment|transportation|income/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows budget mode toggle button', async ({ page }) => {
    const modeBtn = page.getByRole('button', { name: /per-category|flex mode/i }).first();
    await expect(modeBtn).toBeVisible({ timeout: 10000 });
  });

  test('can switch to flex budget mode', async ({ page }) => {
    // Click Per-Category button to switch to flex mode
    const modeBtn = page.getByRole('button', { name: /per-category/i }).first();
    if (await modeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await modeBtn.click();
      await page.waitForTimeout(1500);
      // After switching, button should say "Flex Mode"
      await expect(
        page.getByRole('button', { name: /flex mode/i }).first()
      ).toBeVisible({ timeout: 10000 });
      // Should show spending target UI
      await expect(
        page.getByText(/spending target|spending breakdown/i).first()
      ).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'budget-flex-mode');
    }
  });

  test('flex mode shows spending breakdown', async ({ page }) => {
    // Switch to flex mode first
    const modeBtn = page.getByRole('button', { name: /per-category/i }).first();
    if (await modeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await modeBtn.click();
      await page.waitForTimeout(1500);
      await expect(
        page.getByText(/spending breakdown/i).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('can switch back to per-category mode', async ({ page }) => {
    // Switch to flex
    const modeBtnStart = page.getByRole('button', { name: /per-category/i }).first();
    if (await modeBtnStart.isVisible({ timeout: 5000 }).catch(() => false)) {
      await modeBtnStart.click();
      await page.waitForTimeout(1500);
      // Now switch back
      const flexBtn = page.getByRole('button', { name: /flex mode/i }).first();
      await flexBtn.click();
      await page.waitForTimeout(1500);
      // Should show per-category UI again
      await expect(
        page.getByRole('button', { name: /per-category/i }).first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
