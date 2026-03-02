import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';
const OUT_DIR = 'public/marketing';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  // Login as demo user
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'demo@openfinance.dev');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const screenshots = [
    { path: 'dashboard', url: '/dashboard' },
    { path: 'budget', url: '/budget' },
    { path: 'transactions', url: '/transactions' },
    { path: 'reports', url: '/reports' },
    { path: 'recurring', url: '/recurring' },
    { path: 'goals', url: '/goals' },
    { path: 'investments', url: '/investments' },
    { path: 'net-worth', url: '/net-worth' },
    { path: 'accounts', url: '/accounts' },
  ];

  for (const s of screenshots) {
    await page.goto(`${BASE_URL}${s.url}`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT_DIR}/${s.path}.png`, fullPage: false });
    console.log(`✓ ${s.path}`);
  }

  // Dark mode variants for hero
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1000);
  // Toggle dark mode via localStorage
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT_DIR}/dashboard-dark.png`, fullPage: false });
  console.log('✓ dashboard-dark');

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
