# Game Vision and Design

<aside>
📌

Direction update, 7 Nov 2026. This page is the source of truth for look, feel, and game design. The technical principles in Problem Statement, PRD sections 4 and 5, and Backend Plan are unchanged. Scope tiers live on the MVP vs Post-MVP Scope page. Conflicts with earlier docs are listed on Conflicts and Open Questions.

</aside>

## Vision

A **cinematic, Hollywood-style detective mystery game**. The player is a detective who investigates a murder by interrogating AI-powered suspects. It should feel like playing a noir thriller, not like using a chatbot inside a 2D game.

Inspiration: James Bond-style elegance, Hollywood crime and mystery thrillers, film noir, premium cinematic game interfaces. Think dark rooms, dramatic lighting, rain, shadows, elegant typography, atmospheric music, and sophisticated character design.

## Design pillars

1. **Cinematic first impression.** The first 20 seconds must feel like a film opening, not a web page.
2. **Detective, not chatbot.** Interrogation is a scene: portrait, tone, tension, dialogue history, evidence to confront them with.
3. **The server owns the truth.** NPCs have private knowledge, persistent memory, talk to each other, and can lie. LLM output is structured and validated. No visual effect is allowed to weaken this.
4. **Premium restraint.** Minimal, dark UI. Gold is used sparingly. No generic dashboards, no colorful mobile-game look.

## Design language

Values below are proposed starting tokens. Person A can adjust after seeing them on screen.

| Token | Proposed value | Use |
| --- | --- | --- |
| Background | `#0B0B0C` to `#141414` | Screens, overlays |
| Surface | `#1C1C1E` / `#262628` | Panels, dialogue box, notebook |
| Accent (vintage gold) | `#B8985A` | Titles, borders, active states, diamonds |
| Text primary | `#E8E2D0` (warm ivory) | Body text |
| Text muted | `#8A8A8A` | Secondary text |
| Danger | `#7A1F1F` | Accusation, warnings |

| Area | Direction |
| --- | --- |
| Headings | Elegant cinematic serif (Cormorant Garamond, Playfair Display, or Cinzel; all free on Google Fonts) |
| Body and UI | Readable modern sans-serif (Inter) |
| Lighting | Dramatic but subtle: vignette, dark overlay, soft light pools, gold rim light on portraits |
| Weather | Rain particles over the scene, occasional lightning flash |
| Motion | Smooth fades and slow pushes. No bouncy or playful animation |
| Audio | Mystery soundtrack, rain, footsteps, ambient mansion sounds, interaction effects |

## Game concept

The player is a detective summoned to a rain-soaked mansion after its owner is found dead. Six people were in the house. Each has something to hide, and not every secret is about the murder.

Working setting: a wealthy family's mansion, one night, one body. The working case title is "The Blackwood Manor Murder" (placeholder, see Conflicts page for naming).

### Core loop

1. Arrive and read the case briefing.
2. Explore the mansion and approach characters.
3. Interrogate with free-text questions.
4. Collect evidence in rooms.
5. Cross-check statements and clues in the notebook and catch contradictions.
6. Optionally spend a diamond for a hint.
7. Accuse a suspect.
8. See the reveal, the true timeline, and the reward.

### Updated gameplay flow

1. Audio gate: "Click to begin" (browsers block audio before a click).
2. Cinematic intro (skippable).
3. Main menu: Start Investigation, Detective Profile, Settings.
4. Start Investigation leads to difficulty selection (Rookie, Professional, Master).
5. Case briefing: victim, scene, suspects at a glance.
6. Investigation in the mansion: movement, interrogation, evidence, notebook, hints.
7. Accusation.
8. Case ending: reveal, truth timeline, diamonds earned, back to menu.

## Cinematic intro and main menu

### Intro beat sheet (MVP target: 15 to 20 seconds, skippable with any key)

1. Black screen. Rain starts. Low mystery music fades in.
2. Thunder and a lightning flash reveal a mansion silhouette through rain.
3. A stylish detective silhouette under a street lamp: trench coat, fedora, a match or lighter flare.
4. Title reveal with a slow gold serif fade-in and a subtle light sweep.
5. Smooth cross-fade into the main menu with rain still playing.

The intro can be built from layered images, CSS or canvas effects, and audio. It does not need video.

### Main menu

Minimal, centered or left-aligned stack over a dark atmospheric background (rain, slow-moving fog or light). Three entries:

