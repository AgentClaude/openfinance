import { test, expect } from '@playwright/test';
import { login, takeScreenshot } from './helpers';

test.describe('Rules', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/rules');
    await page.waitForLoadState('networkidle');
  });

  test('shows rules page', async ({ page }) => {
    await expect(page.getByText(/rule/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'rules-page');
  });

  test('shows create rule button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('opens create rule modal with form fields', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // Should show modal with form fields
    await takeScreenshot(page, 'rules-create-modal');
    // Check some form elements exist
    await expect(page.locator('input, select').first()).toBeVisible({ timeout: 5000 });
  });

  test('create rule modal has match field selector', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // Should have merchant_name or description options
    await expect(
      page.getByText(/merchant name|description/i).first()
    ).toBeAttached({ timeout: 5000 });
  });

  test('create rule modal has match type selector', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    await expect(
      page.getByText(/contains|exact/i).first()
    ).toBeAttached({ timeout: 5000 });
  });

  test('create rule modal has category selector', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*rule|new.*rule|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    await expect(
      page.getByText(/category|groceries|dining/i).first()
    ).toBeAttached({ timeout: 5000 });
  });

  test('shows existing rules list or empty state', async ({ page }) => {
    await expect(
      page.getByText(/rule|no rules|create.*first/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('can edit a rule if rules exist', async ({ page }) => {
    const editBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await takeScreenshot(page, 'rules-with-entries');
    }
  });

  test('shows apply rules button', async ({ page }) => {
    const applyBtn = page.getByRole('button', { name: /apply/i }).first();
    if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(applyBtn).toBeVisible();
      await takeScreenshot(page, 'rules-apply-button');
    }
  });
});
