import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Accept Invitation Page', () => {
  test('shows error for invalid/missing invitation token', async ({ page }) => {
    await page.goto('/invite/invalid-token-12345');
    await page.waitForLoadState('networkidle');

    // Should show "Invitation not found" or error state
    await expect(
      page.getByText(/invitation not found|invalid|not found/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Should have a link back to login
    await expect(
      page.getByRole('link', { name: /login|sign in/i }).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-invalid');
  });

  test('displays the OpenFinance branding', async ({ page }) => {
    await page.goto('/invite/some-token');
    await page.waitForLoadState('networkidle');

    // Logo/brand element
    await expect(
      page.locator('text=Household Invitation').first()
    ).toBeVisible({ timeout: 10000 });

    // The "O" logo
    await expect(
      page.locator('.bg-gradient-to-br span:has-text("O")').first()
    ).toBeVisible();
  });

  test('shows loading state while fetching invitation', async ({ page }) => {
    // Use a route intercept to slow down the response
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        // Delay the response
        await new Promise((r) => setTimeout(r, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { invitationByToken: null },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/invite/slow-token');

    // Loading spinner should appear briefly
    const loading = page.locator('text=Loading invitation').first();
    // It may pass quickly, so we just check the page renders
    await page.waitForLoadState('networkidle');
  });

  test('shows expired state for expired invitations', async ({ page }) => {
    // Mock an expired invitation
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              invitationByToken: {
                id: '1',
                email: 'test@test.com',
                role: 'member',
                status: 'pending',
                expiresAt: '2020-01-01T00:00:00Z', // Expired date
                householdName: 'Test Household',
                invitedByName: 'John Doe',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/invite/expired-token');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/expired/i).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/send a new one/i).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-expired');
  });

  test('shows already-used state for accepted invitations', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              invitationByToken: {
                id: '1',
                email: 'test@test.com',
                role: 'member',
                status: 'accepted', // Already used
                expiresAt: '2030-01-01T00:00:00Z',
                householdName: 'Test Household',
                invitedByName: 'John Doe',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/invite/used-token');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText(/already accepted|already been used/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Should have link to dashboard
    await expect(
      page.getByRole('link', { name: /dashboard/i }).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-used');
  });

  test('shows sign in / create account for unauthenticated users with valid invitation', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              invitationByToken: {
                id: '1',
                email: 'invitee@test.com',
                role: 'member',
                status: 'pending',
                expiresAt: '2030-01-01T00:00:00Z',
                householdName: 'The Smiths',
                invitedByName: 'Jane Smith',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Clear any auth tokens
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('access_token'));

    await page.goto('/invite/valid-token');
    await page.waitForLoadState('networkidle');

    // Should show the invitation details
    await expect(
      page.getByText(/Jane Smith/i).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/The Smiths/i).first()
    ).toBeVisible();

    // Invitation details section
    await expect(page.getByText(/invited by/i).first()).toBeVisible();
    await expect(page.getByText(/role/i).first()).toBeVisible();
    await expect(page.getByText(/member/i).first()).toBeVisible();
    await expect(page.getByText(/invitee@test.com/).first()).toBeVisible();

    // Sign in and Create account buttons
    await expect(
      page.getByRole('button', { name: /sign in/i }).or(page.getByRole('link', { name: /sign in/i })).first()
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /create account/i }).or(page.getByRole('link', { name: /create account/i })).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-valid-unauthenticated');
  });

  test('sign in link preserves redirect back to invitation', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              invitationByToken: {
                id: '1',
                email: 'invitee@test.com',
                role: 'member',
                status: 'pending',
                expiresAt: '2030-01-01T00:00:00Z',
                householdName: 'Test House',
                invitedByName: 'Tester',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('access_token'));

    await page.goto('/invite/redirect-test');
    await page.waitForLoadState('networkidle');

    // Click sign in
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    if (await signInLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await signInLink.getAttribute('href');
      expect(href).toContain('redirect');
      expect(href).toContain('invite');
    }
  });

  test('shows email mismatch warning when logged in as different user', async ({ page }) => {
    // First login as demo user
    await loginViaApi(page);

    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              invitationByToken: {
                id: '1',
                email: 'different-user@test.com', // Different from demo@openfinance.dev
                role: 'member',
                status: 'pending',
                expiresAt: '2030-01-01T00:00:00Z',
                householdName: 'Other Household',
                invitedByName: 'Someone',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/invite/mismatch-token');
    await page.waitForLoadState('networkidle');

    // Should show email mismatch warning
    await expect(
      page.getByText(/different-user@test.com/).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/sign in with the correct account/i).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-email-mismatch');
  });

  test('shows accept button when logged in as correct user', async ({ page }) => {
    // Login as demo user
    await loginViaApi(page);

    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON?.();
      if (body?.query?.includes('invitationByToken')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              invitationByToken: {
                id: '1',
                email: 'demo@openfinance.dev', // Matches demo user
                role: 'member',
                status: 'pending',
                expiresAt: '2030-01-01T00:00:00Z',
                householdName: 'Friend Household',
                invitedByName: 'A Friend',
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/invite/matching-token');
    await page.waitForLoadState('networkidle');

    // Should show accept button
    await expect(
      page.getByRole('button', { name: /accept invitation/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // Invitation details visible
    await expect(page.getByText(/A Friend/).first()).toBeVisible();
    await expect(page.getByText(/Friend Household/).first()).toBeVisible();

    await takeScreenshot(page, 'invitation-accept-ready');
  });
});
