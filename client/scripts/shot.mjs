// Dev-only screenshot helper (uses your installed Chrome via playwright-core; nothing is downloaded).
//   node scripts/shot.mjs "<path+query>" <width>x<height> <out.png> [actions]
// actions: comma list of  click:<css> | wait:<ms> | press:<key> | type:<css>=<text> | scrollend
// Example: node scripts/shot.mjs "/?screen=menu" 1280x720 out.png wait:1500
import { chromium } from 'playwright-core';

const [, , path = '/', size = '1280x720', out = 'shot.png', actions = ''] = process.argv;
const [w, h] = size.split('x').map(Number);
const base = process.env.BASE_URL ?? 'http://localhost:5173';
const touch = process.env.TOUCH === '1';

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
// Only the query string matters (Git Bash rewrites a leading "/" into a Windows path).
const query = path.includes('?') ? path.slice(path.indexOf('?')) : '';
await page.goto(base + '/' + query, { waitUntil: 'load' });
await page.waitForTimeout(800);
for (const a of actions.split(',').filter(Boolean)) {
  const i = a.indexOf(':');
  const k = a.slice(0, i), v = a.slice(i + 1);
  if (k === 'click') await page.click(v);
  else if (k === 'wait') await page.waitForTimeout(Number(v));
  else if (k === 'press') await page.keyboard.press(v);
  else if (k === 'type') { const j = v.indexOf('='); await page.fill(v.slice(0, j), v.slice(j + 1)); }
  else if (k === 'eval') await page.evaluate(v);
}
await page.screenshot({ path: out });
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
