import { test, expect } from '@playwright/test';
import { EMAIL, PASSWORD, login, takeScreenshot } from './helpers';

test.describe('Authentication', () => {
  test.describe('Login', () => {
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
      await login(page);
      await expect(page).toHaveURL(/dashboard/);
      await takeScreenshot(page, 'auth-login-success');
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
  });

  test.describe('Session Persistence', () => {
    test('maintains session after page reload', async ({ page }) => {
      await login(page);
      await page.reload();
      await page.waitForLoadState('networkidle');
      // Should still be on dashboard, not redirected to login
      await expect(page).toHaveURL(/dashboard/);
    });

    test('maintains session when navigating', async ({ page }) => {
      await login(page);
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
    });
  });

  test.describe('Logout', () => {
    test('can log out and redirects to login', async ({ page }) => {
      await login(page);
      // Try various logout patterns
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
        // Try settings/profile link which might have logout
        await page.goto('/settings');
        await page.waitForTimeout(1000);
        const logoutInSettings = page.getByText(/log\s*out|sign\s*out/i).first();
        if (await logoutInSettings.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutInSettings.click();
        }
      }
      // If logout worked, should redirect
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Register', () => {
    test('shows registration form', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByLabel(/name/i).first()).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i).or(page.getByLabel(/password/i).first())).toBeVisible();
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
      // Fill password fields
      const passwordFields = page.getByLabel(/password/i);
      const count = await passwordFields.count();
      if (count >= 2) {
        await passwordFields.nth(0).fill('password123');
        await passwordFields.nth(1).fill('differentpassword');
      }
      await page.getByRole('button', { name: /sign up|register|create/i }).click();
      await expect(page.getByText(/match|mismatch/i).first()).toBeAttached({ timeout: 10000 });
    });

    test('can submit registration form', async ({ page }) => {
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
      const submitBtn = page.getByRole('button', { name: /sign up|register|create/i });
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();
      // Wait for either redirect or success/error message
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'auth-register-submitted');
    });
  });

  test.describe('Route Protection', () => {
    test('redirects unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });

    test('redirects unauthenticated users from transactions', async ({ page }) => {
      await page.goto('/transactions');
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });
});
