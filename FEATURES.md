# Features of App

## Starting a Game

On the "Skate" tab, the user can play a game of SKATE against a bot with customizable game options. The user is able to adjust the difficulty of the game, the length of the game, and

## Adaptive Bot Difficulty

adjusts the opponent's behavior in real-time based on your recent performance. A rolling window of match results feeds into a scoring function that shifts the bot's trick sampling toward harder combinations as you improve — keeping matches competitive without any manual tuning. No external API required; it's a closed-loop feedback algorithm built entirely on your existing trick pool infrastructure.

## Weakness Detection

analyzes your defense miss history across sessions and surfaces patterns you might not notice yourself — like consistently missing switch-stance tricks or heelflip variations. The core version is free and template-based, aggregating your match data into actionable insights displayed as a coach card on your profile. An LLM layer can optionally be added for more natural language output, but the statistical foundation delivers most of the value on its own.

## Natural Language Trick Challenges

lets you describe a practice session in plain English — "only switch stance flip tricks" or "hardest tricks only" — and parses that into a filtered trick pool for the match. Your existing game engine runs unchanged; the LLM simply acts as a query interface over your static trick data, grounding its output in your defined trick list to prevent hallucination.

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
