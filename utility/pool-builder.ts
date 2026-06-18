import { BotTrickSet } from "@/constants/bot-tricks";
import { Modifier, Rotation, Stance } from "@/constants/trick-options";
import { buildTrickName } from "./trick-manipulator";

export type BotTrickEntry = {
  fullString: string; // display string e.g. "fakie kickflip bs 180"
  baseStanceRate: number; // true land rate basis — never inflated by boost
  sampleWeight: number; // used for weighted sampling — boosted by boostTricks
  landRate: number; // baseStanceRate × rotationModifier — used for land attempt
  difficultyTier: 1 | 2 | 3 | 4 | 5; // inherited from base trick — drives progression window
  stance: Stance;
  trick: string;
  rotation: Rotation | "";
  modifier: Modifier | "";
};

// A trick requires rotation if ALL of its rotation keys are direction-only
// e.g. shuvit has { BS, FS } -> requiresRotation = true
// e.g. kickflip has { "BS 180", "FS 180" } -> requiresRotation = false
function requiresRotation(rotationKeys: string[]): boolean {
  if (rotationKeys.length === 0) return false;
  return rotationKeys.every((r) => r === "BS" || r === "FS");
}

export function buildBotPool(trickSet: BotTrickSet): BotTrickEntry[] {
  const pool: BotTrickEntry[] = [];

  for (const [trickName, trickData] of Object.entries(trickSet)) {
    const {
      difficultyTier,
      stanceRates,
      rotationModifiers,
      modifierPenalties,
    } = trickData;

    const rotationKeys = Object.keys(rotationModifiers) as (Rotation | "")[];
    const modifierKeys = Object.keys(modifierPenalties) as (Modifier | "")[];
    const needsRotation = requiresRotation(rotationKeys);

    for (const [stance, baseStanceRate] of Object.entries(stanceRates) as [
      Stance,
      number,
    ][]) {
      // Generate base trick (stance + trick only) for direction-optional tricks
      if (!needsRotation) {
        pool.push({
          fullString: buildTrickName({
            stance,
            trick: trickName,
            rotation: "",
            modifier: "",
            fullName: "",
          }),
          baseStanceRate,
          sampleWeight: baseStanceRate,
          landRate: baseStanceRate,
          difficultyTier,
          stance,
          trick: trickName,
          rotation: "",
          modifier: "",
        });

        // Base + modifier only (no rotation)
        for (const modifier of modifierKeys) {
          const modifierMultiplier =
            modifierPenalties[modifier as Modifier] ?? 1;
          const landRate = baseStanceRate * modifierMultiplier;
          pool.push({
            fullString: buildTrickName({
              stance,
              trick: trickName,
              rotation: "",
              modifier,
              fullName: "",
            }),
            baseStanceRate,
            sampleWeight: landRate,
            landRate,
            difficultyTier,
            stance,
            trick: trickName,
            rotation: "",
            modifier,
          });
        }
      }

      // Generate rotation-based entries (with and without modifiers)
      for (const rotation of rotationKeys) {
        const rotationMultiplier = rotationModifiers[rotation as Rotation] ?? 1;
        const landRate = baseStanceRate * rotationMultiplier;

        // Rotation only (no modifier)
        pool.push({
          fullString: buildTrickName({
            stance,
            trick: trickName,
            rotation,
            modifier: "",
            fullName: "",
          }),
          baseStanceRate,
          sampleWeight: landRate,
          landRate,
          difficultyTier,
          stance,
          trick: trickName,
          rotation,
          modifier: "",
        });

        // Full cartesian product: rotation + modifier
        for (const modifier of modifierKeys) {
          const modifierMultiplier =
            modifierPenalties[modifier as Modifier] ?? 1;
          const fullLandRate =
            baseStanceRate * rotationMultiplier * modifierMultiplier;
          pool.push({
            fullString: buildTrickName({
              stance,
              trick: trickName,
              rotation,
              modifier,
              fullName: "",
            }),
            baseStanceRate,
            sampleWeight: fullLandRate,
            landRate: fullLandRate,
            difficultyTier,
            stance,
            trick: trickName,
            rotation,
            modifier,
          });
        }
      }
    }
  }

  return pool;
}

// ---------------------------------------------------------------------------
// Compute the total sampleWeight of all entries in a given tier.
// Called once at game init to establish activeTierStartingWeight.
// ---------------------------------------------------------------------------

export function computeTierStartingWeight(
  pool: BotTrickEntry[],
  tier: 1 | 2 | 3 | 4 | 5,
): number {
  return pool
    .filter((e) => e.difficultyTier === tier)
    .reduce((sum, e) => sum + e.sampleWeight, 0);
}
