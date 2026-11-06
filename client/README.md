# Village of Liars: client

The browser client for the noir mansion mystery (working title "Village of Liars"). Vite + TypeScript (strict) + **Phaser 3** for the world, and plain DOM/CSS for every menu, panel and modal.

It runs **with no backend and no downloaded assets**: a mock server lives in the browser, art is generated in code, and audio is synthesised with Web Audio.

## Run it

```powershell
cd client
npm install
npm run dev
```

Open <http://localhost:5173>. Vite also prints a **Network** URL (for example `http://192.168.x.x:5173`). Open that on a phone on the same Wi-Fi. If Windows Firewall asks, allow Node.js on private networks.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5173, reachable from the LAN |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run typecheck` | `tsc --noEmit` (strict) |

Needs Node 18 or newer.

## Play

1. Click to begin (this unlocks audio), watch or skip the intro (any key, click or tap).
2. Start Investigation, pick a difficulty, read the briefing, Begin.
3. Walk with **WASD / arrow keys**, or the on-screen **joystick** on touch devices. Press **E** (or tap the prompt or the sprite) to talk to a suspect or inspect a glinting object.
4. Question the five suspects in free text (300 characters). Collect evidence. Use the **Notebook** to compare statements and clues.
5. Optionally spend 1 diamond on a **Hint**. Questioning and evidence are always free.
6. **Accuse** one suspect (final), then read the reveal and return to the menu.

Escape closes any panel. The backtick key (`` ` ``) toggles the hidden debug overlay (or add `?debug=1`).

## Config

Copy `.env.example` to `.env.local` to override:

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_USE_MOCK` | `true` | `true` runs the in-browser mock server. `false` connects to the real WebSocket server |
| `VITE_WS_URL` | `ws://localhost:8080` | Real server URL (only used when mock is off) |

### Switching to the real server

```
# client/.env.local
VITE_USE_MOCK=false
VITE_WS_URL=ws://localhost:8080
```

Restart `npm run dev`. The game code is identical in both modes. Both implement the `Transport` interface (`src/net/transport.ts`). The real one (`src/net/wsTransport.ts`) reconnects with backoff and re-sends `join` on reconnect. The message contract is drafted in `src/net/protocol.ts` and `BACKEND_REQUESTS.md` lists what still needs agreeing in `shared/types.ts`.

## Dev URL shortcuts (dev server only, stripped from production builds)

Jump straight to a screen. The mock starts a case automatically where needed.

| URL | Shows |
| --- | --- |
| `/?screen=menu` | Main menu (also `intro`, `difficulty`, `profile`, `settings`, `briefing`) |
| `/?screen=game` | Mansion with HUD |
| `/?screen=interrogation&npc=julian` | Interrogation (npc: `evelyn`, `julian`, `harold`, `margaret`, `victor`) |
| `/?screen=evidence` | Evidence modal (`&clue=c_body`) |
| `/?screen=notebook&tab=statements` | Notebook (tab: `clues`, `statements`, `suspects`) |
| `/?screen=hint` / `/?screen=accuse` | Hint panel / accusation |
| `/?screen=ending&result=won` | Reveal (`won` or `lost`) |
| `/?screen=offline` | Reconnecting banner |
| add `&d=easy\|medium\|hard` | Difficulty for the case |
| add `&dia=0` | Set the **mock** balance (test the empty-diamonds state) |

## Testing

With the dev server running:

```powershell
node scripts/e2e.mjs                                   # full loop on the mock, prints PASS/FAIL
node scripts/shot.mjs "?screen=game" 390x844 out.png wait:2500   # screenshot at any size (TOUCH=1 for touch emulation)
```

Both use `playwright-core` with your installed Chrome. Nothing is downloaded. Sizes checked: 360x640, 390x844, 844x390, 768x1024, 1280x720, 1920x1080.

## Architecture

```
src/
  main.ts            boot
  game/              flow controller (screen order), Phaser bootstrap, shared input state
  scenes/            MansionScene (the world), generated textures
  entities/          NpcSprite, ClueMarker
  ui/                DOM screens, HUD, panels, atmosphere (rain, fog, lightning), portraits, debug
  net/               protocol (DRAFT types), Transport interface, WebSocket client, typed client
  mock/              in-browser mock server (lazy loaded, never part of the real-server path)
  state/             view-state store (displays server data, never decides it) and event bus
  audio/             AudioManager (synth fallbacks, optional files)
  data/              NPCs, mansion grid, difficulty copy, asset manifest
  styles/            tokens.css (design tokens), base.css, intro.css
  dev/               URL shortcuts (dev only)
```

Rules the client follows:

- **The client never owns game truth.** The diamond balance is only ever assigned from a server message (`profile`, `hint`, `diamonds_update`, `game_over`). The mock keeps its own pretend-server balance in localStorage *inside the mock module only*.
- No solution data (killer, timeline, secrets) exists in the client before `game_over`. The mock picks a random killer privately at `start_case`.
- No LLM calls and no API keys in the client.
- No AI or chatbot wording in the UI: the player questions a suspect.

## Assets to drop in

Everything works without these. Add real files and they are picked up automatically (no code changes). Missing or undecodable files fall back silently.

**Portraits**: `public/assets/portraits/<npcId>.webp`. Use the same dimensions for all (for example 768x1024), bust or half-body, 3/4 angle, dark background, subtle gold rim light. Ids: `alistair`, `evelyn`, `julian`, `harold`, `margaret`, `victor`. (`detective` is not overridden yet.)

**Audio**: `public/assets/audio/<name>.mp3`:

| File | Used for |
| --- | --- |
| `rain.mp3` | Rain loop (replaces the synthesised rain) |
| `music-menu.mp3` | Menu and intro music loop |
| `music-investigation.mp3` | In-game music loop |
| `thunder.mp3`, `click.mp3`, `footstep.mp3`, `paper.mp3`, `chime.mp3`, `sting.mp3` | One-shot effects |

Keep licences and attributions in a file next to the audio if any asset requires them. Do not commit copyrighted material.

## Known limits

- Player movement is simulated on the client (with wall collision). The server only receives movement input. See `BACKEND_REQUESTS.md`.
- The mock has canned replies (keyword-matched), seven clues and one authored case with a random killer each run. It is for UI development, not for judging game design.
- Silhouette portraits are the permanent fallback. Real art needs sourcing (see above).
- Not verified on a real iOS device. Layouts use `dvh`, safe-area insets and 16px inputs to avoid the usual iOS issues.
- Notebook is list view only (the drag-and-drop evidence board is post-MVP). Wardrobe slots are locked placeholders.
- The Phaser bundle makes the main chunk about 1.2 MB (340 KB gzip).
