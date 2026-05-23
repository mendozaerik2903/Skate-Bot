import { BOT_TRICKS } from "@/constants/bot-tricks";
import { TrickComponents } from "@/constants/trick-options";
import { Difficulty } from "@/constants/types";

export function attemptDefenseTrick(
  difficulty: Difficulty,
  trick: TrickComponents,
): boolean {
  const { stance, trick: trickName, rotation, modifier } = trick;

  const trickSet = BOT_TRICKS[difficulty];
  const trickData = trickSet[trickName.toLowerCase()];

  // Bot has no entry for this trick at this difficulty — auto fail
  if (!trickData) return false;

  const baseStanceRate = trickData.stanceRates[stance] ?? 0;

  // Bot has no entry for this stance at this difficulty — auto fail
  if (baseStanceRate === 0) return false;

  const rotationMultiplier = rotation
    ? (trickData.rotationModifiers[rotation] ?? 0)
    : 1;

  const modifierMultiplier = modifier
    ? (trickData.modifierPenalties[modifier] ?? 0)
    : 1;

  const landRate = baseStanceRate * rotationMultiplier * modifierMultiplier;

  return Math.random() < landRate;
}
