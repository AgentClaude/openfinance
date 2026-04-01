import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('FIRE Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/fire-calculator');
    await page.waitForLoadState('networkidle');
  });

  test('shows page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /FIRE Calculator/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Financial Independence, Retire Early')).toBeVisible();
  });

  test('shows parameter controls', async ({ page }) => {
    await expect(page.getByLabel('Current age')).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Retirement age')).toBeVisible();
    await expect(page.getByLabel('Annual return rate')).toBeVisible();
    await expect(page.getByLabel('Withdrawal rate')).toBeVisible();
    await expect(page.getByLabel('Inflation rate')).toBeVisible();
  });

  test('shows overview tab by default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true', { timeout: 10000 });
    await expect(page.getByText('FIRE Number', { exact: true })).toBeVisible();
    await expect(page.getByText('Time to FIRE')).toBeVisible();
    await expect(page.getByText('Progress to FIRE')).toBeVisible();
  });

  test('shows financial snapshot', async ({ page }) => {
    await expect(page.getByText('Your Financial Snapshot')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Monthly Expenses')).toBeVisible();
  });

  test('shows savings rate stat', async ({ page }) => {
    await expect(page.getByText('Savings Rate')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Monthly Savings').first()).toBeVisible();
  });

  test('navigates between tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Projections' }).click();
    await expect(page.getByText('Portfolio Growth Projection')).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: 'Scenarios' }).click();
    await expect(page.getByText('Savings Rate vs Years to FIRE')).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: 'Milestones' }).click();
    await expect(page.getByText('FIRE Milestones')).toBeVisible({ timeout: 10000 });
  });

  test('changing age updates calculations', async ({ page }) => {
    const ageInput = page.getByLabel('Current age');
    await ageInput.fill('25');
    await ageInput.press('Tab');
    await page.waitForTimeout(1000);
    await expect(page.getByText('FIRE Number', { exact: true })).toBeVisible();
  });

  test('changing withdrawal rate updates FIRE number', async ({ page }) => {
    const withdrawalInput = page.getByLabel('Withdrawal rate');
    await withdrawalInput.fill('3');
    await withdrawalInput.press('Tab');
    await page.waitForTimeout(1000);
    await expect(page.getByText('FIRE Number', { exact: true })).toBeVisible();
  });

  test('projections tab shows chart area', async ({ page }) => {
    await page.getByRole('tab', { name: 'Projections' }).click();
    await expect(page.getByText('Portfolio Growth Projection')).toBeVisible({ timeout: 10000 });
  });

  test('scenarios tab shows comparison table', async ({ page }) => {
    await page.getByRole('tab', { name: 'Scenarios' }).click();
    await expect(page.getByText('Scenario Comparison')).toBeVisible({ timeout: 10000 });
  });

  test('milestones tab shows disclaimer', async ({ page }) => {
    await page.getByRole('tab', { name: 'Milestones' }).click();
    await expect(page.getByText('Disclaimer')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('4% rule is a guideline')).toBeVisible();
  });

  test('sidebar navigation link exists', async ({ page }) => {
    const navLink = page.getByRole('link', { name: 'FIRE Calculator' });
    await expect(navLink).toBeVisible({ timeout: 10000 });
  });

  test('tips section shows insights', async ({ page }) => {
    await expect(page.getByText('FIRE Number', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});
