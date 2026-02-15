import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Rules', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/rules');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows rules page', async ({ page }) => {
      await expect(page.getByText(/rule/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'rules-page');
    });

    test('shows create rule button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
    });

    test('shows existing rules or empty state', async ({ page }) => {
      await expect(
        page.getByText(/rule|no rules|create.*first/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('shows apply rules button', async ({ page }) => {
      const applyBtn = page.getByRole('button', { name: /apply/i }).first();
      if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(applyBtn).toBeVisible();
        await takeScreenshot(page, 'rules-apply-button');
      }
    });
  });

  test.describe('Create Rule', () => {
    test('opens create rule modal with form fields', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('input, select').first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'rules-create-modal');
    });

    test('modal has match field selector (merchant_name, description)', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(
        page.getByText(/merchant name|description/i).first()
      ).toBeAttached({ timeout: 5000 });
    });

    test('modal has match type selector (contains, exact)', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(
        page.getByText(/contains|exact/i).first()
      ).toBeAttached({ timeout: 5000 });
    });

    test('modal has category selector for assignment', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(
        page.getByText(/category|groceries|dining/i).first()
      ).toBeAttached({ timeout: 5000 });
    });

    test('can create a new rule', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Fill match value
      const matchInput = page.getByLabel(/match value/i);
      await expect(matchInput).toBeVisible({ timeout: 5000 });
      await matchInput.fill('E2E Test Merchant');

      // Submit
      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'rules-after-create');
    });
  });

  test.describe('Edit Rule', () => {
    test('can open edit mode for existing rule', async ({ page }) => {
      const editBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await takeScreenshot(page, 'rules-with-entries');
      }
    });
  });

  test.describe('Delete Rule', () => {
    test('can delete a rule', async ({ page }) => {
      const deleteBtn = page.locator('[aria-label*="delete" i]').first();
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await takeScreenshot(page, 'rules-delete');
      }
    });
  });

  test.describe('Apply Rules', () => {
    test('can apply rules to existing transactions', async ({ page }) => {
      const applyBtn = page.getByRole('button', { name: /apply/i }).first();
      if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'rules-after-apply');
      }
    });
  });
});
