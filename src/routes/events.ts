import { Router } from "express";
import { searchEvents } from "../store.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/events – search and browse events                        */
/* ------------------------------------------------------------------ */
router.get("/", (req, res) => {
  const { game, city, radius_km } = req.query;

  const searchParams = {
    game: game as string | undefined,
    city: city as string | undefined,
    radius_km: radius_km ? parseFloat(radius_km as string) : undefined,
  };

  const results = searchEvents(searchParams);
  res.json(results);
});

export default router;
