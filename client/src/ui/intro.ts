// Cinematic intro (about 18 s). Skippable with any key, tap or click. Built from layered SVG, CSS and the
// shared rain canvas. Lightning is skipped under prefers-reduced-motion.
import { audio } from '../audio/audioManager';
import { h } from './dom';
import { atmosphere } from './atmosphere';
import { detectiveStreetSVG, mansionSVG } from './silhouettes';

export function introScreen(onDone: () => void): HTMLElement {
  const mansion = h('div', { class: 'scenery intro-mansion' });
  mansion.innerHTML = mansionSVG();
  const det = h('div', { class: 'intro-detective' });
  det.innerHTML = detectiveStreetSVG();
  const title = h('div', { class: 'intro-title' },
    h('div', { class: 'eyebrow' }, 'A noir mystery'),
    h('h1', null, 'Village of Liars'),
    h('p', null, 'One night. One body. Five liars.'),
  );
  const skip = h('div', { class: 'skip-hint' }, 'Press any key or tap to skip');
  const el = h('div', { class: 'intro transparent' }, mansion, det, title, skip);

  const timers: number[] = [];
  let finished = false;
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', finish);
    el.removeEventListener('pointerdown', finish);
    onDone();
  };

  atmosphere.setIntensity(1);
  at(300, () => skip.classList.add('show'));
  at(2500, () => { atmosphere.lightning(); mansion.classList.add('flash-1'); });
  at(3000, () => mansion.classList.add('show'));
  at(5200, () => { atmosphere.lightning(); mansion.classList.add('flash-2'); });
  at(7600, () => { mansion.classList.add('dim'); det.classList.add('show'); });
  at(12200, () => { title.classList.add('show'); audio.sfx('sting'); });
  at(13400, () => title.classList.add('sweep'));
  at(17400, () => { el.classList.add('fade-out'); });
  at(18600, finish);

  window.addEventListener('keydown', finish);
  el.addEventListener('pointerdown', finish);
  return el;
}
