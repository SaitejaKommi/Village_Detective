// Gameplay panels: interrogation, evidence, notebook, hint, accusation, ending.
import { audio } from '../audio/audioManager';
import { npcDef, npcName, SUSPECT_IDS } from '../data/npcs';
import { roomName } from '../data/mansion';
import { net } from '../net/client';
import { bus, formatHour, store } from '../state/store';
import { h, icon } from './dom';
import { bindStore } from './menuScreens';
import { portrait } from './portrait';
import { closeOverlay, modal, openOverlay, toast } from './screens';
import { clueIconPath } from './silhouettes';

const ERROR_TEXT: Record<string, string> = {
  INSUFFICIENT_DIAMONDS: 'You have no diamonds left to spend on a hint.',
  HINT_CAP_REACHED: 'No hints remain on this difficulty.',
  NO_ACTIVE_CASE: 'There is no case in progress.',
  CASE_ALREADY_STARTED: 'A case is already running.',
  CASE_ALREADY_SOLVED: 'The accusation has already been made.',
  RATE_LIMITED: 'Slow down a moment.',
  NPC_NOT_FOUND: 'They are not available to talk right now.',
  CLUE_NOT_FOUND: 'There is nothing to examine there.',
  INVALID_MOVE: 'You cannot go that way.',
  INVALID_MESSAGE: 'That did not go through. Try again.',
};
export function friendlyError(code: string | number, message?: string): string {
  return ERROR_TEXT[String(code)] ?? message ?? 'Something went wrong. Try again.';
}

function suspectInfo(id: string): { name: string; role: string; appearance: string } {
  const s = store.state.caseInfo?.suspects.find((x) => x.id === id);
  const d = npcDef(id);
  return { name: s?.name ?? d?.name ?? id, role: s?.role ?? d?.role ?? '', appearance: d?.appearance ?? '' };
}

const closeBtn = (onclick: () => void) =>
  h('button', { class: 'btn icon ghost close', type: 'button', 'aria-label': 'Close', onclick }, icon('close'));

// ======================================================================================
// 8. Interrogation: side panel on desktop, bottom sheet on mobile
// ======================================================================================
const QUICK = ['Where were you at ten o\'clock?', 'What was your relationship with the victim?', 'Did you see anyone near the study?'];

