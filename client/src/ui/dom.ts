type Child = Node | string | null | undefined | false;
type Props = Record<string, unknown> & { class?: string; text?: string };

/** Tiny hyperscript helper. `on*` props become event listeners, `class`/`text` are shortcuts, the rest are attributes. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'text') el.textContent = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(sel);

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export const isTouch = (): boolean => matchMedia('(pointer: coarse)').matches;

/** Small inline SVG icons. */
export function icon(name: 'diamond' | 'notebook' | 'hint' | 'close' | 'talk' | 'search' | 'back' | 'lock' | 'send'): SVGSVGElement {
  const paths: Record<string, string> = {
    diamond: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18M15 3l-3 18" opacity=".5"/>',
    notebook: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M9 8h6M9 12h6"/>',
    hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    talk: '<path d="M4 5h16v11H9l-5 4z"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths[name];
  return svg;
}
