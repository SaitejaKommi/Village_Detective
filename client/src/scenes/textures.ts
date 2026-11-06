// All world art is generated in code: floors, walls, windows, furniture, sprites, light. No downloaded assets.
import Phaser from 'phaser';
import { NPCS, type NpcDef } from '../data/npcs';
import { DOOR_TILES, GRID, MAP_H, MAP_W, ROOMS, WALL, WINDOWS, roomOrigin, ROOM_H, ROOM_W, TILE } from '../data/mansion';

const SKIN = 0xc9a98a;

function g(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}
/** Deterministic pseudo-random in 0..1 for a tile, so the map is the same every run. */
function hash(x: number, y: number, k = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function shade(c: number, f: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * f)));
  const gg = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * f)));
  return (r << 16) | (gg << 8) | b;
}

// ---- floors ---------------------------------------------------------------------------------------------------
function floorTile(gr: Phaser.GameObjects.Graphics, roomId: string, base: number, alt: number, x: number, y: number, px: number, py: number): void {
  switch (roomId) {
    case 'study': case 'library': { // parquet: two planks per tile, each slightly different
      const t = (x + y) % 2 === 0 ? base : alt;
      for (let i = 0; i < 2; i++) {
        const v = 0.86 + hash(x, y, i) * 0.28;
        gr.fillStyle(shade(t, v), 1).fillRect(px, py + i * 16, TILE, 16);
        gr.fillStyle(0x000000, 0.35).fillRect(px, py + i * 16 + 15, TILE, 1);
      }
      gr.fillStyle(0x000000, 0.22).fillRect(px + (hash(x, y, 5) > 0.5 ? 10 : 22), py, 1, TILE);
      break;
    }
    case 'kitchen': { // tile with grout
      gr.fillStyle((x + y) % 2 === 0 ? base : alt, 1).fillRect(px, py, TILE, TILE);
      gr.fillStyle(0xffffff, 0.05).fillRect(px + 2, py + 2, TILE - 4, 6);
      gr.lineStyle(1, 0x0c0f12, 0.7).strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      break;
    }
    case 'foyer': { // marble checker with veins
      gr.fillStyle((x + y) % 2 === 0 ? base : alt, 1).fillRect(px, py, TILE, TILE);
      gr.lineStyle(1, 0xffffff, 0.06);
      const k = hash(x, y, 9);
      gr.lineBetween(px + k * 12, py, px + 12 + k * 18, py + TILE);
      gr.lineStyle(1, 0x000000, 0.35).strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      break;
    }
    default: { // carpeted rooms: base weave with a diamond motif
      gr.fillStyle((x + y) % 2 === 0 ? base : alt, 1).fillRect(px, py, TILE, TILE);
      if ((x + y) % 2 === 0) gr.fillStyle(0xb8985a, 0.07).fillTriangle(px + 16, py + 6, px + 26, py + 16, px + 16, py + 26).fillTriangle(px + 16, py + 6, px + 6, py + 16, px + 16, py + 26);
      gr.fillStyle(0x000000, 0.12).fillRect(px, py + 31, TILE, 1);
    }
  }
}

