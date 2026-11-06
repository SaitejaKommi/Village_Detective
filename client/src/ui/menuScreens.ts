import { audio } from '../audio/audioManager';
import { DIFFICULTIES, type Difficulty } from '../data/difficulty';
import { npcDef, SUSPECT_IDS, VICTIM_ID } from '../data/npcs';
import { getSettings, updateSettings } from '../settings';
import { store } from '../state/store';
import { $, h, icon } from './dom';
import { portrait } from './portrait';
import { detectiveStreetSVG, mansionSVG, silhouetteSVG } from './silhouettes';

/** Re-render when the store changes; unsubscribes itself once the element has left the DOM. */
export function bindStore(el: HTMLElement, render: (s: typeof store.state) => void): void {
  let seen = false;
  const unsub = store.subscribe((s) => {
    if (el.isConnected) seen = true;
    else if (seen) { unsub(); return; }
    render(s);
  });
  render(store.state);
}

function backBtn(onBack: () => void): HTMLButtonElement {
  return h('button', { class: 'btn icon ghost', type: 'button', 'aria-label': 'Back', onclick: onBack }, icon('back'));
}

// ---- 0. Audio gate -----------------------------------------------------------
export function gateScreen(onBegin: () => void): HTMLElement {
  const btn = h('button', { class: 'gate-text', type: 'button', 'data-autofocus': '' }, 'Click to begin');
  const el = h('div', { class: 'gate' }, h('div', null, btn, h('div', { class: 'gate-sub' }, 'Best with sound')));
  const go = () => { el.removeEventListener('click', go); onBegin(); };
  el.addEventListener('click', go);
  return el;
}

// ---- 2. Main menu --------------------------------------------------------------
export function menuScreen(h2: { onStart: () => void; onProfile: () => void; onSettings: () => void }): HTMLElement {
  const diamonds = h('span', { class: 'menu-diamonds' });
  const items = [
    h('button', { class: 'menu-item', type: 'button', 'data-autofocus': '', onclick: h2.onStart }, 'Start Investigation'),
    h('button', { class: 'menu-item', type: 'button', onclick: h2.onProfile }, 'Detective Profile'),
    h('button', { class: 'menu-item', type: 'button', onclick: h2.onSettings }, 'Settings'),
  ];
  const list = h('div', { class: 'menu-list', role: 'menu' }, ...items);
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  const bg = h('div', { class: 'scenery', style: 'opacity:.55' });
  bg.innerHTML = mansionSVG();
  const sil = h('div', { class: 'menu-silhouette' });
  sil.innerHTML = detectiveStreetSVG();
  const el = h('div', { class: 'menu transparent' },
    bg, sil,
    h('div', { class: 'menu-inner' },
      h('div', { class: 'title-block' },
        h('div', { class: 'orn' }),
        h('h1', { class: 'game-title' }, h('span', null, 'A noir mystery'), 'Village of', h('br'), 'Liars'),
        h('p', { class: 'tagline' }, 'One night. One body. Five liars.'),
      ),
      list,
      diamonds,
    ),
  );
  bindStore(el, (s) => {
    diamonds.replaceChildren(icon('diamond'), s.diamonds === null ? '…' : `${s.diamonds} diamonds`);
  });
  return el;
}

// ---- 3. Difficulty --------------------------------------------------------------
export function difficultyScreen(handlers: { onPick: (d: Difficulty) => void; onBack: () => void }): HTMLElement {
  const cards = DIFFICULTIES.map((d, i) =>
    h('button', { class: 'diff-card', type: 'button', 'data-d': d.id, ...(i === 1 ? { 'data-autofocus': '' } : {}), onclick: () => handlers.onPick(d.id) },
      h('span', { class: 'tag' }, d.tag),
      h('h3', null, d.label),
      h('p', null, d.blurb),
      h('ul', null, ...d.bullets.map((b) => h('li', null, b))),
    ),
  );
  return h('div', null,
    h('div', { class: 'screen-head' }, backBtn(handlers.onBack), h('h2', null, 'Select difficulty')),
    h('div', { class: 'screen-body' },
      h('p', { class: 'muted', style: 'margin-top:0' }, 'Choose your challenge. The case is the same; the people in it are not.'),
      h('div', { class: 'diff-grid' }, ...cards)),
  );
}

