// Screen + overlay manager. Screens are full-screen DOM views. Overlays (modals, panels) form a stack
// closed by Escape. Everything is a DOM layer above the Phaser canvas.
import { audio } from '../audio/audioManager';
import { bus } from '../state/store';
import { h } from './dom';

let screenRoot: HTMLElement;
let hudRoot: HTMLElement;
let overlayRoot: HTMLElement;
let currentScreen: HTMLElement | null = null;

interface OverlayEntry { el: HTMLElement; closable: boolean; onClose?: () => void; returnFocus: Element | null }
const stack: OverlayEntry[] = [];

export function initUi(): void {
  const ui = document.getElementById('ui')!;
  screenRoot = h('div', { id: 'screen-root' });
  hudRoot = h('div', { id: 'hud-root' });
  overlayRoot = h('div', { class: 'overlay-root' });
  ui.append(hudRoot, screenRoot, overlayRoot);
  // Root containers must not swallow taps meant for the game canvas.
  for (const r of [screenRoot, hudRoot]) { r.style.position = 'absolute'; r.style.inset = '0'; r.style.pointerEvents = 'none'; }
  overlayRoot.style.pointerEvents = 'none';

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length) {
      const top = stack[stack.length - 1];
      if (top.closable) { e.preventDefault(); closeOverlay(top.el); }
    }
  });
  // Keep sheets above the soft keyboard on phones.
  const vv = window.visualViewport;
  if (vv) {
    const upd = () => document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    vv.addEventListener('resize', upd);
    upd();
  }
}

export function showScreen(el: HTMLElement, opts: { instant?: boolean } = {}): void {
  const old = currentScreen;
  el.classList.add('screen');
  el.style.pointerEvents = 'auto';
  screenRoot.append(el);
  currentScreen = el;
  if (old) {
    if (opts.instant) old.remove();
    else { old.classList.add('leaving'); window.setTimeout(() => old.remove(), 460); }
  }
  // Move keyboard focus into the new screen.
  window.setTimeout(() => (el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>('button, [tabindex]'))?.focus({ preventScroll: true }), 80);
}

export function clearScreen(): void {
  const old = currentScreen;
  currentScreen = null;
  if (old) { old.classList.add('leaving'); window.setTimeout(() => old.remove(), 460); }
}

export function setHud(el: HTMLElement | null): void {
  hudRoot.replaceChildren();
  if (el) hudRoot.append(el);
}

export function overlayCount(): number { return stack.length; }
export function hasOverlay(): boolean { return stack.length > 0; }

export interface OverlayOpts { closable?: boolean; onClose?: () => void }

export function openOverlay(el: HTMLElement, opts: OverlayOpts = {}): () => void {
  const entry: OverlayEntry = { el, closable: opts.closable !== false, onClose: opts.onClose, returnFocus: document.activeElement };
  stack.push(entry);
  overlayRoot.append(el);
  bus.emit('overlay:change', stack.length);
  window.setTimeout(() => (el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>('button, input'))?.focus({ preventScroll: true }), 60);
  return () => closeOverlay(el);
}

export function closeOverlay(el: HTMLElement): void {
  const i = stack.findIndex((e) => e.el === el);
  if (i < 0) return;
  const [entry] = stack.splice(i, 1);
  el.remove();
  entry.onClose?.();
  bus.emit('overlay:change', stack.length);
  if (entry.returnFocus instanceof HTMLElement && document.contains(entry.returnFocus)) entry.returnFocus.focus({ preventScroll: true });
}

export function closeAllOverlays(): void {
  while (stack.length) closeOverlay(stack[stack.length - 1].el);
}

/** Standard modal: backdrop + dialog. Clicking the backdrop closes it. */
export function modal(content: HTMLElement, opts: OverlayOpts & { full?: boolean; className?: string } = {}): () => void {
  const dialog = h('div', { class: `modal ${opts.className ?? ''}`.trim(), role: 'dialog', 'aria-modal': 'true' }, content);
  const backdrop = h('div', { class: `backdrop${opts.full ? ' full' : ''}` }, dialog);
  backdrop.addEventListener('pointerdown', (e) => { if (e.target === backdrop && opts.closable !== false) closeOverlay(backdrop); });
  return openOverlay(backdrop, opts);
}

export function toast(message: string, kind: 'info' | 'error' = 'info', ms = 3600): void {
  const host = document.getElementById('toasts');
  if (!host) return;
  const t = h('div', { class: `toast ${kind}` }, message);
  host.append(t);
  while (host.children.length > 3) host.firstElementChild?.remove();
  window.setTimeout(() => t.classList.add('out'), ms);
  window.setTimeout(() => t.remove(), ms + 520);
}

/** Wire click sounds and hover ticks on buttons inside a root. */
export function wireSounds(root: HTMLElement): void {
  root.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('button')) audio.sfx('click'); });
  root.addEventListener('pointerover', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (b && (e as PointerEvent).pointerType === 'mouse') audio.sfx('hover');
  });
}
