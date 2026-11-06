// Hidden debug overlay (off by default). Toggle with the ` key, or add ?debug=1 to the URL.
import { fps } from '../game/phaserGame';
import { net } from '../net/client';
import { bus, formatClock, store } from '../state/store';
import { h } from './dom';

export function initDebug(): void {
  let root: HTMLElement | null = null;
  let timer: number | undefined;
  let room = '';
  let lastDebug: unknown = null;
  bus.on('room', (r: string) => { room = r; });
  net.on('debug', (p) => { lastDebug = p; });

  const draw = () => {
    if (!root) return;
    const s = store.state;
    const pre = (t: string) => h('pre', { style: 'margin:0;white-space:pre-wrap' }, t);
    const buttons = h('div', null);
    if (net.usingMock) {
      buttons.append(h('button', { type: 'button', onclick: () => void import('../mock/mockServer').then((m) => m.getMock()?.simulateDisconnect(4000)) }, 'Simulate disconnect (4s)'));
    }
    buttons.append(h('button', { type: 'button', onclick: () => toggle(false) }, 'Close'));
    root.replaceChildren(
      h('h4', null, 'DEBUG (` to close)'),
      pre(`fps ${fps()}  conn ${s.connection}  mode ${net.usingMock ? 'mock' : 'real'}\nroom ${room}  clock ${s.world ? formatClock(s.world.clock) : '-'}  tick ${s.world?.tick ?? '-'}\ndiamonds ${s.diamonds}  hintsLeft ${s.hintsLeft}`),
      h('h4', null, 'NPCs'),
      pre((s.world?.npcs ?? []).map((n) => `${n.id.padEnd(9)} ${n.roomId}`).join('\n') || '-'),
      h('h4', null, 'Server debug message'),
      pre(lastDebug ? JSON.stringify(lastDebug, null, 1) : 'none received'),
      h('h4', null, 'Recent messages'),
      pre(net.log.slice(-10).map((l) => `${l.dir === 'in' ? '<-' : '->'} ${l.type}`).join('\n')),
      buttons,
    );
  };

  const toggle = (on: boolean) => {
    if (on && !root) {
      root = h('div', { class: 'debug' });
      document.getElementById('ui')!.append(root);
      draw();
      timer = window.setInterval(draw, 500);
    } else if (!on && root) {
      root.remove(); root = null; window.clearInterval(timer);
    }
  };
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' && !(e.target instanceof HTMLInputElement)) toggle(!root);
  });
  if (new URLSearchParams(location.search).get('debug') === '1') toggle(true);
}
