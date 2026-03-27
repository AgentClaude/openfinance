import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test.describe('SEO & Marketing', () => {
  test.describe('Landing Page SEO', () => {
    test('has correct meta tags', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Title
      await expect(page).toHaveTitle(/OpenFinance/);

      // Meta description (Helmet adds data-rh attribute; use last() for the Helmet-managed one or first for fallback)
      const description = page.locator('meta[name="description"]').last();
      await expect(description).toHaveAttribute('content', /personal finance/i);

      // Open Graph tags
      await expect(page.locator('meta[property="og:type"]').first()).toHaveAttribute('content', 'website');
      await expect(page.locator('meta[property="og:title"]').first()).toHaveAttribute('content', /OpenFinance/);
      await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /og-image\.png/);

      // Twitter card
      await expect(page.locator('meta[name="twitter:card"]').first()).toHaveAttribute('content', 'summary_large_image');
    });

    test('has structured data (JSON-LD)', async ({ page }) => {
      await page.goto('/');

      const jsonLd = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent || '');
            if (data['@type'] === 'SoftwareApplication') return data;
          } catch { /* skip */ }
        }
        return null;
      });

      expect(jsonLd).not.toBeNull();
      expect(jsonLd?.['@context']).toBe('https://schema.org');
      expect(jsonLd?.['@type']).toBe('SoftwareApplication');
      expect(jsonLd?.name).toBe('OpenFinance');
      expect(jsonLd?.applicationCategory).toBe('FinanceApplication');
      expect(jsonLd?.featureList).toBeTruthy();
    });
  });

  test.describe('Pricing Page SEO', () => {
    test('has correct meta tags', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      // Wait for Helmet to update title
      await expect(page).toHaveTitle(/Pricing.*OpenFinance/, { timeout: 10000 });

      // Helmet-updated meta tags (last() because Helmet appends a new one with data-rh)
      const description = page.locator('meta[name="description"]').last();
      await expect(description).toHaveAttribute('content', /pricing/i);
    });

    test('displays pricing plans with toggle', async ({ page }) => {
      await page.goto('/pricing');

      await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /monthly/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /annual/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /compare plans/i })).toBeVisible();
    });
  });

  test.describe('Docs Page SEO', () => {
    test('has correct title', async ({ page }) => {
      await page.goto('/docs');
      await expect(page).toHaveTitle(/OpenFinance/);
    });
  });

  test.describe('Login Page SEO', () => {
    test('has correct title', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Sign In.*OpenFinance/);
    });
  });

  test.describe('Register Page SEO', () => {
    test('has correct title', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveTitle(/OpenFinance/);
    });
  });

  test.describe('Static Assets', () => {
    test('robots.txt is accessible and valid', async ({ request }) => {
      const response = await request.get('/robots.txt');
      expect(response.status()).toBe(200);
      const text = await response.text();

      expect(text).toContain('User-agent: *');
      expect(text).toContain('Allow: /');
      expect(text).toContain('Disallow: /dashboard');
      expect(text).toContain('Disallow: /graphql');
      expect(text).toContain('Sitemap:');
    });

    test('sitemap.xml is accessible and valid', async ({ request }) => {
      const response = await request.get('/sitemap.xml');
      expect(response.status()).toBe(200);
      const text = await response.text();

      expect(text).toContain('<?xml version="1.0"');
      expect(text).toContain('<urlset');
      expect(text).toContain('/pricing');
      expect(text).toContain('/docs');
    });

    test('manifest.json is accessible with PWA config', async ({ request }) => {
      const response = await request.get('/manifest.json');
      expect(response.status()).toBe(200);
      const json = await response.json();

      expect(json.name).toBe('OpenFinance');
      expect(json.display).toBe('standalone');
      expect(json.theme_color).toBe('#0D9488');
      expect(json.icons.length).toBeGreaterThanOrEqual(2);
      expect(json.shortcuts).toBeTruthy();
      expect(json.shortcuts.length).toBeGreaterThan(0);
    });

    test('favicon.svg is accessible', async ({ request }) => {
      const response = await request.get('/favicon.svg');
      expect(response.status()).toBe(200);
    });

    test('og-image.png is accessible', async ({ request }) => {
      const response = await request.get('/og-image.png');
      expect(response.status()).toBe(200);
    });

    test('PWA icons are accessible', async ({ request }) => {
      const r192 = await request.get('/icons/icon-192.png');
      expect(r192.status()).toBe(200);

      const r512 = await request.get('/icons/icon-512.png');
      expect(r512.status()).toBe(200);
    });
  });

  test.describe('Page Titles (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaApi(page);
    });

    test('dashboard has correct title', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveTitle(/Dashboard.*OpenFinance/, { timeout: 15000 });
    });

    test('transactions page has correct title', async ({ page }) => {
      await page.goto('/transactions');
      await expect(page).toHaveTitle(/Transactions.*OpenFinance/, { timeout: 15000 });
    });

    test('budget page has correct title', async ({ page }) => {
      await page.goto('/budget');
      await expect(page).toHaveTitle(/Budget.*OpenFinance/, { timeout: 15000 });
    });

    test('accounts page has correct title', async ({ page }) => {
      await page.goto('/accounts');
      await expect(page).toHaveTitle(/Accounts.*OpenFinance/, { timeout: 15000 });
    });

    test('reports page has correct title', async ({ page }) => {
      await page.goto('/reports');
      await expect(page).toHaveTitle(/Reports.*OpenFinance/, { timeout: 15000 });
    });

    test('settings page has correct title', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveTitle(/Settings.*OpenFinance/, { timeout: 15000 });
    });

    test('goals page has correct title', async ({ page }) => {
      await page.goto('/goals');
      await expect(page).toHaveTitle(/Goals.*OpenFinance/, { timeout: 15000 });
    });

    test('investments page has correct title', async ({ page }) => {
      await page.goto('/investments');
      await expect(page).toHaveTitle(/Investments.*OpenFinance/, { timeout: 15000 });
    });

    test('insights page has correct title', async ({ page }) => {
      await page.goto('/insights');
      await expect(page).toHaveTitle(/Insights.*OpenFinance/, { timeout: 15000 });
    });

    test('forecast page has correct title', async ({ page }) => {
      await page.goto('/forecast');
      await expect(page).toHaveTitle(/Cash Flow Forecast.*OpenFinance/, { timeout: 15000 });
    });
  });

  test.describe('Responsive Layout', () => {
    test('landing page renders on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Hero heading is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Nav is visible
      await expect(page.locator('nav')).toBeVisible();
    });

    test('landing page renders on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('pricing page renders on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible();
    });
  });
});
