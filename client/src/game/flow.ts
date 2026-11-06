// App flow controller: gate -> intro -> menu -> difficulty -> briefing -> game -> ending -> menu.
import { audio } from '../audio/audioManager';
import { npcDef } from '../data/npcs';
import type { Difficulty } from '../data/difficulty';
import { net } from '../net/client';
import type { ErrorPayload } from '../net/protocol';
import type { Interactable } from '../scenes/MansionScene';
import { getSettings } from '../settings';
import { bus, store } from '../state/store';
import { atmosphere } from '../ui/atmosphere';
import { initDebug } from '../ui/debug';
import { h } from '../ui/dom';
import { createHud } from '../ui/hud';
import { introScreen } from '../ui/intro';
import { briefingScreen, difficultyScreen, gateScreen, loadingOverlay, menuScreen, profileScreen, settingsScreen } from '../ui/menuScreens';
import { endingScreen, friendlyError, openAccuse, openEvidence, openHint, openInterrogation, openNotebook } from '../ui/panels';
import { clearScreen, closeAllOverlays, hasOverlay, setHud, showScreen, toast } from '../ui/screens';
import { input } from './input';
import { startMansion, stopMansion } from './phaserGame';

class Flow {
  private inGame = false;
  private loading: HTMLElement | null = null;
  private banner: HTMLElement | null = null;
  private connTimer: number | undefined;

  boot(): void {
    this.wireGlobal();
    initDebug();
    showScreen(gateScreen(() => void this.afterGate()), { instant: true });
    void this.devShortcut();
  }

  // ---- global wiring ------------------------------------------------------
  private wireGlobal(): void {
    bus.on('overlay:change', (n: number) => { input.locked = n > 0 || !this.inGame; atmosphere.setDim(n > 0); document.getElementById('hud-root')?.classList.toggle('under', n > 0); });
    bus.on('toast', (m: string) => toast(m));
    bus.on('interact', (t: Interactable) => this.interact(t));
    net.on('error', (p: ErrorPayload) => { if (!hasOverlay() && !this.loading) toast(friendlyError(p.code, p.message), 'error'); });
    net.on('game_over', () => this.showEnding());
    store.subscribe((s) => this.syncConnection(s.connection));
  }

  /** Reconnecting / offline banner (screen 15). */
  private lastConn = '';
  private syncConnection(status: string): void {
    if (status === this.lastConn) return; // store updates every tick; only react to changes
    this.lastConn = status;
    window.clearTimeout(this.connTimer);
    const root = document.getElementById('ui')!;
    const clearBanner = () => { this.banner?.remove(); this.banner = null; };
    if (status === 'online') { clearBanner(); return; }
    const show = () => {
      clearBanner();
      if (status === 'offline') {
        this.banner = h('div', { class: 'conn-banner offline', role: 'alert' }, 'Cannot reach the server.',
          h('button', { class: 'btn', type: 'button', onclick: () => { net.retry(); } }, 'Retry'));
      } else {
        this.banner = h('div', { class: 'conn-banner', role: 'status' }, h('span', { class: 'spin' }), status === 'connecting' ? 'Connecting…' : 'Connection lost. Reconnecting…');
      }
      root.append(this.banner);
    };
    // Don't flash "Connecting…" on a fast first connect.
    if (status === 'connecting') this.connTimer = window.setTimeout(show, 1500); else show();
  }

  // ---- gate / intro / menu ---------------------------------------------------
  private async afterGate(): Promise<void> {
    await audio.unlock();
    audio.startRain();
    atmosphere.setIntensity(1);
    void net.init();
    if (getSettings().skipIntro) this.toMenu();
    else {
      audio.startMusic('menu');
      showScreen(introScreen(() => this.toMenu()));
    }
  }

  playIntro(): void { showScreen(introScreen(() => this.toMenu())); }

  toMenu(): void {
    this.inGame = false;
    audio.startMusic('menu');
    atmosphere.setIntensity(1);
    atmosphere.setAutoLightning(true);
    showScreen(menuScreen({
      onStart: () => this.toDifficulty(),
      onProfile: () => this.toProfile(),
      onSettings: () => this.toSettings(),
    }));
  }

  toDifficulty(): void {
    showScreen(difficultyScreen({ onPick: (d) => this.startCase(d), onBack: () => this.toMenu() }));
  }

  toProfile(): void {
    net.send({ type: 'get_profile', payload: {} });
    showScreen(profileScreen(() => this.toMenu()));
  }

  toSettings(): void { showScreen(settingsScreen(() => this.toMenu())); }

  // ---- case ------------------------------------------------------------------
  /** Sends start_case and shows the briefing when the server answers. Resolves true on success. */
  startCase(difficulty: Difficulty): Promise<boolean> {
    return new Promise((resolve) => {
      this.loading = loadingOverlay('Opening the case file…');
      document.getElementById('ui')!.append(this.loading);
      const done = (ok: boolean) => { offOk(); offErr(); window.clearTimeout(t); this.loading?.remove(); this.loading = null; resolve(ok); };
      const offOk = net.on('case_started', () => { done(true); showScreen(briefingScreen(() => this.begin(), () => this.toDifficulty())); });
      const offErr = net.on('error', (p) => { done(false); toast(friendlyError(p.code, p.message), 'error'); });
      const t = window.setTimeout(() => { done(false); toast('The station is not answering. Try again.', 'error'); }, 15000);
      net.send({ type: 'start_case', payload: { difficulty } });
    });
  }

  /** Leave the briefing and walk into the mansion. */
  begin(): void {
    this.inGame = true;
    input.locked = false;
    clearScreen();
    audio.startMusic('game');
    audio.sfx('door');
    atmosphere.setIntensity(0.6);
    atmosphere.setAutoLightning(true);
    startMansion();
    setHud(createHud({
      onNotebook: () => openNotebook(),
      onHint: () => openHint(),
      onAccuse: () => openAccuse(),
      onInteract: (t) => this.interact(t),
    }));
  }

  private interact(t: Interactable): void {
    if (!this.inGame || hasOverlay()) return;
    if (t.kind === 'npc') {
      if (!npcDef(t.id)) return;
      openInterrogation(t.id);
    } else openEvidence(t.id, t.label);
  }

  private showEnding(): void {
    closeAllOverlays();
    this.inGame = false;
    input.locked = true;
    setHud(null);
    audio.sfx('sting');
    window.setTimeout(() => {
      stopMansion();
      atmosphere.setIntensity(1);
      showScreen(endingScreen(() => this.returnToMenu()));
    }, 300);
  }

  private returnToMenu(): void {
    stopMansion();
    setHud(null);
    store.resetCase();
    net.send({ type: 'get_profile', payload: {} });
    this.toMenu();
  }

  // ---- dev shortcuts (stripped from production builds) -------------------------
  private async devShortcut(): Promise<void> {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(location.search);
    if (!params.get('screen')) return;
    const { runShortcut } = await import('../dev/shortcuts');
    await runShortcut(this, params);
  }
}

export const flow = new Flow();
export type { Flow };
