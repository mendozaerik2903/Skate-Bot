import { DIFFICULTY_SCALARS, MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { TrickComponents } from "@/constants/trick-options";
import { Difficulty } from "@/constants/types";

export function attemptDefenseTrick(
  difficulty: Difficulty,
  trick: TrickComponents,
): boolean {
  const { stance, trick: trickName, rotation } = trick;

  const trickData = MASTER_BOT_TRICKS[trickName.toLowerCase()];

  // Bot has no entry for this trick — auto fail
  if (!trickData) return false;

  const baseStanceRate = trickData.stanceRates[stance] ?? 0;

  // Bot has no entry for this stance — auto fail
  if (baseStanceRate === 0) return false;

  const rotationMultiplier = rotation
    ? (trickData.rotationModifiers[rotation] ?? 0)
    : 1;

  // Modifiers stripped from bot pool — multiplier is always 1
  const difficultyScalar = DIFFICULTY_SCALARS[difficulty];
  const landRate = baseStanceRate * rotationMultiplier * difficultyScalar;

  return Math.random() < landRate;
}
