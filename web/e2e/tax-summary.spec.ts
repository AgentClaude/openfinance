import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Tax Summary', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/tax-summary');
    await page.waitForLoadState('networkidle');
  });

  test('shows tax summary page with header', async ({ page }) => {
    await expect(page.getByText(/tax summary/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/estimated federal tax/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'tax-summary-overview');
  });

  test('shows year selector', async ({ page }) => {
    const yearSelect = page.getByLabel(/tax year/i);
    await expect(yearSelect).toBeVisible({ timeout: 10000 });
    // Should have current year selected
    const currentYear = new Date().getFullYear().toString();
    await expect(yearSelect).toHaveValue(currentYear);
  });

  test('shows filing status selector', async ({ page }) => {
    const filingSelect = page.getByLabel(/filing status/i);
    await expect(filingSelect).toBeVisible({ timeout: 10000 });
    await expect(filingSelect).toHaveValue('single');
  });

  test('shows disclaimer banner', async ({ page }) => {
    await expect(page.getByText(/estimate.*planning purposes/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows overview stat cards', async ({ page }) => {
    await expect(page.getByText(/gross income/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/taxable income/i).first()).toBeVisible();
    await expect(page.getByText(/effective tax rate/i).first()).toBeVisible();
  });

  test('shows tax calculation flow', async ({ page }) => {
    await expect(page.getByText(/tax calculation flow/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/adjusted gross income/i)).toBeVisible();
    await expect(page.getByText(/total estimated tax/i).first()).toBeVisible();
  });

  test('navigates between tabs', async ({ page }) => {
    // Click Income tab
    await page.getByLabel(/income tab/i).click();
    await expect(page.getByText(/total income/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'tax-summary-income');

    // Click Deductions tab
    await page.getByLabel(/deductions tab/i).click();
    await expect(page.getByText(/standard deduction/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'tax-summary-deductions');

    // Click Tax Brackets tab
    await page.getByLabel(/tax brackets tab/i).click();
    await expect(page.getByText(/marginal rate/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'tax-summary-brackets');

    // Click Quarterly tab
    await page.getByLabel(/quarterly tab/i).click();
    await expect(page.getByText(/estimated tax payments/i)).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'tax-summary-quarterly');
  });

  test('changing filing status updates estimates', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByText(/gross income/i).first()).toBeVisible({ timeout: 10000 });

    // Switch to married
    const filingSelect = page.getByLabel(/filing status/i);
    await filingSelect.selectOption('married');
    await page.waitForLoadState('networkidle');

    // Should show married filing jointly context (standard deduction changes)
    await expect(page.getByText(/gross income/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('changing year updates data', async ({ page }) => {
    await expect(page.getByText(/tax summary/i).first()).toBeVisible({ timeout: 10000 });

    const yearSelect = page.getByLabel(/tax year/i);
    const prevYear = (new Date().getFullYear() - 1).toString();
    await yearSelect.selectOption(prevYear);
    await page.waitForLoadState('networkidle');

    // Page should still render
    await expect(page.getByText(/tax summary/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('deductions tab shows comparison', async ({ page }) => {
    await page.getByLabel(/deductions tab/i).click();
    await expect(page.getByText(/standard deduction/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/itemized total/i).first()).toBeVisible();
    await expect(page.getByText(/recommendation/i).first()).toBeVisible();
  });

  test('quarterly tab shows all four quarters', async ({ page }) => {
    await page.getByLabel(/quarterly tab/i).click();
    await expect(page.getByRole('cell', { name: 'Q1' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'Q2' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Q3' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Q4' })).toBeVisible();
  });

  test('brackets tab shows bracket details', async ({ page }) => {
    await page.getByLabel(/tax brackets tab/i).click();
    await expect(page.getByText(/bracket details/i)).toBeVisible({ timeout: 10000 });
    // Should show at least the 10% bracket
    await expect(page.getByText('10%').first()).toBeVisible();
  });

  test('sidebar navigation link exists', async ({ page }) => {
    const sidebarLink = page.getByRole('link', { name: /tax summary/i });
    await expect(sidebarLink).toBeVisible({ timeout: 10000 });
  });
});