// ---- furniture ------------------------------------------------------------------------------------------------
function drawFurniture(gr: Phaser.GameObjects.Graphics, kind: string, color: number, x: number, y: number, w: number, h: number): void {
  // soft layered shadow so pieces sit on the floor
  gr.fillStyle(0x000000, 0.18).fillRect(x + 2, y + 4, w + 6, h + 6);
  gr.fillStyle(0x000000, 0.28).fillRect(x + 2, y + 4, w + 3, h + 3);
  gr.fillStyle(color, 1).fillRect(x, y, w, h);
  gr.fillStyle(0xffffff, 0.09).fillRect(x, y, w, 5);
  gr.fillStyle(0x000000, 0.25).fillRect(x, y + h - 4, w, 4);
  gr.lineStyle(1, 0x000000, 0.75).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  switch (kind) {
    case 'shelf':
      for (let i = 0; i < Math.floor(w / 9); i++) {
        const col = [0x7a2a2a, 0x2a4a6a, 0x6a5a2a, 0x2a5a3a, 0x5a3a6a][i % 5];
        const bh = h - 12 - ((i * 7) % 6);
        gr.fillStyle(col, 0.95).fillRect(x + 4 + i * 9, y + h - 6 - bh, 7, bh);
        gr.fillStyle(0xffffff, 0.12).fillRect(x + 4 + i * 9, y + h - 6 - bh, 1, bh);
      }
      break;
    case 'desk':
      gr.fillStyle(0x6a4a30, 1).fillRect(x + 3, y + 3, w - 6, h - 10);
      gr.fillStyle(0xe8e2d0, 0.8).fillRect(x + 12, y + 10, 18, 14); // papers
      gr.fillStyle(0x1a1a1a, 1).fillCircle(x + w - 20, y + 16, 5); // ink well
      gr.fillStyle(0xffc271, 1).fillCircle(x + 20, y + h - 16, 4); // lamp base glow
      gr.fillStyle(0x2a2a2a, 1).fillRect(x + 18, y + h - 22, 4, 8);
      break;
    case 'table':
      gr.fillStyle(0xffffff, 0.06).fillRect(x + 4, y + 4, w - 8, h - 12);
      if (w >= 128) { // dining table: cloth, plates and candles
        gr.fillStyle(0xd8cdb4, 0.55).fillRect(x + 6, y + 6, w - 12, h - 16);
        for (let i = 0; i < 4; i++) gr.fillStyle(0xf0ead8, 0.9).fillCircle(x + 22 + i * ((w - 44) / 3), y + h / 2 - 2, 7);
        gr.fillStyle(0xffd08a, 1).fillCircle(x + w / 2, y + h / 2 - 2, 3);
      }
      break;
    case 'chair':
      gr.fillStyle(0xffffff, 0.08).fillRect(x + 6, y + 6, w - 12, h - 14);
      gr.fillStyle(0x000000, 0.25).fillRect(x, y, w, 8);
      break;
    case 'sofa':
      for (let i = 0; i < 3; i++) gr.fillStyle(0xffffff, 0.08).fillRoundedRect(x + 6 + i * ((w - 12) / 3), y + 14, (w - 12) / 3 - 4, h - 22, 5);
      gr.fillStyle(0x000000, 0.3).fillRect(x, y, w, 10);
      break;
    case 'fireplace':
      gr.fillStyle(0x5a5050, 1).fillRect(x, y, w, h);
      gr.fillStyle(0x0c0806, 1).fillRect(x + 10, y + 8, w - 20, h - 10);
      gr.fillStyle(0xff7a2a, 0.85).fillTriangle(x + w / 2 - 12, y + h - 3, x + w / 2 + 12, y + h - 3, x + w / 2, y + 12);
      gr.fillStyle(0xffd27a, 0.9).fillTriangle(x + w / 2 - 6, y + h - 3, x + w / 2 + 6, y + h - 3, x + w / 2, y + 20);
      gr.fillStyle(0xffffff, 0.12).fillRect(x, y, w, 4);
      break;
    case 'piano':
      gr.fillStyle(0x0e0e11, 1).fillRect(x, y, w, h);
      gr.fillStyle(0xe8e2d0, 0.9).fillRect(x + 4, y + h - 14, w - 8, 9);
      for (let i = 0; i < Math.floor((w - 8) / 6); i++) gr.fillStyle(0x111111, 1).fillRect(x + 7 + i * 6, y + h - 14, 2, 5);
      gr.fillStyle(0xffffff, 0.10).fillRect(x, y, w, 4);
      break;
    case 'stairs':
      for (let i = 1; i < 9; i++) gr.lineStyle(1, 0x000000, 0.4).lineBetween(x, y + i * (h / 9), x + w, y + i * (h / 9));
      gr.fillStyle(0x6a1f1f, 0.8).fillRect(x + w / 2 - 14, y, 28, h);
      gr.fillStyle(0xb8985a, 0.5).fillRect(x + w / 2 - 14, y, 1, h).fillRect(x + w / 2 + 13, y, 1, h);
      break;
    case 'stove':
      for (let i = 0; i < 4; i++) {
        gr.fillStyle(0x0c0c0c, 1).fillCircle(x + 20 + (i % 2) * 28, y + 18 + Math.floor(i / 2) * 26, 8);
        gr.lineStyle(1, 0x555555, 1).strokeCircle(x + 20 + (i % 2) * 28, y + 18 + Math.floor(i / 2) * 26, 5);
      }
      break;
    case 'counter':
      gr.fillStyle(0x7a7e82, 1).fillRect(x + 2, y + 2, w - 4, h - 12);
      gr.fillStyle(0x2a3a44, 1).fillRect(x + w - 54, y + 7, 36, 14); // sink
      gr.fillStyle(0xffffff, 0.18).fillRect(x + w - 40, y + 4, 8, 3);
      break;
    case 'sideboard':
      for (let i = 0; i < Math.floor(w / 40); i++) gr.lineStyle(1, 0x000000, 0.5).strokeRect(x + 6 + i * 40, y + 6, 34, h - 14);
      gr.fillStyle(0xb8985a, 0.8).fillCircle(x + w / 2, y + 12, 2.5);
      break;
    case 'clock':
      gr.fillStyle(0xd9bd7f, 0.95).fillCircle(x + w / 2, y + 18, 11);
      gr.lineStyle(1.5, 0x000000, 0.9).lineBetween(x + w / 2, y + 18, x + w / 2, y + 10).lineBetween(x + w / 2, y + 18, x + w / 2 + 6, y + 18);
      gr.fillStyle(0xb8985a, 0.9).fillRect(x + w / 2 - 2, y + 34, 4, h - 40);
      break;
    case 'console':
      gr.fillStyle(0x6a8a8a, 0.9).fillCircle(x + 20, y - 2, 6); // vase
      gr.fillStyle(0xb8985a, 0.5).fillRect(x + 4, y + 5, w - 8, 2);
      break;
    default: break;
  }
}

