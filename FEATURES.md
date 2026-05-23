# SKATE vs Bot — Feature Design Spec

## Data Model

- **Base tricks + modifier combinations** seeded upfront in Postgres
- **Land rate lives on the full modifier combination**, not on individual modifier axes
- **Single source of truth** — the frontend derives all modifier availability from a `GET /api/tricks/combinations` call at game load; no static config files on the client
- Every combination always carries its land rate value regardless of its enabled state

### Modifier Axes

Each base trick accepts up to five parameter axes:

- **Stance:** Normal, Fakie, Nollie, Switch
- **Direction:** Frontside, Backside
- **Rotation:** 180, 360, 540
- **Modifier:** Body varial, Pressure, Revert, Late
- **Land Rate:** A percentage (0–100%) representing both the bot's probability of landing the trick and its weighted attempt frequency

---

## Bot Engine

- **Weighted trick selection** — land rate doubles as attempt frequency; higher land rate = more likely to be attempted
- **Non-repeatable trick pool** tracked as a `Set` of combination IDs in local game state for the duration of the session
- **Pool reset** — when all combinations are exhausted, the pool resets silently and continues; a flag marks that the pool has cycled
- **Two bot modes:**
  - _Setting a trick:_ weighted random selection from enabled combinations minus already-used combinations
  - _Matching a trick:_ direct land rate lookup for that specific combination
- **Out-of-pool fallback** — if the player sets a trick not in the bot's enabled combination list, the bot defaults to a 2% land rate
- **Artificial delay and staged presentation** for bot turns to make resolution feel dramatic rather than instantaneous

---

## Game Rules

- **Player always goes first** as the offensive player, matching real SKATE rules
- **Player self-reports** landed or missed — no friction, no confirmation dialogs, no anti-cheat; it's a solo game
- **Landed →** bot must attempt the same trick; bot resolves via its land rate for that combination
- **Missed →** no letter consequence; possession flips to the bot
- **Bot misses a forced match →** bot receives a letter
- **Player misses a forced match →** player receives a letter
- **Game length** is configurable (e.g. SKATE = 5 letters, SKATEBOARD = 9 letters)

---

## Pre-Game Configuration

- All configuration lives in **local component state** during the setup screen
- On Start, a **fully denormalized config object** is passed to the game screen as a navigation param
- The config object includes: game length, and the complete bot trick pool with every combination and its land rate already resolved
- The **game screen is a pure consumer** — it never re-queries the database mid-game

---

## Custom Difficulty Editor

### Hierarchy

Three-level expandable hierarchy:

1. **Stance (top level):** Normal, Fakie, Nollie, Switch
   - Each stance can be expanded to reveal base tricks within it
   - Toggling a stance off disables and greys out all children — the parent toggle is absolute
2. **Base Trick (second level):** Ollie, Kickflip, Shuvit, Heelflip, etc.
   - Each base trick has a toggle and a land rate slider
   - Can be expanded to reveal specific trick alternatives (e.g. Kickflip → Backside 180 Kickflip)
3. **Modifiers (third level):** Trick-specific extras (e.g. Shuvit → Revert)
   - Each modifier has its own toggle and land rate slider

### Toggle Behavior

- **Disabling a parent stance** greys out and excludes all tricks within it; children are not editable while the parent is disabled
- **Re-enabling a parent stance** restores all children to their previous configured state
- Disabling a stance is **not a reset** — it is an inclusion flag only

### State Preservation

- When a stance is disabled, child land rate values are **preserved in state but marked inactive**
- The game engine builds the bot's trick pool by filtering on the enabled flag; disabled combinations are excluded regardless of their land rate value
