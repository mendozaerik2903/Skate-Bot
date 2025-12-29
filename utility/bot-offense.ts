import { BOT_TRICKS } from '@/constants/bot-tricks';
import { Difficulty, Stance } from '@/constants/types';

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomOffenseTrick(difficulty: Difficulty) {
    const trickSet = BOT_TRICKS[difficulty];
    const trickNames = Object.keys(trickSet);
    if (trickNames.length === 0 ) throw new Error("bot-offense.ts: No tricks available");

    const selectedTrick = getRandomItem(trickNames);
    const stanceNames = Object.keys(trickSet[selectedTrick]) as Stance[];
    if (stanceNames.length === 0) throw new Error("bot-offense.ts: No stances available for trick");

    const selectedStance = getRandomItem(stanceNames);
    const landRate = trickSet[selectedTrick][selectedStance] ?? 0; // 0 land rate as a fallback to undefined

    const trick = 
        selectedStance === "regular" ? selectedTrick
        : `${selectedStance} ${selectedTrick}`;

    return {
        trick,
        landRate
    };
}

function attemptOffenseTrick(landRate: number) {
    return Math.random() < landRate;
}

export function botOffenseTurn(difficulty: Difficulty) {
    const offenseResult = getRandomOffenseTrick(difficulty);
    const botOffenseTrick = offenseResult.trick;
    const botOffenseSuccess = attemptOffenseTrick(offenseResult.landRate);
    return {
        botOffenseTrick,
        botOffenseSuccess
    };
}
