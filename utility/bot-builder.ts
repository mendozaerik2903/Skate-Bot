import { BOT_PERSONAS } from "@/constants/bot-personas";
import { BotTrickSet, MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { DEFAULT_DIFFICULTY_VALUE } from "@/constants/difficulty";
import { Difficulty } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BotTrickEntry } from "./pool-builder";

export type PersonaCard = {
  type: "persona";
  id: string;
  name: string;
  styleDescription: string;
  poolFilter: (masterTricks: BotTrickSet) => BotTrickEntry[];
};

export type CustomCard = {
  type: "custom";
  id: string; // unique per card, e.g. "custom-1"
  name: string; // user-editable, defaults to "My Bot"
  savedPool: BotTrickEntry[] | null;
};

export type BotCard = PersonaCard | CustomCard;

export const DEFAULT_PERSONA_ID = "flatground-fred";

// ---------------------------------------------------------------------------
// Custom card storage
// Key schema: "customCards" -> JSON.stringify(CustomCard[])
// ---------------------------------------------------------------------------

const CUSTOM_CARDS_KEY = "customCards";

export async function loadCustomCards(): Promise<CustomCard[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_CARDS_KEY);
    if (!raw) return [getDefaultCustomCard()];
    const parsed: CustomCard[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : [getDefaultCustomCard()];
  } catch {
    return [getDefaultCustomCard()];
  }
}

export async function saveCustomCards(cards: CustomCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to save custom cards:", e);
  }
}

export async function upsertCustomCard(card: CustomCard): Promise<void> {
  const cards = await loadCustomCards();
  const index = cards.findIndex((c) => c.id === card.id);
  if (index >= 0) {
    cards[index] = card;
  } else {
    cards.push(card);
  }
  await saveCustomCards(cards);
}

// ---------------------------------------------------------------------------
// Default custom card
// Ships with one slot. savedPool: null triggers persona fallback seeding
// in the edit screen.
// ---------------------------------------------------------------------------

export function getDefaultCustomCard(): CustomCard {
  return {
    type: "custom",
    id: "custom-1",
    name: "My Bot",
    savedPool: null,
  };
}

// ---------------------------------------------------------------------------
// Full carousel builder
// Call this on screen mount. Merges hardcoded personas + saved custom cards.
// Shape: [...BOT_PERSONAS, ...customCards]
// ---------------------------------------------------------------------------

export async function buildCarousel(): Promise<BotCard[]> {
  const customCards = await loadCustomCards();
  return [...BOT_PERSONAS, ...customCards];
}

// ---------------------------------------------------------------------------
// Navigation payload type
// Consumed by the game screen to resolve the full BotTrickEntry pool.
// ---------------------------------------------------------------------------

export type GameConfig = {
  botCardId: string;
  botCardType: "persona" | "custom";
  // Continuous [0,1] scalar, applied to landRate for both persona and custom
  // pools. Never null in practice now — options.tsx always sends the current
  // slider value regardless of card type — but kept nullable for safety at
  // call sites that predate this change; falls back to DEFAULT_DIFFICULTY_VALUE.
  difficulty: Difficulty | null;
  turnOrder: "user" | "bot" | "roshambo";
};

// ---------------------------------------------------------------------------
// Game screen pool resolver
// Call this on game screen mount with the navigation payload.
// Returns the fully resolved BotTrickEntry[] ready for weighted sampling.
// ---------------------------------------------------------------------------

export async function resolveGamePool(
  config: GameConfig,
  // buildBotPool still passed in for custom card fallback seeding
  buildBotPoolFn: (trickSet: BotTrickSet) => BotTrickEntry[],
): Promise<BotTrickEntry[]> {
  const scalar = config.difficulty ?? DEFAULT_DIFFICULTY_VALUE;

  if (config.botCardType === "custom") {
    const cards = await loadCustomCards();
    const card = cards.find((c) => c.id === config.botCardId);
    if (card?.savedPool && card.savedPool.length > 0) {
      // Custom pool: difficulty scalar applied on top of the user's saved,
      // unscaled landRates — mirrors the same non-destructive multiplier
      // used for the live preview in options.tsx. sampleWeight matches the
      // scaled landRate so pick probability tracks the adjusted difficulty.
      return card.savedPool.map((entry) => {
        const scaledLandRate = entry.landRate * scalar;
        return {
          ...entry,
          landRate: scaledLandRate,
          sampleWeight: scaledLandRate,
        };
      });
    }
    // Fallback: seed from default persona if no saved pool exists
    const fallback = BOT_PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID)!;
    const fallbackPool = fallback.poolFilter(MASTER_BOT_TRICKS);
    return fallbackPool.map((entry) => ({
      ...entry,
      landRate: entry.landRate * scalar,
    }));
  }

  // Persona path: poolFilter now returns BotTrickEntry[] directly
  const persona = BOT_PERSONAS.find((p) => p.id === config.botCardId);
  if (!persona) throw new Error(`Unknown persona id: ${config.botCardId}`);

  const pool = persona.poolFilter(MASTER_BOT_TRICKS);

  // Apply difficulty scalar to landRate only — sampleWeight (pick probability)
  // is intentionally unchanged so persona character is preserved at all difficulties
  return pool.map((entry) => ({
    ...entry,
    landRate: entry.landRate * scalar,
  }));
}
