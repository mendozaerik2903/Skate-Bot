import { Modifier, Rotation, Stance } from "./trick-options";
import { Difficulty } from "./types";

export type BotTrickData = {
  difficultyTier: 1 | 2 | 3 | 4 | 5;
  stanceRates: Partial<Record<Stance, number>>;
  rotationModifiers: Partial<Record<Rotation, number>>;
  modifierPenalties: Partial<Record<Modifier, number>>;
};

export type BotTrickSet = Record<string, BotTrickData>;

// ---------------------------------------------------------------------------
// Difficulty scalars
// Applied to landRate at game-time for persona-based bots.
// Custom bots bypass these entirely — their savedPool landRates are used as-is.
// ---------------------------------------------------------------------------

export const DIFFICULTY_SCALARS: Record<Difficulty, number> = {
  Easy: 0.5,
  Medium: 0.75,
  Hard: 1.0,
};

// ---------------------------------------------------------------------------
// Progression window weights
// Applied at sample time in botOffenseTurn to shape trick selection by tier.
//
// BELOW_ACTIVE:  tiers below the active tier — full natural weight (1.0)
// ACTIVE:        the current target tier — boosted to bias selection here
// BLEED:         active + 1 tier — lightly weighted to preview harder tricks
// ABOVE_BLEED:   tiers above bleed — invisible until window advances
// ---------------------------------------------------------------------------

export const PROGRESSION_WEIGHTS = {
  BELOW_ACTIVE: 1.0,
  ACTIVE: 3.0,
  BLEED: 0.4,
  ABOVE_BLEED: 0.0,
} as const;

// Fraction of active tier's starting sampleWeight that must be exhausted
// before the window advances to the next tier.
export const PROGRESSION_EXHAUSTION_THRESHOLD = 0.65;

// ---------------------------------------------------------------------------
// Master trick set — Pro baseline land rates (difficulty scalar = 1.0)
//
// difficultyTier:    conceptual trick difficulty (1 = beginner, 5 = banger)
//                    independent of landRate — used for progression window only
// stanceRates:       base land probability per stance
// rotationModifiers: multiplier applied on top of stanceRate
// modifierPenalties: multiplier applied on top of rotationModifier (or stanceRate)
//
// Tier groupings:
//   1 — ollie, shuvit
//   2 — kickflip, heelflip, 360 shuvit, varial flip, varial heel, bigspin
//   3 — hardflip, inward heel, tre flip, laser flip, hospital flip, hospital heel
//   4 — impossible, dolphin flip, dolphin heel, big flip, big heel, biggerspin
//   5 — double kickflip, double heelflip, bigger flip, bigger heel,
//       540 shuvit, 540 flip, 540 heel, gazelle flip, gazelle heel, gazelle spin
// ---------------------------------------------------------------------------

