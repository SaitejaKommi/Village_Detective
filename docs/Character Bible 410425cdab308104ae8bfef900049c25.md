# Character Bible

<aside>
📌

Names, secrets, and relationships below are DRAFTS for the team to finalize in the first 30 minutes. They exist so the frontend can design portraits and the backend can write `personas.json` in parallel. The killer and the full murder timeline are deliberately not decided here. Decide them in the case file.

</aside>

## NPC visual identity requirements

The NPCs must look like characters from a Hollywood crime thriller. Not generic cartoon characters. Each NPC must have:

- A distinctive visual appearance that communicates personality at a glance
- Unique clothing, props, and posture
- An individual dialogue style
- Private knowledge and secrets
- Relationships with other NPCs
- A different motivation and a different reason to lie

### Portrait-first identity (scope decision)

Tiny top-down sprites cannot carry a cinematic look. The identity of each character lives in the **interrogation portrait**. In-world sprites stay simple, with one distinguishing color and silhouette prop per NPC so players can tell them apart while walking.

### Portrait specification

- Bust or half-body, 3/4 angle, consistent crop and scale across all six
- High-contrast noir lighting with a subtle gold rim light, dark background
- Same style across the whole cast (this matters more than detail)
- One neutral expression per NPC for MVP. Extra expressions (nervous, angry, calm) are post-MVP
- Delivered as PNG or WebP, same dimensions for all (for example 768 by 1024)

### Where portraits come from (decide in the first 30 minutes)

1. **AI-generated portraits** with one shared style prompt, using a free tool. Check the tool's terms for use in a public project.
2. **CC0 or free-licensed character art** with a shared color grade in CSS (duotone or desaturate plus gold tint) to unify the style.
3. **Fallback:** stylized silhouettes with a unique prop each (cane, keys, pipe, pearls, tray, ledger), unified by the same lighting treatment. Always build this fallback first so the UI is never blocked.

## The six NPCs (draft)

| # | Working name | Role | Look | Speech style |
| --- | --- | --- | --- | --- |
| 1 | Alistair Blackwood | Wealthy businessman, head of the house | Late 60s, charcoal three-piece suit, silver pocket watch, cane | Commanding, clipped, used to being obeyed |
| 2 | Evelyn Blackwood | Elegant, mysterious wife | Mid 40s, black evening gown, pearl choker, long gloves, deep red lipstick | Soft, precise, answers questions with questions |
| 3 | Julian Blackwood | Suspicious son | Late 20s, rumpled dark blazer, loosened tie, tired eyes | Sarcastic, defensive, deflects with humor |
| 4 | Harold Finch | Sophisticated butler | 60s, immaculate tailcoat, white gloves, straight posture | Formal, measured, never volunteers anything |
| 5 | Margaret Doyle | Observant housekeeper | 50s, dark dress, apron, ring of keys at the belt | Plain-spoken, notices small details, speaks carefully about the family |
| 6 | Victor Crane | Manipulative business partner | 50s, double-breasted pinstripe suit, slicked hair, pinky ring | Charming, persuasive, steers the conversation |

## Draft secrets, relationships, and reasons to lie

Secrets here are not the murder solution. Some are red herrings by design.

| Working name | Private secret (draft) | Key relationships | Why they lie |
| --- | --- | --- | --- |
| Alistair | Planned to change his will that week | Rivalry with Victor, strained marriage, disappointed in Julian | Protect the business and his pride |
| Evelyn | Secretly met a divorce lawyer | Cold with Alistair, closer to Harold than she shows | Avoid looking like she had a motive |
| Julian | Gambling debts, sold a family heirloom | Resents Alistair, trusted by Margaret | Fear of being cut off and exposed |
| Harold | Opened the study safe for Alistair that night and knows what was in it | Decades of loyalty to the family, protective of Evelyn | Loyalty and professional discretion |
| Margaret | Heard an argument at night and is afraid to say so | Fond of Julian, distrusts Victor | Fear of losing her job |
| Victor | Has been moving money out of the company | Partner and rival of Alistair, private history with Evelyn | Avoid exposure of the financial fraud |

Note: Alistair is the proposed victim (see Conflicts and Open Questions, item 4). If so, he is present in the prologue and briefing, and the interrogable suspects are the other five. If the team prefers six living suspects, add a seventh character as the victim.

## Persona data shape (for `personas.json`)

Extends the existing persona fields (name, personality, secret, goal). Proposed additions for the new direction:

- `id`, `name`, `role`
- `appearance` (short text, used for portrait prompts and UI captions)
- `voiceStyle` (how they speak, used in the prompt)
- `secret` and `motiveToLie`
- `relationships[]` (`npcId`, `attitude`, `knowsAbout`)
- `seedMemories[]` (what they saw or know at case start, written into their memory by the case loader)
- `portraitId` and `spriteColor`
- `difficultyOverrides` (optional, post-MVP)

## Interrogation UI requirements

The conversation must feel like an interrogation scene, not a chat window.

- Large character portrait with name and role
- Dialogue history as a styled transcript (the detective on one side, the suspect on the other)
- Free-text input with a 300 character limit and a "thinking" indicator while the LLM replies (use a subtle animation, such as a slow light flicker on the portrait)
- Cinematic framing: darkened scene behind, portrait lit from the side, serif name plate
- Quick access to the notebook so the player can check clues before asking
- No raw JSON, no AI branding, no "assistant" wording anywhere in the UI
- Optional later: expression changes, typewriter text, evidence "present" action (show a clue to an NPC)