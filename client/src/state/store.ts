// Client view-state. Everything here is DISPLAYED, never decided, by the client.
// In particular `diamonds` is only ever assigned from a server (or mock) message.
import type {
  CaseStartedMessage, ConnectionStatus, GameOverMessage, ProfileMessage, StateMessage,
} from '../net/protocol';

export interface TranscriptLine { who: 'you' | 'npc'; text: string; at: number }
export interface FoundClue { id: string; title: string; text: string; room: string }
export interface HintEntry { tier: string; text: string }

export interface GameState {
  connection: ConnectionStatus;
  playerId: string | null;
  sessionId: string | null;
  profile: ProfileMessage | null;
  diamonds: number | null; // server-owned
  caseInfo: CaseStartedMessage | null;
  world: StateMessage | null;
  hintsLeft: number | null;
  hints: HintEntry[];
  transcripts: Record<string, TranscriptLine[]>;
  /** Derived from `state.clues` entries the server marks `discovered`. */
  foundClues: FoundClue[];
  gameOver: GameOverMessage | null;
  accused: boolean;
}

function initial(): GameState {
  return {
    connection: 'connecting', playerId: null, sessionId: null, profile: null, diamonds: null, caseInfo: null,
    world: null, hintsLeft: null, hints: [], transcripts: {}, foundClues: [], gameOver: null, accused: false,
  };
}

type Listener = (s: GameState) => void;

class Store {
  state: GameState = initial();
  private listeners = new Set<Listener>();

  set(patch: Partial<GameState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }
  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  /** Reset per-case data (keeps profile, diamonds, identity and connection). */
  resetCase(): void {
    this.set({
      caseInfo: null, world: null, hintsLeft: null, hints: [], transcripts: {}, foundClues: [],
      gameOver: null, accused: false,
    });
  }
  addLine(npcId: string, line: TranscriptLine): void {
    const t = { ...this.state.transcripts };
    t[npcId] = [...(t[npcId] ?? []), line];
    this.set({ transcripts: t });
  }
}

export const store = new Store();

// ---- tiny event bus for UI <-> Phaser <-> flow ---------------------------------
type Handler = (data?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
const handlers = new Map<string, Set<Handler>>();
export const bus = {
  on(evt: string, h: Handler): () => void {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt)!.add(h);
    return () => handlers.get(evt)?.delete(h);
  },
  emit(evt: string, data?: unknown): void {
    handlers.get(evt)?.forEach((h) => h(data));
  },
};

/** Format in-game minutes since midnight as 9:42 PM. */
export function formatClock(minutes: number): string {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60), mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** The server sends no clue titles, only ids like `torn_ledger`. Make a readable title from the id. */
export function clueTitle(id: string): string {
  const s = id.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Timeline `time` is an hour of the day (24 = midnight). */
export function formatHour(hour: number): string {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${h < 12 ? 'AM' : 'PM'}`;
}
