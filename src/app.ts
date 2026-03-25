import express from "express";
import authRoutes from "./routes/auth.js";
import tournamentRoutes from "./routes/tournaments.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tournaments", tournamentRoutes);

  return app;
}
