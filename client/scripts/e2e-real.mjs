// Dev-only: drives the real UI against the REAL backend (no mock).
//   1) backend:  cd backend; $env:DB_PATH="$env:TEMP\vol-test.db"; $env:PORT='8099'; npx tsx src/index.ts
//   2) client:   cd client;  $env:VITE_USE_MOCK='false'; $env:VITE_WS_URL='ws://127.0.0.1:8099'; npx vite --port 5175
//   3) run:      $env:BASE_URL='http://localhost:5175'; node scripts/e2e-real.mjs
// Needs a fresh database (a new player starts with 3 diamonds).
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL ?? 'http://localhost:5175';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) process.exitCode = 1; };
const txt = (sel) => page.locator(sel).first().innerText().catch(() => '');
const scene = (fn, arg) => page.evaluate(fn, arg);

await page.goto(base + '/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.click('.gate-text'); await page.waitForTimeout(300); await page.keyboard.press('Space');
await page.waitForSelector('.menu-item');
await page.waitForTimeout(1200);
ok((await txt('.menu-diamonds')).includes('3'), 'menu shows 3 diamonds from the real server (get_profile after session)');

const startCase = async () => {
  await page.click('text=Start Investigation');
  await page.click('.diff-card[data-d="easy"]');
  await page.waitForSelector('.briefing', { timeout: 8000 });
  await page.click('text=Begin investigation');
  await page.waitForSelector('.hud', { timeout: 5000 });
  await page.waitForFunction(() => window.__game?.scene.getScene('MansionScene')?.npcs?.size === 5, null, { timeout: 8000 });
};
await startCase();
ok(true, 'case started on the real server, briefing shown, five suspects in the mansion');
const clueIds = await scene(() => [...window.__game.scene.getScene('MansionScene').clues.keys()].sort());
ok(clueIds.length === 8, `eight clues on easy (seven plus a red herring) (${clueIds.join(', ')})`);

const placeNear = (kind, id, dy = 18) => scene(([k, i, oy]) => {
  const s = window.__game.scene.getScene('MansionScene');
  const t = (k === 'clue' ? s.clues : s.npcs).get(i);
  s.player.setPosition(t.x, t.y + oy);
}, [kind, id, dy]);
const closeTop = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };
const waitModalText = (re) => page.waitForFunction((r) => new RegExp(r, 'i').test(document.querySelector('.modal')?.innerText ?? ''), re, { timeout: 5000 }).then(() => true, () => false);

// Foyer clue (the player starts in the foyer)
await placeNear('clue', 'muddy_footprints');
await page.waitForTimeout(300);
await page.keyboard.press('e');
ok(await waitModalText('footprints'), 'inspect works in the foyer: modal shows the real clue text');
await closeTop();

// Study clue: needs the room report. Walk into the study (adjacent to the foyer).
await placeNear('clue', 'broken_glass');
await page.waitForTimeout(500);
await page.keyboard.press('e');
ok(await waitModalText('glass'), 'inspect works in the STUDY after the client reports the room (backend fix)');
await closeTop();

// Notebook shows both discovered clues from state
await page.click('button[aria-label="Notebook"]');
ok((await page.locator('.nb-body .card').count()) >= 2, 'notebook lists the discovered clues');
await closeTop();

// Interrogation with the real agent loop (scripted fallback without API keys)
const npcIds = await scene(() => [...window.__game.scene.getScene('MansionScene').npcs.keys()]);
const target = npcIds.includes('evelyn') ? 'evelyn' : npcIds[0];
for (let i = 0; i < 6; i++) {
  await placeNear('npc', target, 0);
  await page.waitForTimeout(300);
  if (/talk to/i.test(await txt('.prompt.show'))) break;
}
await page.keyboard.press('e');
await page.waitForSelector('.interro', { timeout: 4000 });
await page.fill('.interro-form input', 'Where were you at midnight?');
await page.keyboard.press('Enter');
await page.waitForSelector('.line.npc', { timeout: 20000 });
ok((await txt('.line.npc .said')).length > 0, `${target} answered over the real WebSocket`);
await closeTop();

// Hint: 3 -> 2, server confirmed
await page.click('button[aria-label="Hint"]');
await page.click('button:has-text("Spend 1 diamond")');
await page.waitForSelector('.hint-text', { timeout: 6000 });
ok((await txt('.hint-balance')).trim() === '2', 'hint cost 1 diamond: balance 2');
await closeTop();

ok((await page.locator('.toast.error').count()) === 0, 'no error toasts during play (move is integer-only and room reports are accepted)');

// Accuse the killer from the case file (victor), see the reveal
await page.click('button[aria-label="Accuse"]');
await page.click('.accuse-card:has-text("Victor")');
await page.click('button.danger');
await page.click('text=Make the accusation');
await page.waitForSelector('.verdict', { timeout: 8000 });
ok(/CASE SOLVED/i.test(await txt('.verdict')), 'ending: ' + (await txt('.verdict')));
await page.waitForTimeout(6000);
const tl = await page.locator('.timeline li').allInnerTexts();
ok(tl.length > 0 && !tl.some((t) => /object Object|undefined/.test(t)), `timeline reads cleanly: "${tl[0] ?? ''}"`);
ok(/\+1/.test(await txt('.reward-box')), 'reward shown from the server: ' + (await txt('.reward-box')).trim());
await page.waitForTimeout(500);
ok(/Balance: 3/.test(await txt('.reveal-row')), 'balance after reward from diamonds_update: ' + (await txt('.reveal-row')).replace(/\s+/g, ' '));

// Second case in a new session
await page.click('text=Return to menu');
await page.waitForSelector('.menu-item');
await page.waitForTimeout(600);
await startCase();
ok(true, 'second case starts on a fresh session (no CASE_ALREADY_STARTED)');

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console or page errors');
await browser.close();
