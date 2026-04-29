const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(process.cwd(), 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

async function enterAdmin(page) {
  await page.goto('http://localhost:8888', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('body').click({ position: { x: 20, y: 20 } }).catch(() => {});
  await page.keyboard.down('g');
  await page.keyboard.down('a');
  await page.waitForTimeout(250);
  await page.keyboard.up('a');
  await page.keyboard.up('g');
  await page.waitForSelector('.topbar.topbar-ref', { timeout: 10000 });
  await page.waitForTimeout(700);
}

async function captureSet(browser, theme, width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript((mode) => window.localStorage.setItem('ghost_theme_mode', mode), theme);
  const page = await context.newPage();
  await enterAdmin(page);

  const report = {};

  report.admin = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    mobileOnlyVisible: !!Array.from(document.querySelectorAll('.mobile-only, .bottom-nav, .mobile-bottom-nav')).find((el) => {
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    }),
  }));

  await page.screenshot({ path: path.join(outDir, `final-${width}-${theme}-admin.png`), fullPage: true });

  const liveButton = page.getByRole('button', { name: /Ghost Live/i }).first();
  await liveButton.click();
  await page.waitForTimeout(900);
  report.live = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    mobileOnlyVisible: !!Array.from(document.querySelectorAll('.mobile-only, .bottom-nav, .mobile-bottom-nav')).find((el) => {
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    }),
  }));
  await page.screenshot({ path: path.join(outDir, `final-${width}-${theme}-live.png`), fullPage: true });

  const commandCenter = page.getByRole('button', { name: /Command Center/i }).first();
  await commandCenter.click();
  await page.waitForTimeout(900);
  report.overview = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    mobileOnlyVisible: !!Array.from(document.querySelectorAll('.mobile-only, .bottom-nav, .mobile-bottom-nav')).find((el) => {
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    }),
  }));
  await page.screenshot({ path: path.join(outDir, `final-${width}-${theme}-overview.png`), fullPage: true });

  await context.close();
  return report;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const report = {
    generatedAt: new Date().toISOString(),
    dark1440: await captureSet(browser, 'dark', 1440, 1100),
    light1440: await captureSet(browser, 'light', 1440, 1100),
    dark1024: await captureSet(browser, 'dark', 1024, 900),
    light1024: await captureSet(browser, 'light', 1024, 900),
  };
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'final-web-pass-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
