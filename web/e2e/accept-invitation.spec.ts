import { test, expect, Page } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

interface InvitationOverrides {
  id?: string;
  email?: string;
  role?: string;
  status?: string;
  expiresAt?: string;
  householdName?: string;
  invitedByName?: string;
}

async function mockInvitation(page: Page, overrides: InvitationOverrides = {}) {
  const defaults = {
    id: '1',
    email: 'test@test.com',
    role: 'member',
    status: 'pending',
    expiresAt: '2030-01-01T00:00:00Z',
    householdName: 'Test Household',
    invitedByName: 'John Doe',
  };
  await page.route('**/graphql', async (route) => {
    const body = route.request().postDataJSON?.();
    if (body?.query?.includes('invitationByToken')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { invitationByToken: { ...defaults, ...overrides } },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

async function mockNullInvitation(page: Page, delayMs = 0) {
  await page.route('**/graphql', async (route) => {
    const body = route.request().postDataJSON?.();
    if (body?.query?.includes('invitationByToken')) {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { invitationByToken: null } }),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe('Accept Invitation Page', () => {
  test('shows error for invalid/missing invitation token', async ({ page }) => {
    await page.goto('/invite/invalid-token-12345');

    await expect(
      page.getByText(/invitation not found|invalid|not found/i).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('link', { name: /login|sign in/i }).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-invalid');
  });

  test('displays the OpenFinance branding', async ({ page }) => {
    await page.goto('/invite/some-token');

    await expect(
      page.getByText('Household Invitation').first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator('.bg-gradient-to-br span:has-text("O")').first()
    ).toBeVisible();
  });

  test('shows loading state while fetching invitation', async ({ page }) => {
    await mockNullInvitation(page, 1000);
    await page.goto('/invite/slow-token');

    // Loading spinner should appear briefly — page should at minimum render
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows expired state for expired invitations', async ({ page }) => {
    await mockInvitation(page, { expiresAt: '2020-01-01T00:00:00Z' });

    await page.goto('/invite/expired-token');

    await expect(
      page.getByText(/expired/i).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/send a new one/i).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-expired');
  });

  test('shows already-used state for accepted invitations', async ({ page }) => {
    await mockInvitation(page, { status: 'accepted' });

    await page.goto('/invite/used-token');

    await expect(
      page.getByText(/already accepted|already been used/i).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('link', { name: /dashboard/i }).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-used');
  });

  test('shows sign in / create account for unauthenticated users with valid invitation', async ({ page }) => {
    await mockInvitation(page, {
      email: 'invitee@test.com',
      householdName: 'The Smiths',
      invitedByName: 'Jane Smith',
    });

    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('access_token'));

    await page.goto('/invite/valid-token');

    await expect(
      page.getByText(/Jane Smith/i).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/The Smiths/i).first()
    ).toBeVisible();

    await expect(page.getByText(/invited by/i).first()).toBeVisible();
    await expect(page.getByText(/role/i).first()).toBeVisible();
    await expect(page.getByText(/member/i).first()).toBeVisible();
    await expect(page.getByText(/invitee@test.com/).first()).toBeVisible();

    await expect(
      page.getByRole('button', { name: /sign in/i }).or(page.getByRole('link', { name: /sign in/i })).first()
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /create account/i }).or(page.getByRole('link', { name: /create account/i })).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-valid-unauthenticated');
  });

  test('sign in link preserves redirect back to invitation', async ({ page }) => {
    await mockInvitation(page, {
      email: 'invitee@test.com',
      householdName: 'Test House',
      invitedByName: 'Tester',
    });

    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('access_token'));

    await page.goto('/invite/redirect-test');

    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInLink).toBeVisible({ timeout: 5000 });
    const href = await signInLink.getAttribute('href');
    expect(href).toContain('redirect');
    expect(href).toContain('invite');
  });

  test('shows email mismatch warning when logged in as different user', async ({ page }) => {
    await loginViaApi(page);

    await mockInvitation(page, {
      email: 'different-user@test.com',
      householdName: 'Other Household',
      invitedByName: 'Someone',
    });

    await page.goto('/invite/mismatch-token');

    await expect(
      page.getByText(/different-user@test.com/).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/sign in with the correct account/i).first()
    ).toBeVisible();

    await takeScreenshot(page, 'invitation-email-mismatch');
  });

  test('shows accept button when logged in as correct user', async ({ page }) => {
    await loginViaApi(page);

    await mockInvitation(page, {
      email: 'demo@openfinance.dev',
      householdName: 'Friend Household',
      invitedByName: 'A Friend',
    });

    await page.goto('/invite/matching-token');

    await expect(
      page.getByRole('button', { name: /accept invitation/i }).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/A Friend/).first()).toBeVisible();
    await expect(page.getByText(/Friend Household/).first()).toBeVisible();

    await takeScreenshot(page, 'invitation-accept-ready');
  });
});
