import { BOT_TRICKS } from '@/constants/bot-tricks';
import { Difficulty, Stance, Trick } from '@/constants/types';

export function attemptDefenseTrick(difficulty: Difficulty, trick: Trick) {
  const parts = trick.trim().split(" ");

  // Extract stance and base trick name
  let stance: Stance = "regular";
  let baseTrick = trick.toLowerCase();

  if (["fakie", "nollie", "switch"].includes(parts[0])) {
    stance = parts[0] as Stance;
    baseTrick = parts.slice(1).join(" ");
  }

  // Look up base trick
  const trickMap = BOT_TRICKS[difficulty];
  const stanceMap = trickMap[baseTrick.toLowerCase()];

  const landRate = stanceMap?.[stance] ?? 0;

  return Math.random() < landRate;
}