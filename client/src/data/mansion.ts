// Hand-coded mansion grid: 3 x 2 rooms, 16 x 12 tiles each (walls on the shared lines), 32px tiles.
export const TILE = 32;
export const ROOM_W = 16;
export const ROOM_H = 12;
export const COLS = 3;
export const ROWS = 2;
export const MAP_W = COLS * ROOM_W + 1; // 49
export const MAP_H = ROWS * ROOM_H + 1; // 25

export const FLOOR = 0;
export const WALL = 1;
export const FURN = 2;

export interface Furniture {
  x: number; y: number; w: number; h: number; color: number; kind: string; // local tile coords
}
export interface RoomDef {
  id: string;
  name: string;
  col: number;
  row: number;
  floor: number;
  floor2: number;
  furniture: Furniture[];
}

// Furniture stays in the room corners so the centre cross (door corridors) is always walkable.
export const ROOMS: RoomDef[] = [
  { id: 'study', name: 'Study', col: 0, row: 0, floor: 0x2a1c14, floor2: 0x32221a, furniture: [
    { x: 2, y: 2, w: 4, h: 2, color: 0x4a3222, kind: 'desk' },
    { x: 10, y: 1, w: 5, h: 1, color: 0x3a2618, kind: 'shelf' },
    { x: 13, y: 9, w: 2, h: 2, color: 0x5a2a2a, kind: 'chair' },
  ] },
  { id: 'library', name: 'Library', col: 1, row: 0, floor: 0x1f2a22, floor2: 0x26332a, furniture: [
    { x: 1, y: 1, w: 6, h: 1, color: 0x3a2a1a, kind: 'shelf' },
    { x: 10, y: 1, w: 5, h: 1, color: 0x3a2a1a, kind: 'shelf' },
    { x: 3, y: 9, w: 3, h: 2, color: 0x4a3a28, kind: 'table' },
  ] },
  { id: 'kitchen', name: 'Kitchen', col: 2, row: 0, floor: 0x252a2e, floor2: 0x2c3237, furniture: [
    { x: 1, y: 1, w: 3, h: 2, color: 0x4a4e52, kind: 'stove' },
    { x: 10, y: 1, w: 5, h: 1, color: 0x55595d, kind: 'counter' },
    { x: 11, y: 9, w: 4, h: 2, color: 0x6a5a48, kind: 'table' },
  ] },
  { id: 'dining', name: 'Dining Room', col: 0, row: 1, floor: 0x2c1a1c, floor2: 0x351f22, furniture: [
    { x: 1, y: 1, w: 5, h: 1, color: 0x4a2a22, kind: 'sideboard' },
    { x: 10, y: 8, w: 5, h: 3, color: 0x5a3a2a, kind: 'table' },
  ] },
  { id: 'foyer', name: 'Foyer', col: 1, row: 1, floor: 0x24242a, floor2: 0x2d2d34, furniture: [
    { x: 1, y: 1, w: 5, h: 3, color: 0x3a2a24, kind: 'stairs' },
    { x: 13, y: 1, w: 2, h: 2, color: 0x4a3a22, kind: 'clock' },
    { x: 11, y: 10, w: 4, h: 1, color: 0x4a3a30, kind: 'console' },
  ] },
  { id: 'garden', name: 'Greenhouse Garden', col: 2, row: 1, floor: 0x1a2a1c, floor2: 0x203222, furniture: [
    { x: 1, y: 1, w: 4, h: 2, color: 0x24432a, kind: 'hedge' },
    { x: 11, y: 2, w: 3, h: 3, color: 0x4a5a5e, kind: 'fountain' },
    { x: 2, y: 9, w: 4, h: 1, color: 0x4a3a2a, kind: 'bench' },
    { x: 10, y: 9, w: 5, h: 2, color: 0x2e4a32, kind: 'planter' },
  ] },
];

export const ROOM_BY_ID: Record<string, RoomDef> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

export function roomOrigin(r: RoomDef): { ox: number; oy: number } {
  return { ox: r.col * ROOM_W, oy: r.row * ROOM_H };
}
export function roomCenter(r: RoomDef): { x: number; y: number } {
  const { ox, oy } = roomOrigin(r);
  return { x: ox + ROOM_W / 2, y: oy + ROOM_H / 2 };
}
/** Which room a tile-space point is in. */
export function roomAt(x: number, y: number): string {
  const c = Math.min(COLS - 1, Math.max(0, Math.floor(x / ROOM_W)));
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor(y / ROOM_H)));
  return ROOMS.find((rm) => rm.col === c && rm.row === r)!.id;
}
export function roomName(id: string): string {
  return ROOM_BY_ID[id]?.name ?? id;
}

/** Door tiles: a 2 tile gap centred on each wall line shared by neighbouring rooms. */
function doorTiles(): Set<string> {
  const s = new Set<string>();
  for (const r of ROOMS) {
    const { ox, oy } = roomOrigin(r);
    const cx = ox + ROOM_W / 2, cy = oy + ROOM_H / 2;
    if (r.col < COLS - 1) { s.add(`${ox + ROOM_W},${cy - 1}`); s.add(`${ox + ROOM_W},${cy}`); }
    if (r.row < ROWS - 1) { s.add(`${cx - 1},${oy + ROOM_H}`); s.add(`${cx},${oy + ROOM_H}`); }
  }
  return s;
}
export const DOOR_TILES = doorTiles();

function buildGrid(): number[][] {
  const g: number[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      const wallLine = x % ROOM_W === 0 || y % ROOM_H === 0;
      row.push(wallLine && !DOOR_TILES.has(`${x},${y}`) ? WALL : FLOOR);
    }
    g.push(row);
  }
  for (const r of ROOMS) {
    const { ox, oy } = roomOrigin(r);
    for (const f of r.furniture)
      for (let dy = 0; dy < f.h; dy++) for (let dx = 0; dx < f.w; dx++) g[oy + f.y + dy][ox + f.x + dx] = FURN;
  }
  return g;
}
/** grid[y][x] is FLOOR, WALL or FURN. */
export const GRID = buildGrid();

export function isSolid(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  return GRID[ty][tx] !== FLOOR;
}

/** Room graph: neighbours that share a door. */
export function neighbours(id: string): string[] {
  const r = ROOM_BY_ID[id];
  return ROOMS.filter(
    (o) => (o.row === r.row && Math.abs(o.col - r.col) === 1) || (o.col === r.col && Math.abs(o.row - r.row) === 1),
  ).map((o) => o.id);
}

/** Waypoints (tile coords) to walk from one room to another through the doors. */
export function routeBetween(from: string, to: string): { x: number; y: number }[] {
  if (from === to) return [];
  const prev: Record<string, string | null> = { [from]: null };
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    for (const n of neighbours(cur)) if (!(n in prev)) { prev[n] = cur; q.push(n); }
  }
  const path: string[] = [];
  for (let c: string | null = to; c; c = prev[c] ?? null) path.unshift(c);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const ca = roomCenter(ROOM_BY_ID[path[i]]);
    const cb = roomCenter(ROOM_BY_ID[path[i + 1]]);
    pts.push(ca);
    pts.push({ x: (ca.x + cb.x) / 2, y: (ca.y + cb.y) / 2 }); // door midpoint (centres share a row or column)
  }
  pts.push(roomCenter(ROOM_BY_ID[to]));
  return pts;
}
