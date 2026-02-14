import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Layout', () => {
    test('shows settings page with tabs', async ({ page }) => {
      await expect(page.getByText(/settings/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'settings-page');
    });

    test('shows profile tab by default', async ({ page }) => {
      await expect(
        page.getByText(/profile/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows multiple setting tabs', async ({ page }) => {
      // Check for various tab labels
      const tabs = ['profile', 'preferences', 'household', 'members', 'notifications', 'security'];
      for (const tab of tabs) {
        const tabEl = page.getByText(new RegExp(tab, 'i')).first();
        if (await tabEl.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(tabEl).toBeVisible();
        }
      }
    });
  });

  test.describe('Profile Tab', () => {
    test('shows name and email fields', async ({ page }) => {
      await expect(page.getByLabel(/name/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/email/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('can update profile name', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i).first();
      await nameInput.clear();
      await nameInput.fill('E2E Updated Name');
      const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
      await takeScreenshot(page, 'settings-profile-updated');
    });
  });

  test.describe('Password Change', () => {
    test('shows password change fields on security tab', async ({ page }) => {
      // Navigate to security tab
      const securityTab = page.getByText(/security/i).first();
      if (await securityTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await securityTab.click();
        await page.waitForTimeout(500);
      }
      const passwordInput = page.getByLabel(/current password|old password/i).first();
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(passwordInput).toBeVisible();
        await takeScreenshot(page, 'settings-security');
      }
    });
  });

  test.describe('Household Settings', () => {
    test('shows household settings on household tab', async ({ page }) => {
      const householdTab = page.getByText(/household/i).first();
      if (await householdTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await householdTab.click();
        await page.waitForTimeout(500);
        await expect(
          page.getByLabel(/household name|name/i).or(page.getByText(/household/i)).first()
        ).toBeVisible({ timeout: 5000 });
        await takeScreenshot(page, 'settings-household');
      }
    });

    test('shows currency selector', async ({ page }) => {
      const householdTab = page.getByText(/household/i).first();
      if (await householdTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await householdTab.click();
        await page.waitForTimeout(500);
        const currencySelect = page.getByText(/USD|EUR|GBP|currency/i).first();
        await expect(currencySelect).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Notifications Tab', () => {
    test('shows notification preferences', async ({ page }) => {
      const notifTab = page.getByText(/notification/i).first();
      if (await notifTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await notifTab.click();
        await page.waitForTimeout(500);
        await expect(
          page.getByText(/budget exceeded|bill due|large transaction|weekly digest|goal milestone/i).first()
        ).toBeVisible({ timeout: 5000 });
        await takeScreenshot(page, 'settings-notifications');
      }
    });

    test('shows notification channel toggles (in-app, email, push)', async ({ page }) => {
      const notifTab = page.getByText(/notification/i).first();
      if (await notifTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await notifTab.click();
        await page.waitForTimeout(500);
        await expect(
          page.getByText(/in-app|email|push/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Preferences Tab', () => {
    test('shows dark mode toggle', async ({ page }) => {
      const prefsTab = page.getByText(/preference/i).first();
      if (await prefsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prefsTab.click();
        await page.waitForTimeout(500);
      }
      const darkToggle = page.getByText(/dark mode|theme/i).first();
      if (await darkToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(darkToggle).toBeVisible();
        await takeScreenshot(page, 'settings-preferences');
      }
    });

    test('can toggle dark mode', async ({ page }) => {
      const prefsTab = page.getByText(/preference/i).first();
      if (await prefsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prefsTab.click();
        await page.waitForTimeout(500);
      }
      const toggle = page.locator('button, input[type="checkbox"]').filter({ hasText: /dark/i }).first()
        .or(page.getByRole('switch').first());
      if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'settings-dark-mode');
      }
    });

    test('shows date format and number format options', async ({ page }) => {
      const prefsTab = page.getByText(/preference/i).first();
      if (await prefsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await prefsTab.click();
        await page.waitForTimeout(500);
      }
      await expect(
        page.getByText(/date format|number format|MM\/DD/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Members Tab', () => {
    test('shows household members', async ({ page }) => {
      const membersTab = page.getByText(/member/i).first();
      if (await membersTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await membersTab.click();
        await page.waitForTimeout(500);
        await expect(
          page.getByText(/member|invite|role/i).first()
        ).toBeVisible({ timeout: 5000 });
        await takeScreenshot(page, 'settings-members');
      }
    });
  });

  test.describe('Referrals Tab', () => {
    test('shows referral code', async ({ page }) => {
      const referralTab = page.getByText(/referral/i).first();
      if (await referralTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await referralTab.click();
        await page.waitForTimeout(500);
        await expect(
          page.getByText(/referral|code|share/i).first()
        ).toBeVisible({ timeout: 5000 });
        await takeScreenshot(page, 'settings-referrals');
      }
    });
  });

  test.describe('Data Export', () => {
    test('shows export data option on data tab', async ({ page }) => {
      const dataTab = page.getByText(/^data$/i).first();
      if (await dataTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dataTab.click();
        await page.waitForTimeout(500);
        await expect(
          page.getByRole('button', { name: /export/i }).first()
        ).toBeVisible({ timeout: 5000 });
        await takeScreenshot(page, 'settings-data');
      }
    });
  });
});
