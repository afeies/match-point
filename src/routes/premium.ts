import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requirePremium } from "../middleware/auth.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/premium/features – test premium feature access           */
/* ------------------------------------------------------------------ */
router.get("/features", requireAuth, requirePremium, (req: AuthedRequest, res) => {
  res.json({
    features: [
      "stream_overlays",
      "automated_video_uploads",
      "ad_free_pages",
      "advanced_analytics",
      "custom_branding",
    ],
  });
});

export default router;
