import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Savings Rate Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/savings-rate');
    await page.waitForLoadState('networkidle');
  });

  test('shows page header', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Savings Rate' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Track your savings rate and income allocation over time')).toBeVisible();
  });

  test('shows time range selector', async ({ page }) => {
    await expect(page.getByRole('button', { name: '6mo' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '12mo' })).toBeVisible();
    await expect(page.getByRole('button', { name: '24mo' })).toBeVisible();
  });

  test('shows summary cards', async ({ page }) => {
    await expect(page.getByText('Current Rate')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Average Rate')).toBeVisible();
    await expect(page.getByText('Total Saved')).toBeVisible();
    await expect(page.getByText('Percentile')).toBeVisible();
  });

  test('shows tab navigation', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Trends' })).toBeVisible();
    await expect(page.getByRole('button', { name: '50/30/20' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Income & Expenses' })).toBeVisible();
  });

  test('overview tab shows savings rate chart', async ({ page }) => {
    await expect(page.getByText('Savings Rate Over Time')).toBeVisible({ timeout: 10000 });
  });

  test('overview tab shows 50/30/20 snapshot', async ({ page }) => {
    await expect(page.getByText('50/30/20 Snapshot')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Needs').first()).toBeVisible();
    await expect(page.getByText('Wants').first()).toBeVisible();
    await expect(page.getByText('Savings').first()).toBeVisible();
  });

  test('switching to trends tab shows income vs expenses', async ({ page }) => {
    await page.getByRole('button', { name: 'Trends' }).click();
    await expect(page.getByText('Income vs Expenses')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Monthly Savings')).toBeVisible();
    await expect(page.getByText('Monthly Details')).toBeVisible();
  });

  test('trends tab shows monthly details table', async ({ page }) => {
    await page.getByRole('button', { name: 'Trends' }).click();
    await expect(page.getByText('Monthly Details')).toBeVisible({ timeout: 10000 });
    // Table headers
    await expect(page.getByRole('columnheader', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Income' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Expenses' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Saved' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Rate' })).toBeVisible();
  });

  test('switching to allocation tab shows 50/30/20 analysis', async ({ page }) => {
    await page.getByRole('button', { name: '50/30/20' }).click();
    await expect(page.getByText('50/30/20 Rule Analysis')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your Allocation')).toBeVisible();
    await expect(page.getByText('Target (50/30/20)')).toBeVisible();
  });

  test('allocation tab shows detailed breakdown', async ({ page }) => {
    await page.getByRole('button', { name: '50/30/20' }).click();
    await expect(page.getByText('Detailed Breakdown')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Housing, transportation, healthcare, utilities')).toBeVisible();
    await expect(page.getByText('Dining, shopping, entertainment, personal care')).toBeVisible();
  });

  test('allocation tab shows expense groups', async ({ page }) => {
    await page.getByRole('button', { name: '50/30/20' }).click();
    await expect(page.getByText('Expense Groups')).toBeVisible({ timeout: 10000 });
  });

  test('switching to income tab shows income sources', async ({ page }) => {
    await page.getByRole('button', { name: 'Income & Expenses' }).click();
    await expect(page.getByText('Income Sources')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Top Expense Categories')).toBeVisible();
  });

  test('time range buttons switch active state', async ({ page }) => {
    const btn6 = page.getByRole('button', { name: '6mo' });
    const btn12 = page.getByRole('button', { name: '12mo' });

    // 12mo should be active by default
    await expect(btn12).toHaveClass(/bg-emerald/, { timeout: 10000 });

    // Click 6mo
    await btn6.click();
    await expect(btn6).toHaveClass(/bg-emerald/);
  });
});
