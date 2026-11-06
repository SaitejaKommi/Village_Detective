# Design notes

Distilled from the three reference images (desk/evidence-board illustration, grey-fedora detective render, noir concept board). They set mood only. No title, logo, character or composition is copied.

- **Palette.** Near-black base `#0B0B0C` / `#141414`, panels `#1C1C1E` / `#262628`. Vintage gold `#B8985A` (bright `#D9BD7F`) for titles, borders and active states, warm ivory `#E8E2D0` for text. From the desk illustration: lamp amber `#E8A33D`, window teal `#1F5A5E`, desk brown `#2A1A12`. Danger is a dried-blood red `#7A1F1F`.
- **Lighting.** One warm practical light (lamp, window, street lamp) against a very dark room. Pools of light, never flat fill. In-game this is a soft amber light pool around the player and a heavy vignette. A cold teal rim appears on rain and window light, so warm and cool are always in tension.
- **Characters.** Stylised, high contrast, side or 3/4 lit with a thin gold rim light and a dark background. Identity comes from silhouette and one prop each (cane, pearls, loosened tie, white gloves, keys, pinky ring). The portrait style matters more than detail, so every portrait shares one crop, scale and grade.
- **Detective.** Grey fedora with a dark band, trench coat or three-piece suit, a figure seen from behind or in profile under rain. Used as a silhouette in the intro and on the menu.
- **UI style.** Minimal and premium: thin 1px gold outlines, no filled colour buttons, generous spacing, uppercase letter-spaced labels. Cards have a dark gradient with a faint warm glow on hover and focus. The only red is danger (accusation).
- **Typography.** Cormorant Garamond (cinematic serif) for the title, headings and name plates, in gold or ivory with wide tracking for caps. Inter for body, transcript and controls. Body text is at least 16px on inputs.
- **Motion.** Slow cross-fades and slow pushes. Hover is a gold underline or soft glow. Nothing bounces. Lightning is at most one flash plus a faint afterglow, never more than three flashes per second, and off for `prefers-reduced-motion`.
- **Atmosphere stack.** Rain canvas, a CSS vignette, drifting fog and the occasional lightning wash sit above the world and below the UI. Rain is on everywhere; intensity drops under panels so text stays readable.
- **Evidence board motif.** Paper cards, red string and pinned photos from the desk image inform the notebook: warm paper-tone accents on a dark surface, and tabs that look like folder tabs.
- **Audio mood.** Low drone with sparse minor-key notes, steady rain and distant thunder. All of it synthesised in code so it works with no files. Real tracks drop in later.
- **Contrast.** Ivory on near-black is above 12:1. Muted text `#9A968B` on `#1C1C1E` is about 5.6:1. Gold on near-black is about 7:1. Both meet WCAG AA.
