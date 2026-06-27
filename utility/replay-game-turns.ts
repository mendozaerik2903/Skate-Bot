// Lives alongside your other pure helpers (pool-filters.ts etc.) since it
// has no side effects and no dependency on game.tsx — it can be unit tested
// on a plain array of turns.
//
// Mirrors game.tsx's actual TrickHistoryEntry shape (trick, performer,
// offense, landed, performerScore, turn) so the existing TrickHistoryList
// component can render replayed history with zero changes.

import { TrickHistoryEntry } from "@/constants/types";

export interface RawGameTurn {
  turnNumber: number;
  isOffense: boolean;
  isUserTurn: boolean;
  trickName: string;
  landed: boolean;
}

// Replays turns in order and reconstructs each entry's performerScore:
// the performer's own letter count immediately after that turn resolves.
//
// A letter is assigned when a DEFENSE turn (isOffense === false) is
// missed — the defender failing to copy the trick is who takes the
// letter. This matches game.tsx's addLetter calls inside botResult /
// userResult exactly (confirmed against the live scoring logic).
export function replayGameTurns(turns: RawGameTurn[]): {
  history: TrickHistoryEntry[];
  finalUserLetters: number;
  finalBotLetters: number;
} {
  let userLetters = 0;
  let botLetters = 0;

  const history: TrickHistoryEntry[] = turns.map((turn) => {
    if (!turn.isOffense && !turn.landed) {
      if (turn.isUserTurn) {
        userLetters += 1;
      } else {
        botLetters += 1;
      }
    }

    return {
      turn: turn.turnNumber,
      trick: turn.trickName,
      performer: turn.isUserTurn ? "user" : "bot",
      offense: turn.isOffense,
      landed: turn.landed,
      // The performer's own running letter count after this turn —
      // not whoever actually got the letter on this specific turn.
      performerScore: turn.isUserTurn ? userLetters : botLetters,
    };
  });

  return {
    history,
    finalUserLetters: userLetters,
    finalBotLetters: botLetters,
  };
}
export { TrickHistoryEntry };

