import { Page } from '@playwright/test';

export const EMAIL = 'demo@openfinance.dev';
export const PASSWORD = 'password123';
const API_URL = 'http://localhost:3001';

/**
 * Login via GraphQL API and set token in localStorage for speed.
 * Falls back to UI login if API fails.
 */
export async function loginViaApi(page: Page) {
  const response = await page.request.post(`${API_URL}/graphql`, {
    data: {
      query: `mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user { id email name householdId }
        }
      }`,
      variables: { email: EMAIL, password: PASSWORD },
    },
  });

  const json = await response.json();
  const token = json?.data?.login?.token;

  if (!token) {
    // Fallback to UI login
    return loginViaUi(page);
  }

  // Navigate to app and set token before the app loads
  await page.goto('/login');
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t);
  }, token);
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Login via the UI form.
 */
export async function loginViaUi(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}
