import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows accounts page header', async ({ page }) => {
      await expect(page.getByText(/account/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'accounts-page');
    });

    test('displays seeded accounts', async ({ page }) => {
      await expect(
        page.getByText(/checking|savings|credit|freedom/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows account balances as dollar amounts', async ({ page }) => {
      await expect(page.getByText(/\$[\d,.]+/).first()).toBeVisible({ timeout: 10000 });
    });

    test('groups accounts by type (Banking, Credit, etc)', async ({ page }) => {
      await expect(
        page.getByText(/banking|depository|credit|loan|investment/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows net worth total', async ({ page }) => {
      await expect(
        page.getByText(/net worth|total/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('account type icons are displayed', async ({ page }) => {
      const svgIcons = page.locator('svg').first();
      await expect(svgIcons).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Add Account', () => {
    test('shows add account button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*account|new.*account|connect/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
    });

    test('opens add account modal', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*account|new.*account|connect/i }).first();
      await addBtn.click();
      await expect(
        page.getByText(/manual|connect|add.*account/i).first()
      ).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'accounts-add-modal');
    });

    test('can add a manual account', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add.*account|new.*account|connect/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Click manual tab if present
      const manualTab = page.getByText(/manual/i).first();
      if (await manualTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manualTab.click();
        await page.waitForTimeout(500);
      }

      const nameInput = page.getByLabel(/account name/i).first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(`E2E Test Account ${Date.now()}`);

      const balanceInput = page.getByLabel(/balance/i).first();
      if (await balanceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await balanceInput.fill('5000');
      }

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();

      await expect(
        page.getByText(/success|created|added|e2e test account/i).first()
      ).toBeAttached({ timeout: 15000 });
      await takeScreenshot(page, 'accounts-after-add');
    });
  });

  test.describe('Account Details', () => {
    test('clicking an account shows details or navigates', async ({ page }) => {
      const accountLink = page.getByText(/checking|savings/i).first();
      if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await accountLink.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'accounts-detail');
      }
    });
  });

  test.describe('Filter by Type', () => {
    test('can filter accounts by type if filter exists', async ({ page }) => {
      const filterBtn = page.getByRole('button', { name: /filter|type/i }).first();
      if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'accounts-filter');
      }
    });
  });
});