function drawWindow(gr: Phaser.GameObjects.Graphics, x: number, y: number): void {
  const px = x * TILE, py = y * TILE;
  gr.fillStyle(0x07090c, 1).fillRect(px - 2, py + 2, TILE * 2 + 4, TILE - 4);
  gr.fillStyle(0x1d3a48, 1).fillRect(px + 2, py + 5, TILE * 2 - 4, TILE - 10);
  gr.fillStyle(0x4a8aa0, 0.22).fillRect(px + 2, py + 5, TILE * 2 - 4, 8);
  gr.fillStyle(0x0a0c10, 1).fillRect(px + TILE - 1, py + 5, 2, TILE - 10).fillRect(px + 2, py + TILE / 2 - 1, TILE * 2 - 4, 2);
}

function drawMap(scene: Phaser.Scene): void {
  const gr = g(scene);
  const W = MAP_W * TILE, H = MAP_H * TILE;
  gr.fillStyle(0x070708, 1).fillRect(0, 0, W, H);

  // Floors
  for (const r of ROOMS) {
    const { ox, oy } = roomOrigin(r);
    for (let y = 1; y < ROOM_H; y++) for (let x = 1; x < ROOM_W; x++) floorTile(gr, r.id, r.floor, r.floor2, ox + x, oy + y, (ox + x) * TILE, (oy + y) * TILE);
    // Rug under the centre
    const rug = { study: 0x4a1f1f, library: 0x2a3a2a, kitchen: 0x303840, dining_room: 0x5a2a2a, foyer: 0x3a2a3a, drawing_room: 0x4a2a4a }[r.id] ?? 0x333333;
    gr.fillStyle(0x000000, 0.25).fillRect((ox + 5) * TILE + 3, (oy + 3) * TILE + 4, 6 * TILE, 6 * TILE);
    gr.fillStyle(rug, 0.7).fillRect((ox + 5) * TILE, (oy + 3) * TILE, 6 * TILE, 6 * TILE);
    gr.lineStyle(2, 0xb8985a, 0.3).strokeRect((ox + 5) * TILE + 6, (oy + 3) * TILE + 6, 6 * TILE - 12, 6 * TILE - 12);
    gr.lineStyle(1, 0xb8985a, 0.18).strokeRect((ox + 5) * TILE + 12, (oy + 3) * TILE + 12, 6 * TILE - 24, 6 * TILE - 24);
  }

  // Shade the floor where it meets a wall (ambient occlusion), so the rooms have depth
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (GRID[y][x] === WALL) continue;
    const px = x * TILE, py = y * TILE;
    const wall = (tx: number, ty: number) => ty >= 0 && tx >= 0 && ty < MAP_H && tx < MAP_W && GRID[ty][tx] === WALL;
    if (wall(x, y - 1)) gr.fillStyle(0x000000, 0.38).fillRect(px, py, TILE, 12).fillStyle(0x000000, 0.2).fillRect(px, py + 12, TILE, 8);
    if (wall(x - 1, y)) gr.fillStyle(0x000000, 0.25).fillRect(px, py, 10, TILE);
    if (wall(x + 1, y)) gr.fillStyle(0x000000, 0.25).fillRect(px + TILE - 10, py, 10, TILE);
    if (wall(x, y + 1)) gr.fillStyle(0x000000, 0.18).fillRect(px, py + TILE - 8, TILE, 8);
  }

  // Doors (floor with a brass threshold) and walls
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const px = x * TILE, py = y * TILE;
    if (GRID[y][x] === WALL) {
      gr.fillStyle(0x13131a, 1).fillRect(px, py, TILE, TILE);
      gr.fillStyle(0x23232d, 1).fillRect(px, py, TILE, 8);
      gr.fillStyle(0x2f2f3a, 1).fillRect(px, py, TILE, 2);
      gr.fillStyle(0xb8985a, 0.16).fillRect(px, py + TILE - 6, TILE, 1); // skirting line
      gr.lineStyle(1, 0x000000, 0.6).strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
    } else if (DOOR_TILES.has(`${x},${y}`)) {
      gr.fillStyle(0x2a2218, 1).fillRect(px, py, TILE, TILE);
      gr.fillStyle(0xb8985a, 0.55);
      if (x % ROOM_W === 0) gr.fillRect(px + TILE / 2 - 1, py, 2, TILE); else gr.fillRect(px, py + TILE / 2 - 1, TILE, 2);
    }
  }
  for (const wdw of WINDOWS) drawWindow(gr, wdw.x, wdw.y);

  // Furniture
  for (const r of ROOMS) {
    const { ox, oy } = roomOrigin(r);
    for (const f of r.furniture) drawFurniture(gr, f.kind, f.color, (ox + f.x) * TILE, (oy + f.y) * TILE, f.w * TILE, f.h * TILE);
  }
  gr.generateTexture('map', W, H);
  gr.destroy();
}

