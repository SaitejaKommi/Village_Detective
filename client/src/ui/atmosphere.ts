// Atmosphere layers above the world and below the UI: rain canvas, fog, vignette, lightning.
import { audio } from '../audio/audioManager';
import { reducedMotion } from '../settings';
import { h } from './dom';

interface Drop { x: number; y: number; len: number; v: number; a: number }

class Atmosphere {
  private root!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private flash!: HTMLElement;
  private drops: Drop[] = [];
  private raf = 0;
  private w = 0;
  private h = 0;
  private intensity = 1; // 0..1
  private lightningTimer: number | undefined;
  private lightningEnabled = false;
  private flashing = false;

  mount(root: HTMLElement): void {
    this.root = root;
    this.canvas = h('canvas', { class: 'rain-canvas' });
    this.flash = h('div', { class: 'lightning' });
    root.append(
      h('div', { class: 'fog fog-a' }),
      h('div', { class: 'fog fog-b' }),
      this.canvas,
      this.flash,
      h('div', { class: 'vignette' }),
    );
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
    this.start();
  }

  /** 0 = off, 1 = full. Lower under panels so text stays readable. */
  setIntensity(v: number): void {
    this.intensity = v;
    this.root.style.setProperty('--rain-alpha', String(Math.min(1, 0.25 + v * 0.75)));
  }
  setDim(on: boolean): void { this.root.classList.toggle('dim', on); }

  private resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(220, (this.w * this.h) / 7000) * (reducedMotion() ? 0.4 : 1));
    this.drops = Array.from({ length: count }, () => this.newDrop(true));
  }

  private newDrop(anywhere: boolean): Drop {
    const slow = reducedMotion();
    return {
      x: Math.random() * (this.w + 100) - 50,
      y: anywhere ? Math.random() * this.h : -20,
      len: 10 + Math.random() * 16,
      v: (slow ? 5 : 11) + Math.random() * 8,
      a: 0.15 + Math.random() * 0.3,
    };
  }

  private start(): void {
    if (this.raf) return;
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const { ctx } = this;
      ctx.clearRect(0, 0, this.w, this.h);
      if (this.intensity <= 0) return;
      ctx.lineWidth = 1;
      const wind = 0.22;
      for (const d of this.drops) {
        ctx.strokeStyle = `rgba(190,205,215,${d.a * this.intensity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * wind, d.y + d.len);
        ctx.stroke();
        d.y += d.v; d.x -= d.v * wind;
        if (d.y > this.h + 20) Object.assign(d, this.newDrop(false));
      }
    };
    this.raf = requestAnimationFrame(loop);
  }
  private stop(): void { cancelAnimationFrame(this.raf); this.raf = 0; }

  /**
   * One flash plus a fainter afterglow (two pulses over ~0.9 s, well under 3 per second).
   * Does nothing for prefers-reduced-motion. Thunder follows.
   */
  lightning(withSound = true): void {
    if (reducedMotion() || this.flashing) return;
    this.flashing = true;
    const f = this.flash;
    f.style.transition = 'none';
    f.style.opacity = '0.75';
    window.setTimeout(() => { f.style.transition = 'opacity 260ms ease-out'; f.style.opacity = '0.06'; }, 70);
    window.setTimeout(() => { f.style.transition = 'opacity 80ms linear'; f.style.opacity = '0.4'; }, 520);
    window.setTimeout(() => { f.style.transition = 'opacity 700ms ease-out'; f.style.opacity = '0'; }, 620);
    window.setTimeout(() => { this.flashing = false; }, 1500);
    if (withSound) audio.thunder(450 + Math.random() * 700);
  }

  /** Random lightning every 18 to 40 s while enabled. */
  setAutoLightning(on: boolean): void {
    this.lightningEnabled = on;
    window.clearTimeout(this.lightningTimer);
    if (!on) return;
    const next = () => {
      this.lightningTimer = window.setTimeout(() => {
        if (this.lightningEnabled) { this.lightning(); next(); }
      }, 18000 + Math.random() * 22000);
    };
    next();
  }
}

export const atmosphere = new Atmosphere();
