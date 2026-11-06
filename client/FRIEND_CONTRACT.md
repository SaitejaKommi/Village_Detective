# Contract note for the backend (Person B)

The client is finished and runs on a mock. It cannot talk to the real server until `shared/types.ts` has the pieces below. The full reasoning is in `BACKEND_REQUESTS.md` (items 1 to 8). This page is just what to paste and what to check.

## Paste into `shared/types.ts`

These replace the loose `State` and `Error`, and extend `Join`, `Session` and `Game_over`. Keep your other types as they are.

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';

// ---- Every WebSocket frame is { type, payload } --------------------------------
export type ClientMessage =
  | { type: 'join'; payload: { playerId?: string; sessionId?: string } }
  | { type: 'get_profile'; payload: Record<string, never> }
  | { type: 'start_case'; payload: { difficulty: Difficulty } }
  | { type: 'move'; payload: { dx: number; dy: number } }          // direction only, not a position
  | { type: 'talk'; payload: { npcId: string; text: string } }     // text max 300 chars
  | { type: 'inspect'; payload: { clueId: string } }
  | { type: 'hint_request'; payload: Record<string, never> }
  | { type: 'accuse'; payload: { npcId: string } };

export type Session = { sessionId: string; playerId: string };     // playerId added

export type Profile = { playerId: string; diamonds: number; casesSolved: number; outfitId: string };

export type CaseStarted = {                                          // never include killer, timeline or secrets
  caseId: string;
  title: string;
  difficulty: Difficulty;
  briefing: { victimId: string; victimName: string; scene: string; summary: string };
  rooms: { id: string; name: string }[];
  suspects: { id: string; name: string; role: string; appearance: string }[];
};

export type State = {                                                // replaces the string[] version
  tick: number;
  clock: number;                                                     // in-game minutes since midnight
  npcs: { id: string; room: string; x: number; y: number }[];       // tile units; victim is not listed
  clues: { id: string; room: string; x: number; y: number; label: string }[];
};

export type ClueInfo = { clueId: string; title: string; text: string; room?: string };  // reply to inspect

export type Hint = { tier: number; text: string; cost: number; diamonds: number; hintsLeft: number };

export type DiamondsUpdate = { balance: number; reason: 'hint' | 'reward' };

export type Game_over = {
  won: boolean;
  killerId: string;
  timeline: string[];
  secrets: Record<string, string>;                                   // npcId -> secret text
  reward: number;                                                    // diamonds granted (0 if lost)
  diamonds: number;                                                  // new balance, from the server
};

// Error codes are strings. message is optional.
export type ErrorMsg = {
  code: 'INSUFFICIENT_DIAMONDS' | 'HINT_CAP_REACHED' | 'NO_ACTIVE_CASE' | 'RATE_LIMITED'
      | 'NPC_UNAVAILABLE' | 'UNKNOWN_CLUE' | 'ALREADY_ACCUSED' | 'LLM_BUSY' | 'SERVER_BUSY' | 'BAD_REQUEST' | string;
  message?: string;
};

export type ServerMessage =
  | { type: 'session'; payload: Session }
  | { type: 'profile'; payload: Profile }
  | { type: 'case_started'; payload: CaseStarted }
  | { type: 'state'; payload: State }
  | { type: 'npc_say'; payload: Npc_say }                            // npcId is required
  | { type: 'clue_info'; payload: ClueInfo }
  | { type: 'event'; payload: Event }
  | { type: 'hint'; payload: Hint }
  | { type: 'diamonds_update'; payload: DiamondsUpdate }
  | { type: 'debug'; payload: Debug }
  | { type: 'game_over'; payload: Game_over }
  | { type: 'error'; payload: ErrorMsg };
```

## IDs the client hard-codes (use these in the case file)

- Rooms: `study`, `library`, `kitchen`, `dining`, `foyer`, `garden`.
- NPCs: `alistair` (the victim, never in `state.npcs`), `evelyn`, `julian`, `harold`, `margaret`, `victor`.
- The victim's body must be an inspectable clue with id `c_body`. Other clue ids are free.
- Coordinates are tile units on a 49 x 25 grid (3 x 2 rooms, 16 x 12 tiles each). The layout lives in `client/src/data/mansion.ts`. Tell us if rooms change.

## Behaviour the client relies on

- The client never sends or computes a balance. It shows `profile.diamonds`, `hint.diamonds`, `diamonds_update.balance` and `game_over.diamonds`.
- On every connect or reconnect it sends `join { playerId }`. Resume the case or reply `NO_ACTIVE_CASE`.
- It waits 25 s for an `npc_say`. `LLM_BUSY` or `SERVER_BUSY` ends the wait sooner.
- Player movement is simulated on the client. The server does not need `state.player`.

## Checklist

**You (Person B)**
- [ ] Paste the types above into `shared/types.ts` (change anything you disagree with and tell Saiteja).
- [ ] Use the room, NPC and `c_body` ids above in the case file.
- [ ] Make `session` return `playerId`, `inspect` answer with `clue_info`, and `game_over` include `reward` and `diamonds`.
- [ ] Never put the killer, timeline or secrets in `case_started` or `state`.

**Client (Saiteja, after your types merge)**
- [ ] Delete the DRAFT overrides in `client/src/net/protocol.ts` and import your types instead.
- [ ] Run `npm run typecheck` and fix any shape differences.
- [ ] Set `VITE_USE_MOCK=false` and `VITE_WS_URL` in `client/.env.local`, then play one full case against your server.
