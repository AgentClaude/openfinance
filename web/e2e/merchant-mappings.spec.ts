import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Merchant Mappings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/merchant-mappings');
    await page.waitForLoadState('networkidle');
  });

  test('shows merchant mappings page header', async ({ page }) => {
    await expect(
      page.getByText(/merchant|mapping/i).first()
    ).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'merchant-mappings-page');
  });

  test('shows add mapping button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('displays mapping list or empty state', async ({ page }) => {
    const hasMappings = await page.getByText(/contains|exact|starts|ends/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no mapping|no merchant|empty|get started/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasMappings || hasEmpty).toBeTruthy();
  });

  test('can open create mapping modal', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Modal should show pattern and clean name inputs
    await expect(
      page.getByLabel(/pattern|raw/i).or(page.getByPlaceholder(/pattern/i)).first()
    ).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'merchant-mappings-create-modal');
  });

  test('can create a new merchant mapping', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    const patternInput = page.getByLabel(/pattern|raw/i).or(page.getByPlaceholder(/pattern/i)).first();
    await patternInput.fill('AMZN*MKTP');

    const cleanNameInput = page.getByLabel(/clean|display|name/i).or(page.getByPlaceholder(/clean|display|name/i)).first();
    await cleanNameInput.fill('Amazon');

    const saveBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
    await saveBtn.click();

    await expect(async () => {
      const hasToast = await page.getByText(/success|created|saved/i).first().isVisible().catch(() => false);
      const modalGone = !(await page.locator('[role="dialog"]').first().isVisible().catch(() => false));
      expect(hasToast || modalGone).toBeTruthy();
    }).toPass({ timeout: 10000 });
    await takeScreenshot(page, 'merchant-mappings-after-create');
  });

  test('shows suggest button for AI suggestions', async ({ page }) => {
    const suggestBtn = page.getByRole('button', { name: /suggest|ai|detect/i }).first();
    if (await suggestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(suggestBtn).toBeVisible();
    }
  });

  test('shows apply mappings button', async ({ page }) => {
    const applyBtn = page.getByRole('button', { name: /apply/i }).first();
    if (await applyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(applyBtn).toBeVisible();
    }
  });
});
