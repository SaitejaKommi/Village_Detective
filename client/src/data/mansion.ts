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

// Room ids and adjacency are the BACKEND's (backend/data/world.json). The grid layout is the client's:
//   kitchen  | study   | library
//   dining   | foyer   | drawing_room
// Furniture stays in the room corners so the centre cross (door corridors) is always walkable.
export const ROOMS: RoomDef[] = [
  { id: 'kitchen', name: 'Kitchen', col: 0, row: 0, floor: 0x252a2e, floor2: 0x2c3237, furniture: [
    { x: 1, y: 1, w: 3, h: 2, color: 0x4a4e52, kind: 'stove' },
    { x: 10, y: 1, w: 5, h: 1, color: 0x55595d, kind: 'counter' },
    { x: 11, y: 9, w: 4, h: 2, color: 0x6a5a48, kind: 'table' },
  ] },
  { id: 'study', name: 'Study', col: 1, row: 0, floor: 0x2a1c14, floor2: 0x32221a, furniture: [
    { x: 2, y: 2, w: 4, h: 2, color: 0x4a3222, kind: 'desk' },
    { x: 10, y: 1, w: 5, h: 1, color: 0x3a2618, kind: 'shelf' },
    { x: 13, y: 9, w: 2, h: 2, color: 0x5a2a2a, kind: 'chair' },
  ] },
  { id: 'library', name: 'Library', col: 2, row: 0, floor: 0x1f2a22, floor2: 0x26332a, furniture: [
    { x: 1, y: 1, w: 6, h: 1, color: 0x3a2a1a, kind: 'shelf' },
    { x: 10, y: 1, w: 2, h: 1, color: 0x3a2a1a, kind: 'shelf' },
    { x: 12, y: 1, w: 3, h: 1, color: 0x4a3a3a, kind: 'fireplace' },
    { x: 3, y: 9, w: 3, h: 2, color: 0x4a3a28, kind: 'table' },
  ] },
  { id: 'dining_room', name: 'Dining Room', col: 0, row: 1, floor: 0x2c1a1c, floor2: 0x351f22, furniture: [
    { x: 1, y: 1, w: 5, h: 1, color: 0x4a2a22, kind: 'sideboard' },
    { x: 10, y: 8, w: 5, h: 3, color: 0x5a3a2a, kind: 'table' },
  ] },
  { id: 'foyer', name: 'Grand Foyer', col: 1, row: 1, floor: 0x24242a, floor2: 0x2d2d34, furniture: [
    { x: 1, y: 1, w: 5, h: 3, color: 0x3a2a24, kind: 'stairs' },
    { x: 13, y: 1, w: 2, h: 2, color: 0x4a3a22, kind: 'clock' },
    { x: 11, y: 10, w: 4, h: 1, color: 0x4a3a30, kind: 'console' },
  ] },
  { id: 'drawing_room', name: 'Drawing Room', col: 2, row: 1, floor: 0x2a2030, floor2: 0x31263a, furniture: [
    { x: 1, y: 1, w: 4, h: 2, color: 0x5a2f3f, kind: 'sofa' },
    { x: 10, y: 1, w: 5, h: 1, color: 0x4a3a3a, kind: 'fireplace' },
    { x: 2, y: 9, w: 2, h: 2, color: 0x4a2f4f, kind: 'chair' },
    { x: 11, y: 8, w: 3, h: 2, color: 0x1a1a1e, kind: 'piano' },
  ] },
];

/** Doors: exactly the backend's `adjacent` edges (world.json). */
export const EDGES: [string, string][] = [
  ['study', 'library'], ['study', 'foyer'], ['library', 'drawing_room'],
  ['foyer', 'drawing_room'], ['foyer', 'dining_room'], ['dining_room', 'kitchen'],
];

