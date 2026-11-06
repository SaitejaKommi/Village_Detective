# Problem Statement

## The problem

LLM-powered NPCs in games are usually shallow. Most demos are a single chatbot with a character prompt:

- It forgets earlier events.
- It does not know what other NPCs know.
- It happily invents facts that contradict the game world.
- It cannot be trusted to drive real game logic, because its output is free text.

Because of this, "AI NPCs" feel like gimmicks instead of real gameplay.

## What we are solving

We want to show that LLM agents can be a **reliable core game mechanic**, not just dialogue decoration. Specifically:

1. NPCs have **private knowledge** (secrets, alibis) and **persistent memory**.
2. NPCs **talk to each other**, so information spreads and lies can be exposed.
3. The game world stays **consistent**: the server owns the truth, and agents only get perceptions of it.
4. Agent output is **structured and validated**, so game logic never breaks on bad model output.

The game that proves this is a murder mystery. It is a natural fit: the fun comes from who knows what, who lies, and whose story does not match.

## Why it matters

- **For players:** a mystery that is different every run, where you question characters in free text instead of picking dialogue options.
- **For developers:** a concrete, small-scale pattern for building multi-agent systems with an authoritative server, structured actions, and graceful handling of rate limits. The same pattern applies to simulations, training tools, and agent-based apps.
- **For us:** a portfolio project that demonstrates systems design, networking, applied AI, and game development in one repo, plus strong content for a YouTube devlog.

## Who it helps

| Group | Benefit |
| --- | --- |
| Players | A replayable, text-driven detective game |
| Developers who read the repo | A reference design for reliable LLM agents in a game loop |
| The two of us | Resume value, game dev experience, video content |
| Recruiters / viewers | A clear, demoable project with a good story |

## Goals

- Ship a playable vertical slice in about 5 hours.
- Use only free tools and free API tiers.
- Make the architecture clean enough to extend after the challenge.
- Record the whole process as a watchable devlog.

## Assumptions

- Neither of us has game dev experience, so we use a web game framework (Phaser) instead of a full engine.
- Free LLM tiers (Groq, Gemini) are enough for 6 to 8 NPCs if we are careful with call volume. Limits change, so we check current limits before starting.
- Single-player first. One player per game session.
- Desktop browser only.
- Graphics are simple 2D tiles and sprites from free asset packs. Concept and tech matter more than visuals.
- Auth is lightweight: a guest session ID. No passwords or OAuth.

## Constraints

- **Time:** about 5 hours total, including recording.
- **Team:** 2 people (1 frontend, 1 backend).
- **Cost:** zero. No paid APIs or hosting.
- **LLM limits:** requests per minute and per day are capped, so NPC calls must be event-driven and queued.
- **Reliability:** the game must never crash or soft-lock because an LLM returned bad output.

## Non-goals (for the 5-hour version)

- Multiplayer
- Polished art or animation
- Mobile support
- User accounts with passwords
- Production deployment and scaling