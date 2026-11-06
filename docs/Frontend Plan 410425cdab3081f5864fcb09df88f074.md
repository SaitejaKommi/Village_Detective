# Frontend Plan

<aside>
🎬

Cinematic direction update, 7 Nov 2026. Documentation only for now. No frontend implementation has started. Design details: [Game Vision and Design](Game%20Vision%20and%20Design%20410425cdab30810da641c035c23cc0de.md). Characters: [Character Bible](Character%20Bible%20410425cdab308104ae8bfef900049c25.md). Scope and cut order: [MVP vs Post-MVP Scope](MVP%20vs%20Post-MVP%20Scope%20410425cdab308196a955ce2b0dd1b413.md).

</aside>

## Cinematic direction update (7 Nov 2026)

### Implementation approach

- All menus, the interrogation panel, notebook, hint panel, and modals are DOM and CSS overlays, not Phaser UI. This matches the earlier rule and is the fastest route to a polished cinematic look.
- Phaser renders only the mansion world, NPC sprites, and world effects.
- Design tokens (colors, fonts, spacing) live in one CSS file as variables. Proposed values are on the Game Vision page.
- Atmosphere layers: rain (Phaser particles or canvas), vignette and dark overlay (CSS), optional lightning flash (respect reduced motion).
- Audio uses the Phaser sound manager, started only after the "Click to begin" gate.
- The scene formerly called VillageScene is now MansionScene.

### Screen breakdown

| # | Screen | Purpose and key elements | Priority | Server messages |
| --- | --- | --- | --- | --- |
| 0 | Audio gate | "Click to begin" on black. Unlocks audio | P1 | None |
| 1 | Cinematic intro | Rain, thunder, detective silhouette, title reveal, skip hint | P1 | None |
| 2 | Main menu | Start Investigation, Detective Profile, Settings. Dark atmospheric background | P1 | None |
| 3 | Difficulty selection | Three cards: Rookie, Professional, Master, with one-line descriptions | P1 | `start_case` |
| 4 | Detective Profile | Diamonds, cases solved, default detective, locked wardrobe slots | P1 | `get_profile`, `profile` |
| 5 | Settings | Music and effects volume, mute, skip intro | P2 | None (local) |
| 6 | Case briefing | Victim, scene, suspects at a glance, Begin button | P1 | `case_started` |
| 7 | Mansion gameplay | Scene, movement, HUD (clock, objective, diamonds, hint and notebook buttons), "Press E" prompts | P0 | `state`, `move` |
| 8 | Interrogation | Portrait, name plate, transcript, free-text input, thinking indicator | P0 | `talk`, `npc_say` |
| 9 | Evidence inspection | Modal with clue text and image or icon | P0 | `inspect` |
| 10 | Notebook / evidence board | Clues list, statements list, suspect cards. List view first. Drag-and-drop board is post-MVP | P0 | Client state, optional server sync |
| 11 | Hint panel | Cost confirmation (1 diamond), hint result, remaining balance | P1 | `hint_request`, `hint`, `diamonds_update` |
| 12 | Accusation | Suspect picker, confirm with a warning that it is final | P0 | `accuse` |
| 13 | Case ending / reveal | Win or lose, true timeline, secrets, diamonds earned, back to menu | P0 (P2 for polish) | `game_over`, `diamonds_update` |
| 14 | Debug overlay | Hidden toggle showing NPC perception, memory, thought | P2 | `debug` |
| 15 | Error and disconnect states | Reconnecting, server busy, LLM slow | P1 | `error` |

### Added tasks by phase (additive to the original task list below)

**Phase 0 (together, 0:00 to 0:30)**

- [ ]  Design tokens file and font loading
- [ ]  Asset shopping list: portraits, audio, tiles, sprites
- [ ]  Silhouette placeholder portraits (one per NPC) so the UI is never blocked
- [ ]  "Click to begin" audio gate

**Phase 1 (0:30 to 2:00)**

- [ ]  Rename VillageScene to MansionScene, build the mansion layout from the case file's rooms
- [ ]  InterrogationPanel (replaces the simple DialogueBox): portrait, transcript, input, thinking indicator, running on the mock server
- [ ]  Mock server messages for `case_started`, `profile`, `hint`

**Phase 2 (2:00 to 3:00)**

- [ ]  Main menu, difficulty selection, and profile screens (DOM)
- [ ]  `start_case` and `get_profile` wired to the server
- [ ]  Diamond display in the HUD from `profile` and `diamonds_update`

**Phase 3 (3:00 to 4:00)**

- [ ]  Notebook (list view), evidence modal, accusation, ending screen
- [ ]  Hint panel with cost confirmation and server result

**Phase 4 (4:00 to 4:40)**

- [ ]  Short cinematic intro
- [ ]  Rain, vignette, music, ambience, footsteps, UI sounds
- [ ]  Swap placeholder portraits for real ones with a shared color grade
- [ ]  Settings screen (P2) and reveal polish (P2)

