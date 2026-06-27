import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.js";
import gamesRoutes from "./routes/games.js";
import spotRoutes from "./routes/spots.js";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/spots", spotRoutes);
app.use("/games", gamesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
