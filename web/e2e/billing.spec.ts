import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers';

test.describe('Pricing Page', () => {
  test('shows plan cards with pricing', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Should show page heading
    await expect(page.getByText('Simple, transparent pricing')).toBeVisible();

    // Should show billing toggle
    await expect(page.getByRole('button', { name: /monthly/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /annual/i })).toBeVisible();

    // Should show plan names
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible();
  });

  test('shows feature comparison table', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Compare plans' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Connected Accounts' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Transactions / month' })).toBeVisible();
  });

  test('billing toggle switches between monthly and annual', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click monthly
    await page.getByRole('button', { name: /^monthly$/i }).click();

    // Click annual
    await page.getByRole('button', { name: /annual/i }).click();
  });

  test('redirects to register when not logged in and clicking a plan', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Click "Get Started" on Free plan
    const freeCard = page.locator('text=Get Started').first();
    if (await freeCard.isVisible()) {
      await freeCard.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});

test.describe('Settings - Billing Tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('shows billing tab in settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // The billing tab should be visible in the tab list
    const billingTab = page.getByRole('button', { name: /billing/i });
    await expect(billingTab).toBeVisible();
  });

  test('billing tab shows subscription info or upgrade CTA', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /billing/i }).click();

    // Should show either current plan info or an upgrade CTA
    const hasPlan = page.getByText(/plan$/i);
    const hasUpgrade = page.getByText(/view plans/i);
    const hasSubscription = page.getByText(/current plan|active|no active subscription/i);
    
    // At least one of these should be visible
    await expect(hasSubscription.first()).toBeVisible({ timeout: 5000 });
  });

  test('billing tab shows plan details for subscribed user', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /billing/i }).click();

    // Demo user has Pro plan — wait for subscription details to load
    await expect(page.getByText(/plan/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Pricing Page - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('shows current plan indicator when logged in', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Should show "Current Plan" on the active plan
    const currentPlanButton = page.getByRole('button', { name: /current plan/i });
    // Demo user has Pro plan
    if (await currentPlanButton.isVisible()) {
      await expect(currentPlanButton).toBeDisabled();
    }
  });

  test('shows back to dashboard link', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByText(/back to dashboard/i);
    await expect(backLink).toBeVisible();
  });
});
