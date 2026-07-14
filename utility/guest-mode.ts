import AsyncStorage from "@react-native-async-storage/async-storage";
import { GUEST_BOT_CARDS_KEY } from "./bot-builder";

const GUEST_MODE_KEY = "guestMode";
const GUEST_MATCH_HISTORY_KEY = "guestMatchHistory";

// Mirrors the POST /games request body exactly (won, botPersona, scoreWord,
// turns), plus a locally generated id/createdAt so a guest match can be
// rendered through the same GameSummary-shaped UI as a real backend game
// before it's ever uploaded. Turn fields match the GET /games/:id/turns
// response shape (RawGameTurn) so they can be replayed client-side with
// zero transform via replayGameTurns().
export type GuestTurn = {
  turnNumber: number;
  isOffense: boolean;
  isUserTurn: boolean;
  trickName: string;
  landed: boolean;
};

export type GuestMatchRecord = {
  id: string;
  won: boolean;
  botPersona: string;
  scoreWord: string;
  turns: GuestTurn[];
  createdAt: string;
};

export async function isGuestMode(): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
  return value === "true";
}

export async function setGuestMode(active: boolean): Promise<void> {
  if (active) {
    await AsyncStorage.setItem(GUEST_MODE_KEY, "true");
  } else {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }
}

export async function getGuestMatchHistory(): Promise<GuestMatchRecord[]> {
  const raw = await AsyncStorage.getItem(GUEST_MATCH_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GuestMatchRecord[];
  } catch {
    return [];
  }
}

// Stored newest-first, matching the ordering the backend's GET /games
// returns (ORDER BY created_at DESC), so guest and real history behave
// identically to every screen that consumes it.
export async function appendGuestMatch(
  match: Omit<GuestMatchRecord, "id" | "createdAt">,
): Promise<void> {
  const existing = await getGuestMatchHistory();
  const record: GuestMatchRecord = {
    ...match,
    id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    GUEST_MATCH_HISTORY_KEY,
    JSON.stringify([record, ...existing]),
  );
}

// Wipes the guest flag, match history, AND locally-stored bot cards. Used
// for both "Log out of guest mode" (data is gone for good — including bot
// key, otherwise the next guest session on this device would inherit this
// guest's bots) and post-signup migration cleanup (data has already been
// uploaded/migrated, local copies are now redundant).
export async function clearGuestData(): Promise<void> {
  await AsyncStorage.multiRemove([
    GUEST_MODE_KEY,
    GUEST_MATCH_HISTORY_KEY,
    GUEST_BOT_CARDS_KEY,
  ]);
}