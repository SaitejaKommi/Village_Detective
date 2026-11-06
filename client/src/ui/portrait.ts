import { PORTRAIT_URL } from '../data/assets';
import { h } from './dom';
import { silhouetteSVG } from './silhouettes';

// id -> whether a real portrait file exists (undefined = not checked yet)
const real = new Map<string, boolean>();

function tryLoad(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false); // missing file, or the dev server answered with index.html
    img.src = PORTRAIT_URL(id);
  });
}

/**
 * A portrait element. Starts with the generated silhouette (the permanent fallback) and swaps in
 * public/assets/portraits/<id>.webp if that file exists. No code changes needed to add real art.
 */
export function portrait(id: string, className = ''): HTMLDivElement {
  const el = h('div', { class: `portrait ${className}`.trim(), 'data-id': id });
  el.innerHTML = silhouetteSVG(id);
  const known = real.get(id);
  const apply = () => {
    const img = h('img', { src: PORTRAIT_URL(id), alt: '', loading: 'lazy', decoding: 'async' });
    el.replaceChildren(img);
  };
  if (known === true) apply();
  else if (known === undefined) {
    void tryLoad(id).then((ok) => { real.set(id, ok); if (ok) apply(); });
  }
  return el;
}
