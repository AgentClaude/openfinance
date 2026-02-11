import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  // Capture network failures
  const failedRequests = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({ url: response.url(), status: response.status() });
    }
  });

  console.log('=== Loading login page ===');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  // Screenshot login page
  await page.screenshot({ path: '/tmp/of-01-login.png', fullPage: true });
  console.log('Screenshot: /tmp/of-01-login.png');

  // Check what's on the page
  const bodyText = await page.textContent('body');
  console.log('Body text (first 500):', bodyText?.substring(0, 500));

  // Look for form elements
  const inputs = await page.$$('input');
  console.log(`Found ${inputs.length} input elements`);
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  input: type=${type} name=${name} placeholder=${placeholder}`);
  }

  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} buttons`);
  for (const btn of buttons) {
    const text = await btn.textContent();
    console.log(`  button: "${text?.trim()}"`);
  }

  // Try to login
  console.log('\n=== Attempting login ===');
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="mail"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  
  if (emailInput && passwordInput) {
    await emailInput.fill('demo@openfinance.dev');
    await passwordInput.fill('password123');
    await page.screenshot({ path: '/tmp/of-02-filled.png', fullPage: true });
    
    // Click submit
    const submitBtn = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")');
    if (submitBtn) {
      console.log('Clicking submit button...');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('URL after login:', page.url());
      await page.screenshot({ path: '/tmp/of-03-after-login.png', fullPage: true });
      
      // Check dashboard
      const dashText = await page.textContent('body');
      console.log('Body after login (first 500):', dashText?.substring(0, 500));
      
      // Try navigating to accounts
      await page.goto(`${BASE_URL}/accounts`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: '/tmp/of-04-accounts.png', fullPage: true });
      console.log('\n=== Accounts page ===');
      console.log('Body (first 500):', (await page.textContent('body'))?.substring(0, 500));

      // Try transactions
      await page.goto(`${BASE_URL}/transactions`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: '/tmp/of-05-transactions.png', fullPage: true });
      console.log('\n=== Transactions page ===');
      console.log('Body (first 500):', (await page.textContent('body'))?.substring(0, 500));
    } else {
      console.log('No submit button found!');
    }
  } else {
    console.log('Email input found:', !!emailInput);
    console.log('Password input found:', !!passwordInput);
  }

  console.log('\n=== Console Errors ===');
  errors.forEach(e => console.log('ERROR:', e));
  
  console.log('\n=== Failed Requests ===');
  failedRequests.forEach(r => console.log(`FAILED: ${r.status} ${r.url}`));

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
