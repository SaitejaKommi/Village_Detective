# Open requests for the backend

The client now speaks the backend's own flat protocol (`shared/types.ts`, merged from PR #5). The old envelope draft and `FRIEND_CONTRACT.md` are gone. Only the gaps that remain are listed here, most important first.

## 1. Blocker: `inspect` only works for clues in the foyer

`move()` changes `player.position` but never `player.roomId`, which is set to `rooms[0]` (the foyer) at case start. `inspect` then rejects every clue outside that room with `CLUE_NOT_FOUND`.

The client cannot fix this: the server's `position` values (small integers) do not map to any room layout, and the client draws its own map. Suggested fix: let `move` carry the room the player walked into (for example `roomId?: string`) and validate it is adjacent to the current `player.roomId` using `world.json`. The client will send it as soon as the field exists in `MoveMessage`.

Until then, in real mode the player can only inspect clues in the Grand Foyer.

## 2. Smaller gaps

| What | Why it matters |
| --- | --- |
| `game_over` has no `reward` (and the reward `diamonds_update` arrives after it). | The ending shows "Reward earned" and the live balance. Add `reward: number` if you want it to show "+2". The client never computes a delta. |
| `clock` starts at 0 and counts up 1 per tick. | The HUD reads 12:00 AM and advances a minute per second. Fine if intended. If you want a night-time start, start it at an offset (for example 22:50 is `1370`). `case.json` timeline `time` is an hour of the day, which the client formats as `11:00 PM`. |
| `state.clues[]` has `roomId`, `discovered`, `text`, but no title or position. | The client places clues itself (by order within the room) and builds the title from the id (`torn_ledger` becomes "Torn ledger"). Keep ids readable. Before inspection the prompt just says "Object". |
| `state.npcs[].position` values are small integers with no map meaning. | The client ignores them and uses `roomId` only, walking NPCs through the doors when the room changes. Rooms must stay connected as in `world.json`. |
| `INVALID_MESSAGE` is also used for unexpected exceptions in `handleMessage`. | The client ignores it for `move` (sent about 4 times a second) and shows a generic message otherwise. A separate `INTERNAL_ERROR` code would help debugging. |
| `talk` replies take as long as the LLM. | The client waits 25 s for `npc_say`. An `error` with a busy-style code would end the wait sooner. |

## 3. What the client assumes (already true on your server)

- One case per session. After "Return to menu" the client sends `join { playerId }` with no `sessionId` to get a fresh session, then `start_case`.
- After `session` the client sends `get_profile` (the server does not push `profile` on join).
- On a dropped socket mid-case it re-sends `join { playerId, sessionId }`. Your server resumes the same session and sends `state`.
- `move` is sent as integer `dx`/`dy` in -1..1, only while moving.
- The client never sends or computes a balance. It shows `profile.diamonds`, `hint.diamonds` and `diamonds_update.balance`.
- Room ids and adjacency come from `world.json` (`foyer`, `drawing_room`, `dining_room`, `study`, `library`, `kitchen`). The client map has a door for each `adjacent` edge, no more, no fewer. If you change `world.json`, tell the client side: the layout lives in `client/src/data/mansion.ts`.
- NPC ids `alistair` (victim, not in `state.npcs`), `evelyn`, `julian`, `harold`, `margaret`, `victor`. Portraits and sprite props are keyed by these ids.

## 4. Repo hygiene (your folder, so left untouched)

These paths are tracked in git even though `backend/.gitignore` lists them: `backend/node_modules` (about 1,300 files), `backend/dist`, `backend/.env`, `backend/data/village.db*`.

- The API keys in the committed `.env` are empty today. If real Groq or Gemini keys are pasted into it, git will offer to commit them. Rotate any key that ever lands in a commit.
- Fix: `git rm -r --cached backend/node_modules backend/dist backend/.env backend/data/village.db backend/data/village.db-shm backend/data/village.db-wal`, then commit.
- A root `.gitignore` would also help.
