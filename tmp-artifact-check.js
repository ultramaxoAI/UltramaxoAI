const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  await page.goto('http://localhost:3000/api/auth/guest?redirectUrl=/chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('URL', page.url());
  console.log('BODY_START');
  console.log(((await page.textContent('body')) || '').slice(0, 2000));
  console.log('BODY_END');
  await browser.close();
})();
