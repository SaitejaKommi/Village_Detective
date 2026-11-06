import Phaser from 'phaser';
import { npcDef } from '../data/npcs';
import { TILE } from '../data/mansion';

/** An NPC in the world: shadow, sprite and a name label. Position is driven by server `state` ticks. */
export class NpcSprite extends Phaser.GameObjects.Container {
  readonly npcId: string;
  private sprite: Phaser.GameObjects.Image;
  private target = new Phaser.Math.Vector2();
  private bob = Math.random() * 6;

  constructor(scene: Phaser.Scene, id: string, tx: number, ty: number) {
    super(scene, tx * TILE, ty * TILE);
    this.npcId = id;
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
    this.target.set(this.x, this.y);
    scene.add.existing(this);
  }

  setTarget(tx: number, ty: number): void { this.target.set(tx * TILE, ty * TILE); }

  tick(dt: number): void {
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    // Ease toward the last snapshot (snapshots arrive about twice a second).
    const k = 1 - Math.exp(-dt * 5);
    this.x += dx * k; this.y += dy * k;
    if (Math.abs(dx) > 1) this.sprite.setFlipX(dx < 0);
    this.bob += dt * (dist > 3 ? 14 : 2);
    this.sprite.y = -20 + Math.sin(this.bob) * (dist > 3 ? 1.5 : 0.4);
    this.setDepth(this.y);
  }
}
