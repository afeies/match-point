import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireOrganizer } from "../middleware/auth.js";
import {
  createReplay,
  getReplayById,
  getTournament,
  validateReplayFileSize,
  searchReplays,
} from "../store.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/replays – search and browse replays                      */
/* ------------------------------------------------------------------ */
router.get("/", (req, res) => {
  const { game, event_id, player_name, page, page_size } = req.query;

  const searchParams = {
    game: game as string | undefined,
    event_id: event_id as string | undefined,
    player_name: player_name as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    page_size: page_size ? parseInt(page_size as string, 10) : undefined,
  };

  const results = searchReplays(searchParams);
  res.json(results);
});

/* ------------------------------------------------------------------ */
/*  POST /api/replays – upload replay                                 */
/* ------------------------------------------------------------------ */
const createReplaySchema = z.object({
  tournamentId: z.string().uuid(),
  title: z.string().min(1).max(200),
  game: z.string().min(1).max(120),
  playerNames: z.array(z.string().min(1).max(120)).min(1),
  videoUrl: z.string().url(),
  fileSize: z.number().int().positive(),
});

router.post("/", requireAuth, requireOrganizer, (req: AuthedRequest, res) => {
  const parsed = createReplaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { tournamentId, title, game, playerNames, videoUrl, fileSize } = parsed.data;

  // Check file size
  if (!validateReplayFileSize(fileSize)) {
    res.status(413).json({ error: "File size exceeds the 2GB limit" });
    return;
  }

  // Check tournament exists
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  // Check organizer owns tournament
  if (tournament.organizerId !== req.userId) {
    res.status(403).json({ error: "You can only upload replays for your own tournaments" });
    return;
  }

  const replay = createReplay({
    tournamentId,
    title,
    game,
    playerNames,
    uploadedBy: req.userId!,
    videoUrl,
    fileSize,
  });

  res.status(201).json(replay);
});

/* ------------------------------------------------------------------ */
/*  GET /api/replays/:id – get replay by ID                           */
/* ------------------------------------------------------------------ */
router.get("/:id", (req, res) => {
  const replay = getReplayById(req.params.id);
  if (!replay) {
    res.status(404).json({ error: "Replay not found" });
    return;
  }
  res.json(replay);
});

export default router;
