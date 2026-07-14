import { Router } from "express";
import pool from "../db.js";
import authenticate from "../middleware/auth.js";

const router = Router();

// GET /profile
// Favorite trick + favorite spot + last active (derived from the user's
// most recent game — no dedicated column for it).
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         up.favorite_trick_name,
         s.id AS spot_id,
         s.name AS spot_name,
         s.latitude AS spot_latitude,
         s.longitude AS spot_longitude,
         (SELECT MAX(created_at) FROM games WHERE user_id = $1) AS last_active
       FROM users u
       LEFT JOIN user_profile up ON up.user_id = u.id
       LEFT JOIN spots s ON s.id = up.favorite_spot_id
       WHERE u.id = $1`,
      [req.user.userId],
    );

    const row = result.rows[0];

    res.status(200).json({
      favoriteTrickName: row?.favorite_trick_name ?? null,
      favoriteSpot: row?.spot_id
        ? {
            id: row.spot_id,
            name: row.spot_name,
            latitude: row.spot_latitude,
            longitude: row.spot_longitude,
          }
        : null,
      lastActive: row?.last_active ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /profile
// Partial update. Upsert since a user_profile row won't exist yet for
// pre-existing users — COALESCE keeps whichever field wasn't sent.
router.patch("/", authenticate, async (req, res) => {
  const { favoriteTrickName, favoriteSpotId } = req.body;

  if (favoriteTrickName === undefined && favoriteSpotId === undefined) {
    return res
      .status(400)
      .json({ error: "favoriteTrickName or favoriteSpotId is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_profile (user_id, favorite_trick_name, favorite_spot_id, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET
         favorite_trick_name = COALESCE($2, user_profile.favorite_trick_name),
         favorite_spot_id = COALESCE($3, user_profile.favorite_spot_id),
         updated_at = now()
       RETURNING favorite_trick_name, favorite_spot_id`,
      [req.user.userId, favoriteTrickName ?? null, favoriteSpotId ?? null],
    );

    res.status(200).json({
      favoriteTrickName: result.rows[0].favorite_trick_name,
      favoriteSpotId: result.rows[0].favorite_spot_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;