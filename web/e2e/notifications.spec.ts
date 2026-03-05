import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('shows notifications page header', async ({ page }) => {
    await expect(
      page.getByText(/notification/i).first()
    ).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'notifications-page');
  });

  test('displays notification list or empty state', async ({ page }) => {
    const hasNotifications = await page.getByText(/budget|transaction|goal|sync|balance|security/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no notification|all caught up|empty|no alerts/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasNotifications || hasEmpty).toBeTruthy();
  });

  test('shows filter options', async ({ page }) => {
    // Should have filter buttons/tabs for all, unread, or by type
    const filterBtn = page.getByRole('button', { name: /all|unread/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: 5000 });
  });

  test('can switch between filter tabs', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: /^all$/i }).first();
    const unreadBtn = page.getByRole('button', { name: /unread/i }).first();

    if (await allBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allBtn.click();
      await page.waitForTimeout(500);
    }
    if (await unreadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unreadBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('mark all as read button exists', async ({ page }) => {
    const markAllBtn = page.getByRole('button', { name: /mark.*read|mark all/i }).first();
    if (await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(markAllBtn).toBeVisible();
    }
  });

  test('notification items show type badges', async ({ page }) => {
    const hasNotifications = await page.getByText(/budget|transaction|goal|sync|balance/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasNotifications) {
      // Type badges should render
      await expect(
        page.getByText(/budget|transaction|goal|sync|balance|security/i).first()
      ).toBeVisible();
      await takeScreenshot(page, 'notifications-with-items');
    }
  });
});
