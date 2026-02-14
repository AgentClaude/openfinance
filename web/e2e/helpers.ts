import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Re-export auth helpers for backward compatibility
export { EMAIL, PASSWORD, loginViaApi, loginViaUi } from './helpers/auth';
export { loginViaUi as login } from './helpers/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, 'results', 'screenshots');

export async function ensureScreenshotDir() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export async function takeScreenshot(page: Page, name: string) {
  ensureScreenshotDir();
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
}
