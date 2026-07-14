import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";
import { getGuestMatchHistory, isGuestMode } from "../utility/guest-mode";

export interface GameStats {
  wins: number;
  losses: number;
  last5: boolean[]; // newest first
  currentStreak: { count: number; type: "W" | "L" | null };
  mostLandedTrick: string | null;
  hasPlayedGames: boolean;
}

// Mirrors computeCurrentStreak() in routes/games.js exactly, so guest and
// real-user stats behave identically.
function computeCurrentStreak(recentResultsNewestFirst: boolean[]): {
  count: number;
  type: "W" | "L" | null;
} {
  if (recentResultsNewestFirst.length === 0) {
    return { count: 0, type: null };
  }

  const latest = recentResultsNewestFirst[0];
  let count = 0;
  for (const result of recentResultsNewestFirst) {
    if (result !== latest) break;
    count += 1;
  }

  return { count, type: latest ? "W" : "L" };
}

async function computeGuestStats(): Promise<GameStats> {
  const matches = await getGuestMatchHistory(); // newest-first

  const wins = matches.filter((m) => m.won).length;
  const losses = matches.length - wins;
  const last5 = matches.slice(0, 5).map((m) => m.won);
  const currentStreak = computeCurrentStreak(last5);

  // Same grouping as the backend's mostLandedResult query: only the
  // user's own landed tricks count, grouped by trick name.
  const landCounts = new Map<string, number>();
  for (const match of matches) {
    for (const turn of match.turns) {
      if (turn.isUserTurn && turn.landed) {
        landCounts.set(
          turn.trickName,
          (landCounts.get(turn.trickName) ?? 0) + 1,
        );
      }
    }
  }
  let mostLandedTrick: string | null = null;
  let highestCount = 0;
  for (const [trick, count] of landCounts) {
    if (count > highestCount) {
      mostLandedTrick = trick;
      highestCount = count;
    }
  }

  return {
    wins,
    losses,
    last5,
    currentStreak,
    mostLandedTrick,
    hasPlayedGames: wins + losses > 0,
  };
}

export function useGameStats() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        if (await isGuestMode()) {
          const guestStats = await computeGuestStats();
          if (isMounted) setStats(guestStats);
          return;
        }

        const response = await fetchWithAuth("/games/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data: GameStats = await response.json();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, isLoading, error };
}