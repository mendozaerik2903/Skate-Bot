import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";

export interface GameStats {
  wins: number;
  losses: number;
  last5: boolean[]; // newest first
  currentStreak: { count: number; type: "W" | "L" | null };
  mostLandedTrick: string | null;
  hasPlayedGames: boolean;
}

export function useGameStats() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
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
