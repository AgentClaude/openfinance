import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Import Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
  });

  test('shows import page with header', async ({ page }) => {
    await expect(page.getByText(/import transactions/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'import-page');
  });

  test('shows format toggle buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /csv/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /ofx/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows account selector', async ({ page }) => {
    await expect(
      page.getByText(/select account|import to account/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows file upload area', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 10000 });
  });

  test('shows drag and drop zone', async ({ page }) => {
    await expect(
      page.getByText(/drop file|click to upload|upload/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('CSV and OFX tabs are visible and clickable', async ({ page }) => {
    const csvBtn = page.getByRole('button', { name: /csv/i });
    const ofxBtn = page.getByRole('button', { name: /ofx/i });
    await expect(csvBtn).toBeVisible();
    await expect(ofxBtn).toBeVisible();

    // Click OFX tab
    await ofxBtn.click();
    // Should see bank statement text in the upload area
    await expect(page.getByText(/bank statement|ofx.*qfx/i).first()).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'import-ofx-mode');

    // Click back to CSV
    await csvBtn.click();
    await expect(page.getByText(/comma-separated|csv/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows column mapping section after CSV file upload', async ({ page }) => {
    // Create a test CSV in memory
    const csvContent = 'Date,Description,Amount\n2026-03-01,Test Transaction,-50.00\n2026-03-02,Another One,-25.00';
    const buffer = Buffer.from(csvContent, 'utf-8');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer,
    });

    // Should show column mapping preview
    await expect(page.getByText(/column mapping/i)).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'import-csv-preview');
  });

  test('import button is disabled without account selected', async ({ page }) => {
    const importBtn = page.getByRole('button', { name: /import.*transactions/i });
    await expect(importBtn).toBeDisabled();
  });
});
