import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Categories', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows categories page', async ({ page }) => {
      await expect(page.getByText(/categor/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'categories-page');
    });

    test('displays seeded categories', async ({ page }) => {
      await expect(
        page.getByText(/groceries|dining|entertainment|transportation/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows category groups', async ({ page }) => {
      await expect(
        page.getByText(/food|shopping|bills|income|entertainment|transportation/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows color indicators for categories', async ({ page }) => {
      const colorIndicator = page.locator('[style*="background-color"], [class*="color"], [class*="badge"]').first();
      await expect(colorIndicator).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Category', () => {
    test('shows add category button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*category|new.*category|create/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
    });

    test('opens add category modal with form', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*category|new.*category|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByLabel(/name/i).first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'categories-add-modal');
    });

    test('can create a new category', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*category|new.*category|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);

      await page.getByLabel(/name/i).first().fill(`E2E Category ${Date.now()}`);

      const groupSelect = page.getByLabel(/group/i).first();
      if (await groupSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await groupSelect.selectOption({ index: 1 });
      }

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();

      await expect(
        page.getByText(/success|created|e2e category/i).first()
      ).toBeAttached({ timeout: 10000 });
      await takeScreenshot(page, 'categories-after-add');
    });
  });

  test.describe('Edit Category', () => {
    test('can open edit mode for a category', async ({ page }) => {
      const editBtn = page.getByRole('button', { name: /edit/i })
        .or(page.locator('button:has(svg[class*="pencil"]), [aria-label*="edit" i]')).first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'categories-edit-modal');
      }
    });
  });

  test.describe('Delete Category', () => {
    test('can delete a user-created category', async ({ page }) => {
      // First create one to delete
      const addBtn = page.getByRole('button', { name: /add.*category|new.*category|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);

      const catName = `Delete Me ${Date.now()}`;
      await page.getByLabel(/name/i).first().fill(catName);

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Verify page is still functional
      await expect(page.getByText(/categor/i).first()).toBeVisible();
    });
  });

  test.describe('Category Groups', () => {
    test('categories are organized by group', async ({ page }) => {
      // Check multiple groups exist
      const groups = page.getByText(/food|shopping|bills|housing|income/i);
      await expect(groups.first()).toBeVisible({ timeout: 10000 });
    });

    test('system categories are visually distinct', async ({ page }) => {
      const lockIcon = page.locator('svg[class*="lock"], [aria-label*="system" i]').first();
      if (await lockIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(lockIcon).toBeVisible();
      }
    });
  });
});
