import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const EMAIL = 'demo@openfinance.dev';
export const PASSWORD = 'password123';
const SCREENSHOTS_DIR = path.join(__dirname, 'results', 'screenshots');

export async function ensureScreenshotDir() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

export async function takeScreenshot(page: Page, name: string) {
  ensureScreenshotDir();
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}