export function openInterrogation(npcId: string): void {
  const info = suspectInfo(npcId);
  let pending = false;
  let timer: number | undefined;

  const thinkingWrap = h('div', { class: 'interro-portrait-wrap' }, portrait(npcId),
    h('div', { class: 'nameplate' }, h('h2', null, info.name), h('div', { class: 'role' }, info.role)));
  const transcript = h('div', { class: 'transcript', role: 'log', 'aria-live': 'polite' });
  const input = h('input', { type: 'text', maxlength: '300', placeholder: 'Ask a question…', autocomplete: 'off', enterkeyhint: 'send', 'aria-label': `Question for ${info.name}`, 'data-autofocus': '' });
  const send = h('button', { class: 'btn icon primary', type: 'submit', 'aria-label': 'Ask' }, icon('send'));
  const count = h('div', { class: 'count' }, '0 / 300');
  const form = h('form', { class: 'interro-form' }, input, send, count);
  const chips = h('div', { class: 'chips' }, ...QUICK.map((q) => h('button', { class: 'chip', type: 'button', onclick: () => { input.value = q; submit(); } }, q)));
  const tools = h('div', { class: 'interro-tools' },
    h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Open notebook', onclick: () => openNotebook() }, icon('notebook')),
    h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Close', onclick: () => close() }, icon('close')),
  );
  const panel = h('section', { class: 'interro', role: 'dialog', 'aria-label': `Interrogation: ${info.name}` }, thinkingWrap, tools, transcript, chips, form);

  const setPending = (p: boolean) => {
    pending = p;
    thinkingWrap.classList.toggle('thinking', p);
    send.disabled = p; input.disabled = p;
    if (!p) { window.clearTimeout(timer); window.setTimeout(() => input.focus({ preventScroll: true }), 30); }
    render();
  };

  const render = () => {
    const lines = store.state.transcripts[npcId] ?? [];
    transcript.replaceChildren();
    if (!lines.length && !pending) {
      transcript.append(h('div', { class: 'empty' }, `${info.name} waits for your first question.`));
    }
    for (const l of lines) {
      transcript.append(h('div', { class: `line ${l.who}` },
        h('span', { class: 'who' }, l.who === 'you' ? 'Detective' : info.name.split(' ')[0]),
        h('div', { class: 'said' }, l.text)));
    }
    if (pending) transcript.append(h('div', { class: 'thinking-dots', 'aria-label': `${info.name} is thinking` }, h('i'), h('i'), h('i')));
    chips.style.display = lines.length || pending ? 'none' : '';
    transcript.scrollTop = transcript.scrollHeight;
  };

  const submit = () => {
    const text = input.value.trim();
    if (!text || pending) return;
    input.value = ''; count.textContent = '0 / 300';
    store.addLine(npcId, { who: 'you', text, at: Date.now() });
    net.send({ type: 'talk', npcId, text });
    setPending(true);
    timer = window.setTimeout(() => { if (pending) { setPending(false); toast(`${info.name} does not answer. Try again.`, 'error'); } }, 25000);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  input.addEventListener('input', () => { count.textContent = `${input.value.length} / 300`; });
  // Keep the latest lines visible when the keyboard opens.
  input.addEventListener('focus', () => window.setTimeout(() => { transcript.scrollTop = transcript.scrollHeight; }, 250));

  const offSay = net.on('npc_say', (p) => { if (p.npcId === npcId && pending) setPending(false); });
  const offErr = net.on('error', (e) => { if (pending) { setPending(false); toast(friendlyError(e.code, e.message), 'error'); } });
  const close = () => closeOverlay(panel);
  openOverlay(panel, { onClose: () => { offSay(); offErr(); window.clearTimeout(timer); bus.emit('interrogation:closed', npcId); } });
  render();
}

// ======================================================================================
// 9. Evidence inspection modal
// ======================================================================================
export function openEvidence(clueId: string, fallbackTitle = 'Evidence'): void {
  const body = h('div');
  const iconBox = h('div', { class: 'evidence-icon' });
  let offErr: (() => void) | undefined, offStore: (() => void) | undefined, timer: number | undefined;
  const cleanup = () => { offErr?.(); offStore?.(); window.clearTimeout(timer); };
  const close = modal(body, { className: 'evidence', onClose: cleanup });

  const show = (title: string, text: string, room?: string) => {
    cleanup();
    iconBox.innerHTML = `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${clueIconPath(clueId, title)}</svg>`;
    body.replaceChildren(
      closeBtn(() => close()), iconBox,
      h('div', { class: 'meta' }, room ? `Found in the ${roomName(room)}` : 'Evidence'),
      h('h2', null, title), h('p', { class: 'body', style: 'margin:0' }, text),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', 'data-autofocus': '', onclick: () => close() }, 'Add to notebook')),
    );
    (body.querySelector('[data-autofocus]') as HTMLElement | null)?.focus();
    audio.sfx('paper');
  };
  const fail = (msg: string) => { cleanup(); body.replaceChildren(closeBtn(() => close()), h('h2', null, 'Nothing here'), h('p', { class: 'body muted' }, msg)); };

  // The server answers `inspect` with an event and a fresh `state` where the clue is `discovered` and carries its text.
  const have = () => store.state.foundClues.find((c) => c.id === clueId);
  const cached = have();
  if (cached) { show(cached.title, cached.text, cached.room); return; }
  body.replaceChildren(closeBtn(() => close()), h('h2', null, fallbackTitle), h('p', { class: 'body muted' }, 'Looking closer…'));
  offStore = store.subscribe(() => { const c = have(); if (c) show(c.title, c.text, c.room); });
  offErr = net.on('error', (p) => fail(friendlyError(p.code, p.message)));
  timer = window.setTimeout(() => fail('You find nothing of use.'), 8000);
  net.send({ type: 'inspect', clueId });
}

// ======================================================================================
// 10. Notebook
// ======================================================================================
type Tab = 'clues' | 'statements' | 'suspects';

export function openNotebook(startTab: Tab = 'clues'): void {
  let tab: Tab = startTab;
  const body = h('div', { class: 'nb-body', role: 'tabpanel' });
  const tabs = (['clues', 'statements', 'suspects'] as Tab[]).map((t) =>
    h('button', { class: 'tab', type: 'button', role: 'tab', 'data-tab': t, onclick: () => { tab = t; draw(); } }, t[0].toUpperCase() + t.slice(1)));
  const root = h('div', { class: 'notebook-inner', style: 'display:flex;flex-direction:column;height:100%;min-height:0' },
    h('div', { class: 'nb-head' }, h('h2', null, 'Notebook'), h('button', { class: 'btn icon ghost', type: 'button', 'aria-label': 'Close notebook', 'data-autofocus': '', onclick: () => close() }, icon('close'))),
    h('div', { class: 'tabs', role: 'tablist' }, ...tabs), body);

  const draw = () => {
    const s = store.state;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    body.replaceChildren();
    if (tab === 'clues') {
      if (!s.foundClues.length) body.append(h('div', { class: 'nb-empty' }, 'No evidence yet. Inspect objects in the rooms.'));
      for (const c of s.foundClues) body.append(h('div', { class: 'card' }, h('div', { class: 'where' }, c.room ? roomName(c.room) : 'Evidence'), h('h3', null, c.title), h('p', null, c.text)));
      if (s.hints.length) {
        body.append(h('div', { class: 'nb-group' }, h('h3', { class: 'group' }, 'Hints received')));
        for (const hnt of s.hints) body.append(h('div', { class: 'card' }, h('p', null, hnt.text)));
      }
    } else if (tab === 'statements') {
      let any = false;
      for (const id of SUSPECT_IDS) {
        const lines = s.transcripts[id] ?? [];
        const pairs: { q: string; a: string }[] = [];
        lines.forEach((l, i) => { if (l.who === 'npc') pairs.push({ q: lines[i - 1]?.who === 'you' ? lines[i - 1].text : '', a: l.text }); });
        if (!pairs.length) continue;
        any = true;
        body.append(h('div', { class: 'nb-group' }, h('h3', { class: 'group' }, npcName(id))));
        for (const p of pairs) body.append(h('div', { class: 'card stmt' }, h('q', null, p.a), p.q ? h('div', { class: 'ask' }, `You asked: ${p.q}`) : null));
      }
      if (!any) body.append(h('div', { class: 'nb-empty' }, 'No statements yet. Question the household.'));
    } else {
      const grid = h('div', { class: 'suspect-cards' });
      for (const id of SUSPECT_IDS) {
        const info = suspectInfo(id);
        const n = (s.transcripts[id] ?? []).filter((l) => l.who === 'npc').length;
        grid.append(h('div', { class: 's-card' }, portrait(id), h('div', { class: 'info' }, h('b', null, info.name), h('small', null, info.role), h('small', null, `${n} statement${n === 1 ? '' : 's'}`))));
      }
      body.append(grid);
    }
  };

  const close = modal(root, { full: true, className: 'notebook' });
  draw();
  // Redraw only when the notebook's own data changes (not on every world tick).
  let last = [store.state.foundClues, store.state.transcripts, store.state.hints];
  bindStore(root, (st) => {
    const now = [st.foundClues, st.transcripts, st.hints];
    if (now.some((v, i) => v !== last[i])) { last = now; draw(); }
  });
  audio.sfx('paper');
}

// ======================================================================================
// 11. Hint panel (server confirms the cost and the balance)
// ======================================================================================
export function openHint(): void {
  const s0 = store.state;
  const body = h('div');
  let offHint: (() => void) | undefined, offErr: (() => void) | undefined;
  const cleanup = () => { offHint?.(); offErr?.(); };
  const close = modal(body, { onClose: cleanup });
  const x = closeBtn(() => close());

  const draw = (state: 'ask' | 'wait' | 'result' | 'blocked', msg?: string) => {
    const s = store.state;
    const bal = h('div', { class: 'hint-balance' }, icon('diamond'), s.diamonds === null ? '…' : String(s.diamonds));
    const past = s.hints.length ? h('div', { class: 'hint-history' }, ...s.hints.slice(0, -1).map((p) => h('div', { class: 'past' }, p.text))) : null;
    if (state === 'blocked') {
      body.replaceChildren(x, h('h2', null, 'Hint'), bal, h('p', { class: 'body' }, msg ?? ''), h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', 'data-autofocus': '', onclick: () => close() }, 'Back to the case')));
    } else if (state === 'wait') {
      body.replaceChildren(x, h('h2', null, 'Hint'), h('p', { class: 'body muted' }, 'Consulting your notes…'));
    } else if (state === 'result') {
      const last = s.hints[s.hints.length - 1];
      body.replaceChildren(x, h('h2', null, 'Hint'), h('div', { class: 'hint-text' }, last?.text ?? ''), h('div', { class: 'muted' }, 'Balance'), bal,
        s.hintsLeft !== null ? h('div', { class: 'muted' }, `${s.hintsLeft} hint${s.hintsLeft === 1 ? '' : 's'} left on this case`) : '', past ?? '',
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', 'data-autofocus': '', onclick: () => close() }, 'Continue')));
    } else {
      body.replaceChildren(x, h('h2', null, 'Hint'), h('p', { class: 'body', style: 'margin-top:0' }, 'Spend 1 diamond for a hint?'), h('div', { class: 'muted' }, 'Your balance'), bal,
        h('p', { class: 'muted' }, 'Questioning suspects and searching rooms is always free.'),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => close() }, 'Cancel'),
          h('button', { class: 'btn primary', type: 'button', 'data-autofocus': '', onclick: request }, 'Spend 1 diamond')));
    }
    (body.querySelector('[data-autofocus]') as HTMLElement | null)?.focus();
  };

  const request = () => {
    draw('wait');
    offHint = net.on('hint', () => { cleanup(); draw('result'); });
    offErr = net.on('error', (p) => { cleanup(); draw('blocked', friendlyError(p.code, p.message)); });
    net.send({ type: 'hint_request' });
  };

  if (s0.diamonds !== null && s0.diamonds <= 0) draw('blocked', 'You have no diamonds left, so hints are unavailable. Everything else stays free: keep questioning and searching.');
  else if (s0.hintsLeft !== null && s0.hintsLeft <= 0) draw('blocked', 'No hints remain on this difficulty.');
  else draw('ask');
}

