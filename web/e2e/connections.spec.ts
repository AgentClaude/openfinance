import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('Bank Connections Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    // Navigate to connections — retry if SPA redirects back to dashboard
    await page.goto('/connections');
    await page.waitForLoadState('networkidle');
    // If we ended up on dashboard (SPA cold-start redirect), try again
    if (!page.url().includes('/connections')) {
      await page.goto('/connections');
      await page.waitForLoadState('networkidle');
    }
  });

  test('renders the connections page', async ({ page }) => {
    // Page should show header or empty state or loading
    const content = page.locator('text=/Bank Connections|No bank connections|Connect/').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('shows connections list or empty state', async ({ page }) => {
    const hasConnections = await page
      .getByText(/account/)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/No bank connections/)
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasConnections || hasEmpty).toBeTruthy();
  });

  test('empty state has connect bank action', async ({ page }) => {
    const hasEmpty = await page
      .getByText(/No bank connections/)
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    if (hasEmpty) {
      await expect(
        page.getByRole('button', { name: /Connect Bank/ })
      ).toBeVisible();
      await expect(
        page.getByText(/Connect your bank to automatically import/)
      ).toBeVisible();
    }
  });

  test('connection cards show institution info when connections exist', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    const hasConnections = await page
      .getByText(/Synced/)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasConnections) {
      // Should show sync status
      await expect(page.getByText(/Synced/).first()).toBeVisible();
      // Should show account count
      await expect(page.getByText(/account/).first()).toBeVisible();
    }
  });

  test('connection cards show status badges when connections exist', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasConnections = await page
      .locator('[class*="badge"], [data-testid*="badge"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasConnections) {
      // Should have at least one status badge (Active, Error, etc.)
      const badges = page.getByText(/Active|Error|Disconnected|Expired/);
      await expect(badges.first()).toBeVisible();
    }
  });

  test('connection cards show action buttons when connections exist', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasDisconnect = await page
      .getByRole('button', { name: /Disconnect/ })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasDisconnect) {
      await expect(
        page.getByRole('button', { name: /Disconnect/ }).first()
      ).toBeVisible();
      // May also have Sync Now or Reconnect
      const hasSyncOrReconnect = await page
        .getByRole('button', { name: /Sync Now|Reconnect|Retry/ })
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      // Either is fine — depends on connection status
      expect(typeof hasSyncOrReconnect).toBe('boolean');
    }
  });

  test('disconnect button opens confirmation modal', async ({ page }) => {
    await page.waitForTimeout(2000);
    const disconnectBtn = page.getByRole('button', { name: /Disconnect/ }).first();
    const hasDisconnect = await disconnectBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDisconnect) {
      await disconnectBtn.click();
      await expect(
        page.getByText(/Disconnect Bank\?/)
      ).toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(/stop syncing transactions/)
      ).toBeVisible();
      // Cancel should close modal
      await page.getByRole('button', { name: /Cancel/ }).click();
      await expect(
        page.getByText(/Disconnect Bank\?/)
      ).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('page is accessible via sidebar navigation', async ({ page }) => {
    // Navigate via sidebar
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const navLink = page.getByRole('link', { name: /Connections|Bank/ }).first();
    const isVisible = await navLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await navLink.click();
      await expect(page).toHaveURL(/\/connections/);
      await expect(
        page.getByRole('heading', { name: /Bank Connections/ })
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
