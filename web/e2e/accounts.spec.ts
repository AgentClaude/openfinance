import { test, expect } from '@playwright/test';
import { login, takeScreenshot } from './helpers';

test.describe('Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
  });

  test('shows accounts page header', async ({ page }) => {
    await expect(page.getByText(/account/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'accounts-page');
  });

  test('displays seeded accounts', async ({ page }) => {
    await expect(
      page.getByText(/checking|savings|credit|freedom/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows account balances', async ({ page }) => {
    await expect(page.getByText(/\$[\d,.]+/).first()).toBeVisible({ timeout: 10000 });
  });

  test('groups accounts by type', async ({ page }) => {
    // Should show type groups like Banking, Credit, etc
    await expect(
      page.getByText(/banking|depository|credit|loan|investment/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows add account button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*account|new.*account|connect/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('opens add account modal', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*account|new.*account|connect/i }).first();
    await addBtn.click();
    // Modal should appear with form fields
    await expect(
      page.getByText(/manual|connect|add.*account/i).first()
    ).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'accounts-add-modal');
  });

  test('can add a manual account', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*account|new.*account|connect/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Click manual tab if present
    const manualTab = page.getByText(/manual/i).first();
    if (await manualTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await manualTab.click();
    }

    // Fill form
    const nameInput = page.getByLabel(/name/i).first();
    await nameInput.fill(`E2E Test Account ${Date.now()}`);

    const balanceInput = page.getByLabel(/balance/i).first();
    if (await balanceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await balanceInput.fill('5000');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
    await submitBtn.click();

    // Verify success toast or account appears
    await expect(
      page.getByText(/success|created|added|e2e test account/i).first()
    ).toBeAttached({ timeout: 10000 });
    await takeScreenshot(page, 'accounts-after-add');
  });

  test('shows net worth total', async ({ page }) => {
    // Look for a net worth or total display
    await expect(
      page.getByText(/net worth|total/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('account type icons are displayed', async ({ page }) => {
    // SVG icons should be present for account types
    const svgIcons = page.locator('svg').first();
    await expect(svgIcons).toBeVisible({ timeout: 5000 });
  });
});