/** Where the (server-unplaced) clues sit in each room, local tile coords. Assigned by clue order. */
export const CLUE_SPOTS: Record<string, [number, number][]> = {
  kitchen: [[3.5, 9.5], [12.5, 4.5], [5.5, 3.5], [14.5, 7.5]],
  study: [[4.5, 8.5], [12.5, 4.5], [6.5, 10.5], [2.5, 5.5]],
  library: [[12.5, 9.5], [3.5, 3.5], [12.5, 4.5], [5.5, 7.5]],
  dining_room: [[3.5, 9.5], [12.5, 3.5], [3.5, 4.5], [14.5, 6.5]],
  foyer: [[3.5, 9.5], [12.5, 4.5], [13.5, 8.5], [6.5, 10.5]],
  drawing_room: [[6.5, 3.5], [14.5, 6.5], [5.5, 10.5], [3.5, 6.5]],
};
/** The victim's body is scenery in the Study (local tile coords). */
export const BODY_SPOT: [number, number] = [10.5, 9.5];
/** Per-NPC offset from a room's centre so they do not stack. */
export const NPC_OFFSETS: Record<string, [number, number]> = {
  evelyn: [-2, -1.5], julian: [2, -1.5], harold: [-2, 1.5], margaret: [2, 1.5], victor: [0, -2.5],
};

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

/** Door tiles: a 2 tile gap centred on the wall line of each edge. */
function doorTiles(): Set<string> {
  const s = new Set<string>();
  for (const [aId, bId] of EDGES) {
    const a = ROOM_BY_ID[aId], b = ROOM_BY_ID[bId];
    const left = a.col <= b.col && a.row <= b.row ? a : b;
    const { ox, oy } = roomOrigin(left);
    const cx = ox + ROOM_W / 2, cy = oy + ROOM_H / 2;
    if (a.row === b.row) { s.add(`${ox + ROOM_W},${cy - 1}`); s.add(`${ox + ROOM_W},${cy}`); }
    else { s.add(`${cx - 1},${oy + ROOM_H}`); s.add(`${cx},${oy + ROOM_H}`); }
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
  return EDGES.flatMap(([x, y]) => (x === id ? [y] : y === id ? [x] : []));
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

/** Tile position of a clue by its index among the clues in a room. */
export function clueSpot(roomId: string, index: number): { x: number; y: number } {
  const r = ROOM_BY_ID[roomId];
  const spots = CLUE_SPOTS[roomId] ?? [[8, 6]];
  const [lx, ly] = spots[index % spots.length];
  return { x: r.col * ROOM_W + lx, y: r.row * ROOM_H + ly };
}
/** Tile position where an NPC stands inside a room. */
export function npcSpot(roomId: string, npcId: string): { x: number; y: number } {
  const c = roomCenter(ROOM_BY_ID[roomId] ?? ROOMS[0]);
  const [ox, oy] = NPC_OFFSETS[npcId] ?? [0, 0];
  return { x: c.x + ox, y: c.y + oy };
}

// ---- lighting (kept small so it runs smoothly on a phone) ---------------------------------------------------
export interface LightDef {
  room: string;
  lx: number; ly: number; // local tile coords
  color: number; // warm pool tint
  radius: number; // px
  flicker: number; // 0 = steady, up to about 0.12 for a fire
}
/** One light per room, plus the player's. Six lights in total. */
export const LIGHTS: LightDef[] = [
  { room: 'kitchen', lx: 2.5, ly: 4.2, color: 0xffe3a8, radius: 190, flicker: 0.02 },
  { room: 'study', lx: 4.2, ly: 4.4, color: 0xffc271, radius: 200, flicker: 0.035 }, // desk lamp
  { room: 'library', lx: 13.5, ly: 2.8, color: 0xff9a4a, radius: 250, flicker: 0.11 }, // fireplace
  { room: 'dining_room', lx: 12.5, ly: 6.6, color: 0xffd08a, radius: 210, flicker: 0.05 }, // candles
  { room: 'foyer', lx: 3.8, ly: 5.2, color: 0xffd9a0, radius: 220, flicker: 0.03 },
  { room: 'drawing_room', lx: 12.5, ly: 2.8, color: 0xff9a4a, radius: 230, flicker: 0.1 }, // fireplace
];

/** Windows on the outer walls (tile coords of the left tile; each is 2 tiles wide). Rain runs down them. */
export const WINDOWS: { x: number; y: number; north: boolean }[] = ROOMS.flatMap((r): { x: number; y: number; north: boolean }[] => {
  const ox = r.col * ROOM_W;
  return r.row === 0
    ? [{ x: ox + 3, y: 0, north: true }, { x: ox + 11, y: 0, north: true }]
    : [{ x: ox + 3, y: MAP_H - 1, north: false }];
});
