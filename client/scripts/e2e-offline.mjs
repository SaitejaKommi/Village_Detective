// Dev-only smoke test of the REAL WebSocket path with no server running.
// Start the client with the mock off, on another port:
//   $env:VITE_USE_MOCK='false'; npx vite --port 5174
//   $env:BASE_URL='http://localhost:5174'; node scripts/e2e-offline.mjs
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL ?? 'http://localhost:5174';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/404|WebSocket connection/.test(m.text())) errors.push(m.text()); });
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) process.exitCode = 1; };
const banner = () => page.locator('.conn-banner').first().innerText().catch(() => '');

await page.goto(base + '/');
await page.click('.gate-text'); await page.waitForTimeout(300); await page.keyboard.press('Space');
await page.waitForSelector('.menu-item');
await page.waitForTimeout(2200);
const mode = await page.evaluate(() => document.title);
let b = await banner();
console.log('t~3s banner:', JSON.stringify(b.replace(/\s+/g, ' ')));
ok(/Connecting|Reconnecting|Connection lost/i.test(b), 'banner appears while connecting/reconnecting (real mode, no server)');
let seen = new Set([b.replace(/\s+/g, ' ')]);
for (let i = 0; i < 24 && !/Cannot reach/i.test(b); i++) { await page.waitForTimeout(2500); b = await banner(); seen.add(b.replace(/\s+/g, ' ')); }
console.log('banner states seen:', [...seen]);
ok(/Cannot reach the server/i.test(b), 'goes offline with a Retry button after the attempts run out');
ok((await page.locator('.conn-banner button:has-text("Retry")').count()) === 1, 'Retry button present');
await page.click('.conn-banner button:has-text("Retry")');
await page.waitForTimeout(900);
ok(/Reconnecting|Connecting|Connection lost/i.test(await banner()), 'Retry restarts the reconnect cycle');
// Start Investigation must time out with a toast, not hang
await page.click('text=Start Investigation');
await page.click('.diff-card[data-d="easy"]');
await page.waitForSelector('.loading', { timeout: 3000 });
ok(true, 'loading overlay shown while waiting for the server');
await page.waitForSelector('.toast.error', { timeout: 20000 });
ok(!(await page.locator('.loading').count()), 'loading overlay cleared after the timeout: ' + (await txt()));
async function txt() { return (await page.locator('.toast.error').first().innerText().catch(() => '')).trim(); }
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
void mode;
await browser.close();
