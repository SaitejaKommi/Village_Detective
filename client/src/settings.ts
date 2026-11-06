export interface Settings {
  music: number; // 0..1
  effects: number; // 0..1
  ambience: number; // 0..1 (the rain)
  mute: boolean;
  skipIntro: boolean;
}

const KEY = 'vol.settings';
const DEFAULTS: Settings = { music: 0.6, effects: 0.8, ambience: 0.22, mute: false, skipIntro: false };

let current: Settings = load();
const listeners = new Set<(s: Settings) => void>();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* storage blocked */ }
  return { ...DEFAULTS };
}

export function getSettings(): Settings { return current; }

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  listeners.forEach((l) => l(current));
}

export function onSettings(cb: (s: Settings) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Persistent guest identity (not a balance). */
const PID_KEY = 'vol.playerId';
export function loadPlayerId(): string | undefined {
  try { return localStorage.getItem(PID_KEY) ?? undefined; } catch { return undefined; }
}
export function savePlayerId(id: string): void {
  try { localStorage.setItem(PID_KEY, id); } catch { /* ignore */ }
}

export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
