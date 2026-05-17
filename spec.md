# Neon Dash — Game Spec

## Concept

One-button arcade game. A glowing square (the player) jumps to pass through neon wall gaps that scroll from right to left. Easy to understand in 5 seconds, hard to master.

## Controls

| Input | Action |
|-------|--------|
| `Space` / `ArrowUp` | Jump / Start / Restart |
| `Click` | Jump / Start / Restart |
| `Tap` (mobile) | Jump / Start / Restart |
| Sound toggle (🔊) | Mute / Unmute |

## Files

| File | Purpose |
|------|---------|
| `index.html` | HTML structure, canvas, DOM overlays |
| `style.css` | Dark neon theme, animations, responsive layout |
| `script.js` | All game logic: loop, physics, render, audio, input |
| `package.json` | Dev script (`npx serve . -l 8080`) |
| `spec.md` | This document |

No external dependencies. No build step. Vanilla HTML / CSS / JS.

## Gameplay

- **Player** — 32×32 cyan square, fixed at `x=150`, jumps with gravity (`G=0.45`, jump force `JF=-13`). Max jump height ≈188px.
- **Obstacles** — 40px-wide magenta walls with a single horizontal gap. Spawn at `W+30` and scroll left at `speed` px/frame.
- **Collision** — AABB. Player top/bottom overlaps obstacle top/bottom block → game over.
- **Scoring** — +1 point per obstacle cleared (when obstacle right edge passes player x). Streak counter for consecutive clears.
- **Difficulty** — Quadratic curve: `speed` increases and `gapSize` decreases faster as score grows.

## Key Parameters

| Parameter | Desktop | Mobile (<640px) |
|-----------|---------|-----------------|
| Base speed | 4 | 2.5 |
| Initial gap | 230px | 245px |
| Min gap | 160px | 170px |
| Speed scaling | `+0.08/score + t²·2` | `+0.06/score + t²·1` |
| Gap shrink | `-0.6/score - t²·5` | `-0.4/score - t²·3` |
| Obstacle spacing | `max(240, 420 - score·3)` | `max(280, 480 - score·3)` |

Where `t = score / 30`.

## Difficulty Curve (desktop)

| Score | Speed | Gap |
|-------|-------|-----|
| 0 | 4.0 | 230 |
| 10 | 5.0 | 223 |
| 20 | 6.5 | 216 |
| 30 | 8.4 | 207 |
| 40 | 10.8 | 197 |
| 50 | 13.6 | 186 (→ clamped to 160) |

## Visual Features

- **Dark neon aesthetic** — `#0a0a0f` background, cyan player, magenta obstacles
- **Grid overlay** — subtle 50px grid (`rgba(255,255,255,0.02)`)
- **Ground glow** — gradient from cyan to transparent, glowing ground line
- **Score popups** — `+1` floats up and fades; golden `10!`, `20!` etc. at streak milestones
- **Player trail** — last 8 positions rendered as fading ghost rectangles (cyan / gold when invincible)
- **Death flash** — red overlay (`#ff0033`) that fades on death
- **Screen shake** — 20px intensity, decays over ~0.5s on death
- **Particles** — burst on jump (cyan), score (magenta), death (magenta+cyan+yellow), milestone/powerup (golden)
- **Obstacle pulse** — glow brightness oscillates via `sin(frame * 0.04)`
- **Scanlines** — subtle vertical lines on obstacle blocks
- **Score pulse** — CSS scale animation on each point
- **Background dots** — 50 dim dots drift slowly left (`0.15–0.5 px/frame`) for depth
- **Power-up star** — golden diamond in gap center, pulsing glow, collected when passing through

## Audio (Web Audio API)

| Event | Oscillator | Freq |
|-------|-----------|------|
| Jump | sine | 300→800 Hz |
| Score | sine | 800→1400 Hz |
| Milestone | sine | 500→1800 Hz (longer) |
| Power-up | sine | 500→2000 Hz |
| Death | sawtooth | 400→40 Hz |
| BGM (loop) | square | chiptune arpeggio (31 notes, ~5s loop) |

Audio context is lazily created on first user interaction (browser policy). Mutable via sound toggle button. BGM starts on game start, stops on game over, respects mute toggle.

## Power-up (Star)

- **Spawn** — 25% chance per obstacle, placed in the gap center
- **Collection** — automatically collected when the player passes through the gap
- **Reward** — +5 bonus score, 1.5 seconds of invincibility
- **Visual** — golden diamond with pulsing glow, `⭐ +5` popup on collect
- **Invincibility** — player glows gold with pulsing shadow, passes through all walls
- **Sound** — special power-up tone

## Game States

- **`start`** — Title screen with instructions and PLAY button. Click/space/tap to proceed.
- **`playing`** — Active gameplay. Obstacles scroll, player jumps. Score updates.
- **`gameover`** — Score and best score displayed. New best highlighted. Click/space/tap to restart.

## Data Persistence

Best score stored in `localStorage` key `neondash_best`.

## Responsive Behavior

- Canvas fills `window.innerWidth × window.innerHeight` and recalculates on resize.
- Screens narrower than 640px get reduced speed, wider gaps, and increased obstacle spacing.
- `touch-action: manipulation` prevents browser zoom/scroll on mobile.
- `user-scalable=no` in viewport meta.

## Input Safeguards

- `inputCooldown` (100ms) prevents double-fire from simultaneous touch + click.
- Buttons use `e.stopPropagation()` so their handlers don't conflict with document-level listeners.
- `e.target.closest('button')` check filters button clicks from game input.

## Changelog

| # | Change |
|---|--------|
| 1 | Initial implementation: walls-with-gaps, linear difficulty, basic particles |
| 2 | Fixed `ReferenceError: BS is not defined` (removed `BS` const, forgot one reference) |
| 3 | Mobile tuning: `isCompact()` detection, slower speed, wider gaps, more spacing |
| 4 | Quadratic difficulty curve, streak tracking, milestone effects, player trail, death flash, score pulse, obstacle glow oscillation |
| 5 | Gap sizes widened globally (initial 180→230, min 110→160) to make jumping easier |
| 6 | Background music: chiptune square-wave arpeggio loop. Background dots: 50 slow-drift dots for parallax depth. Power-up star: 25% chance per obstacle, +5 score + 1.5s invincibility |
