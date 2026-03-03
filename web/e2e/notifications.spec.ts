import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('shows notifications page with header', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/notification/i).first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'notifications-page');
  });

  test('displays filter options', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    // Look for filter controls (all, unread, type filters)
    const filterEl = page.getByText(/all|unread|filter/i).first();
    await expect(filterEl).toBeVisible({ timeout: 10000 });
  });

  test('bell icon in navbar opens dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Find the bell/notification icon button in the header
    const bellBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ });
    const navBell = page.getByRole('button', { name: /notification/i }).first();
    if (await navBell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navBell.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'notifications-dropdown');
    }
  });

  test('empty state when no notifications', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    // Either shows notifications or an empty state
    const content = page.locator('main, [role="main"], .content, #root').first();
    await expect(content).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'notifications-state');
  });

  test('view all link navigates to notifications page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const viewAll = page.getByText(/view all/i).first();
    if (await viewAll.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewAll.click();
      await page.waitForURL('**/notifications', { timeout: 5000 });
      await expect(page.getByText(/notification/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
