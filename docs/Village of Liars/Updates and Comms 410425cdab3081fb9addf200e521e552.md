# Updates and Comms

Running log for the team. Add newest entries at the top of each section. Keep entries short.

## Current status

| Area | Owner | Status | Notes |
| --- | --- | --- | --- |
| Repo and shared types | Both | Not started |  |
| Frontend (Phaser client) | Person A | Not started |  |
| Backend (agents, server) | Person B | Not started |  |
| Integration | Both | Not started |  |
| Video recording | Both | Not started |  |

## Milestone checklist

- [ ]  0:30 Repo scaffolded, `shared/types.ts` merged
- [ ]  2:00 Client runs on mock, server runs one agent
- [ ]  3:00 First real client-to-server chat working
- [ ]  4:00 Full game loop working on `main`
- [ ]  4:40 Feature freeze
- [ ]  5:00 README done, repo pushed, ending recorded

## Progress updates

Format: `time | who | what was done | what is next`

- (add entries here)

## Decisions

Format: `date | decision | why`

- Server owns the truth; agents only receive perceptions.
- Guest session UUID instead of full auth for the 5-hour version.
- 7 Nov | Product direction changed to a cinematic noir detective mystery set in a mansion | Stronger identity and video appeal. Technical principles unchanged. See Game Vision and Design.
- 7 Nov | Scope split into MVP (P0, P1, P2) and Post-MVP, with a pre-agreed cut order and a 3:00 cut line | The vision is larger than 5 hours.
- 7 Nov | Diamonds are server-owned. Hints cost 1 diamond, start balance 3, evidence and NPC chat always free | Prevents client-side cheating and keeps essential play free.
- Pending confirmation: title, victim, killer, difficulty depth, economy numbers, portrait source, session length. See Conflicts and Open Questions.

## Blockers and questions

Format: `time | who | blocker | who can help`

- (none yet)

## Pending contract changes (7 Nov vision update)

To be added to the shared types and agreed by both people before the freeze: start_case, hint_request, get_profile (client to server) and case_started, hint, profile, diamonds_update (server to client). Payloads are proposed on the Backend Plan page.

## Contract changes

Any change to `shared/types.ts` after the freeze goes here, with the other person's OK.

- (none yet)

## Video highlights

Timestamps for moments worth using in the video.

- (add entries here)

## Useful links

- GitHub repo: (add link)
- Chat group: (add link)
- Groq console / docs: (add link)
- Gemini API docs: (add link)