import { BotTrickSet } from "@/constants/bot-tricks";
import { BotTrickEntry, buildBotPool } from "@/utility/pool-builder";

function weightedSample(pool: BotTrickEntry[]): BotTrickEntry {
  const totalWeight = pool.reduce(
    (sum, entry) => sum + entry.baseStanceRate,
    0,
  );

  let random = Math.random() * totalWeight;

  for (const entry of pool) {
    random -= entry.baseStanceRate;
    if (random <= 0) return entry;
  }

  // Fallback — should never reach here but satisfies TypeScript
  return pool[pool.length - 1];
}

function attemptTrick(landRate: number): boolean {
  return Math.random() < landRate;
}

export function botOffenseTurn(
  pool: BotTrickEntry[],
  trickSet: BotTrickSet,
): {
  entry: BotTrickEntry;
  success: boolean;
  updatedPool: BotTrickEntry[];
  poolWasReset: boolean;
} {
  let currentPool = pool;
  let poolWasReset = false;

  // Rebuild pool if exhausted
  if (currentPool.length === 0) {
    currentPool = buildBotPool(trickSet);
    poolWasReset = true;
  }

  const entry = weightedSample(currentPool);
  const success = attemptTrick(entry.landRate);

  // Only exhaust the trick if it was successfully landed on offense
  const updatedPool = success
    ? currentPool.filter((e) => e.fullString !== entry.fullString)
    : currentPool;

  return {
    entry,
    success,
    updatedPool,
    poolWasReset,
  };
}
