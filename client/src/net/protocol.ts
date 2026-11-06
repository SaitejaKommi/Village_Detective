// DRAFT client-side protocol.
// Base message shapes are imported from shared/types.ts (owned by the backend dev).
// shared/types.ts has no envelope and does not yet include the 7 Nov messages (start_case,
// hint_request, profile, ...), so those are drafted here. See BACKEND_REQUESTS.md.
// Every item marked DRAFT should move into shared/types.ts once both sides agree.
import type { Session, Npc_say, Event as GameEvent, Debug, Game_over } from '@shared/types';
import type { Difficulty } from '../data/difficulty';

export type { Npc_say, GameEvent, Debug, Session };
export type { Difficulty };

// ---- Client -> server -------------------------------------------------------
export type ClientMessage =
  | { type: 'join'; payload: { playerId?: string; sessionId?: string } } // DRAFT: union of both contract versions
  | { type: 'get_profile'; payload: Record<string, never> }
  | { type: 'start_case'; payload: { difficulty: Difficulty } }
  | { type: 'move'; payload: { dx: number; dy: number } }
  | { type: 'talk'; payload: { npcId: string; text: string } }
  | { type: 'inspect'; payload: { clueId: string } }
  | { type: 'hint_request'; payload: Record<string, never> }
  | { type: 'accuse'; payload: { npcId: string } };

// ---- Server -> client -------------------------------------------------------
/** DRAFT: shared `Session` plus playerId. */
export type SessionPayload = Session & { playerId?: string };

/** DRAFT. */
export interface ProfilePayload {
  playerId: string;
  diamonds: number;
  casesSolved: number;
  outfitId: string;
}

/** DRAFT: public case info. Never contains solution data. */
export interface CaseStartedPayload {
  caseId: string;
  title: string;
  difficulty: Difficulty;
  briefing: {
    victimId: string;
    victimName: string;
    scene: string;
    summary: string;
  };
  rooms: { id: string; name: string }[];
  suspects: { id: string; name: string; role: string; appearance: string }[];
}

/** DRAFT. Coordinates are tile units. `shared` State is too loose to use directly. */
export interface WorldState {
  tick: number;
  /** In-game minutes since midnight. */
  clock: number;
  objective?: string;
  npcs: { id: string; room: string; x: number; y: number }[];
  clues: { id: string; room: string; x: number; y: number; label: string }[];
}

/** DRAFT: reply to `inspect` (contract has none). */
export interface ClueInfoPayload {
  clueId: string;
  title: string;
  text: string;
  room?: string;
}

export interface HintPayload {
  tier: number;
  text: string;
  cost: number;
  diamonds: number;
  hintsLeft: number;
}

export interface DiamondsUpdatePayload {
  balance: number;
  reason: 'hint' | 'reward';
}

/** DRAFT: shared Game_over plus the reward and difficulty. */
export type GameOverPayload = Omit<Game_over, 'timeline' | 'secrets'> & {
  timeline: string[];
  secrets: Record<string, string>;
  reward: number;
  diamonds: number;
};

/** DRAFT: shared Error has numeric code, but the 7 Nov doc uses string codes. */
export interface ErrorPayload {
  code: string | number;
  message?: string;
}

export type ServerMessage =
  | { type: 'session'; payload: SessionPayload }
  | { type: 'profile'; payload: ProfilePayload }
  | { type: 'case_started'; payload: CaseStartedPayload }
  | { type: 'state'; payload: WorldState }
  | { type: 'npc_say'; payload: Npc_say }
  | { type: 'clue_info'; payload: ClueInfoPayload }
  | { type: 'event'; payload: GameEvent }
  | { type: 'hint'; payload: HintPayload }
  | { type: 'diamonds_update'; payload: DiamondsUpdatePayload }
  | { type: 'debug'; payload: Debug }
  | { type: 'game_over'; payload: GameOverPayload }
  | { type: 'error'; payload: ErrorPayload };

export type ServerType = ServerMessage['type'];
export type ServerPayload<T extends ServerType> = Extract<ServerMessage, { type: T }>['payload'];

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';
