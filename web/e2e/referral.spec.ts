import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers';

test.describe('Referral Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first to get a valid origin, then clear auth state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('shows invalid referral page for bad code', async ({ page }) => {
    await page.goto('/r/INVALID-CODE-12345');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/invalid referral/i)
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('link', { name: /create free account/i })
    ).toBeVisible();

    await takeScreenshot(page, 'referral-invalid');
  });

  test('shows referral landing page with valid code', async ({ page, request }) => {
    // Get a valid referral code from the demo user
    const loginRes = await request.post('http://localhost:3001/graphql', {
      data: {
        query: `mutation { login(email: "demo@openfinance.dev", password: "password123") { token } }`
      }
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.login?.token;

    if (!token) {
      test.skip(true, 'Demo user not available');
      return;
    }

    const codeRes = await request.post('http://localhost:3001/graphql', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        query: `query { myReferralCode }`
      }
    });
    const codeData = await codeRes.json();
    const referralCode = codeData.data?.myReferralCode;

    if (!referralCode) {
      test.skip(true, 'Could not get referral code');
      return;
    }

    await page.goto(`/r/${referralCode}`);
    await page.waitForLoadState('networkidle');

    // Should show personalized referral page
    await expect(
      page.getByText(/invited you/i)
    ).toBeVisible({ timeout: 10000 });

    // Should show features
    await expect(
      page.getByText(/smart budgeting/i)
    ).toBeVisible();

    // Should show CTA buttons
    await expect(
      page.getByRole('button', { name: /get started free/i })
    ).toBeVisible();

    await takeScreenshot(page, 'referral-landing-valid');
  });

  test('stores referral code and navigates to register', async ({ page, request }) => {
    // Get valid code
    const loginRes = await request.post('http://localhost:3001/graphql', {
      data: {
        query: `mutation { login(email: "demo@openfinance.dev", password: "password123") { token } }`
      }
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.login?.token;

    if (!token) {
      test.skip(true, 'Demo user not available');
      return;
    }

    const codeRes = await request.post('http://localhost:3001/graphql', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        query: `query { myReferralCode }`
      }
    });
    const codeData = await codeRes.json();
    const referralCode = codeData.data?.myReferralCode;

    if (!referralCode) {
      test.skip(true, 'Could not get referral code');
      return;
    }

    await page.goto(`/r/${referralCode}`);
    await page.waitForLoadState('networkidle');

    // Wait for page to render
    await expect(page.getByText(/invited you/i)).toBeVisible({ timeout: 10000 });

    // Check that referral code is stored in localStorage
    const storedCode = await page.evaluate(() =>
      localStorage.getItem('openfinance_referral_code')
    );
    expect(storedCode).toBe(referralCode);

    // Click Get Started
    await page.getByRole('button', { name: /get started free/i }).click();

    // Should navigate to register with ref param
    await page.waitForURL(/\/register\?ref=/);
    expect(page.url()).toContain(`ref=${referralCode}`);

    // Should show the "Referred by a friend" badge
    await expect(
      page.getByText(/referred by a friend/i)
    ).toBeVisible({ timeout: 5000 });

    await takeScreenshot(page, 'referral-register-page');
  });

  test('register page shows referral badge with ref param', async ({ page }) => {
    await page.goto('/register?ref=TEST-CODE');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/referred by a friend/i)
    ).toBeVisible({ timeout: 10000 });

    await takeScreenshot(page, 'referral-register-badge');
  });
});
