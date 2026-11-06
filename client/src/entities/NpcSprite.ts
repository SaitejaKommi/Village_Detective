import Phaser from 'phaser';
import { npcDef } from '../data/npcs';
import { TILE, npcSpot, roomAt, routeBetween } from '../data/mansion';

const WALK = 72; // px per second

/**
 * An NPC in the world. The server only says which ROOM an NPC is in (its x/y mean nothing on our map), so the
 * client stands the NPC at a spot in that room and, when the room changes, walks it through the doors.
 */
export class NpcSprite extends Phaser.GameObjects.Container {
  readonly npcId: string;
  private sprite: Phaser.GameObjects.Image;
  private route: { x: number; y: number }[] = [];
  private roomId: string;
  private bob = Math.random() * 6;

  constructor(scene: Phaser.Scene, id: string, roomId: string) {
    const spot = npcSpot(roomId, id);
    super(scene, spot.x * TILE, spot.y * TILE);
    this.npcId = id;
    this.roomId = roomId;
    const def = npcDef(id);
    const shadow = scene.add.ellipse(0, 1, 20, 8, 0x000000, 0.4);
    this.sprite = scene.add.image(0, -20, `npc_${id}`);
    const label = scene.add.text(0, -48, def?.short ?? id, {
      fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '13px', color: '#e8e2d0', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setResolution(3);
    this.add([shadow, this.sprite, label]);
    this.setSize(34, 50);
    // Container hit areas are tested in the size box's top-left space, so add half the size.
    this.setInteractive(new Phaser.Geom.Rectangle(-24 + 17, -58 + 25, 48, 66), Phaser.Geom.Rectangle.Contains);
    scene.add.existing(this);
  }

  /** Called with each server snapshot. Walks to the new room through the doors when it changed. */
  setRoom(roomId: string): void {
    if (roomId === this.roomId) return;
    const from = this.route.length ? this.roomId : roomAt(this.x / TILE, this.y / TILE);
    const path = routeBetween(from, roomId).map((p) => ({ x: p.x * TILE, y: p.y * TILE }));
    const end = npcSpot(roomId, this.npcId);
    this.route = [...path, { x: end.x * TILE, y: end.y * TILE }];
    this.roomId = roomId;
  }

  tick(dt: number): void {
    const t = this.route[0];
    let moving = false;
    if (t) {
      const dx = t.x - this.x, dy = t.y - this.y, d = Math.hypot(dx, dy);
      const step = WALK * dt;
      if (d <= step) { this.x = t.x; this.y = t.y; this.route.shift(); }
      else { this.x += (dx / d) * step; this.y += (dy / d) * step; }
      if (Math.abs(dx) > 1) this.sprite.setFlipX(dx < 0);
      moving = true;
    }
    this.bob += dt * (moving ? 14 : 2);
    this.sprite.y = -20 + Math.sin(this.bob) * (moving ? 1.5 : 0.4);
    this.setDepth(this.y);
  }
}
