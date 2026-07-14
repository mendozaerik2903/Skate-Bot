import { BOT_PERSONAS } from "@/constants/bot-personas";
import { MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { DEFAULT_DIFFICULTY_VALUE } from "@/constants/difficulty";
import { Difficulty } from "@/constants/types";
import { getCurrentUserId } from "@/utility/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BotTrickEntry } from "./pool-builder";

// ---------------------------------------------------------------------------
// Unified BotCard type
// Every bot — starter-pack or user-created — is the same shape and equally
// editable/deletable. isStarterPack is cosmetic only (badge on the card).
// ---------------------------------------------------------------------------

export type BotCard = {
  id: string;
  name: string;
  description: string;
  avatarEmoji: string;
  savedPool: BotTrickEntry[] | null;
  advancedMode: boolean; // shows/hides the sampleWeight slider in the editor
  isStarterPack: boolean;
};

// ---------------------------------------------------------------------------
// Storage — scoped per account
// Key schema: "botCards:<userId>" for signed-in accounts, "botCards:guest"
// for guest mode. Every account (including a fresh guest session) starts
// with its own seeded starter pack — bots never leak between accounts
// sharing a device.
// ---------------------------------------------------------------------------

// Exported so guest-mode.ts's clearGuestData() can wipe this alongside the
// guest flag/match history when a guest logs out for good — otherwise a
// second guest on the same device would inherit the first guest's bots.
export const GUEST_BOT_CARDS_KEY = "botCards:guest";

async function getBotCardsStorageKey(): Promise<string> {
  const userId = await getCurrentUserId();
  if (userId !== null) return `botCards:${userId}`;
  return GUEST_BOT_CARDS_KEY;
}

export function getDefaultNewBotCard(): BotCard {
  return {
    id: `bot-${Date.now()}`,
    name: "New Bot",
    description: "",
    avatarEmoji: "🛹",
    savedPool: null,
    advancedMode: false,
    isStarterPack: false,
  };
}

// Materialize a hardcoded persona's poolFilter into saved data, once.
function materializePersona(persona: (typeof BOT_PERSONAS)[number]): BotCard {
  const pool = persona.poolFilter(MASTER_BOT_TRICKS);
  return {
    id: persona.id,
    name: persona.name,
    description: persona.styleDescription,
    avatarEmoji: "🤖",
    savedPool: pool,
    advancedMode: false,
    isStarterPack: true,
  };
}

// Every fresh account (real or guest) gets its own materialized starter pack.
async function seedStarterCards(): Promise<BotCard[]> {
  const starterCards = BOT_PERSONAS.map(materializePersona);
  await saveBotCards(starterCards);
  return starterCards;
}

export async function loadBotCards(): Promise<BotCard[]> {
  try {
    const key = await getBotCardsStorageKey();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return seedStarterCards();
    const parsed: BotCard[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : seedStarterCards();
  } catch (e) {
    console.error("Failed to load bot cards:", e);
    return seedStarterCards();
  }
}

export async function saveBotCards(cards: BotCard[]): Promise<void> {
  try {
    const key = await getBotCardsStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to save bot cards:", e);
  }
}

// Returns the full, updated card list so callers can setState directly.
export async function upsertBotCard(card: BotCard): Promise<BotCard[]> {
  const cards = await loadBotCards();
  const index = cards.findIndex((c) => c.id === card.id);
  if (index >= 0) {
    cards[index] = card;
  } else {
    cards.push(card);
  }
  await saveBotCards(cards);
  return cards;
}

// Returns null if the delete was blocked (would remove the last bot).
export async function deleteBotCard(id: string): Promise<BotCard[] | null> {
  const cards = await loadBotCards();
  if (cards.length <= 1) return null;
  const updated = cards.filter((c) => c.id !== id);
  await saveBotCards(updated);
  return updated;
}

// Persist a new order after a long-press drag reorder on the carousel.
// Order is implicit in array position — no separate `order` field needed.
export async function reorderBotCards(cards: BotCard[]): Promise<void> {
  await saveBotCards(cards);
}

// ---------------------------------------------------------------------------
// Guest → account migration
// Called from the signup flow, AFTER saveTokens() so getCurrentUserId()
// (and therefore getBotCardsStorageKey()) already resolves to the new
// account. Moves the guest's local bot list onto the new account's key,
// then clears the guest copy — mirrors the "local data is redundant once
// migrated" pattern already used for guest match history.
// ---------------------------------------------------------------------------

export async function migrateGuestBotsToAccount(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_BOT_CARDS_KEY);
    if (!raw) return;
    const guestCards: BotCard[] = JSON.parse(raw);
    if (guestCards.length === 0) return;
    await saveBotCards(guestCards); // writes under the now-current account's key
    await AsyncStorage.removeItem(GUEST_BOT_CARDS_KEY);
  } catch (e) {
    console.error("Failed to migrate guest bots:", e);
  }
}

// ---------------------------------------------------------------------------
// Carousel builder — call on options.tsx focus
// ---------------------------------------------------------------------------

export async function buildCarousel(): Promise<BotCard[]> {
  return loadBotCards();
}

// ---------------------------------------------------------------------------
// Navigation payload — every card resolves identically
// ---------------------------------------------------------------------------

export type GameConfig = {
  botCardId: string;
  difficulty: Difficulty | null;
  turnOrder: "user" | "bot" | "roshambo";
};

// ---------------------------------------------------------------------------
// Game screen pool resolver
// Difficulty scalar applies to landRate ONLY, for every bot — sampleWeight
// (pick-rate) is never touched, whether or not advancedMode is on. This
// keeps a bot's "character" (what it likes to throw) stable across
// difficulty while land-success still gets harder/easier.
// ---------------------------------------------------------------------------

export async function resolveGamePool(
  config: GameConfig,
): Promise<BotTrickEntry[]> {
  const scalar = config.difficulty ?? DEFAULT_DIFFICULTY_VALUE;
  const cards = await loadBotCards();
  const card = cards.find((c) => c.id === config.botCardId);
  if (!card) throw new Error(`Unknown bot card id: ${config.botCardId}`);

  // Fallback: an unconfigured bot (savedPool null/empty) falls back to the
  // first starter-pack bot's pool rather than starting a game with nothing.
  const pool =
    card.savedPool && card.savedPool.length > 0
      ? card.savedPool
      : (cards.find((c) => c.isStarterPack)?.savedPool ?? []);

  return pool.map((entry) => ({
    ...entry,
    landRate: entry.landRate * scalar,
    // sampleWeight intentionally left untouched — never scaled by difficulty
  }));
}