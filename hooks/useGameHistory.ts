import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";
import { getGuestMatchHistory, isGuestMode } from "../utility/guest-mode";

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
        // Guest matches live in AsyncStorage, already stored newest-first —
        // map to the same GameSummary shape the backend returns so the
        // Skate tab doesn't need to know which source it's reading from.
        if (await isGuestMode()) {
          const guestMatches = await getGuestMatchHistory();
          const guestGames: GameSummary[] = guestMatches
            .slice(0, limit)
            .map((match) => ({
              id: match.id,
              won: match.won,
              bot_persona: match.botPersona,
              created_at: match.createdAt,
            }));
          if (isMounted) setGames(guestGames);
          return;
        }

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