1. **Start Investigation**: goes to difficulty selection.
2. **Detective Profile**: diamonds, cases solved, current detective look.
3. **Settings**: music volume, effects volume, mute, skip intro.

Hover states: gold underline or soft glow, short sound. No icons grid, no colorful buttons.

## Difficulty levels

Difficulty must change real mechanics, not just labels.

|  | Easy: Rookie Detective | Medium: Professional Detective | Hard: Master Detective |
| --- | --- | --- | --- |
| Clues | More obvious, more placed in rooms | Moderate, some need cross-referencing | Subtle, fewer, some only matter in combination |
| NPC behavior | Relatively cooperative, reveal more when asked well | Lie and withhold; secrets must be pressed | Deeper secrets, more misinformation, guarded |
| Testimonies | Mostly consistent | More conflicting statements | Complex alibis and relationship webs |
| Hints | Most available | Fewer | Limited |
| Diamond reward on success | Lowest | Middle | Highest |

### How difficulty is implemented (server-side config)

A small config object chosen at `start_case`, loaded by the server. Proposed knobs:

- `npcCooperation` (injected into each NPC prompt as a behavior directive)
- `lieTendency` (how readily NPCs deflect or lie about their secret)
- `redHerrings` (how many misleading clues or statements are active)
- `clueVisibility` (how many clues are placed and how explicit their text is)
- `maxHints` (hard cap per case)
- `rewardDiamonds` (reward on success)

**MVP:** one playable case. All three difficulties are selectable and use the same case, with the knobs above changing prompt directives, active red herrings, hint cap, and reward. Case-specific alternate alibis and extra secrets per difficulty are post-MVP. See Conflicts and Open Questions, item 13.

## Detective character and customization

The player has their own detective.

**Visual inspiration:** Bond-style formal suits, black trench coats, fedora hats, leather gloves, sunglasses, luxury watches, different outfits and accessories.

**MVP:** one default detective (black trench coat and fedora) and a basic Detective Profile screen showing diamonds, cases solved, and the default look. Wardrobe slots can appear as locked "coming soon" placeholders.

**Post-MVP:** a wardrobe system. Outfits and accessories are unlockable and upgradeable with diamonds earned from solved cases. Cosmetic only: no gameplay advantage from outfits.

## Diamonds and hint economy

### Rules

- Players start with **3 diamonds**.
- An optional hint costs **1 diamond**.
- Diamonds are earned after successfully completing an investigation.
- Later, diamonds unlock detective outfits and accessories (post-MVP).
- **Evidence collection and normal NPC conversations are always free.** Diamonds pay only for optional assistance. A player with 0 diamonds can still finish every case.
- The **backend owns the balance.** The client never sends or sets a balance. It sends a hint request, and the server checks the balance, deducts, and replies.

### Hint design

- Hints are generated by the server from the truth log and case data using templates. They are not free-form LLM output, so a hint can never leak or contradict the truth.
- Tiered, in increasing cost of spoiling:
    1. **Direction:** who is worth talking to again.
    2. **Location:** which room has something worth inspecting.
    3. **Contradiction pointer:** two recorded statements or a clue and a statement that do not match (still does not name the killer).
- Hints never name the killer.
- Hint cap per case comes from the difficulty config.

### Earning (proposed values, to confirm)

| Difficulty | Reward on correct accusation |
| --- | --- |
| Easy | +1 diamond |
| Medium | +2 diamonds |
| Hard | +3 diamonds |

Rewards are granted once per case run, server-side, and only on a correct accusation.

### Persistence and integrity

The balance lives in SQLite against a persistent player ID. See the Backend Plan section "Backend impact of the vision update". Known limit: a guest ID stored in the browser can be cleared, which resets progress. Acceptable for the MVP. Real accounts are post-MVP.

## Audio design

| Layer | Examples |
| --- | --- |
| Music | Menu theme, investigation loop, tension sting on murder reveal, accusation sting |
| Ambience | Rain loop, distant thunder, mansion hum, clock ticking |
| Interaction | Footsteps (changes by room if time allows), door, paper rustle for evidence, UI click, hint chime |

Sources must be free and license-checked. Candidates: Pixabay audio, Freesound (CC0 only unless attribution is added), Kenney audio packs (CC0). Keep an attribution list in the repo if any asset requires it.

## Progression (post-MVP)

- Multiple murder cases with their own casts and mansions or locations.
- Advanced per-case difficulty variations.
- Wardrobe and unlockables funded by diamonds.
- More sophisticated rewards: ranks, case grades, achievements.
- Expanded diamond economy.