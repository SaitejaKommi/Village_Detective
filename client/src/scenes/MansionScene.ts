import Phaser from 'phaser';
import { audio } from '../audio/audioManager';
import { BODY_SPOT, ROOMS, MAP_H, MAP_W, TILE, clueSpot, isSolid, roomAt, roomCenter, roomOrigin, ROOM_BY_ID } from '../data/mansion';
import { ClueMarker } from '../entities/ClueMarker';
import { NpcSprite } from '../entities/NpcSprite';
import { input } from '../game/input';
import { net } from '../net/client';
import { bus, clueTitle, store } from '../state/store';
import { ensureTextures } from './textures';

const SPEED = 118; // px per second
const RANGE = 1.9 * TILE; // interaction range
const HX = 7, HY = 4; // collision half extents around the feet

export interface Interactable { kind: 'npc' | 'clue'; id: string; label: string }

/** The mansion world. Phaser renders only the world; all UI is DOM. */
export class MansionScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private light!: Phaser.GameObjects.Image;
  private npcs = new Map<string, NpcSprite>();
  private clues = new Map<string, ClueMarker>();
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'E', Phaser.Input.Keyboard.Key>;
  private nearby: Interactable | null = null;
  private room = '';
  private stepAt = 0;
  private lastMoveSent = 0;
  private walkBob = 0;
  private unsubs: (() => void)[] = [];

  constructor() { super('MansionScene'); }

  create(): void {
    ensureTextures(this);
    this.cameras.main.setBackgroundColor('#070708');
    this.add.image(0, 0, 'map').setOrigin(0).setDepth(-1000);

    for (const r of ROOMS) {
      const { ox, oy } = roomOrigin(r);
      this.add.text((ox + 1.4) * TILE, (oy + 0.35) * TILE, r.name.toUpperCase(), {
        fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#b8985a',
      }).setAlpha(0.55).setResolution(3).setDepth(-900).setLetterSpacing(3);
    }

    // The victim lies in the Study. Scenery only: the server has no clue for the body.
    const study = ROOM_BY_ID.study;
    this.add.image((study.col * 16 + BODY_SPOT[0]) * TILE, (study.row * 12 + BODY_SPOT[1]) * TILE, 'body').setDepth(-500);

    const start = roomCenter(ROOM_BY_ID.foyer);
    const px = start.x * TILE, py = (start.y + 2) * TILE;
    this.light = this.add.image(px, py - 16, 'light').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.32).setScale(1.35).setDepth(5000);
    // Darken the whole mansion; the light pool around the detective brings the room back.
    this.add.rectangle(0, 0, MAP_W * TILE, MAP_H * TILE, 0x04060a, 0.32).setOrigin(0).setDepth(4000);
    const shadow = this.add.ellipse(0, 1, 20, 8, 0x000000, 0.45);
    this.playerSprite = this.add.image(0, -20, 'player');
    this.player = this.add.container(px, py, [shadow, this.playerSprite]);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);

    const kb = this.input.keyboard!;
    kb.disableGlobalCapture(); // never swallow keys meant for the text input
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      W: kb.addKey(K.W, false), A: kb.addKey(K.A, false), S: kb.addKey(K.S, false), D: kb.addKey(K.D, false),
      UP: kb.addKey(K.UP, false), DOWN: kb.addKey(K.DOWN, false), LEFT: kb.addKey(K.LEFT, false), RIGHT: kb.addKey(K.RIGHT, false),
      E: kb.addKey(K.E, false),
    };
    this.keys.E.on('down', () => { if (!input.locked && this.nearby) bus.emit('interact', this.nearby); });

    // Tapping a sprite interacts if in range, otherwise nudges the player closer.
    this.input.on('gameobjectdown', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      if (input.locked) return;
      let target: Interactable | null = null; let ox = 0, oy = 0;
      if (obj instanceof NpcSprite) { target = { kind: 'npc', id: obj.npcId, label: obj.npcId }; ox = obj.x; oy = obj.y; }
      else if (obj instanceof ClueMarker) { target = { kind: 'clue', id: obj.clueId, label: obj.label }; ox = obj.x; oy = obj.y; }
      if (!target) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, ox, oy) <= RANGE + 12) bus.emit('interact', target);
      else bus.emit('toast', 'Move closer.');
    });

    this.unsubs.push(
      store.subscribe(() => this.syncWorld()),
      bus.on('overlay:change', () => this.applyLock()),
    );
    this.syncWorld();
    this.applyLock();
    this.updateRoom(true);
    this.events.once('shutdown', () => this.cleanup());
  }

  private cleanup(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.scale.off('resize', this.applyZoom, this);
    this.npcs.clear();
    this.clues.clear();
  }

  private applyZoom(): void {
    const { width, height } = this.scale;
    const z = Phaser.Math.Clamp(Math.min(width, height) / 440, 1.2, 2.1);
    this.cameras.main.setZoom(z);
  }

  private applyLock(): void {
    const locked = input.locked;
    if (this.input.keyboard) this.input.keyboard.enabled = !locked;
    if (locked) for (const k of Object.values(this.keys ?? {})) k.reset();
  }

  /** Create and update sprites from the latest server snapshot. */
  private syncWorld(): void {
    const w = store.state.world;
    if (!w) return;
    for (const n of w.npcs) {
      let s = this.npcs.get(n.id);
      if (!s) { s = new NpcSprite(this, n.id, n.roomId); this.npcs.set(n.id, s); }
      s.setRoom(n.roomId);
    }
    // The server sends clues by room only. Give each a spot in its room, by order within the room.
    const perRoom: Record<string, number> = {};
    for (const c of [...w.clues].sort((a, b) => a.id.localeCompare(b.id))) {
      let m = this.clues.get(c.id);
      if (!m) {
        const i = (perRoom[c.roomId] = (perRoom[c.roomId] ?? -1) + 1);
        const spot = clueSpot(c.roomId, i);
        m = new ClueMarker(this, c.id, spot.x, spot.y);
        this.clues.set(c.id, m);
      }
      m.setFound(c.discovered, clueTitle(c.id));
    }
  }

  private canStand(x: number, y: number): boolean {
    const x0 = Math.floor((x - HX) / TILE), x1 = Math.floor((x + HX) / TILE);
    const y0 = Math.floor((y - HY) / TILE), y1 = Math.floor((y + HY) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolid(tx, ty)) return false;
    return true;
  }

  override update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;

    // --- input -> velocity
    let vx = 0, vy = 0;
    if (!input.locked) {
      const k = this.keys;
      vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
      vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
      vx += input.joyX; vy += input.joyY;
      const m = Math.hypot(vx, vy);
      if (m > 1) { vx /= m; vy /= m; }
    }
    const moving = Math.hypot(vx, vy) > 0.05;
    if (moving) {
      const nx = this.player.x + vx * SPEED * dt, ny = this.player.y + vy * SPEED * dt;
      if (this.canStand(nx, this.player.y)) this.player.x = nx; // axis-separated: slide along walls
      if (this.canStand(this.player.x, ny)) this.player.y = ny;
      if (vx !== 0) this.playerSprite.setFlipX(vx < 0);
      this.walkBob += dt * 14;
      this.playerSprite.y = -20 + Math.sin(this.walkBob) * 1.4;
      if (time - this.stepAt > 340) { this.stepAt = time; audio.sfx('step'); }
      if (time - this.lastMoveSent > 250) {
        this.lastMoveSent = time;
        // The server's schema only accepts integer directions in -1..1.
        net.send({ type: 'move', dx: Math.sign(Math.round(vx)), dy: Math.sign(Math.round(vy)) });
      }
    } else this.playerSprite.y = -20;
    this.player.setDepth(this.player.y);
    this.light.setPosition(this.player.x, this.player.y - 16);

    for (const n of this.npcs.values()) n.tick(dt);

    this.updateRoom(false);
    this.updateNearby();
  }

  private updateRoom(force: boolean): void {
    const r = roomAt(this.player.x / TILE, this.player.y / TILE);
    if (force || r !== this.room) { this.room = r; bus.emit('room', r); }
  }

  /** Nearest NPC or clue within range. Emits `nearby` only on change. */
  private updateNearby(): void {
    let best: Interactable | null = null; let bestD = RANGE;
    if (!input.locked) {
      for (const n of this.npcs.values()) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y);
        if (d < bestD) { bestD = d; best = { kind: 'npc', id: n.npcId, label: n.npcId }; }
      }
      for (const c of this.clues.values()) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
        if (d < bestD) { bestD = d; best = { kind: 'clue', id: c.clueId, label: c.label }; }
      }
    }
    const same = (this.nearby?.id ?? null) === (best?.id ?? null) && (this.nearby?.kind ?? null) === (best?.kind ?? null);
    if (!same) { this.nearby = best; bus.emit('nearby', best); }
  }
}
