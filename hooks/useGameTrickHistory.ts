import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";
import { getGuestMatchHistory, isGuestMode } from "../utility/guest-mode";
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
        // Guest match turns are already stored in the same shape the
        // backend's /turns endpoint returns (RawGameTurn), so they replay
        // through the exact same function — no transform needed.
        if (await isGuestMode()) {
          const matches = await getGuestMatchHistory();
          const match = matches.find((m) => m.id === gameId);
          if (!match) throw new Error("Game not found");

          const { history: replayedHistory } = replayGameTurns(
            match.turns as RawGameTurn[],
          );

          if (isMounted) {
            setGame({
              id: match.id,
              won: match.won,
              bot_persona: match.botPersona,
              score_word: match.scoreWord,
              created_at: match.createdAt,
            });
            setHistory(replayedHistory);
          }
          return;
        }

        const response = await fetchWithAuth(`/games/${gameId}/turns`);
        if (!response.ok) throw new Error("Failed to fetch trick history");
        const data: {
          game: UseGameTrickHistoryResult["game"];
          turns: RawGameTurn[];
        } = await response.json();

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