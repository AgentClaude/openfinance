import { test } from '@playwright/test';
import { login } from './helpers';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const MARKETING_DIR = path.join(__dirname2, '..', 'public', 'marketing');

const pages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'accounts', path: '/accounts' },
  { name: 'transactions', path: '/transactions' },
  { name: 'budget', path: '/budget' },
  { name: 'reports', path: '/reports' },
  { name: 'goals', path: '/goals' },
  { name: 'investments', path: '/investments' },
  { name: 'settings', path: '/settings' },
];

fs.mkdirSync(MARKETING_DIR, { recursive: true });

async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
  await page.waitForTimeout(500);
}

test.describe('Marketing Screenshots', () => {
  for (const mode of ['light', 'dark'] as const) {
    for (const p of pages) {
      test(`${p.name} - ${mode}`, async ({ page }) => {
        await login(page);
        await setTheme(page, mode);
        await page.goto(p.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(MARKETING_DIR, `${p.name}-${mode}.png`),
          fullPage: true,
        });
      });
    }
  }
});
