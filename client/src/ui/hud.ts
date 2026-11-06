// Gameplay HUD: clock, room, objective, diamonds, hint / notebook / accuse buttons, interaction prompt,
// and the virtual joystick (touch devices only, via CSS (pointer: coarse)).
import { npcDef, SUSPECT_IDS } from '../data/npcs';
import { roomName } from '../data/mansion';
import { input } from '../game/input';
import type { Interactable } from '../scenes/MansionScene';
import { bus, formatClock, store } from '../state/store';
import { h, icon, isTouch } from './dom';
import { bindStore } from './menuScreens';

export interface HudHandlers {
  onNotebook: () => void;
  onHint: () => void;
  onAccuse: () => void;
  onInteract: (t: Interactable) => void;
}

export function createHud(hd: HudHandlers): HTMLElement {
  const clock = h('div', { class: 'hud-clock' }, '--:--');
  const room = h('div', { class: 'hud-room' });
  const objective = h('div', { class: 'hud-objective' });

  const dia = h('span', { class: 'cnt' }, '…');
  const diaPill = h('div', { class: 'pill static', title: 'Diamonds', 'aria-label': 'Diamonds' }, icon('diamond'), dia);
  const hintBtn = h('button', { class: 'pill', type: 'button', onclick: hd.onHint, 'aria-label': 'Hint' }, icon('hint'), h('span', { class: 'lab' }, 'Hint'));
  const noteBtn = h('button', { class: 'pill', type: 'button', onclick: hd.onNotebook, 'aria-label': 'Notebook' }, icon('notebook'), h('span', { class: 'lab' }, 'Notebook'));
  const accBtn = h('button', { class: 'pill', type: 'button', onclick: hd.onAccuse, style: 'color:#e9b5b0;border-color:#8f3a35', 'aria-label': 'Accuse' }, icon('search'), h('span', { class: 'lab' }, 'Accuse'));
  const note = h('div', { class: 'hud-note', hidden: true });

  const verb = h('span', { class: 'verb' });
  const what = h('span');
  const prompt = h('button', { class: 'prompt', type: 'button' }, h('kbd', null, 'E'), verb, what);
  let target: Interactable | null = null;
  prompt.addEventListener('click', () => { if (target) hd.onInteract(target); });

  // Joystick
  const knob = h('div', { class: 'knob' });
  const stick = h('div', { class: 'joystick', 'aria-hidden': 'true' }, knob);
  const R = 46;
  let pid = -1;
  const move = (e: PointerEvent) => {
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    input.joyX = dx / R; input.joyY = dy / R;
  };
  const end = () => { pid = -1; knob.style.transform = ''; input.joyX = 0; input.joyY = 0; };
  stick.addEventListener('pointerdown', (e) => { pid = e.pointerId; stick.setPointerCapture(pid); move(e); e.preventDefault(); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === pid) move(e); });
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  const el = h('div', { class: 'hud' },
    h('div', { class: 'hud-top' },
      h('div', { class: 'hud-left' }, clock, room, objective),
      h('div', { class: 'hud-right' }, diaPill, hintBtn, noteBtn, accBtn),
    ),
    note, prompt, stick,
  );

  const off = [
    bus.on('room', (r: string) => { room.textContent = roomName(r); }),
    bus.on('nearby', (t: Interactable | null) => {
      target = t;
      if (!t) { prompt.classList.remove('show'); return; }
      const label = t.kind === 'npc' ? (npcDef(t.id)?.name ?? t.id) : t.label;
      verb.textContent = t.kind === 'npc' ? 'Talk to' : 'Inspect';
      what.textContent = label;
      (prompt.querySelector('kbd') as HTMLElement).style.display = isTouch() ? 'none' : '';
      prompt.classList.add('show');
    }),
  ];

  bindStore(el, (s) => {
    clock.textContent = s.world ? formatClock(s.world.clock) : '--:--';
    dia.textContent = s.diamonds === null ? '…' : String(s.diamonds);
    objective.textContent = objectiveText();
    // Hint availability. The client only displays what the server told it.
    const noDiamonds = s.diamonds !== null && s.diamonds <= 0;
    const noHints = s.hintsLeft !== null && s.hintsLeft <= 0;
    hintBtn.setAttribute('aria-disabled', String(noDiamonds || noHints));
    if (noDiamonds || noHints) {
      note.hidden = false;
      note.textContent = noDiamonds
        ? 'No diamonds left. Hints are unavailable. Questioning and evidence stay free.'
        : 'No hints left on this difficulty.';
    } else note.hidden = true;
  });
  // Clean up bus listeners when the HUD is replaced.
  const mo = new MutationObserver(() => { if (!el.isConnected) { off.forEach((f) => f()); mo.disconnect(); end(); } });
  window.setTimeout(() => mo.observe(document.getElementById('ui')!, { childList: true, subtree: true }), 0);
  return el;
}

function objectiveText(): string {
  const s = store.state;
  const total = s.world?.clues.length ?? 0;
  const found = s.foundClues.length;
  const talked = SUSPECT_IDS.filter((id) => (s.transcripts[id]?.length ?? 0) > 0).length;
  if (!talked && !found) return 'Question the household and search the rooms for evidence.';
  if (talked < SUSPECT_IDS.length) return `Question the household (${talked}/${SUSPECT_IDS.length}). Search the rooms (${found}/${total}).`;
  if (total && found < total) return `Search the remaining rooms (${found}/${total} found).`;
  return 'Compare statements and evidence in your notebook, then name the killer.';
}
