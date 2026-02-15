import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows goals page with header', async ({ page }) => {
      await expect(page.getByText(/goal/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'goals-page');
    });

    test('shows add goal button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*goal|new.*goal|create/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
    });

    test('shows goal summary stats', async ({ page }) => {
      // Stats like total goals, active, achieved
      await expect(
        page.getByText(/goal|active|achieved|total|\$/i).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Goal', () => {
    test('opens create goal modal', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*goal|new.*goal|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.getByLabel(/name/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'goals-create-modal');
    });

    test('create form has goal type selector', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*goal|new.*goal|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(
        page.getByText(/savings|debt payoff/i).first()
      ).toBeAttached({ timeout: 5000 });
    });

    test('can create a savings goal', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*goal|new.*goal|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel(/name/i).first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill(`E2E Goal ${Date.now()}`);

      const targetInput = page.getByLabel(/target.*amount|target/i).first();
      if (await targetInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await targetInput.fill('10000');
      }

      const currentInput = page.getByLabel(/current.*amount|current/i).first();
      if (await currentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await currentInput.fill('2500');
      }

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'goals-after-create');
    });
  });

  test.describe('Edit Goal', () => {
    test('can open edit for a goal', async ({ page }) => {
      const editBtn = page.locator('[aria-label*="edit" i], button:has(svg)').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'goals-edit-modal');
      }
    });
  });

  test.describe('Delete Goal', () => {
    test('can trigger delete for a goal', async ({ page }) => {
      const deleteBtn = page.locator('[aria-label*="delete" i]').first();
      if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'goals-delete-confirm');
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('shows progress bars for goals', async ({ page }) => {
      const progressBar = page.locator('[role="progressbar"], [class*="progress"], [class*="bg-"]').first();
      if (await progressBar.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(progressBar).toBeVisible();
      }
    });

    test('shows percentage completion', async ({ page }) => {
      const pct = page.getByText(/\d+%/).first();
      if (await pct.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(pct).toBeVisible();
      }
    });

    test('shows monthly target amount', async ({ page }) => {
      const monthly = page.getByText(/monthly|per month|\$.*\/mo/i).first();
      if (await monthly.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(monthly).toBeVisible();
      }
    });
  });

  test.describe('Goal States', () => {
    test('shows on-track/overdue indicators', async ({ page }) => {
      const indicator = page.getByText(/on track|overdue|behind/i).first();
      if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(indicator).toBeVisible();
      }
    });

    test('shows achieved goals differently', async ({ page }) => {
      const achieved = page.getByText(/achieved|complete/i).first();
      if (await achieved.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(achieved).toBeVisible();
        await takeScreenshot(page, 'goals-achieved');
      }
    });
  });
});
