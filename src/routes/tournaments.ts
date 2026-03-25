import { Router } from "express";
import { z } from "zod";
import { BracketValidationError, buildSingleEliminationBracket } from "../bracket/singleElimination.js";
import type { BracketPlayer } from "../types.js";
import { addEntrant, createTournament, getEntrants, getTournament, getUserById } from "../store.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireOrganizer } from "../middleware/auth.js";

const router = Router();

const createTournamentSchema = z.object({
  name: z.string().min(1).max(200),
  game: z.string().min(1).max(120),
});

router.post("/", requireAuth, requireOrganizer, (req: AuthedRequest, res) => {
  const parsed = createTournamentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const tournament = createTournament({
    name: parsed.data.name,
    game: parsed.data.game,
    organizerId: req.userId!,
  });
  res.status(201).json({
    id: tournament.id,
    name: tournament.name,
    game: tournament.game,
  });
});

router.post("/:id/register", requireAuth, (req: AuthedRequest, res) => {
  const tournament = getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  const user = getUserById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const existing = getEntrants(tournament.id).some((e) => e.userId === user.id);
  if (existing) {
    res.status(409).json({ error: "Already registered for this tournament" });
    return;
  }
  addEntrant(tournament.id, {
    userId: user.id,
    displayName: user.displayName,
    registeredAt: new Date().toISOString(),
  });
  res.status(201).json({
    tournamentId: tournament.id,
    userId: user.id,
    displayName: user.displayName,
  });
});

const bracketBodySchema = z
  .object({
    players: z
      .array(
        z.object({
          userId: z.string().uuid(),
          displayName: z.string().min(1),
        })
      )
      .optional(),
  })
  .optional();

router.post("/:id/bracket", requireAuth, requireOrganizer, (req: AuthedRequest, res) => {
  const parsed = bracketBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const tournament = getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  let players: BracketPlayer[];
  if (parsed.data?.players?.length) {
    players = parsed.data.players;
  } else {
    players = getEntrants(tournament.id).map((e) => ({
      userId: e.userId,
      displayName: e.displayName,
    }));
  }

  try {
    const bracket = buildSingleEliminationBracket(tournament.id, players);
    res.status(200).json(bracket);
  } catch (e) {
    if (e instanceof BracketValidationError) {
      res.status(400).json({ error: e.message });
      return;
    }
    throw e;
  }
});

router.get("/:id", (req, res) => {
  const tournament = getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  res.json({
    id: tournament.id,
    name: tournament.name,
    game: tournament.game,
    entrantCount: getEntrants(tournament.id).length,
  });
});

export default router;
