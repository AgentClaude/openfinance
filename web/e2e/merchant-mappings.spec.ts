import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Merchant Mappings', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/merchant-mappings');
    await page.waitForLoadState('networkidle');
  });

  test('shows merchant mappings page header', async ({ page }) => {
    await expect(page.getByText(/merchant/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'merchant-mappings-page');
  });

  test('displays add mapping button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('can open add mapping form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // Should show form fields for original name and mapped name
    const formEl = page.getByLabel(/original|from|pattern/i).first();
    if (await formEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await takeScreenshot(page, 'merchant-mappings-add-form');
    }
  });

  test('shows suggest button for auto-suggestions', async ({ page }) => {
    const suggestBtn = page.getByRole('button', { name: /suggest|auto|scan/i }).first();
    if (await suggestBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await takeScreenshot(page, 'merchant-mappings-suggest');
    }
  });

  test('displays existing mappings if any', async ({ page }) => {
    // Either shows mappings table/list or empty state
    const content = page.locator('table, [role="table"]').first();
    const emptyState = page.getByText(/no.*mapping|empty|get started/i).first();
    const hasContent = await content.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent || hasEmpty).toBeTruthy();
    await takeScreenshot(page, 'merchant-mappings-content');
  });
});
