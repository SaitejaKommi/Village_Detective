import './styles/tokens.css';
import './styles/base.css';
import './styles/intro.css';
import { flow } from './game/flow';
import { atmosphere } from './ui/atmosphere';
import { mountFx } from './ui/fx';
import { initUi, wireSounds } from './ui/screens';

initUi();
atmosphere.mount(document.getElementById('atmos')!);
atmosphere.setIntensity(0); // black until the click gate
wireSounds(document.getElementById('ui')!);
mountFx();
flow.boot();
