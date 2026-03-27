import { Router } from "express";
import { z } from "zod";
import { BracketValidationError, buildSingleEliminationBracket } from "../bracket/singleElimination.js";
import type { BracketPlayer } from "../types.js";
import {
  addEntrant,
  createTournament,
  getEntrants,
  getTournament,
  getTournamentBracket,
  getUserById,
  listTournaments,
  setTournamentBracket,
  updateTournament,
} from "../store.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireOrganizer } from "../middleware/auth.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/tournaments – list all tournaments                       */
/* ------------------------------------------------------------------ */
router.get("/", (_req, res) => {
  const items = listTournaments().map((t) => ({
    id: t.id,
    name: t.name,
    game: t.game,
    entrantCount: getEntrants(t.id).length,
    maxEntrants: t.maxEntrants,
    registrationOpen: t.registrationOpen,
    createdAt: t.createdAt,
  }));
  res.json(items);
});

/* ------------------------------------------------------------------ */
/*  POST /api/tournaments – create a tournament (organizer only)      */
/* ------------------------------------------------------------------ */
const createTournamentSchema = z.object({
  name: z.string().min(1).max(200),
  game: z.string().min(1).max(120),
  maxEntrants: z.number().int().min(2).optional(),
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
    maxEntrants: parsed.data.maxEntrants ?? null,
  });
  res.status(201).json({
    id: tournament.id,
    name: tournament.name,
    game: tournament.game,
    maxEntrants: tournament.maxEntrants,
    registrationOpen: tournament.registrationOpen,
  });
});

/* ------------------------------------------------------------------ */
/*  GET /api/tournaments/:id/bracket                                  */
/* ------------------------------------------------------------------ */
router.get("/:id/bracket", (req, res) => {
  const tournament = getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  const bracket = getTournamentBracket(req.params.id);
  if (!bracket) {
    res.status(404).json({ error: "Bracket not available" });
    return;
  }
  res.json(bracket);
});

/* ------------------------------------------------------------------ */
/*  POST /api/tournaments/:id/register – player registration          */
/* ------------------------------------------------------------------ */
const registerSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  gameSelection: z.string().min(1, "Game selection is required"),
});

router.post("/:id/register", requireAuth, (req: AuthedRequest, res) => {
  /* --- Validate required body fields -------------------------------- */
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  /* --- Tournament must exist ---------------------------------------- */
  const tournament = getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  /* --- Auth user must exist ----------------------------------------- */
  const user = getUserById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  /* --- Registration must be open ------------------------------------ */
  if (!tournament.registrationOpen) {
    res.status(403).json({ error: "Registration is closed for this tournament" });
    return;
  }

  /* --- Capacity check ----------------------------------------------- */
  const currentEntrants = getEntrants(tournament.id);
  if (tournament.maxEntrants !== null && currentEntrants.length >= tournament.maxEntrants) {
    res.status(403).json({ error: "Registration is full. No more spots are available." });
    return;
  }

  /* --- Duplicate check ---------------------------------------------- */
  const existing = currentEntrants.some((e) => e.userId === user.id);
  if (existing) {
    res.status(409).json({ error: "Already registered for this tournament" });
    return;
  }

  /* --- Create registration ------------------------------------------ */
  const entrant = {
    userId: user.id,
    displayName: parsed.data.displayName,
    gameSelection: parsed.data.gameSelection,
    registeredAt: new Date().toISOString(),
  };
  addEntrant(tournament.id, entrant);

  res.status(201).json({
    tournamentId: tournament.id,
    userId: user.id,
    displayName: entrant.displayName,
    gameSelection: entrant.gameSelection,
    registeredAt: entrant.registeredAt,
  });
});

/* ------------------------------------------------------------------ */
/*  GET /api/tournaments/:id/entrants – ordered entrant list          */
/* ------------------------------------------------------------------ */
router.get("/:id/entrants", (req, res) => {
  const tournament = getTournament(req.params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  const entrants = getEntrants(tournament.id)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
    )
    .map((e) => ({
      userId: e.userId,
      displayName: e.displayName,
      gameSelection: e.gameSelection,
      registeredAt: e.registeredAt,
    }));
  res.json({ tournamentId: tournament.id, count: entrants.length, entrants });
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/tournaments/:id – update registration status           */
/* ------------------------------------------------------------------ */
const patchTournamentSchema = z.object({
  registrationOpen: z.boolean().optional(),
  maxEntrants: z.number().int().min(2).nullable().optional(),
});

router.patch("/:id", requireAuth, requireOrganizer, (req: AuthedRequest, res) => {
  const parsed = patchTournamentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const tournament = updateTournament(req.params.id, parsed.data);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  res.json({
    id: tournament.id,
    name: tournament.name,
    game: tournament.game,
    maxEntrants: tournament.maxEntrants,
    registrationOpen: tournament.registrationOpen,
  });
});

/* ------------------------------------------------------------------ */
/*  POST /api/tournaments/:id/bracket – generate bracket              */
/* ------------------------------------------------------------------ */
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
    setTournamentBracket(tournament.id, bracket);
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
  const entrants = getEntrants(tournament.id).map((e) => ({
    userId: e.userId,
    displayName: e.displayName,
    gameSelection: e.gameSelection,
    registeredAt: e.registeredAt,
  }));
  res.json({
    id: tournament.id,
    name: tournament.name,
    game: tournament.game,
    maxEntrants: tournament.maxEntrants,
    registrationOpen: tournament.registrationOpen,
    entrantCount: entrants.length,
    createdAt: tournament.createdAt,
    entrants,
  });
});

export default router;