/** A strip of diagonal rain streaks. Tiled and scrolled over each window. */
function drawRainStreaks(scene: Phaser.Scene): void {
  const gr = g(scene);
  const W = 32, H = 64;
  gr.fillStyle(0x000000, 0).fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    const x = 3 + ((i * 11) % 27), y = (i * 19) % 56;
    gr.lineStyle(1.4, 0xbcd6e0, 0.5).lineBetween(x, y, x - 2, y + 9);
    gr.fillStyle(0xdceaf0, 0.55).fillCircle(x - 2, y + 9, 1.2);
  }
  gr.generateTexture('rainstreak', W, H);
  gr.destroy();
}

function drawPerson(scene: Phaser.Scene, key: string, body: number, hat: boolean, prop?: NpcDef['prop']): void {
  const gr = g(scene);
  const W = 28, H = 40, cx = 14;
  gr.fillStyle(0x000000, 0.0).fillRect(0, 0, W, H);
  // body
  gr.fillStyle(body, 1).fillRoundedRect(cx - 9, 17, 18, 21, 6);
  gr.fillStyle(0xffffff, 0.08).fillRoundedRect(cx - 9, 17, 18, 5, 4);
  gr.fillStyle(0x000000, 0.25).fillRect(cx - 1, 20, 2, 16); // coat seam
  gr.fillStyle(0x000000, 0.2).fillRect(cx - 9, 34, 18, 4);
  // head
  gr.fillStyle(SKIN, 1).fillCircle(cx, 12, 7);
  if (hat) {
    gr.fillStyle(0x6e6a66, 1).fillEllipse(cx, 9, 24, 7);
    gr.fillStyle(0x7c7873, 1).fillRoundedRect(cx - 7, 1, 14, 9, 3);
    gr.fillStyle(0x1b2a44, 1).fillRect(cx - 7, 7, 14, 2);
  } else {
    gr.fillStyle(0x1a1512, 1).fillRoundedRect(cx - 7, 4, 14, 6, 3);
  }
  // props that make each NPC readable at a glance
  switch (prop) {
    case 'cane': gr.lineStyle(2, 0x8a6a3a, 1).lineBetween(cx + 12, 22, cx + 12, 40); gr.lineStyle(2, 0xd9bd7f, 1).lineBetween(cx + 10, 22, cx + 14, 22); break;
    case 'pearls': gr.fillStyle(0xefe9d8, 1); for (let i = 0; i < 5; i++) gr.fillCircle(cx - 5 + i * 2.5, 19 + (i === 2 ? 1.5 : 0), 1.4); break;
    case 'tie': gr.fillStyle(0xa02a36, 1).fillTriangle(cx - 2, 18, cx + 2, 18, cx + 3, 30); break;
    case 'gloves': gr.fillStyle(0xffffff, 1).fillCircle(cx - 10, 31, 3).fillCircle(cx + 10, 31, 3); break;
    case 'keys': gr.lineStyle(1.6, 0xd9bd7f, 1).strokeCircle(cx - 10, 30, 3.2); gr.fillStyle(0xd9bd7f, 1).fillRect(cx - 11, 33, 2, 4).fillRect(cx - 8, 33, 2, 3); break;
    case 'ring': gr.fillStyle(0xd9bd7f, 1).fillCircle(cx + 10, 30, 2.4); gr.fillStyle(0x6a0f1f, 1).fillCircle(cx + 10, 30, 1); break;
    default: break;
  }
  gr.generateTexture(key, W, H);
  gr.destroy();
}

