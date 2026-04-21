import { Router } from "express";
import { markNotificationRead } from "../store.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/:id/ack", requireAuth, (req: AuthedRequest, res) => {
  const outcome = markNotificationRead(req.params.id, req.userId!);
  if (outcome === "not_found") {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  if (outcome === "forbidden") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json({ ok: true });
});

export default router;
