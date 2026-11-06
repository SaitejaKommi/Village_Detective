// App flow controller: gate -> intro -> menu -> difficulty -> briefing -> game -> ending -> menu.
import { audio } from '../audio/audioManager';
import type { Difficulty } from '../data/difficulty';
import { net } from '../net/client';
import { getSettings } from '../settings';
import { atmosphere } from '../ui/atmosphere';
import { introScreen } from '../ui/intro';
import { briefingScreen, difficultyScreen, gateScreen, menuScreen, profileScreen, settingsScreen } from '../ui/menuScreens';
import { showScreen } from '../ui/screens';

class Flow {
  boot(): void {
    showScreen(gateScreen(() => void this.afterGate()), { instant: true });
  }

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

  toMenu(): void {
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

  toSettings(): void {
    showScreen(settingsScreen(() => this.toMenu()));
  }

  startCase(difficulty: Difficulty): void {
    net.send({ type: 'start_case', payload: { difficulty } });
    // Briefing is shown on case_started (wired in step 7).
    net.on('case_started', () => showScreen(briefingScreen(() => {}, () => this.toDifficulty())));
  }
}

export const flow = new Flow();
