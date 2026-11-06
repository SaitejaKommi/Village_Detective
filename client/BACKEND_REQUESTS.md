# Client and backend: contract notes

The client speaks the backend's flat protocol from `shared/types.ts`. Both sides were checked together with `client/scripts/e2e-real.mjs` (real UI, real backend, no mock) and `backend/scripts/smoke-test.mjs`.

## Fixed together

| Was | Now |
| --- | --- |
| `move()` never changed `player.roomId`, so `inspect` only worked in the foyer. | `MoveMessage` has an optional `roomId`. The client sends the room it walked into, and the server accepts the same or an adjacent room (from `world.json`), otherwise `INVALID_MOVE`. |
| `game_over` had no reward. | `GameOverMessage.reward` (0 on a loss). The new balance still arrives in `diamonds_update`. |
| `backend/node_modules` (about 1,300 files, with a non-Windows `better_sqlite3.node`), `backend/dist`, `backend/.env` and `backend/data/village.db*` were tracked in git. | Untracked with `git rm --cached` (files stay on disk, `backend/.gitignore` already lists them). Use `npm install` to get dependencies. |
| `better-sqlite3@11` has no prebuilt binary for Node 24 and failed to build on Windows. | Bumped to `^12` (works on Node 22 to 24). |

## Still open (small)

- `clock` starts at 0, so the HUD reads 12:00 AM and advances a minute per second. Start it at an offset if you want a night-time start (for example `1370` is 10:50 PM). The case file's timeline `time` is an hour of the day.
- `INVALID_MESSAGE` is also used for unexpected exceptions. A separate code would help debugging. The client ignores it for `move` and shows a generic message otherwise.
- `talk` replies take as long as the LLM. The client waits 25 s for `npc_say`. A busy-style error code would end the wait sooner.
- If real Groq or Gemini keys are ever put in `backend/.env`, keep that file out of git (it is now untracked). Rotate any key that was ever committed.

## What the client assumes

- One case per session. After "Return to menu" the client sends `join { playerId }` with no `sessionId`, then `start_case`.
- After `session` the client sends `get_profile` (the server does not push `profile` on join).
- On a dropped socket mid-case the client re-sends `join { playerId, sessionId }`.
- `move` is sent as integer `dx`/`dy` in -1..1 with the current `roomId`, about 4 times a second while walking, and once on every room change.
- The client never sends or computes a balance. It shows `profile.diamonds`, `hint.diamonds`, `diamonds_update.balance` and `game_over.reward`.
- Room ids and adjacency come from `world.json` (`foyer`, `drawing_room`, `dining_room`, `study`, `library`, `kitchen`). The client map has a door for each `adjacent` edge. If `world.json` changes, update `client/src/data/mansion.ts`.
- NPC ids `alistair` (victim, not in `state.npcs`), `evelyn`, `julian`, `harold`, `margaret`, `victor`. Portraits and sprite props are keyed by these ids.
- `state.clues[]` has no positions or titles, so the client places clues by order within each room and makes the title from the id (`torn_ledger` becomes "Torn ledger"). Keep ids readable. NPC `position` values are ignored (only `roomId` is used).
