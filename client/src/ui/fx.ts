// Whole-game finishing layer: very subtle film grain and a light vignette, above everything (menus and panels
// included) and below the toasts. Pure decoration: it never blocks input.
import { h } from './dom';

/** One small tile of monochrome noise, generated once. */
function noiseTile(size = 160): string {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

export function mountFx(): void {
  const app = document.getElementById('app');
  if (!app || document.getElementById('fx')) return;
  const grain = h('div', { class: 'grain' });
  const url = noiseTile();
  if (url) grain.style.backgroundImage = `url(${url})`;
  app.append(h('div', { id: 'fx', 'aria-hidden': 'true' }, grain, h('div', { class: 'vig' })));
}
