# Conflicts and Open Questions

<aside>
📌

This page lists where the new vision disagrees with earlier documents. Original pages were not silently rewritten. Where an earlier statement is affected, it is marked with a warning on its page and listed here with a recommended resolution. Status: **Open** means we need a decision.

</aside>

## Conflicts with earlier documentation

| # | Area | Earlier docs say | New vision says | Recommended resolution | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Setting and name | "Village of Liars", a village, villagers, VillageScene | A mansion and a detective noir thriller | Keep "Village of Liars" as the repo codename. Pick a final title later. Rename the scene to MansionScene in code. Docs use "mansion" for the game world | Open |
| 2 | Visual ambition | PRD and Problem Statement: simple 2D, concept over visuals, Kenney free assets | Premium cinematic noir look | Portrait-first identity, plus overlays (rain, vignette, lighting), palette and type. Keep world sprites simple. Kenney remains fine for tiles and base sprites | Open |
| 3 | Non-goals | Problem Statement lists "polished art or animation" as a non-goal | Polished feel is now a core goal | Narrow the non-goal to "no custom animation or frame-by-frame art". Problem Statement is left unchanged until you confirm | Open |
| 4 | NPC count and the victim | 6 to 8 NPCs, victim chosen by the engine | Six distinct NPCs including the businessman | Make the businessman the victim. He appears in the prologue and briefing, leaving five interrogable suspects. Or add a seventh character as the victim | Open |
| 5 | When the murder happens | FR-11 and FR-14: the engine creates the murder live during the simulation and witnesses perceive it | The player is a detective investigating a murder | The detective arrives after the crime. The case loader writes the murder, the true timeline, and each NPC's seed memories at case start. The live simulation (movement, gossip, lies) runs after the briefing. This is cheaper, more reliable, and keeps truth on the server | Open |
| 6 | Randomness | FR-11: seeded random killer and victim | One authored playable case | Fixed case file for the MVP. Use the seed only for small variation such as NPC start positions. Replayable random cases are post-MVP | Open |
| 7 | Identity and persistence | FR-23: guest session ID per game | A diamond balance that persists across games | Two IDs: a persistent `playerId` for the profile and balance, and a per-run `sessionId`. Browser-stored, so it can be reset by clearing site data. Accepted for the MVP | Open |
| 8 | Hint source | Not specified. Principle: LLM output never changes game logic without validation | Hints cost diamonds and must be fair | Template hints built by the server from the truth log. Zero extra LLM calls, no risk of leaking the killer | Open |
| 9 | Audio | Voices and sound were optional stretch goals | Audio is part of the core atmosphere | Move music, rain, footsteps, and click sounds into the MVP (P1). Add a "Click to begin" gate so browsers allow audio | Open |
| 10 | Browser speech voices | Optional `speechSynthesis` NPC voices | Cinematic noir tone | Robotic browser voices will probably break the mood. Move to post-MVP, or use only if they sound acceptable in a test | Open |
| 11 | Timeline and checkpoints | 5-hour plan with one frontend load | Frontend now also owns intro, menu, profile, difficulty, cinematic UI, audio | Revised roadmap and a 3:00 cut line on the Scope page. Original timeline kept as superseded | Open |
| 12 | Debug overlay | Core feature and the video's best tool | Conflicts with immersion if always visible | Keep it as a hidden toggle, off by default. Priority drops to P2 | Open |
| 13 | Difficulty depth | N/A | Difficulty must change mechanics, but the MVP says basic selection or configuration | MVP ships three selectable levels on one case, changing four to six server config knobs (prompt directives, red herrings, clue visibility, hint cap, reward). Per-difficulty case content is post-MVP. Please confirm this reading | Open |

## Questions for you

1. **Title:** keep "Village of Liars" or choose a noir title now?
2. **Victim:** is the businessman the victim (five suspects), or do we add a seventh character?
3. **Killer and timeline:** who did it, and what is the true timeline? This needs to be fixed in the first 30 minutes and kept secret from anyone playing the case.
4. **Difficulty:** is the reading in item 13 correct?
5. **Economy numbers:** are these OK? Hint caps: Easy 4, Medium 3, Hard 1. Rewards: Easy +1, Medium +2, Hard +3.
6. **Portraits:** are AI-generated portraits acceptable, or must we use only existing free art?
7. **Extra time:** is 5 hours a hard limit, or can polish continue in a second session (for video part 2)?

## Technical and scope concerns

- **Frontend load is the main risk.** Intro, menu, difficulty, profile, interrogation UI, notebook, hint panel, accusation, ending, overlays, and audio is a lot for one person in about five hours. The backend also has a heavy P0 load. The cut order on the Scope page is the safety net.
- **LLM rate limits.** Six NPCs plus player interrogation plus ambient gossip on free tiers is tight. Difficulty directives must be prompt text only, not extra calls. Hints are templated, not LLM-generated. Check current Groq and Gemini limits before starting.
- **Perceived latency.** A cinematic UI makes slow replies more noticeable. Use a thinking animation on the portrait, short prompts, and the fast model for interrogation.
- **Art consistency.** Mixed free assets look cheap quickly. A shared color grade and one portrait style matter more than detail.
- **Audio licensing and autoplay.** Check each license, keep an attribution file, and gate audio behind a click.
- **Diamond integrity.** Deduct and grant with atomic SQL updates, make rewards idempotent per case run, and never trust a client-sent balance. Browser-stored IDs can be cleared, which is a known limit.
- **Case quality.** A fair, solvable case (clues that actually point to the killer, with at least one catchable lie) takes real design time. Budget 20 to 30 minutes in the first block and write it down before coding agents.
- **Spoilers in prompts.** Only the killer's agent should have the cover-story instruction. Other NPCs must not receive the solution, or they may leak it.