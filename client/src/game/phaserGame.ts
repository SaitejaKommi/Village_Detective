import Phaser from 'phaser';
import { MansionScene } from '../scenes/MansionScene';

let game: Phaser.Game | null = null;

function ensureGame(): Phaser.Game {
  if (game) return game;
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#070708',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: '100%', height: '100%' },
    render: { antialias: true, roundPixels: true },
    input: { activePointers: 3, touch: { capture: false } },
    disableContextMenu: true,
    scene: [],
  });
  game.scene.add('MansionScene', MansionScene, false);
  return game;
}

/** Show the canvas and (re)start the mansion scene. */
export function startMansion(): void {
  const host = document.getElementById('game')!;
  host.classList.add('on');
  const g = ensureGame();
  g.scale.refresh();
  if (g.scene.isActive('MansionScene')) g.scene.stop('MansionScene');
  g.scene.start('MansionScene');
  window.setTimeout(() => g.scale.refresh(), 50);
}

export function stopMansion(): void {
  document.getElementById('game')?.classList.remove('on');
  if (game?.scene.isActive('MansionScene')) game.scene.stop('MansionScene');
}

export function fps(): number { return game ? Math.round(game.loop.actualFps) : 0; }