// ======================================================================================
// 12. Accusation
// ======================================================================================
let lastAccused: string | null = null;

export function openAccuse(): void {
  let picked: string | null = null;
  const body = h('div');
  const close = modal(body, { className: 'accuse' });
  const x = closeBtn(() => close());
  const victim = store.state.caseInfo?.briefing.victimName ?? 'the victim';

  const pick = () => {
    const confirm = h('button', { class: 'btn danger', type: 'button', disabled: picked ? null : true, onclick: () => confirmStep() }, picked ? `Accuse ${npcName(picked).split(' ')[0]}` : 'Choose a suspect');
    const cards = SUSPECT_IDS.map((id) => {
      const info = suspectInfo(id);
      return h('button', { class: 'accuse-card', type: 'button', role: 'radio', 'aria-checked': String(picked === id), onclick: () => { picked = id; pick(); } },
        portrait(id), h('div', { class: 'info' }, h('b', null, info.name), h('small', null, info.role)));
    });
    body.replaceChildren(x, h('h2', null, 'Final accusation'), h('p', { class: 'muted', style: 'margin:0' }, `Who killed ${victim}?`),
      h('div', { class: 'accuse-grid', role: 'radiogroup', 'aria-label': 'Suspects' }, ...cards),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => close() }, 'Not yet'), confirm));
  };

  const confirmStep = () => {
    if (!picked) return;
    const id = picked;
    body.replaceChildren(x, h('h2', null, 'Are you certain?'),
      h('div', { class: 'victim', style: 'margin:0 0 12px' }, portrait(id), h('div', null, h('div', { class: 'eyebrow' }, 'You accuse'), h('h3', { style: 'color:var(--gold-bright);font-size:1.6rem' }, npcName(id)))),
      h('div', { class: 'warn' }, 'This is final. You can accuse only once, and the case ends immediately.'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => pick() }, 'Back'),
        h('button', { class: 'btn danger', type: 'button', 'data-autofocus': '', onclick: () => submit(id) }, 'Make the accusation')));
    (body.querySelector('[data-autofocus]') as HTMLElement | null)?.focus();
  };

  const submit = (id: string) => {
    lastAccused = id;
    body.replaceChildren(h('h2', null, 'The room falls silent…'), h('p', { class: 'body muted' }, 'Waiting for the verdict.'));
    const off = net.on('error', (p) => { off(); body.replaceChildren(x, h('h2', null, 'Not now'), h('p', { class: 'body muted' }, friendlyError(p.code, p.message)), h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => pick() }, 'Back'))); });
    net.on('game_over', () => { off(); close(); });
    net.send({ type: 'accuse', npcId: id });
  };
  pick();
}

