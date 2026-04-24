import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;

  // basic validation
  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: "Email, username and password are required" });
  }

  try {
    // check if user already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email or username already taken" });
    }

    // hash the password — 12 rounds is a good balance of security vs speed
    const password_hash = await bcrypt.hash(password, 12);

    // insert the new user
    const result = await pool.query(
      "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at",
      [email, username, password_hash],
    );

    const user = result.rows[0];

    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // find the user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // compare the submitted password against the stored hash
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, refreshToken],
    );

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

import authenticate from "../middleware/auth.js";

router.get("/me", authenticate, async (req, res) => {
  const result = await pool.query(
    "SELECT id, email, username, created_at FROM users WHERE id = $1",
    [req.user.userId],
  );
  res.status(200).json({ user: result.rows[0] });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    // verify the refresh token is valid
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // check it exists in the DB (hasn't been revoked)
    const result = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Refresh token revoked" });
    }

    // issue a new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/signout", authenticate, async (req, res) => {
  const { refreshToken } = req.body;

  await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
    refreshToken,
  ]);

  res.status(200).json({ message: "Signed out" });
});

export default router;
