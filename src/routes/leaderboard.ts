import { Router } from "express";
import { getLeaderboard } from "../store.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/leaderboard – get ranked leaderboard                     */
/* ------------------------------------------------------------------ */
router.get("/", (req, res) => {
  const { game, player_id, page, page_size } = req.query;

  if (!game) {
    res.status(400).json({ error: "game parameter is required" });
    return;
  }

  const leaderboardParams = {
    game: game as string,
    player_id: player_id as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    page_size: page_size ? parseInt(page_size as string, 10) : undefined,
  };

  const result = getLeaderboard(leaderboardParams);

  if (!result) {
    res.status(400).json({ error: "Invalid leaderboard parameters" });
    return;
  }

  // If player_id was requested but not found, return 404
  if (player_id && !result.playerRank) {
    res.status(404).json({ error: "Player not found on leaderboard" });
    return;
  }

  res.json(result);
});

export default router;
