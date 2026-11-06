# Requests for the backend

The client is built and tested against a mock server that follows the drafts below. Nothing outside `client/` was changed. `shared/types.ts` was **not** edited. The drafts live in `client/src/net/protocol.ts`. Each is marked DRAFT there and should move into `shared/types.ts` once we agree.

## 1. Gaps in `shared/types.ts` (needs agreement)

| # | What | Why | Client draft |
| --- | --- | --- | --- |
| 1 | **Message envelope.** `shared/types.ts` defines payload types but no wrapper. | The client sends and expects `{ "type": string, "payload": object }`. | `ClientMessage` / `ServerMessage` unions |
| 2 | **The 7 Nov messages are missing:** `get_profile`, `start_case`, `hint_request` (client to server); `profile`, `case_started`, `hint`, `diamonds_update` (server to client). | The whole menu, briefing, hint and profile flow depends on them. Shapes follow the Backend Plan tables exactly. | `protocol.ts` |
| 3 | **`join` payload.** The base table says `{sessionId?}`, the 7 Nov table says `{playerId?}`. | The client sends `{ playerId?, sessionId? }`. | |
| 4 | **`session` should also return `playerId`.** Today only `profile` carries it. | The client persists `playerId` in localStorage and sends it on every (re)connect. | `SessionPayload` |
| 5 | **`error` payload.** `shared` has `{ code: number, message: string }`. The 7 Nov doc uses string codes (`INSUFFICIENT_DIAMONDS`, `HINT_CAP_REACHED`, `NO_ACTIVE_CASE`). | The client expects `{ code: string \| number, message?: string }`. It shows friendly text for the known codes. | `ErrorPayload` |
| 6 | **`inspect` has no reply message.** | Without one the evidence modal has nothing to show. Proposed: `clue_info { clueId, title, text, room? }`. | `ClueInfoPayload` |
| 7 | **`game_over` needs the reward.** | The ending shows "diamonds earned". The client must not do balance math, so it needs `reward` and the new `diamonds` balance from the server. `secrets` should be `Record<npcId, string>` and `timeline` `string[]`. | `GameOverPayload` |
| 8 | **`state` shape.** `shared` has `player: string, npcs: string[], clues: string[]`, which is too loose to render. | Proposed: `{ tick, clock, npcs: [{id, room, x, y}], clues: [{id, room, x, y, label}] }`. `clock` is in-game minutes since midnight. Coordinates are tile units (32px tiles, 49 x 25 grid). | `WorldState` |

## 2. IDs the client hard-codes (please use these in the case file)

- **Rooms:** `study`, `library`, `kitchen`, `dining`, `foyer`, `garden`. The client map is a hand-coded 3 x 2 grid of these. `state.npcs[].room` and `state.clues[].room` must use them.
- **NPCs:** `alistair` (victim, not in `state.npcs`), `evelyn`, `julian`, `harold`, `margaret`, `victor`. The client keeps portraits and sprite props per id in `client/src/data/npcs.ts`.
- **Clue `c_body`:** the victim's body must be an inspectable clue with this id (it is drawn as the body, and the first objective is "examine the body"). Other clue ids are free.
- If you change the layout or add rooms, tell us. The grid and door positions live in `client/src/data/mansion.ts`.

## 3. Behaviour the client assumes

- **Player movement is simulated locally** (with wall collision) for responsiveness. `move { dx, dy }` is sent about 8 times a second while moving (a normalised direction, not a position). The client does not need `state.player`. If the server must own player position, we will need to share the map and add a position to `state`.
- **Reconnect:** on every (re)connect the client sends `join { playerId }`. Please resume the in-progress case, or reply `NO_ACTIVE_CASE`.
- **Slow LLM:** the client waits 25 s for an `npc_say` before showing "does not answer". An `error { code: "LLM_BUSY" }` (or `SERVER_BUSY`) clears the thinking state sooner.
- **`npc_say` must carry `npcId`.** Replies are matched to the open interrogation by it.
- **`hint`:** the client shows `text`, `diamonds` and `hintsLeft` straight from the message. `diamonds_update` after a hint is fine but not required.
- **`hintsLeft` before the first hint:** the client does not know it until a hint is bought. Optional improvement: include `maxHints` (or `hintsLeft`) in `case_started` so the HUD can say "No hints on this difficulty" up front.
- **Diamonds:** the client never sends or computes a balance. It only displays `profile.diamonds`, `hint.diamonds`, `diamonds_update.balance` and `game_over.diamonds`.
- **`case_started` must not contain** `killerId`, the timeline or NPC secrets. The client never holds solution data before `game_over`.
- **`debug`** messages are rendered in the hidden overlay (` key). Any shape works but `{ npcId, perception, memory[], thought }` from `shared` is displayed as JSON.

## 4. Switching the client to the real server

Set `VITE_USE_MOCK=false` and `VITE_WS_URL=ws://<host>:<port>` in `client/.env.local`, then restart `npm run dev`. See `client/README.md`.
