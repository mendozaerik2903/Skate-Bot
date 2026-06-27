import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";
import {
  RawGameTurn,
  replayGameTurns,
  TrickHistoryEntry,
} from "../utility/replay-game-turns";

interface UseGameTrickHistoryResult {
  history: TrickHistoryEntry[];
  game: {
    id: string;
    won: boolean;
    bot_persona: string;
    score_word: string;
    created_at: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Fetches raw turns for a single game and replays them client-side into
// the same TrickHistoryEntry shape the post-game screen already uses, so
// `TrickHistoryList` can render historical matches with zero changes.
export function useGameTrickHistory(
  gameId: string | null,
): UseGameTrickHistoryResult {
  const [history, setHistory] = useState<TrickHistoryEntry[]>([]);
  const [game, setGame] = useState<UseGameTrickHistoryResult["game"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadTurns() {
      try {
        const response = await fetchWithAuth(`/games/${gameId}/turns`);
        if (!response.ok) throw new Error("Failed to fetch trick history");
        const data: {
          game: UseGameTrickHistoryResult["game"];
          turns: RawGameTurn[];
        } = await response.json();
        // console.log(data.turns);

        const { history: replayedHistory } = replayGameTurns(data.turns);

        if (isMounted) {
          setGame(data.game);
          setHistory(replayedHistory);
        }
      } catch (err) {
        if (isMounted)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTurns();
    return () => {
      isMounted = false;
    };
  }, [gameId]);

  return { history, game, isLoading, error };
}
