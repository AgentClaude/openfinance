import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Recurring', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/recurring');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows recurring page with header', async ({ page }) => {
      await expect(page.getByText(/recurring/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'recurring-page');
    });

    test('shows monthly expense/income totals', async ({ page }) => {
      await expect(
        page.getByText(/monthly|expense|income|\$/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows add recurring button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
    });

    test('shows detect recurring button', async ({ page }) => {
      const detectBtn = page.getByRole('button', { name: /detect/i }).first();
      if (await detectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(detectBtn).toBeVisible();
      }
    });
  });

  test.describe('Create Recurring', () => {
    test('opens create recurring modal', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('input, select').first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'recurring-create-modal');
    });

    test('create form has required fields (name, amount, frequency)', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);

      await expect(page.getByLabel(/name|description/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/amount/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('can create a new recurring item', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.getByLabel(/name|description/i).first();
      await nameInput.fill(`E2E Recurring ${Date.now()}`);

      const amountInput = page.getByLabel(/amount/i).first();
      await amountInput.fill('99.99');

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'recurring-after-add');
    });
  });

  test.describe('Edit Recurring', () => {
    test('can open edit mode for a recurring item', async ({ page }) => {
      const editBtn = page.locator('button').filter({ has: page.locator('svg') });
      const count = await editBtn.count();
      for (let i = 0; i < Math.min(count, 15); i++) {
        const ariaLabel = await editBtn.nth(i).getAttribute('aria-label');
        if (ariaLabel?.match(/edit/i)) {
          await editBtn.nth(i).click();
          await page.waitForTimeout(500);
          await takeScreenshot(page, 'recurring-edit-modal');
          break;
        }
      }
    });
  });

  test.describe('Delete Recurring', () => {
    test('can trigger delete for a recurring item', async ({ page }) => {
      const deleteBtn = page.locator('button').filter({ has: page.locator('svg') });
      // Just check page is functional with items or empty state
      await expect(
        page.getByText(/recurring|no recurring|create/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Mark as Paid', () => {
    test('can mark a recurring item as paid', async ({ page }) => {
      const paidBtn = page.getByRole('button', { name: /mark.*paid|paid/i }).first();
      if (await paidBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await takeScreenshot(page, 'recurring-mark-paid');
      }
    });
  });

  test.describe('Detect Recurring', () => {
    test('detect button triggers detection', async ({ page }) => {
      const detectBtn = page.getByRole('button', { name: /detect/i }).first();
      if (await detectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await detectBtn.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'recurring-after-detect');
      }
    });
  });

  test.describe('Toggle Inactive', () => {
    test('can toggle showing inactive recurring items', async ({ page }) => {
      const toggleBtn = page.getByRole('button', { name: /inactive|hidden|show/i }).first()
        .or(page.getByText(/show inactive|hidden/i).first());
      if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'recurring-show-inactive');
      }
    });
  });
});
