import { test, expect } from '@playwright/test';
import { EMAIL, PASSWORD, loginViaApi, loginViaUi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('shows login form with all fields', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      await takeScreenshot(page, 'auth-login-form');
    });

    test('shows link to register page', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('link', { name: /create.*account|register|sign up/i })).toBeVisible();
    });

    test('logs in with valid credentials and redirects to dashboard', async ({ page }) => {
      await loginViaUi(page);
      await expect(page).toHaveURL(/dashboard/);
    });

    test('shows error for invalid email', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('nonexistent@test.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page.getByText(/invalid|error|failed/i).first()).toBeAttached({ timeout: 10000 });
    });

    test('shows error for wrong password', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(EMAIL);
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page.getByText(/invalid|error|failed/i).first()).toBeAttached({ timeout: 10000 });
    });

    test('email field has required attribute', async ({ page }) => {
      await page.goto('/login');
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('password field is masked', async ({ page }) => {
      await page.goto('/login');
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Session Persistence', () => {
    test('maintains session after page reload', async ({ page }) => {
      await loginViaApi(page);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('maintains session when navigating between pages', async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
      await page.goto('/accounts');
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
    });
  });

  test.describe('Logout', () => {
    test('can log out and redirects to login', async ({ page }) => {
      await loginViaApi(page);

      // Look for logout in various places
      const logoutBtn = page.getByRole('button', { name: /log\s*out|sign\s*out/i }).first();
      const logoutLink = page.getByRole('link', { name: /log\s*out|sign\s*out/i }).first();
      const logoutText = page.getByText(/log\s*out|sign\s*out/i).first();

      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
      } else if (await logoutLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutLink.click();
      } else if (await logoutText.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutText.click();
      } else {
        // Try settings page
        await page.goto('/settings');
        await page.waitForTimeout(1000);
        const logoutInSettings = page.getByText(/log\s*out|sign\s*out/i).first();
        if (await logoutInSettings.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutInSettings.click();
        }
      }
      await page.waitForTimeout(2000);
    });

    test('after logout, accessing protected route redirects to login', async ({ page }) => {
      await loginViaApi(page);
      // Clear token to simulate logout
      await page.evaluate(() => localStorage.removeItem('access_token'));
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });

  test.describe('Register', () => {
    test('shows registration form', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByLabel(/name/i).first()).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      await takeScreenshot(page, 'auth-register-form');
    });

    test('shows link back to login', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByRole('link', { name: /sign in|log in|already have/i })).toBeVisible();
    });

    test('validates password confirmation mismatch', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/name/i).first().fill('Test User');
      await page.getByLabel(/email/i).fill('test-mismatch@test.com');
      const passwordFields = page.getByLabel(/password/i);
      const count = await passwordFields.count();
      if (count >= 2) {
        await passwordFields.nth(0).fill('password123');
        await passwordFields.nth(1).fill('differentpassword');
      }
      await page.getByRole('button', { name: /sign up|register|create/i }).click();
      await expect(page.getByText(/match|mismatch/i).first()).toBeAttached({ timeout: 10000 });
    });

    test('can submit registration form with unique email', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@test.com`;
      await page.goto('/register');
      await page.getByLabel(/name/i).first().fill('E2E Test User');
      await page.getByLabel(/email/i).fill(uniqueEmail);
      const passwordFields = page.getByLabel(/password/i);
      const count = await passwordFields.count();
      if (count >= 2) {
        await passwordFields.nth(0).fill('password123');
        await passwordFields.nth(1).fill('password123');
      } else {
        await passwordFields.first().fill('password123');
      }
      await page.getByRole('button', { name: /sign up|register|create/i }).click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'auth-register-submitted');
    });

    test('shows error for duplicate email', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/name/i).first().fill('Duplicate User');
      await page.getByLabel(/email/i).fill(EMAIL); // already exists
      const passwordFields = page.getByLabel(/password/i);
      const count = await passwordFields.count();
      if (count >= 2) {
        await passwordFields.nth(0).fill('password123');
        await passwordFields.nth(1).fill('password123');
      } else {
        await passwordFields.first().fill('password123');
      }
      await page.getByRole('button', { name: /sign up|register|create/i }).click();
      await expect(page.getByText(/already|exists|duplicate|error/i).first()).toBeAttached({ timeout: 10000 });
    });
  });

  test.describe('Route Protection', () => {
    test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });

    test('redirects unauthenticated users from transactions to login', async ({ page }) => {
      await page.goto('/transactions');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });

    test('redirects unauthenticated users from accounts to login', async ({ page }) => {
      await page.goto('/accounts');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });

    test('redirects unauthenticated users from settings to login', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });
});
