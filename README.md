# Village of Liars

<aside>
🎬

Product vision update, 7 Nov 2026. Village of Liars is now a cinematic, Hollywood-style detective mystery: a film-noir game where the player is a detective investigating a murder by interrogating AI-powered characters. The original technical concept below (server owns the truth, validated structured agent output, persistent NPC memory, NPC-to-NPC information sharing) is unchanged. Start with [Game Vision and Design](Village%20of%20Liars/Game%20Vision%20and%20Design%20410425cdab30810da641c035c23cc0de.md), then [MVP vs Post-MVP Scope](Village%20of%20Liars/MVP%20vs%20Post-MVP%20Scope%20410425cdab308196a955ce2b0dd1b413.md). Open decisions are on [Conflicts and Open Questions](Village%20of%20Liars/Conflicts%20and%20Open%20Questions%20410425cdab3081beb2caf962f643551b.md).

</aside>

## Updated product structure

| Layer | What it is | Page |
| --- | --- | --- |
| Vision | Cinematic noir detective mystery in a mansion, premium and minimal, dark with muted gold | Game Vision and Design |
| Experience flow | Audio gate, cinematic intro, main menu, difficulty selection, case briefing, investigation, accusation, ending | Game Vision and Design, PRD section 0 |
| Content | One authored case, six distinct NPCs with looks, voices, secrets, relationships | Character Bible |
| Systems | Difficulty config, diamonds and hints, player profile, case loader | Backend Plan (impact section), PRD section 0 |
| Core technology (unchanged) | Authoritative server, multi-agent NPCs with memory and gossip, validated LLM actions | Problem Statement, Backend Plan, PRD sections 4 and 5 |
| Scope | MVP tiers P0, P1, P2, Post-MVP list, cut order, revised roadmap | MVP vs Post-MVP Scope |

## Original concept (first version)

The text below describes the first version of the idea. Where it says village or villagers, read mansion and suspects. See the Conflicts and Open Questions page, item 1.

---

A 2D murder-mystery game where every villager is an LLM agent with a private secret, a memory, and a daily routine. A murder happens. The villagers gossip, lie, and contradict each other. You walk around, interrogate them, catch the lies, and accuse the killer.

> Built in a 5-hour challenge by two CSE students. Free APIs only. Recorded as a YouTube devlog.
> 

## The one idea that makes this different

**The server holds the truth. Agents only receive perceptions.**

Agents can lie, but they cannot hallucinate the world. Every NPC action is a validated JSON object, and the server decides what actually happened. This makes the game reliable and gives us a real architecture to show off.

## Quick facts

| Item | Choice |
| --- | --- |
| Client | Phaser 3 + TypeScript + Vite |
| Server | Node.js + TypeScript + `ws` |
| LLMs | Groq free tier (fast chatter), Gemini Flash free tier (fallback / interrogations) |
| Validation | Zod |
| Storage | In-memory world state + SQLite (sessions, transcripts, leaderboard) |
| Team | 2 people: Frontend (Person A) and Backend (Person B) |

## Documentation index

Read in this order (all are subpages of this page). Items 8 to 11 were added on 7 Nov 2026 for the cinematic detective direction; read them right after this page:

1. Problem Statement: what we are solving and why
2. PRD: what the product does (features, requirements, user flow)
3. Frontend Plan: frontend tasks and tech
4. Backend Plan: backend tasks, tech, and the API contract
5. Work Division: who does what, coordination, helping each other
6. AI Usage: how we use LLMs and Copilot while building
7. Updates and Comms: running log of progress, decisions, and blockers
8. [Game Vision and Design](Village%20of%20Liars/Game%20Vision%20and%20Design%20410425cdab30810da641c035c23cc0de.md): look and feel, cinematic intro, menu, difficulty, diamonds, hints, wardrobe
9. [Character Bible](Village%20of%20Liars/Character%20Bible%20410425cdab308104ae8bfef900049c25.md): NPC visual identity, six draft characters, persona data shape
10. [MVP vs Post-MVP Scope](Village%20of%20Liars/MVP%20vs%20Post-MVP%20Scope%20410425cdab308196a955ce2b0dd1b413.md): what we build now, what we defer, cut order, revised roadmap
11. [Conflicts and Open Questions](Village%20of%20Liars/Conflicts%20and%20Open%20Questions%20410425cdab3081beb2caf962f643551b.md): where the new vision disagrees with earlier docs, and decisions needed

## Project structure

```jsx
village-of-liars/
├─ README.md
├─ docs/
│  ├─ PROBLEM_STATEMENT.md
│  ├─ PRD.md
│  ├─ FRONTEND_PLAN.md
│  ├─ BACKEND_PLAN.md
│  ├─ WORK_DIVISION.md
│  └─ AI_USAGE.md
├─ shared/
│  └─ types.ts            # THE contract. Both sides import from here.
├─ client/                # Phaser game (Person A)
│  ├─ src/
│  │  ├─ scenes/          # BootScene, IntroScene, MenuScene, MansionScene (was VillageScene), UIScene
│  │  ├─ entities/        # Player, Npc
│  │  ├─ ui/              # InterrogationPanel (was DialogueBox), Notebook, HintPanel, AccuseModal, DebugOverlay, Hud, menu and profile screens
│  │  ├─ net/             # ws client, message handlers
│  │  └─ mock/            # mock server that replays canned events
│  ├─ public/assets/      # Kenney.nl sprites and tiles, NPC portraits, audio, fonts
│  └─ index.html
├─ server/                # Authoritative simulation (Person B)
│  ├─ src/
│  │  ├─ world/           # World, rooms, clock, truth log
│  │  ├─ agents/          # Agent, prompts, memory, schemas
│  │  ├─ llm/             # LLMProvider, groq.ts, gemini.ts, queue.ts
│  │  ├─ game/            # case loader, clues, hints, difficulty config, accusation, win/lose
│  │  ├─ net/             # ws server, message routing
│  │  ├─ db/              # SQLite setup and queries (players, diamonds, case runs)
│  │  └─ index.ts
│  └─ data/               # personas.json, world.json
├─ .env.example
└─ package.json           # npm workspaces: client, server, shared
```