### Asset sourcing

| Asset | Options | Notes |
| --- | --- | --- |
| Portraits | AI-generated with one shared style prompt, or free art with a shared CSS color grade, or silhouettes with props | Check tool terms. Build the silhouette fallback first |
| World tiles and sprites | [Kenney.nl](http://Kenney.nl) | Recolor with a shared dark palette. Simple sprites are fine since identity lives in portraits |
| Audio | Pixabay, Freesound (CC0), Kenney audio | Keep an attribution file |
| Fonts | Google Fonts: serif for headings, Inter for body | Open licenses |

### Added frontend rules

- The client never stores or modifies the diamond balance as truth. It displays what the server sends.
- The hint button shows the cost and current balance. At 0 diamonds it is disabled with a clear message, and the rest of the game stays fully playable.
- Never display solution data before `game_over`.
- Respect `prefers-reduced-motion`. No effect flashes more than three times per second.
- No AI or chatbot wording in the UI. The player is questioning a suspect.

---

## Original frontend plan

Everything below is the original plan, kept for the baseline task list and technical rules.

**Owner:** Person A

## Responsibility

Everything the player sees and touches: the Phaser game, the UI, client-side input and state, and the WebSocket client. The frontend contains no game truth. It renders what the server sends.

## Tech stack

- Phaser 3 (game rendering, input, scenes)
- TypeScript + Vite
- Native WebSocket API
- [Kenney.nl](http://Kenney.nl) free sprite and tile packs
- Browser `speechSynthesis` (optional voices)
- Plain DOM/CSS for chat panel and modals (faster than building UI inside Phaser)

## Rules

- Import all message and state types from `shared/types.ts`. Never redefine them.
- Never call an LLM directly from the client. API keys live on the server.
- Develop against the mock server first (`npm run dev:client:mock`), so you are never blocked by the backend.

## Task list (original)

Still valid. The screens, priorities, and extra tasks added by the 7 Nov vision update are in "Cinematic direction update" at the top of this page. Where they overlap, the top section wins.

### Phase 0: Setup (0:00 to 0:30, together)

- [ ]  Scaffold `client/` with Vite + Phaser + TypeScript
- [ ]  Agree on `shared/types.ts` with Person B
- [ ]  Download Kenney assets into `client/public/assets/`

### Phase 1: Game shell (0:30 to 2:00)

- [ ]  `BootScene`: load assets
- [ ]  `VillageScene`: hand-coded grid map with 6 rooms (arrays of tile indices)
- [ ]  `Player` entity: WASD / arrow movement with collision against walls
- [ ]  `Npc` entity: sprite plus name label, position driven by server state
- [ ]  Camera follows the player
- [ ]  `mock/` server: replays canned `state` and `npc_say` messages on a timer
- [ ]  `Hud`: game clock and current objective text

### Phase 2: Chat and networking (2:00 to 3:00)

- [ ]  `net/`: WebSocket client with reconnect and typed message handlers
- [ ]  Proximity prompt: "Press E to talk" near an NPC
- [ ]  `DialogueBox` (DOM): message history, text input, send button, typing indicator
- [ ]  Send `talk` messages and render `npc_say` replies
- [ ]  Interpolate NPC positions between server updates

### Phase 3: Gameplay UI (3:00 to 4:00)

- [ ]  Clue inspection: press E on a clue object, then send `inspect`, show the result
- [ ]  Notebook panel: collected clues and notable statements
- [ ]  `AccuseModal`: pick an NPC, confirm, send `accuse`
- [ ]  Murder moment: bell sound, screen flash, victim sprite changes
- [ ]  Reveal screen: win/lose, true timeline, each NPC's secret

### Phase 4: Polish (4:00 to 4:40)

- [ ]  `DebugOverlay`: toggle with a key; shows each NPC's last perception, memory top-k, and `thought`
- [ ]  NPC voices via `speechSynthesis` (different pitch/rate per NPC)
- [ ]  Loading and error states (disconnected, LLM slow)
- [ ]  Title screen with controls hint
- [ ]  Camera and UI tweaks that look good on video

## UX notes

- Show who is speaking and a typing indicator while waiting for the LLM.
- Disable the send button while a reply is pending.
- Limit input to 300 characters (matches server limit).
- Make the clock and objective always visible.
- Keep the debug overlay out of the default view; turn it on for video moments.

## Stretch goals

- Day/night tint tied to the game clock
- Speech bubbles above NPCs during gossip
- "God view" spectator mode showing all NPC thoughts
- Sound effects and ambient music (free assets). ⚠ Moved into the MVP as P1, see the Cinematic direction update above.
- Minimap

## Done when

- Player can walk, talk to any NPC, inspect clues, accuse, and see the reveal.
- The client runs fully against the real server and also against the mock.
- No hardcoded server URLs (use `import.meta.env`).