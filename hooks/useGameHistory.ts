import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";

export interface GameSummary {
  id: string;
  won: boolean;
  bot_persona: string;
  created_at: string;
}

export function useGameHistory(limit = 20) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGames() {
      try {
        const response = await fetchWithAuth(`/games?limit=${limit}`);
        if (!response.ok) throw new Error("Failed to fetch game history");
        const data: { games: GameSummary[] } = await response.json();
        if (isMounted) setGames(data.games);
      } catch (err) {
        if (isMounted)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadGames();
    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { games, isLoading, error };
}
