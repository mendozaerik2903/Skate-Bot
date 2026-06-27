import { Router } from "express";
import pool from "../db.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// GET /games
// Returns the current user's games, most recent first. Used to populate
// the recent match card and match history list on the Skate tab.
router.get("/", authenticate, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    const result = await pool.query(
      "SELECT id, won, bot_persona, score_word, created_at FROM games WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
      [req.user.userId, limit],
    );
    res.status(200).json({ games: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /games/stats
// Aggregate stats for the stats strip: total record, current streak,
// last-5 results, and most-landed trick.
router.get("/stats", authenticate, async (req, res) => {
  try {
    const recordResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE won) AS wins,
         COUNT(*) FILTER (WHERE NOT won) AS losses
       FROM games
       WHERE user_id = $1`,
      [req.user.userId],
    );

    const recentResult = await pool.query(
      "SELECT won FROM games WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [req.user.userId],
    );

    const mostLandedResult = await pool.query(
      `SELECT gt.trick_name, COUNT(*) AS land_count
       FROM game_turns gt
       JOIN games g ON g.id = gt.game_id
       WHERE g.user_id = $1 AND gt.is_user_turn = true AND gt.landed = true
       GROUP BY gt.trick_name
       ORDER BY land_count DESC
       LIMIT 1`,
      [req.user.userId],
    );

    const last5 = recentResult.rows.map((row) => row.won);
    const currentStreak = computeCurrentStreak(last5);
    const wins = Number(recordResult.rows[0].wins);
    const losses = Number(recordResult.rows[0].losses);

    res.status(200).json({
      wins,
      losses,
      last5,
      currentStreak,
      mostLandedTrick: mostLandedResult.rows[0]?.trick_name ?? null,
      hasPlayedGames: wins + losses > 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /games/:id/turns
// Raw turns for a single game, ordered by turn number. The frontend
// replays these through replayGameTurns to build the TrickHistoryEntry
// list — no derived data is computed here.
router.get("/:id/turns", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const gameResult = await pool.query(
      "SELECT id, won, bot_persona, score_word, created_at FROM games WHERE id = $1 AND user_id = $2",
      [id, req.user.userId],
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    const turnsResult = await pool.query(
      "SELECT turn_number, is_offense, is_user_turn, trick_name, landed FROM game_turns WHERE game_id = $1 ORDER BY turn_number ASC",
      [id],
    );

    res.status(200).json({
      game: gameResult.rows[0],
      turns: turnsResult.rows.map((t) => ({
        turnNumber: t.turn_number,
        isOffense: t.is_offense,
        isUserTurn: t.is_user_turn,
        trickName: t.trick_name,
        landed: t.landed,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /games
// Persists a completed match: one row in `games`, one row per turn in
// `game_turns`. Sent as a single batch when the match ends, not
// incrementally during play.
router.post("/", authenticate, async (req, res) => {
  const { won, botPersona, scoreWord, turns } = req.body;

  if (
    typeof won !== "boolean" ||
    !botPersona ||
    !scoreWord ||
    !Array.isArray(turns) ||
    turns.length === 0
  ) {
    return res.status(400).json({
      error:
        "won, botPersona, scoreWord, and a non-empty turns array are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const gameResult = await client.query(
      "INSERT INTO games (user_id, won, bot_persona, score_word) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
      [req.user.userId, won, botPersona, scoreWord],
    );
    const gameId = gameResult.rows[0].id;

    // Build a single multi-row INSERT instead of N round trips.
    const placeholders = [];
    const values = [];
    turns.forEach((turn, index) => {
      const offset = index * 6;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`,
      );
      values.push(
        gameId,
        turn.turnNumber,
        turn.isOffense,
        turn.isUserTurn,
        turn.trickName,
        turn.landed,
      );
    });

    await client.query(
      `INSERT INTO game_turns (game_id, turn_number, is_offense, is_user_turn, trick_name, landed) VALUES ${placeholders.join(", ")}`,
      values,
    );

    await client.query("COMMIT");

    res.status(201).json({
      id: gameId,
      createdAt: gameResult.rows[0].created_at,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Streak = count of consecutive identical results from most recent
// backward. Stops at the first result that breaks the streak.
function computeCurrentStreak(recentResultsNewestFirst) {
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

export default router;
