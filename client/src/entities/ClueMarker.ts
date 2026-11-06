import Phaser from 'phaser';
import { TILE } from '../data/mansion';

/** A gold glint marking an inspectable object. Dims once inspected. Slow pulse only. */
export class ClueMarker extends Phaser.GameObjects.Container {
  readonly clueId: string;
  readonly label: string;
  private glint: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, id: string, tx: number, ty: number, label: string) {
    super(scene, tx * TILE, ty * TILE);
    this.clueId = id;
    this.label = label;
    this.glint = scene.add.image(0, -6, 'clue');
    this.add(this.glint);
    if (id === 'c_body') this.addAt(scene.add.image(0, 4, 'body'), 0);
    this.setSize(40, 40);
    this.setInteractive(new Phaser.Geom.Rectangle(-24, -26, 48, 48), Phaser.Geom.Rectangle.Contains);
    this.setDepth(this.y - 1);
    scene.tweens.add({ targets: this.glint, alpha: { from: 0.55, to: 1 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.add.existing(this);
  }

  setFound(found: boolean): void { this.glint.setTint(found ? 0x777777 : 0xffffff).setScale(found ? 0.7 : 1); }
}