export const MASTER_BOT_TRICKS: BotTrickSet = {
  // -------------------------------------------------------------------------
  // Tier 1
  // -------------------------------------------------------------------------
  ollie: {
    difficultyTier: 1,
    stanceRates: { regular: 0.95, fakie: 0.9, nollie: 0.75, switch: 0.7 },
    rotationModifiers: {
      "BS 180": 0.85,
      "FS 180": 0.85,
      "BS 360": 0.6,
      "FS 360": 0.55,
    },
    modifierPenalties: {},
  },

  shuvit: {
    difficultyTier: 1,
    stanceRates: { regular: 0.88, fakie: 0.85, nollie: 0.72, switch: 0.68 },
    rotationModifiers: { BS: 1.0, FS: 0.95 },
    modifierPenalties: {},
  },

  // -------------------------------------------------------------------------
  // Tier 2
  // -------------------------------------------------------------------------
  kickflip: {
    difficultyTier: 2,
    stanceRates: { regular: 0.85, fakie: 0.8, nollie: 0.65, switch: 0.6 },
    rotationModifiers: {
      "BS 180": 0.75,
      "FS 180": 0.75,
      "BS 360": 0.5,
      "FS 360": 0.45,
    },
    modifierPenalties: {},
  },

  heelflip: {
    difficultyTier: 2,
    stanceRates: { regular: 0.82, fakie: 0.78, nollie: 0.62, switch: 0.58 },
    rotationModifiers: {
      "BS 180": 0.72,
      "FS 180": 0.72,
      "BS 360": 0.48,
      "FS 360": 0.44,
    },
    modifierPenalties: {},
  },

  "360 shuvit": {
    difficultyTier: 2,
    stanceRates: { regular: 0.72, fakie: 0.68, nollie: 0.52, switch: 0.48 },
    rotationModifiers: { BS: 1.0, FS: 0.9 },
    modifierPenalties: {},
  },

  "varial flip": {
    difficultyTier: 2,
    stanceRates: { regular: 0.75, fakie: 0.7, nollie: 0.55, switch: 0.5 },
    rotationModifiers: { BS: 1.0 },
    modifierPenalties: {},
  },

  "varial heel": {
    difficultyTier: 2,
    stanceRates: { regular: 0.72, fakie: 0.68, nollie: 0.52, switch: 0.48 },
    rotationModifiers: { FS: 1.0 },
    modifierPenalties: {},
  },

  bigspin: {
    difficultyTier: 2,
    stanceRates: { regular: 0.65, fakie: 0.6, nollie: 0.45, switch: 0.4 },
    rotationModifiers: { BS: 1.0, FS: 0.88 },
    modifierPenalties: {},
  },

  // -------------------------------------------------------------------------
  // Tier 3
  // -------------------------------------------------------------------------
  hardflip: {
    difficultyTier: 3,
    stanceRates: { regular: 0.65, fakie: 0.6, nollie: 0.45, switch: 0.4 },
    rotationModifiers: { "BS 180": 0.6, "FS 180": 0.55 },
    modifierPenalties: {},
  },

  "inward heel": {
    difficultyTier: 3,
    stanceRates: { regular: 0.62, fakie: 0.58, nollie: 0.42, switch: 0.38 },
    rotationModifiers: { "BS 180": 0.58, "FS 180": 0.52 },
    modifierPenalties: {},
  },

  "tre flip": {
    difficultyTier: 3,
    stanceRates: { regular: 0.7, fakie: 0.65, nollie: 0.5, switch: 0.45 },
    rotationModifiers: { BS: 1.0 },
    modifierPenalties: {},
  },

  "laser flip": {
    difficultyTier: 3,
    stanceRates: { regular: 0.65, fakie: 0.6, nollie: 0.45, switch: 0.4 },
    rotationModifiers: { FS: 1.0 },
    modifierPenalties: {},
  },

  "hospital flip": {
    difficultyTier: 3,
    stanceRates: { regular: 0.58, fakie: 0.52, nollie: 0.38, switch: 0.32 },
    rotationModifiers: {
      "BS 180": 0.62,
      "FS 180": 0.58,
      "BS 360": 0.42,
      "FS 360": 0.38,
    },
    modifierPenalties: {},
  },

  "hospital heel": {
    difficultyTier: 3,
    stanceRates: { regular: 0.55, fakie: 0.5, nollie: 0.35, switch: 0.3 },
    rotationModifiers: {
      "BS 180": 0.6,
      "FS 180": 0.55,
      "BS 360": 0.4,
      "FS 360": 0.35,
    },
    modifierPenalties: {},
  },

  // -------------------------------------------------------------------------
  // Tier 4
  // -------------------------------------------------------------------------
  impossible: {
    difficultyTier: 4,
    stanceRates: { regular: 0.6, fakie: 0.55, nollie: 0.4, switch: 0.35 },
    rotationModifiers: {
      "BS 180": 0.65,
      "FS 180": 0.6,
      "BS 360": 0.45,
      "FS 360": 0.4,
    },
    modifierPenalties: {},
  },

  "dolphin flip": {
    difficultyTier: 4,
    stanceRates: { regular: 0.55, fakie: 0.5, nollie: 0.35, switch: 0.3 },
    rotationModifiers: {
      "BS 180": 0.6,
      "FS 180": 0.55,
      "BS 360": 0.4,
      "FS 360": 0.35,
    },
    modifierPenalties: {},
  },

  "dolphin heel": {
    difficultyTier: 4,
    stanceRates: { regular: 0.52, fakie: 0.48, nollie: 0.32, switch: 0.28 },
    rotationModifiers: {
      "BS 180": 0.58,
      "FS 180": 0.52,
      "BS 360": 0.38,
      "FS 360": 0.32,
    },
    modifierPenalties: {},
  },

  "big flip": {
    difficultyTier: 4,
    stanceRates: { regular: 0.6, fakie: 0.55, nollie: 0.4, switch: 0.35 },
    rotationModifiers: { BS: 1.0 },
    modifierPenalties: {},
  },

  "big heel": {
    difficultyTier: 4,
    stanceRates: { regular: 0.58, fakie: 0.52, nollie: 0.38, switch: 0.32 },
    rotationModifiers: { FS: 1.0 },
    modifierPenalties: {},
  },

  biggerspin: {
    difficultyTier: 4,
    stanceRates: { regular: 0.45, fakie: 0.4, nollie: 0.28, switch: 0.22 },
    rotationModifiers: { BS: 1.0, FS: 0.85 },
    modifierPenalties: {},
  },

  // -------------------------------------------------------------------------
  // Tier 5
  // -------------------------------------------------------------------------
  "double kickflip": {
    difficultyTier: 5,
    stanceRates: { regular: 0.55, fakie: 0.5, nollie: 0.35, switch: 0.3 },
    rotationModifiers: {
      "BS 180": 0.55,
      "FS 180": 0.5,
      "BS 360": 0.35,
      "FS 360": 0.3,
    },
    modifierPenalties: {},
  },

  "double heelflip": {
    difficultyTier: 5,
    stanceRates: { regular: 0.52, fakie: 0.48, nollie: 0.32, switch: 0.28 },
    rotationModifiers: {
      "BS 180": 0.52,
      "FS 180": 0.48,
      "BS 360": 0.32,
      "FS 360": 0.28,
    },
    modifierPenalties: {},
  },

  "bigger flip": {
    difficultyTier: 5,
    stanceRates: { regular: 0.45, fakie: 0.4, nollie: 0.28, switch: 0.22 },
    rotationModifiers: { BS: 1.0 },
    modifierPenalties: {},
  },

  "bigger heel": {
    difficultyTier: 5,
    stanceRates: { regular: 0.42, fakie: 0.38, nollie: 0.25, switch: 0.2 },
    rotationModifiers: { FS: 1.0 },
    modifierPenalties: {},
  },

  "540 shuvit": {
    difficultyTier: 5,
    stanceRates: { regular: 0.38, fakie: 0.32, nollie: 0.22, switch: 0.16 },
    rotationModifiers: { BS: 1.0, FS: 0.82 },
    modifierPenalties: {},
  },

  "540 flip": {
    difficultyTier: 5,
    stanceRates: { regular: 0.35, fakie: 0.3, nollie: 0.2, switch: 0.15 },
    rotationModifiers: { BS: 1.0 },
    modifierPenalties: {},
  },

  "540 heel": {
    difficultyTier: 5,
    stanceRates: { regular: 0.32, fakie: 0.28, nollie: 0.18, switch: 0.12 },
    rotationModifiers: { FS: 1.0 },
    modifierPenalties: {},
  },

  "gazelle flip": {
    difficultyTier: 5,
    stanceRates: { regular: 0.3, fakie: 0.25, nollie: 0.15, switch: 0.1 },
    rotationModifiers: { BS: 1.0 },
    modifierPenalties: {},
  },

  "gazelle heel": {
    difficultyTier: 5,
    stanceRates: { regular: 0.28, fakie: 0.22, nollie: 0.12, switch: 0.08 },
    rotationModifiers: { FS: 1.0 },
    modifierPenalties: {},
  },

  "gazelle spin": {
    difficultyTier: 5,
    stanceRates: { regular: 0.3, fakie: 0.25, nollie: 0.15, switch: 0.1 },
    rotationModifiers: { BS: 1.0, FS: 0.8 },
    modifierPenalties: {},
  },
};