// ======================================================================================
// 13. Case ending / reveal
// ======================================================================================
export function endingScreen(onMenu: () => void): HTMLElement {
  const g = store.state.gameOver;
  if (!g) return h('div', null, 'No result.');
  const won = g.won;
  const killer = npcName(g.killerId);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = reduced ? 0 : 0.9;

  // `time` in the case file is an hour of the day.
  const timeline = h('ol', { class: 'timeline', style: 'padding:0;margin:0' },
    ...g.timeline.map((t, i) => h('li', { style: `animation-delay:${1.4 + i * step}s` }, `${formatHour(t.time)} · ${t.place}. ${t.text}`)));
  const secretsAt = 1.4 + g.timeline.length * step + 0.4;
  const victim = store.state.caseInfo?.briefing.victimId;
  const secrets = h('div', { class: 'secrets' },
    ...Object.entries(g.secrets).filter(([id]) => id !== victim).map(([id, text], i) =>
      h('div', { class: `secret${id === g.killerId ? ' killer' : ''}`, style: `animation-delay:${secretsAt + i * (step * 0.6)}s` },
        portrait(id), h('div', null, h('b', null, npcName(id) + (id === g.killerId ? ' (the killer)' : '')), h('div', { class: 'muted' }, text)))));

  // The reward arrives in the `diamonds_update` that follows `game_over`. We show the server's balance, never our own sum.
  const balance = h('div', { class: 'muted' });
  const reward = won ? h('div', { class: 'reward-box' }, icon('diamond'), 'Reward earned') : null;
  bindStore(balance, (s) => { balance.textContent = s.diamonds === null ? '' : `Balance: ${s.diamonds} diamonds`; });

  return h('div', { class: 'ending' },
    h('div', { class: 'ending-inner' },
      h('div', { class: 'eyebrow' }, 'Case closed'),
      h('h1', { class: `verdict ${won ? 'won' : 'lost'}` }, won ? 'Case solved' : 'Case failed'),
      h('p', { class: 'killer-line' }, won
        ? `The killer was ${killer}. You named the right person.`
        : `${lastAccused ? 'You accused ' + npcName(lastAccused) + '. ' : ''}The killer was ${killer}.`),
      h('div', { class: 'reveal-row' }, reward, balance),
      h('div', { class: 'timeline-wrap' }, h('h3', null, 'What really happened'), timeline),
      h('div', { class: 'secrets' }, h('h3', { style: 'margin:16px 0 8px;font-size:1rem;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);font-family:var(--font-sans);font-weight:500' }, 'Everyone had something to hide'), secrets),
      h('button', { class: 'btn primary', type: 'button', 'data-autofocus': '', style: 'margin-top:24px', onclick: onMenu }, 'Return to menu'),
    ),
  );
}
