import { Router } from "express";
import pool from "../db.js";
import authenticate from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, user_id, name, description, latitude, longitude, created_at FROM spots ORDER BY created_at DESC",
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, async (req, res) => {
  const { name, description, latitude, longitude } = req.body;

  if (!name || !latitude || !longitude) {
    return res
      .status(400)
      .json({ error: "Name, latitude and longitude are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO spots (user_id, name, description, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.userId, name, description, latitude, longitude],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM spots WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Spot not found or not yours" });
    }

    res.status(200).json({ message: "Spot deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
