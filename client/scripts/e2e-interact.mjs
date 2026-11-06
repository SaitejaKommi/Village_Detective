// Dev-only: exercises the REAL interaction path (proximity prompt, E key, prompt button, tapping a sprite),
// not the ?screen= shortcuts. Also covers a second case after "Return to menu" (scene restart).
//   node scripts/e2e-interact.mjs     (dev server must be running)
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL ?? 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) process.exitCode = 1; };
const txt = (sel) => page.locator(sel).first().innerText().catch(() => '');

const startCase = async () => {
  await page.click('text=Start Investigation');
  await page.click('.diff-card[data-d="easy"]');
  await page.waitForSelector('.briefing', { timeout: 5000 });
  await page.click('text=Begin investigation');
  await page.waitForSelector('.hud', { timeout: 5000 });
  await page.waitForFunction(() => window.__game?.scene.getScene('MansionScene')?.npcs?.size === 5, null, { timeout: 8000 });
};
/** Put the detective just beside a clue or NPC. */
const placeNear = (kind, id, dx = 12, dy = 0) => page.evaluate(([k, i, ox, oy]) => {
  const s = window.__game.scene.getScene('MansionScene');
  const t = (k === 'clue' ? s.clues : s.npcs).get(i);
  s.player.setPosition(t.x + ox, t.y + oy);
}, [kind, id, dx, dy]);
/** Screen position of a world point, for real mouse clicks. */
const screenOf = (kind, id, dy = 0) => page.evaluate(([k, i, oy]) => {
  const s = window.__game.scene.getScene('MansionScene');
  const t = (k === 'clue' ? s.clues : s.npcs).get(i);
  const cam = s.cameras.main, r = window.__game.canvas.getBoundingClientRect();
  return { x: r.left + (t.x - cam.worldView.x) * cam.zoom, y: r.top + (t.y + oy - cam.worldView.y) * cam.zoom };
}, [kind, id, dy]);
const closeTop = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };

await page.goto(base + '/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.click('.gate-text'); await page.waitForTimeout(300); await page.keyboard.press('Space');
await page.waitForSelector('.menu-item');
await startCase();

// Evidence via the E key
await placeNear('clue', 'c_body', 0, 14);
await page.waitForTimeout(300);
let prompt = await txt('.prompt.show');
ok(/inspect/i.test(prompt), `prompt near the body: "${prompt.replace(/\s+/g, ' ')}"`);
await page.keyboard.press('e');
await page.waitForSelector('.modal', { timeout: 4000 });
await page.waitForFunction(() => /Alistair/.test(document.querySelector('.modal')?.innerText ?? ''), null, { timeout: 4000 }).catch(() => {});
ok(/Alistair/i.test(await txt('.modal')), 'E key opens the evidence modal with the clue text');
await closeTop();

// All five suspects: prompt, E, name plate, a question and a reply
const ids = await page.evaluate(() => [...window.__game.scene.getScene('MansionScene').npcs.keys()]);
ok(ids.length === 5, 'five suspects in the world: ' + ids.join(', '));
const names = { evelyn: 'Evelyn Blackwood', julian: 'Julian Blackwood', harold: 'Harold Finch', margaret: 'Margaret Doyle', victor: 'Victor Crane' };
for (const id of ids) {
  // NPCs wander, so another one can briefly be nearer. Re-place until the prompt names this NPC.
  for (let attempt = 0; attempt < 6; attempt++) {
    await placeNear('npc', id);
    await page.waitForTimeout(250);
    prompt = await txt('.prompt.show');
    if (prompt.toLowerCase().includes(names[id].toLowerCase())) break;
  }
  ok(/talk to/i.test(prompt) && prompt.toLowerCase().includes(names[id].toLowerCase()), `prompt for ${id}: "${prompt.replace(/\s+/g, ' ')}"`);
  await page.keyboard.press('e');
  await page.waitForSelector('.interro', { timeout: 4000 });
  ok((await txt('.interro h2')).toLowerCase().includes(names[id].toLowerCase()), `interrogation opens for ${names[id]}`);
  await page.fill('.interro-form input', 'Where were you at ten o\'clock?');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.line.npc', { timeout: 6000 });
  ok(true, `${id} answered`);
  await closeTop();
}

// Statements tab lists five people
await page.click('button[aria-label="Notebook"]');
await page.click('.tab[data-tab="statements"]');
ok((await page.locator('.nb-group h3.group').count()) === 5, 'notebook Statements lists five people');
await closeTop();

// Touch path: tap the prompt button instead of pressing E
await placeNear('clue', 'c_will', 0, 14);
await page.waitForTimeout(300);
await page.click('.prompt.show');
await page.waitForSelector('.modal', { timeout: 4000 });
await page.waitForFunction(() => /will/i.test(document.querySelector('.modal')?.innerText ?? ''), null, { timeout: 4000 }).catch(() => {});
ok(/will/i.test(await txt('.modal')), 'tapping the prompt button inspects the clue');
await closeTop();

// Tap the sprite itself (checks the hit area is on the sprite, feet and body)
for (const dy of [0, -20]) {
  await placeNear('npc', 'julian', 14, 0);
  await page.waitForTimeout(250);
  const p = await screenOf('npc', 'julian', dy);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(500);
  ok((await page.locator('.interro').count()) === 1, `tapping Julian ${dy === 0 ? 'at the feet' : 'on the body'} opens the interrogation`);
  await closeTop();
}
// Out of range tap does not open
await page.evaluate(() => window.__game.scene.getScene('MansionScene').player.setPosition(24 * 32, 21 * 32));
await page.waitForTimeout(300);
const far = await page.evaluate(() => { const s = window.__game.scene.getScene('MansionScene'); const n = [...s.npcs.values()].sort((a, b) => Math.hypot(b.x - s.player.x, b.y - s.player.y) - Math.hypot(a.x - s.player.x, a.y - s.player.y))[0]; return n.npcId; });
const fp = await screenOf('npc', far, -20);
if (fp.x > 0 && fp.x < 1280 && fp.y > 0 && fp.y < 720) { await page.mouse.click(fp.x, fp.y); await page.waitForTimeout(400); ok((await page.locator('.interro').count()) === 0, 'tapping a far NPC does not open (move closer toast)'); }

// Accuse -> ending -> menu -> second case -> interaction (scene restart path)
await page.click('button[aria-label="Accuse"]');
await page.click('.accuse-card >> nth=0');
await page.click('button.danger');
await page.click('text=Make the accusation');
await page.waitForSelector('.verdict', { timeout: 6000 });
await page.click('text=Return to menu');
await page.waitForSelector('.menu-item');
await startCase();
await placeNear('clue', 'c_body', 0, 14);
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForSelector('.modal', { timeout: 4000 });
ok(true, 'second case: E interaction works after restarting the scene');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
