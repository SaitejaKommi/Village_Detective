// DEV ONLY. Jump straight to any screen for testing. This module is only imported when import.meta.env.DEV.
//   ?screen=menu | intro | difficulty | profile | settings | briefing | game | interrogation | evidence |
//           notebook | hint | accuse | ending | offline
//   &npc=julian   (interrogation)      &result=won|lost (ending)
//   &d=easy|medium|hard (case difficulty)      &dia=0 (set the MOCK balance, to test the empty state)
import { audio } from '../audio/audioManager';
import type { Flow } from '../game/flow';
import { net } from '../net/client';
import { store } from '../state/store';
import { atmosphere } from '../ui/atmosphere';
import { openAccuse, openEvidence, openHint, openInterrogation, openNotebook } from '../ui/panels';
import type { Difficulty } from '../data/difficulty';

const until = async (cond: () => boolean, ms = 6000) => {
  const t0 = Date.now();
  while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 50));
};

export async function runShortcut(flow: Flow, q: URLSearchParams): Promise<void> {
  const screen = q.get('screen')!;
  const d = (q.get('d') as Difficulty) || 'medium';
  await audio.unlock();
  audio.startRain();
  atmosphere.setIntensity(1);
  await net.init();
  await until(() => store.state.profile !== null);

  if (q.get('dia') !== null && net.usingMock) {
    const m = await import('../mock/mockServer');
    m.getMock()?.devSetDiamonds(Number(q.get('dia')));
    net.send({ type: 'get_profile', payload: {} });
    await new Promise((r) => setTimeout(r, 400));
  }

  switch (screen) {
    case 'menu': flow.toMenu(); return;
    case 'intro': flow.playIntro(); return;
    case 'difficulty': flow.toDifficulty(); return;
    case 'profile': flow.toProfile(); return;
    case 'settings': flow.toSettings(); return;
    case 'offline': {
      flow.toMenu();
      const m = await import('../mock/mockServer');
      m.getMock()?.simulateDisconnect(60000);
      return;
    }
    case 'briefing': {
      flow.toMenu();
      await flow.startCase(d); // shows the briefing itself
      return;
    }
    default: break;
  }

  // Everything below needs a live case.
  if (!(await flow.startCase(d))) return;
  flow.begin();
  await until(() => store.state.world !== null);
  switch (screen) {
    case 'interrogation': openInterrogation(q.get('npc') || 'julian'); break;
    case 'evidence': openEvidence(q.get('clue') || 'c_body'); break;
    case 'hint': openHint(); break;
    case 'accuse': openAccuse(); break;
    case 'notebook': {
      net.send({ type: 'inspect', payload: { clueId: 'c_body' } });
      net.send({ type: 'talk', payload: { npcId: 'julian', text: 'Where were you at ten?' } });
      net.send({ type: 'talk', payload: { npcId: 'victor', text: 'What was your relationship with Alistair?' } });
      await until(() => (store.state.transcripts.victor?.length ?? 0) >= 2 && store.state.foundClues.length > 0, 6000);
      openNotebook((q.get('tab') as 'clues' | 'statements' | 'suspects') || 'statements');
      break;
    }
    case 'ending': {
      const m = await import('../mock/mockServer');
      m.getMock()?.devAccuse(q.get('result') !== 'lost');
      break;
    }
    default: break; // 'game'
  }
}
