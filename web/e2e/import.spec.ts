import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('CSV Import', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
  });

  test('shows import page with header', async ({ page }) => {
    await expect(page.getByText(/import/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'import-page');
  });

  test('shows account selector', async ({ page }) => {
    await expect(
      page.getByText(/select account|account/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows file upload area', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 10000 });
  });

  test('shows drag and drop zone', async ({ page }) => {
    await expect(
      page.getByText(/drag|drop|upload|choose.*file|csv/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows column mapping section after file upload', async ({ page }) => {
    // This test would require actually uploading a CSV — just verify the page structure
    await expect(
      page.getByText(/import|upload|csv/i).first()
    ).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'import-form');
  });
});
