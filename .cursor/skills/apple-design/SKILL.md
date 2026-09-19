---
name: apple-design
description: Apply Apple-style interface design and fluid motion to web UI. Use when building or restyling H5/web interfaces, HUD/sheets, gesture or mouse-follow motion, spring animations, translucent materials, typography, pressed feedback, or when the user mentions apple-design, Emil Kowalski, 苹果风, 流体交互, or wants to remove generic AI purple-blue gradients.
---

# Apple Design

Distilled from Apple WWDC fluid-interface talks and Emil Kowalski's apple-design skill. Goal: the UI should feel like a physical extension of the pointer, not a scripted slideshow.

Do **not** use generic AI looks: purple-blue mesh gradients, identical 8px cards, Inter-only type, emoji-as-icons everywhere, `ease-in`, or `transition: all`.

## Motion

- Respond on pointer-down. Feedback is continuous while dragging, not only on release.
- Mouse/finger and the object stay 1:1 during the gesture. Animate from the **live on-screen value**, never from a stale target.
- Every motion is interruptible. Never lock input while an animation plays.
- Use springs (or exponential smoothing that retargets from the current value). Critically damped by default (`damping 1.0`, `response 0.3–0.4`). Add bounce (`damping ~0.8`) only after a flick/jump with real momentum.
- Hand off release velocity into the settle spring. Rubber-band at edges instead of a hard stop.
- Animate only `transform` and `opacity`. Custom curve for UI: `cubic-bezier(0.23, 1, 0.32, 1)`. Never `ease-in`.
- Pressed: `transform: scale(0.97)` in about 100ms ease-out.

## Materials

- Chrome is frosted glass: `backdrop-filter: blur(20px) saturate(180%)` plus a translucent fill. Content can sit behind it.
- Hierarchy = material weight. Larger surfaces get stronger blur and deeper (soft) shadows. Do not stack two light glasses.
- Sheets/modals: dim the world, blur it, round the sheet generously (~28–36px), no hard 1px hairline unless contrast mode needs it.
- `@media (prefers-reduced-transparency: reduce)`: raise opacity, drop blur.
- `@media (prefers-reduced-motion: reduce)`: cross-fade, no elastic overshoot.

## Type and layout

- Font: `system-ui, -apple-system, "SF Pro Text", "PingFang SC", sans-serif`.
- Large titles: tight leading (~1.05–1.15) and slightly negative tracking. Body tracking near 0.
- Hierarchy from size + weight + space, not extra chrome.
- Spacing is deliberate (8pt rhythm). Every control earns its place.

## Delight

- Sound, motion, and visual change fire on the **same frame** as the causal event.
- Reserve extra bounce/sound for meaningful moments (success, rare reward). Do not sprinkle confetti on every tap.

When restyling this rabbit game: keep the pastoral scene, but make HUD/sheets/buttons feel like Apple materials with springy, interruptible motion.
