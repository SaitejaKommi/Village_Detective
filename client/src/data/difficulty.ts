export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyInfo {
  id: Difficulty;
  label: string;
  tag: string;
  blurb: string;
  bullets: string[];
}

// Presentation only. The server owns the real rules for each level.
export const DIFFICULTIES: DifficultyInfo[] = [
  {
    id: 'easy', label: 'Rookie', tag: 'Easy',
    blurb: 'A cooperative household and clear leads.',
    bullets: ['More obvious clues', 'Cooperative suspects', 'More hints available'],
  },
  {
    id: 'medium', label: 'Professional', tag: 'Medium',
    blurb: 'Secrets must be pressed. Some stories will not agree.',
    bullets: ['Hidden secrets', 'Lies and contradictions', 'Fewer hints'],
  },
  {
    id: 'hard', label: 'Master', tag: 'Hard',
    blurb: 'Guarded suspects and tangled alibis.',
    bullets: ['Complex alibis', 'Misinformation', 'Very limited hints'],
  },
];