// ---- 4. Detective profile -------------------------------------------------------
export function profileScreen(onBack: () => void): HTMLElement {
  const dia = h('div', { class: 'num' });
  const solved = h('div', { class: 'num' });
  const det = h('div', { class: 'profile-detective' });
  det.innerHTML = silhouetteSVG('detective');
  const slots = ['Outfits', 'Hats', 'Accessories', 'Equipment'].map((n, i) =>
    i === 0
      ? h('div', { class: 'slot on' }, 'Classic trench')
      : h('div', { class: 'slot' }, icon('lock'), h('span', null, n), h('span', { class: 'soon' }, 'Coming soon')));
  const el = h('div', null,
    h('div', { class: 'screen-head' }, backBtn(onBack), h('h2', null, 'Detective Profile')),
    h('div', { class: 'screen-body profile-grid' },
      det,
      h('div', null,
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('div', { class: 'eyebrow' }, 'Diamonds'), dia),
          h('div', { class: 'stat' }, h('div', { class: 'eyebrow' }, 'Cases solved'), solved),
        ),
        h('h3', { style: 'margin-bottom:6px;color:var(--gold-bright);font-size:1.5rem' }, 'The Detective'),
        h('p', { class: 'muted', style: 'margin-top:0' }, 'Grey fedora, black trench coat, a notebook and a good deal of patience.'),
        h('div', { class: 'eyebrow', style: 'margin:20px 0 8px' }, 'Wardrobe'),
        h('div', { class: 'wardrobe' }, ...slots),
      ),
    ),
  );
  bindStore(el, (s) => {
    dia.replaceChildren(icon('diamond'), s.profile ? String(s.diamonds ?? s.profile.diamonds) : '…');
    solved.textContent = s.profile ? String(s.profile.casesSolved) : '…';
  });
  return el;
}

// ---- 5. Settings -----------------------------------------------------------------
export function settingsScreen(onBack: () => void): HTMLElement {
  const s = getSettings();
  const slider = (id: 'music' | 'effects' | 'ambience', label: string) => {
    const val = h('span', { class: 'val' }, `${Math.round(s[id] * 100)}%`);
    const input = h('input', { type: 'range', id: `set-${id}`, min: '0', max: '100', step: '1', value: String(Math.round(s[id] * 100)), 'aria-label': label });
    input.addEventListener('input', () => { updateSettings({ [id]: Number(input.value) / 100 }); val.textContent = `${input.value}%`; });
    input.addEventListener('change', () => audio.sfx('click'));
    return h('div', { class: 'setting' }, h('label', { for: `set-${id}` }, label), val, input);
  };
  const toggle = (key: 'mute' | 'skipIntro', label: string) => {
    const input = h('input', { type: 'checkbox', id: `set-${key}`, role: 'switch' });
    input.checked = s[key];
    input.addEventListener('change', () => { updateSettings({ [key]: input.checked }); audio.sfx('click'); });
    return h('div', { class: 'setting' }, h('label', { for: `set-${key}` }, label), h('span', { class: 'switch' }, input, h('span', { class: 'track' })));
  };
  const el = h('div', null,
    h('div', { class: 'screen-head' }, backBtn(onBack), h('h2', null, 'Settings')),
    h('div', { class: 'screen-body' }, h('div', { class: 'settings-list' },
      slider('music', 'Music volume'), slider('effects', 'Effects volume'), slider('ambience', 'Rain and ambience'),
      toggle('mute', 'Mute all'), toggle('skipIntro', 'Skip intro'),
      h('p', { class: 'muted' }, 'Saved on this device.'),
    )),
  );
  return el;
}

// ---- 6. Case briefing --------------------------------------------------------------
export function briefingScreen(onBegin: () => void, onBack: () => void): HTMLElement {
  const c = store.state.caseInfo;
  if (!c) return h('div', null, 'No case.');
  const diff = DIFFICULTIES.find((d) => d.id === c.difficulty);
  const chips = SUSPECT_IDS.map((id) => {
    const sp = c.suspects.find((x) => x.id === id);
    const def = npcDef(id);
    return h('div', { class: 'suspect-chip' }, portrait(id), h('b', null, sp?.name ?? def?.name ?? id), h('span', null, sp?.role ?? def?.role ?? ''));
  });
  const victimDef = npcDef(c.briefing.victimId) ?? npcDef(VICTIM_ID)!;
  const begin = h('button', { class: 'btn primary', type: 'button', 'data-autofocus': '', onclick: onBegin }, 'Begin investigation');
  return h('div', null,
    h('div', { class: 'screen-head' }, backBtn(onBack), h('div', { class: 'eyebrow', style: 'flex:1' }, `Case file${diff ? ' · ' + diff.label : ''}`)),
    h('div', { class: 'screen-body briefing' },
      h('h2', { class: 'case-title' }, c.briefing.title),
      h('p', { class: 'scene', style: 'margin:12px 0' }, c.briefing.scene),
      h('div', { class: 'victim' },
        portrait(victimDef.id),
        h('div', null, h('div', { class: 'eyebrow' }, 'The victim'),
          h('h3', { style: 'color:var(--gold-bright);font-size:1.7rem' }, c.briefing.victimName),
          h('div', { class: 'muted' }, victimDef.role + '. ' + victimDef.appearance))),
      h('p', { style: 'max-width:70ch' }, c.briefing.summary),
      h('div', { class: 'eyebrow', style: 'margin-top:20px' }, 'Persons of interest'),
      h('div', { class: 'suspect-row' }, ...chips),
      h('div', { class: 'begin-bar' }, begin),
    ),
  );
}

export function loadingOverlay(text: string): HTMLElement {
  return h('div', { class: 'loading', role: 'status' }, text);
}

export { $ };
