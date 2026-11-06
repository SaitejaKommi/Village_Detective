// All world art is generated in code: tiles, furniture, sprites, light. No downloaded assets.
import Phaser from 'phaser';
import { NPCS, type NpcDef } from '../data/npcs';
import { DOOR_TILES, GRID, MAP_H, MAP_W, ROOMS, roomOrigin, ROOM_H, ROOM_W, TILE, WALL } from '../data/mansion';

const SKIN = 0xc9a98a;

function g(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

function drawMap(scene: Phaser.Scene): void {
  const gr = g(scene);
  const W = MAP_W * TILE, H = MAP_H * TILE;
  gr.fillStyle(0x070708, 1).fillRect(0, 0, W, H);

  for (const r of ROOMS) {
    const { ox, oy } = roomOrigin(r);
    for (let y = 1; y < ROOM_H; y++) for (let x = 1; x < ROOM_W; x++) {
      const t = (x + y) % 2 === 0 ? r.floor : r.floor2;
      gr.fillStyle(t, 1).fillRect((ox + x) * TILE, (oy + y) * TILE, TILE, TILE);
    }
    // Rug under the centre
    const rug = { study: 0x4a1f1f, library: 0x2a3a2a, kitchen: 0x303840, dining_room: 0x5a2a2a, foyer: 0x3a2a3a, drawing_room: 0x4a2a4a }[r.id] ?? 0x333333;
    gr.fillStyle(rug, 0.55).fillRect((ox + 5) * TILE, (oy + 3) * TILE, 6 * TILE, 6 * TILE);
    gr.lineStyle(2, 0xb8985a, 0.25).strokeRect((ox + 5) * TILE + 6, (oy + 3) * TILE + 6, 6 * TILE - 12, 6 * TILE - 12);
  }

  // Doors (floor with a brass threshold) then walls
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const px = x * TILE, py = y * TILE;
    if (GRID[y][x] === WALL) {
      gr.fillStyle(0x15151a, 1).fillRect(px, py, TILE, TILE);
      gr.fillStyle(0x24242c, 1).fillRect(px, py, TILE, 6);
      gr.lineStyle(1, 0x000000, 0.6).strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
    } else if (DOOR_TILES.has(`${x},${y}`)) {
      gr.fillStyle(0x2a2218, 1).fillRect(px, py, TILE, TILE);
      gr.fillStyle(0xb8985a, 0.5);
      if (x % ROOM_W === 0) gr.fillRect(px + TILE / 2 - 1, py, 2, TILE); else gr.fillRect(px, py + TILE / 2 - 1, TILE, 2);
    }
  }

  // Furniture
  for (const r of ROOMS) {
    const { ox, oy } = roomOrigin(r);
    for (const f of r.furniture) {
      const x = (ox + f.x) * TILE, y = (oy + f.y) * TILE, w = f.w * TILE, h = f.h * TILE;
      gr.fillStyle(0x000000, 0.35).fillRect(x + 3, y + 5, w, h);
      gr.fillStyle(f.color, 1).fillRect(x, y, w, h);
      gr.fillStyle(0xffffff, 0.07).fillRect(x, y, w, 5);
      gr.lineStyle(1, 0x000000, 0.7).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      switch (f.kind) {
        case 'shelf':
          for (let i = 0; i < f.w * 3; i++) {
            const col = [0x7a2a2a, 0x2a4a6a, 0x6a5a2a, 0x2a5a3a][i % 4];
            gr.fillStyle(col, 0.85).fillRect(x + 4 + i * 10, y + 6, 7, h - 12);
          }
          break;
        case 'stairs':
          for (let i = 1; i < f.h * 3; i++) gr.lineStyle(1, 0x000000, 0.4).lineBetween(x, y + i * 11, x + w, y + i * 11);
          gr.fillStyle(0x6a1f1f, 0.7).fillRect(x + w / 2 - 14, y, 28, h);
          break;
        case 'fountain':
          gr.fillStyle(0x2a5a6a, 1).fillCircle(x + w / 2, y + h / 2, w / 2 - 6);
          gr.fillStyle(0x6aa0b0, 0.5).fillCircle(x + w / 2, y + h / 2, w / 4);
          break;
        case 'hedge': case 'planter':
          for (let i = 0; i < f.w * 2; i++) gr.fillStyle(0x3a6a3e, 0.8).fillCircle(x + 10 + i * 16, y + h / 2 + ((i % 2) * 6 - 3), 11);
          break;
        case 'table': case 'desk':
          gr.fillStyle(0xffffff, 0.06).fillRect(x + 4, y + 4, w - 8, h - 8);
          break;
        case 'stove':
          for (let i = 0; i < 4; i++) gr.fillStyle(0x111111, 1).fillCircle(x + 20 + (i % 2) * 28, y + 18 + Math.floor(i / 2) * 26, 8);
          break;
        case 'clock':
          gr.fillStyle(0xd9bd7f, 0.9).fillCircle(x + w / 2, y + 16, 9);
          gr.lineStyle(1, 0x000000, 0.9).lineBetween(x + w / 2, y + 16, x + w / 2, y + 9).lineBetween(x + w / 2, y + 16, x + w / 2 + 5, y + 16);
          break;
        default: break;
      }
    }
  }
  gr.generateTexture('map', W, H);
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
  const grad = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,214,150,0.9)');
  grad.addColorStop(0.35, 'rgba(255,180,90,0.35)');
  grad.addColorStop(1, 'rgba(255,160,60,0)');
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
  drawPerson(scene, 'player', 0x1b1b20, true);
  for (const n of Object.values(NPCS)) drawPerson(scene, `npc_${n.id}`, n.color, false, n.prop);
  drawLight(scene);
  drawClue(scene);
  drawBody(scene);
}
