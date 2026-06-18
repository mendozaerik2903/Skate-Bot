import {
  PROGRESSION_EXHAUSTION_THRESHOLD,
  PROGRESSION_WEIGHTS,
} from "@/constants/bot-tricks";
import { BotTrickEntry } from "@/utility/pool-builder";

// ---------------------------------------------------------------------------
// Progression state
// Lives co-located with pool state on the game screen.
// Pass in each turn, receive updated values back out.
//
// activeTier:                 the tier the window is currently centered on
// activeTierStartingWeight:   total sampleWeight of activeTier entries at
//                             the moment this tier became active — never changes
//                             while the tier is active, recomputed on advance
// activeTierExhaustedWeight:  running sum of sampleWeight for entries in
//                             activeTier that have been landed and exhausted
//                             while the window was on that tier
// ---------------------------------------------------------------------------

export type ProgressionState = {
  activeTier: 1 | 2 | 3 | 4 | 5;
  activeTierStartingWeight: number;
  activeTierExhaustedWeight: number;
};

// ---------------------------------------------------------------------------
// Progression window weighting
// Applies a multiplier to each entry's sampleWeight based on its tier
// relative to the active tier:
//
//   tier < activeTier  → BELOW_ACTIVE (1.0 — full natural weight)
//   tier = activeTier  → ACTIVE (3.0 — heavily biased toward here)
//   tier = activeTier + 1 → BLEED (0.4 — light preview of next tier)
//   tier > activeTier + 1 → ABOVE_BLEED (0.0 — invisible until window advances)
// ---------------------------------------------------------------------------

function applyProgressionWeight(
  entry: BotTrickEntry,
  activeTier: 1 | 2 | 3 | 4 | 5,
): number {
  const tier = entry.difficultyTier;

  if (tier < activeTier)
    return entry.sampleWeight * PROGRESSION_WEIGHTS.BELOW_ACTIVE;
  if (tier === activeTier)
    return entry.sampleWeight * PROGRESSION_WEIGHTS.ACTIVE;
  if (tier === activeTier + 1)
    return entry.sampleWeight * PROGRESSION_WEIGHTS.BLEED;
  return entry.sampleWeight * PROGRESSION_WEIGHTS.ABOVE_BLEED; // 0 — filtered out below
}

function weightedSample(
  pool: BotTrickEntry[],
  activeTier: 1 | 2 | 3 | 4 | 5,
): BotTrickEntry {
  // Build effective weights with progression window applied.
  // Entries with zero weight (tiers above bleed) are excluded from sampling entirely.
  const weighted = pool
    .map((entry) => ({
      entry,
      effectiveWeight: applyProgressionWeight(entry, activeTier),
    }))
    .filter((item) => item.effectiveWeight > 0);

  const totalWeight = weighted.reduce(
    (sum, item) => sum + item.effectiveWeight,
    0,
  );

  let random = Math.random() * totalWeight;

  for (const item of weighted) {
    random -= item.effectiveWeight;
    if (random <= 0) return item.entry;
  }

  // Fallback — should never reach here but satisfies TypeScript
  return weighted[weighted.length - 1].entry;
}

function attemptTrick(landRate: number): boolean {
  return Math.random() < landRate;
}

// ---------------------------------------------------------------------------
// Advance the window to the next tier.
// Recomputes activeTierStartingWeight from the current pool so boosts and
// persona filtering are reflected accurately.
// Clamps at tier 5 — the window never advances past the hardest tier.
// ---------------------------------------------------------------------------

function advanceWindow(
  pool: BotTrickEntry[],
  currentTier: 1 | 2 | 3 | 4 | 5,
): ProgressionState {
  const nextTier = Math.min(currentTier + 1, 5) as 1 | 2 | 3 | 4 | 5;

  const nextTierStartingWeight = pool
    .filter((e) => e.difficultyTier === nextTier)
    .reduce((sum, e) => sum + e.sampleWeight, 0);

  return {
    activeTier: nextTier,
    activeTierStartingWeight: nextTierStartingWeight,
    activeTierExhaustedWeight: 0,
  };
}

// ---------------------------------------------------------------------------
// botOffenseTurn
//
// Receives full game state, returns updated state after one offensive turn.
// The game screen applies all returned values directly — no logic needed there.
//
// pool:          current exhausted pool (landed tricks removed)
// resetPool:     original resolved pool — used when pool is fully exhausted
// progression:   current window state
// ---------------------------------------------------------------------------

export function botOffenseTurn(
  pool: BotTrickEntry[],
  resetPool: BotTrickEntry[],
  progression: ProgressionState,
): {
  entry: BotTrickEntry;
  success: boolean;
  updatedPool: BotTrickEntry[];
  updatedProgression: ProgressionState;
  poolWasReset: boolean;
  tierAdvanced: boolean;
} {
  let currentPool = pool;
  let poolWasReset = false;

  // Rebuild from resetPool if exhausted — preserves persona/custom filtering.
  // Progression state is intentionally preserved through a reset — the window
  // position reflects how far into the game we are, not pool fullness.
  if (currentPool.length === 0) {
    currentPool = resetPool;
    poolWasReset = true;
  }

  const entry = weightedSample(currentPool, progression.activeTier);
  const success = attemptTrick(entry.landRate);

  // Only exhaust the trick on a successful land
  const updatedPool = success
    ? currentPool.filter((e) => e.fullString !== entry.fullString)
    : currentPool;

  // ---------------------------------------------------------------------------
  // Progression window update
  // Only tracks exhaustion for tricks in the active tier.
  // Out-of-window landings (below or bleed tier) remove the trick from the pool
  // normally but never contribute to window advancement.
  // ---------------------------------------------------------------------------

  let updatedProgression = progression;
  let tierAdvanced = false;

  if (success && entry.difficultyTier === progression.activeTier) {
    const newExhaustedWeight =
      progression.activeTierExhaustedWeight + entry.sampleWeight;

    const exhaustionRatio =
      progression.activeTierStartingWeight > 0
        ? newExhaustedWeight / progression.activeTierStartingWeight
        : 1;

    if (
      exhaustionRatio >= PROGRESSION_EXHAUSTION_THRESHOLD &&
      progression.activeTier < 5
    ) {
      // Threshold crossed — advance the window to the next tier
      updatedProgression = advanceWindow(updatedPool, progression.activeTier);
      tierAdvanced = true;
    } else {
      // Still within the active tier — just update the exhausted weight
      updatedProgression = {
        ...progression,
        activeTierExhaustedWeight: newExhaustedWeight,
      };
    }
  }

  return {
    entry,
    success,
    updatedPool,
    updatedProgression,
    poolWasReset,
    tierAdvanced,
  };
}

// ---------------------------------------------------------------------------
// buildInitialProgression
// Call once on game screen mount after resolveGamePool returns the pool.
// Computes the starting weight for tier 1 so the game screen has a valid
// ProgressionState to pass into the first botOffenseTurn call.
// ---------------------------------------------------------------------------

export function buildInitialProgression(
  pool: BotTrickEntry[],
): ProgressionState {
  const tier1StartingWeight = pool
    .filter((e) => e.difficultyTier === 1)
    .reduce((sum, e) => sum + e.sampleWeight, 0);

  return {
    activeTier: 1,
    activeTierStartingWeight: tier1StartingWeight,
    activeTierExhaustedWeight: 0,
  };
}
