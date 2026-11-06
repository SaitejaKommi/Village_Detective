// AudioManager: starts only after the click gate, works with zero files (everything has a synth fallback),
// and a missing file is a silent no-op. Real files in public/assets/audio/ override the synth.
import { AUDIO_FILES, AUDIO_URL, type AudioKey } from '../data/assets';
import { getSettings, onSettings } from '../settings';

type SfxName = 'click' | 'hover' | 'step' | 'paper' | 'chime' | 'thunder' | 'sting' | 'door';

class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private rainBus!: GainNode;
  private noise: AudioBuffer | null = null;
  private files: Partial<Record<AudioKey, AudioBuffer>> = {};
  private rainNodes: AudioNode[] = [];
  private musicNodes: AudioNode[] = [];
  private musicTimer: number | undefined;
  private rainOn = false;
  private musicMood: 'menu' | 'game' | null = null;
  private lastHover = 0;

  /** Call from a user gesture (the click gate). Safe to call more than once. */
  async unlock(): Promise<void> {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.rainBus = this.ctx.createGain();
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        this.rainBus.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.noise = this.makeNoise(this.ctx);
        onSettings(() => this.applyVolumes());
        this.applyVolumes();
        void this.loadFiles();
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    } catch { /* audio unavailable: stay silent */ }
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0; // pinkish noise
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    return buf;
  }

  /** Try each optional file. A missing file (or a dev server returning index.html) is ignored. */
  private async loadFiles(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    await Promise.all((Object.keys(AUDIO_FILES) as AudioKey[]).map(async (key) => {
      try {
        const res = await fetch(AUDIO_URL(key));
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || !/audio|octet-stream|ogg|mpeg/i.test(type)) return;
        this.files[key] = await ctx.decodeAudioData(await res.arrayBuffer());
        // If a real file arrived after a synth started, swap it in.
        if (key === 'rain' && this.rainOn) { this.stopRain(); this.startRain(); }
        if ((key === 'music_menu' || key === 'music_game') && this.musicMood) { const m = this.musicMood; this.stopMusic(); this.startMusic(m); }
      } catch { /* silent no-op */ }
    }));
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const s = getSettings();
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.mute ? 0 : 1, t, 0.05);
    this.musicBus.gain.setTargetAtTime(s.music, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s.effects, t, 0.05);
    this.rainBus.gain.setTargetAtTime(s.effects * 0.9, t, 0.05);
  }

  // ---- rain ---------------------------------------------------------------
  startRain(): void {
    const ctx = this.ctx;
    if (!ctx || this.rainOn) return;
    this.rainOn = true;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    out.connect(this.rainBus);
    this.rainNodes.push(out);
    const real = this.files.rain;
    if (real) {
      const src = ctx.createBufferSource();
      src.buffer = real; src.loop = true; src.connect(out); src.start();
      this.rainNodes.push(src);
      return;
    }
    // Synthesised rain: bandpassed noise (hiss) plus a low rumble.
    const layer = (type: BiquadFilterType, freq: number, q: number, gain: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise; src.loop = true;
      src.playbackRate.value = 0.9 + Math.random() * 0.2;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(out); src.start();
      this.rainNodes.push(src, f, g);
    };
    layer('highpass', 1400, 0.4, 0.5);
    layer('bandpass', 4200, 0.6, 0.35);
    layer('lowpass', 350, 0.5, 0.45);
  }
  stopRain(): void {
    this.rainOn = false;
    this.rainNodes.forEach((n) => { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* */ } n.disconnect(); });
    this.rainNodes = [];
  }

  // ---- music ---------------------------------------------------------------
  startMusic(mood: 'menu' | 'game'): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.musicMood === mood) return;
    this.stopMusic();
    this.musicMood = mood;
    const key: AudioKey = mood === 'menu' ? 'music_menu' : 'music_game';
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(mood === 'menu' ? 0.9 : 0.6, ctx.currentTime + 4);
    out.connect(this.musicBus);
    this.musicNodes.push(out);
    const real = this.files[key];
    if (real) {
      const src = ctx.createBufferSource();
      src.buffer = real; src.loop = true; src.connect(out); src.start();
      this.musicNodes.push(src);
      return;
    }
    // Synth: slow minor drone with sparse high notes.
    const roots = mood === 'menu' ? [55, 82.41, 98] : [49, 73.42, 87.31]; // A1,E2,G2 / G1,D2,F2
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.connect(out);
    this.musicNodes.push(lp);
    roots.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 0 ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 0 ? 0.16 : 0.1;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = g.gain.value * 0.5;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(lp); o.start(); lfo.start();
      this.musicNodes.push(o, g, lfo, lg);
    });
    const scale = mood === 'menu' ? [220, 261.63, 329.63, 392, 440] : [196, 233.08, 293.66, 349.23, 392];
    const note = () => {
      if (!this.ctx || this.musicMood !== mood) return;
      const f = scale[Math.floor(Math.random() * scale.length)];
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0005, t + 4.5);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 4.6);
      this.musicTimer = window.setTimeout(note, 3500 + Math.random() * 6000);
    };
    this.musicTimer = window.setTimeout(note, 2500);
  }
  stopMusic(): void {
    window.clearTimeout(this.musicTimer);
    this.musicMood = null;
    this.musicNodes.forEach((n) => { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* */ } n.disconnect(); });
    this.musicNodes = [];
  }

  // ---- effects -------------------------------------------------------------
  sfx(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const fileKey: Partial<Record<SfxName, AudioKey>> = {
      click: 'click', step: 'footstep', paper: 'paper', chime: 'chime', thunder: 'thunder', sting: 'sting',
    };
    const k = fileKey[name];
    const t = ctx.currentTime;
    if (k && this.files[k]) {
      const src = ctx.createBufferSource(); src.buffer = this.files[k]!;
      const g = ctx.createGain(); g.gain.value = name === 'step' ? 0.5 : 0.9;
      src.connect(g); g.connect(this.sfxBus); src.start();
      return;
    }
    const tone = (freq: number, dur: number, vol: number, type: OscillatorType = 'sine', slide = 0) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
    };
    const burst = (freq: number, dur: number, vol: number, type: BiquadFilterType = 'lowpass', q = 0.7) => {
      const src = ctx.createBufferSource(); src.buffer = this.noise;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t, Math.random()); src.stop(t + dur + 0.05);
    };
    switch (name) {
      case 'click': tone(520, 0.07, 0.12, 'triangle'); break;
      case 'hover': { const n = performance.now(); if (n - this.lastHover > 90) { tone(900, 0.04, 0.03, 'sine'); this.lastHover = n; } break; }
      case 'step': burst(500 + Math.random() * 200, 0.07, 0.35); break;
      case 'door': burst(180, 0.35, 0.7); tone(90, 0.3, 0.2, 'sine'); break;
      case 'paper': burst(3000, 0.18, 0.18, 'highpass', 0.3); break;
      case 'chime': tone(880, 1.2, 0.12); tone(1318, 1.0, 0.08); break;
      case 'sting': tone(110, 1.4, 0.25, 'sawtooth', -40); tone(116.5, 1.4, 0.2, 'sawtooth', -40); break;
      case 'thunder': burst(140, 3.2, 1.2, 'lowpass', 0.4); burst(70, 4, 0.9, 'lowpass', 0.4); break;
    }
  }

  /** Distant thunder, delayed slightly after a flash. */
  thunder(delayMs = 500): void { window.setTimeout(() => this.sfx('thunder'), delayMs); }
}

export const audio = new AudioManager();
