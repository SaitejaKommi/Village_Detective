# MVP vs Post-MVP Scope

<aside>
⚠️

The new vision is bigger than a 5-hour build. This page separates what we build now from what we document and defer. Treat the cut order at the bottom as pre-agreed so we do not argue about it when we are tired and behind.

</aside>

## MVP: must build now

Priority: **P0** = the game does not work without it. **P1** = needed for the intended experience. **P2** = polish, cut first.

| # | Feature | Priority | Owner (lead) |
| --- | --- | --- | --- |
| 1 | One authored murder case loaded from a case file | P0 | B |
| 2 | Six distinct NPCs (persona, secret, relationships, voice style) | P0 | B (content shared) |
| 3 | NPC conversations with free-text input | P0 | A + B |
| 4 | Persistent NPC memory | P0 | B |
| 5 | NPC-to-NPC information sharing | P0 | B |
| 6 | Server-owned truth, validated structured LLM actions | P0 | B |
| 7 | 2D mansion scene with movement and approachable NPCs | P0 | A |
| 8 | Evidence collection (inspect clues in rooms) | P0 | A + B |
| 9 | Detective notebook (list of clues and statements) | P0 | A |
| 10 | Final accusation and case ending with reveal | P0 | A + B |
| 11 | Basic difficulty selection (3 options, server config) | P1 | A + B |
| 12 | Diamond counter (server-owned balance, start at 3) | P1 | B (API), A (UI) |
| 13 | Basic hint system (1 diamond per hint, template hints from truth) | P1 | B, A |
| 14 | Main menu (Start Investigation, Detective Profile, Settings) | P1 | A |
| 15 | Basic Detective Profile screen (diamonds, cases solved, default detective) | P1 | A |
| 16 | Cinematic opening (short version, skippable, 15 to 20 seconds) | P1 | A |
| 17 | Cinematic interrogation UI with portraits | P1 | A |
| 18 | Design language applied (palette, serif plus sans, vignette, rain overlay) | P1 | A |
| 19 | Core audio: menu music, rain loop, footsteps, UI click | P1 | A |
| 20 | Settings screen (volumes, mute, skip intro) | P2 | A |
| 21 | Reveal screen polish (staged timeline reveal) | P2 | A |
| 22 | Debug overlay (dev and video toggle) | P2 | A + B |
| 23 | LLM queue, fallback provider, scripted fallback lines | P1 | B |

## Post-MVP: future enhancements

- Multiple murder mystery levels and cases
- Advanced difficulty variations per case (separate alibis, secrets, and clue sets)
- Full detective wardrobe and customization
- Unlockable outfits and accessories
- Expanded diamond economy (more earning paths, upgrades)
- More NPCs and locations
- Advanced animations and cinematic sequences
- More sophisticated progression and rewards
- Real accounts and cloud-synced profiles
- NPC expressions in portraits, evidence "present to NPC" action
- Original items from the earlier plan: embedding memory, LLM-chosen killer, deterministic replay, eval harness, multiplayer, Redis plus BullMQ scaling

## Explicitly not in the MVP

- Wardrobe, outfit unlocks, accessories
- More than one case
- Per-difficulty alternate case content
- Spending diamonds on anything except hints
- Video cutscenes, motion-captured or frame-by-frame character animation
- Accounts and passwords
- Mobile layout

## Revised roadmap (5 hours)

| Time | Together or A (frontend) | B (backend) |
| --- | --- | --- |
| 0:00 to 0:30 | Together: repo, keys, `shared/types.ts` including new messages, freeze the case file (victim, killer, timeline, six NPCs), design tokens, asset shopping list. Record intro. |  |
| 0:30 to 2:00 | A: mansion scene on placeholder art, movement, interrogation UI shell with silhouette portraits, running on the mock server | B: tick loop, case loader (truth log plus seed memories), first agent end to end, SQLite players and diamonds |
| 2:00 to 3:00 | A: main menu, difficulty screen, profile screen (simple DOM), hook up real WebSocket for chat | B: all six agents, gossip, `start_case`, `profile`, `hint_request` endpoints |
| 3:00 to 4:00 | A: notebook, hint panel, accusation, ending screen | B: clues from truth log, hints, accusation and reward, difficulty directives |
| 4:00 to 4:40 | A: short intro, audio, rain and vignette overlays, swap in real portraits | B: queue, fallback, NPC behavior testing, debug messages |
| 4:40 to 5:00 | Together: feature freeze, record ending, README, push |  |

The earlier timeline on the main page is kept for reference and is superseded by this one.

## Checkpoint cut line: 3:00

At 3:00 the full chat loop must work end to end with real NPCs. If it does not, stop all P1 and P2 work and fix the loop. The game is the AI investigation. Visuals are a layer on top of it.

## Cut order if we fall behind

Cut from the top of this list first:

1. Reveal screen polish and extra ending effects
2. Settings screen beyond a single mute toggle
3. Debug overlay (keep a console log instead)
4. Intro shortened to a title card with sound and rain
5. Profile screen reduced to a diamonds counter in the menu
6. Audio reduced to menu music and rain only
7. Main menu reduced to a single Start button

Never cut: server-owned truth, validated actions, NPC memory, NPC-to-NPC sharing, evidence, accusation, diamond balance on the backend.

## MVP acceptance criteria

- A new player can go from first click to a case ending without an error
- The cinematic intro plays, can be skipped, and lands on the menu
- All three difficulties can be selected and visibly change NPC behavior or hint availability
- Six NPCs have distinct looks, voices, and secrets
- At least one NPC lie is exposed by another NPC's memory or a clue (the video highlight)
- A hint costs 1 diamond, is deducted by the server, and cannot be spent below zero
- Refreshing the page does not reset the diamond balance (same browser)
- Killing the primary LLM provider mid-game does not stop the game