import { BotTrickSet } from "@/constants/bot-tricks";
import { Modifier, Rotation, Stance } from "@/constants/trick-options";
import { buildTrickName } from "./trick-manipulator";

export type BotTrickEntry = {
  fullString: string; // exhaustion key + display string e.g. "fakie kickflip bs 180 late"
  baseStanceRate: number; // used for weighted sampling
  landRate: number; // baseStanceRate × rotationModifier × modifierPenalty
  stance: Stance;
  trick: string;
  rotation: Rotation | "";
  modifier: Modifier | "";
};

// A trick requires rotation if ALL of its rotation keys are direction-only
// e.g. shuvit has { BS, FS } → requiresRotation = true
// e.g. kickflip has { "BS 180", "FS 180" } → requiresRotation = false
function requiresRotation(rotationKeys: string[]): boolean {
  if (rotationKeys.length === 0) return false;
  return rotationKeys.every((r) => r === "BS" || r === "FS");
}

export function buildBotPool(trickSet: BotTrickSet): BotTrickEntry[] {
  const pool: BotTrickEntry[] = [];

  for (const [trickName, trickData] of Object.entries(trickSet)) {
    const { stanceRates, rotationModifiers, modifierPenalties } = trickData;

    const rotationKeys = Object.keys(rotationModifiers) as (Rotation | "")[];
    const modifierKeys = Object.keys(modifierPenalties) as (Modifier | "")[];
    const needsRotation = requiresRotation(rotationKeys);

    for (const [stance, baseStanceRate] of Object.entries(stanceRates) as [
      Stance,
      number,
    ][]) {
      // Generate bare entry (stance + trick only) for direction-optional tricks
      if (!needsRotation) {
        pool.push({
          fullString: buildTrickName({
            stance,
            trick: trickName,
            rotation: "",
            modifier: "",
          }),
          baseStanceRate,
          landRate: baseStanceRate,
          stance,
          trick: trickName,
          rotation: "",
          modifier: "",
        });

        // Bare + modifier only (no rotation)
        for (const modifier of modifierKeys) {
          const modifierMultiplier =
            modifierPenalties[modifier as Modifier] ?? 1;
          pool.push({
            fullString: buildTrickName({
              stance,
              trick: trickName,
              rotation: "",
              modifier,
            }),
            baseStanceRate,
            landRate: baseStanceRate * modifierMultiplier,
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

        // Rotation only (no modifier)
        pool.push({
          fullString: buildTrickName({
            stance,
            trick: trickName,
            rotation,
            modifier: "",
          }),
          baseStanceRate,
          landRate: baseStanceRate * rotationMultiplier,
          stance,
          trick: trickName,
          rotation,
          modifier: "",
        });

        // Full cartesian product: rotation + modifier
        for (const modifier of modifierKeys) {
          const modifierMultiplier =
            modifierPenalties[modifier as Modifier] ?? 1;
          pool.push({
            fullString: buildTrickName({
              stance,
              trick: trickName,
              rotation,
              modifier,
            }),
            baseStanceRate,
            landRate: baseStanceRate * rotationMultiplier * modifierMultiplier,
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
