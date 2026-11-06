// Drop real files into client/public/assets/... and they are used automatically.
// Anything missing falls back to generated art or synthesised audio.

export const PORTRAIT_URL = (id: string) => `${import.meta.env.BASE_URL}assets/portraits/${id}.webp`;

export const AUDIO_FILES = {
  rain: 'rain.mp3',
  music_menu: 'music-menu.mp3',
  music_game: 'music-investigation.mp3',
  thunder: 'thunder.mp3',
  click: 'click.mp3',
  footstep: 'footstep.mp3',
  paper: 'paper.mp3',
  chime: 'chime.mp3',
  sting: 'sting.mp3',
} as const;
export type AudioKey = keyof typeof AUDIO_FILES;
export const AUDIO_URL = (key: AudioKey) => `${import.meta.env.BASE_URL}assets/audio/${AUDIO_FILES[key]}`;
