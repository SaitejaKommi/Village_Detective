// Dev-only end-to-end check against the mock: gate -> menu -> difficulty -> briefing -> game -> move ->
// hint (3 -> 2) -> spend down -> accuse -> ending -> menu. Run with the dev server up:  node scripts/e2e.mjs
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL ?? 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) process.exitCode = 1; };
const txt = (sel) => page.locator(sel).first().innerText().catch(() => '');

await page.goto(base + '/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.click('.gate-text');
await page.waitForTimeout(400);
await page.keyboard.press('Space'); // skip the intro
await page.waitForSelector('.menu-item', { timeout: 5000 });
await page.waitForTimeout(500);
ok((await txt('.menu-diamonds')).includes('3'), 'menu shows 3 diamonds from the server');
await page.click('text=Start Investigation');
await page.click('.diff-card[data-d="easy"]');
await page.waitForSelector('.briefing', { timeout: 5000 });
ok((await txt('.case-title')).length > 3, 'briefing shown');
await page.click('text=Begin investigation');
await page.waitForSelector('.hud', { timeout: 5000 });
await page.waitForTimeout(1500);

// movement and wall collision
const pos = () => page.evaluate(() => { const s = window.__game.scene.getScene('MansionScene'); return { x: s.player.x, y: s.player.y }; });
const p0 = await pos();
await page.keyboard.down('d'); await page.waitForTimeout(500); await page.keyboard.up('d');
const p1 = await pos();
ok(p1.x > p0.x + 20, `player moves right (${p0.x.toFixed(0)} -> ${p1.x.toFixed(0)})`);
await page.keyboard.down('w'); await page.waitForTimeout(4500); await page.keyboard.up('w');
const p2 = await pos();
ok(p2.y > 12 * 32, `wall/door geometry holds (y=${p2.y.toFixed(0)}, wall line at 384)`);

// hint: 3 -> 2, server confirmed
await page.click('button[aria-label="Hint"]', { force: true });
ok((await txt('.hint-balance')).trim() === '3', 'hint panel shows balance 3');
await page.click('button:has-text("Spend 1 diamond")');
await page.waitForSelector('.hint-text', { timeout: 5000 });
ok((await txt('.hint-balance')).trim() === '2', 'balance is 2 after the hint');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
ok((await txt('.pill.static .cnt')).trim() === '2', 'HUD diamonds show 2');

// spend the rest, then check the empty state
for (let i = 0; i < 3; i++) {
  await page.waitForTimeout(800);
  await page.click('button[aria-label="Hint"]', { force: true });
  if (await page.locator('button:has-text("Spend 1 diamond")').count()) { await page.click('button:has-text("Spend 1 diamond")'); await page.waitForTimeout(900); }
  await page.keyboard.press('Escape');
}
await page.waitForTimeout(400);
const dia = (await txt('.pill.static .cnt')).trim();
ok(dia === '0', `balance bottoms out at 0 (HUD: ${dia})`);
ok(/No diamonds/i.test(await txt('.hud-note')) || /No hints/i.test(await txt('.hud-note')), 'HUD shows a clear no-hints message');
await page.click('button[aria-label="Hint"]', { force: true });
ok(/no diamonds|No hints/i.test(await txt('.modal')), 'hint panel explains it is unavailable');
await page.keyboard.press('Escape');
// the rest of the game still works at 0 diamonds
await page.click('button[aria-label="Notebook"]');
ok((await page.locator('.notebook').count()) === 1, 'notebook still opens at 0 diamonds');
await page.keyboard.press('Escape');

// accuse -> ending -> menu
await page.click('button[aria-label="Accuse"]');
await page.click('.accuse-card >> nth=0');
await page.click('button.danger');
await page.click('text=Make the accusation');
await page.waitForSelector('.verdict', { timeout: 6000 });
ok(/CASE (SOLVED|FAILED)/i.test(await txt('.verdict')), 'ending: ' + (await txt('.verdict')));
await page.waitForTimeout(6500);
ok((await page.locator('.timeline li').count()) >= 5, 'true timeline revealed');
await page.click('text=Return to menu');
await page.waitForSelector('.menu-item', { timeout: 5000 });
await page.waitForTimeout(500);
ok(true, 'back at the menu, balance: ' + (await txt('.menu-diamonds')).trim());

// persistence: reload keeps the balance
await page.reload();
await page.click('.gate-text'); await page.waitForTimeout(300); await page.keyboard.press('Space');
await page.waitForSelector('.menu-item');
await page.waitForTimeout(600);
console.log('balance after reload:', (await txt('.menu-diamonds')).trim());
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