## Quick start

```bash
git clone <repo-url> && cd village-of-liars
cp .env.example .env          # add GROQ_API_KEY and GEMINI_API_KEY
npm install
npm run dev:server            # ws://localhost:8080
npm run dev:client            # http://localhost:5173
npm run dev:client:mock       # client only, no server or LLM needed
```

`.env.example`:

```
GROQ_API_KEY=
GEMINI_API_KEY=
PORT=8080
```

## Revised 5-hour roadmap (7 Nov 2026)

Full detail and the cut order are on the MVP vs Post-MVP Scope page. Summary:

| Time | Focus |
| --- | --- |
| 0:00 to 0:30 | Together: repo, keys, shared types including new messages, freeze the case file and six NPCs, design tokens, asset list. Record intro. |
| 0:30 to 2:00 | A: mansion scene on placeholder art, movement, interrogation UI shell. B: tick loop, case loader, first agent end to end, players and diamonds in SQLite. |
| 2:00 to 3:00 | A: main menu, difficulty, profile screens, real chat over WebSocket. B: all six agents, gossip, start_case, profile, hint endpoints. |
| 3:00 to 4:00 | A: notebook, hint panel, accusation, ending. B: clues, hints, accusation and reward, difficulty directives. |
| 4:00 to 4:40 | A: short intro, audio, rain and vignette, real portraits. B: queue, fallback, NPC behavior testing. |
| 4:40 to 5:00 | Together: freeze, record ending, README, push. |

**3:00 cut line:** if the full chat loop with real NPCs is not working at 3:00, stop all polish work and fix the loop.

## Original 5-hour timeline (superseded, kept for reference)

| Time | Milestone |
| --- | --- |
| 0:00 to 0:30 | Together: repo, keys, `shared/types.ts`, world spec. Record intro. |
| 0:30 to 2:00 | A: Phaser scene, movement, dialogue UI on mock feed. B: tick loop, one agent end to end. |
| 2:00 to 3:00 | Integrate over WebSocket. Player chats with an NPC. |
| 3:00 to 4:00 | All NPCs running, gossip, murder, clues, accuse, win/lose. |
| 4:00 to 4:40 | Rate-limit queue, debug overlay, voice, bug fixes. |
| 4:40 to 5:00 | Record ending, finish README, push. |

## Definition of done (resume-worthy)

- [ ]  Authoritative server with WebSocket state sync
- [ ]  6+ LLM agents with distinct personas, secrets, and memory
- [ ]  Agents act through validated structured JSON only
- [ ]  Agents share information with each other (gossip)
- [ ]  Full loop: murder, investigate, accuse, win/lose
- [ ]  LLM provider abstraction with fallback and rate-limit handling
- [ ]  A README with an architecture diagram and the truth-vs-perception explanation
- [ ]  Cinematic intro (short, skippable) and main menu
- [ ]  Difficulty selection that changes server-side behavior
- [ ]  Diamond balance and hints handled by the server
- [ ]  Six NPCs with distinct looks, voices, and secrets

## Architecture

```
Client (Phaser)  <--WebSocket-->  Server
                                   ├─ World (rooms, positions, clock, truth log)
                                   ├─ EventBus (perceptions: "Mira entered Kitchen")
                                   └─ Agents[6-8]: persona + secret + memory + goal
                                        on perception → build prompt
                                          → LLM → Zod{action, say?, target?}
                                          → server validates → applies → emits events
```

## Future work

Embedding-based memory, LLM-chosen killer, deterministic replay, eval harness for contradictions, spectator "God view", multiplayer, Redis streams + BullMQ workers for horizontal scaling.

[Problem Statement](Village%20of%20Liars/Problem%20Statement%20410425cdab308168bb1ed8d0893c7bf8.md)

[PRD](Village%20of%20Liars/PRD%20410425cdab3081cb9044f92fb8788b0c.md)

[Frontend Plan](Village%20of%20Liars/Frontend%20Plan%20410425cdab3081f5864fcb09df88f074.md)

[Backend Plan](Village%20of%20Liars/Backend%20Plan%20410425cdab3081d18593ca5b891ff04c.md)

[Work Division](Village%20of%20Liars/Work%20Division%20410425cdab3081048e26c01f04ed3913.md)

[AI Usage](Village%20of%20Liars/AI%20Usage%20410425cdab3081d69fb3cb5892525d8a.md)

[Updates and Comms](Village%20of%20Liars/Updates%20and%20Comms%20410425cdab3081fb9addf200e521e552.md)

[Game Vision and Design](Village%20of%20Liars/Game%20Vision%20and%20Design%20410425cdab30810da641c035c23cc0de.md)

[Character Bible](Village%20of%20Liars/Character%20Bible%20410425cdab308104ae8bfef900049c25.md)

[MVP vs Post-MVP Scope](Village%20of%20Liars/MVP%20vs%20Post-MVP%20Scope%20410425cdab308196a955ce2b0dd1b413.md)

[Conflicts and Open Questions](Village%20of%20Liars/Conflicts%20and%20Open%20Questions%20410425cdab3081beb2caf962f643551b.md)