function drawLight(scene: Phaser.Scene): void {
  const size = 512;
  const tex = scene.textures.createCanvas('light', size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.78)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.3)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

function drawClue(scene: Phaser.Scene): void {
  const gr = g(scene);
  gr.fillStyle(0xd9bd7f, 0.18).fillCircle(16, 16, 15);
  gr.fillStyle(0xd9bd7f, 0.4).fillCircle(16, 16, 9);
  gr.fillStyle(0xfff0c0, 1).fillTriangle(16, 8, 22, 16, 16, 24).fillTriangle(16, 8, 10, 16, 16, 24);
  gr.generateTexture('clue', 32, 32);
  gr.destroy();
}

function drawBody(scene: Phaser.Scene): void {
  const gr = g(scene);
  gr.lineStyle(1.5, 0xe8e2d0, 0.7).strokeEllipse(30, 14, 56, 24);
  gr.fillStyle(0x4a4a52, 1).fillRoundedRect(8, 7, 34, 14, 6);
  gr.fillStyle(SKIN, 1).fillCircle(46, 14, 6);
  gr.fillStyle(0x1a1a1c, 1).fillRect(8, 21, 12, 4);
  gr.generateTexture('body', 60, 30);
  gr.destroy();
}

export function ensureTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('map')) return;
  drawMap(scene);
  drawRainStreaks(scene);
  drawPerson(scene, 'player', 0x1b1b20, true);
  for (const n of Object.values(NPCS)) drawPerson(scene, `npc_${n.id}`, n.color, false, n.prop);
  drawLight(scene);
  drawClue(scene);
  drawBody(scene);
}
