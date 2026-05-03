import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createFollow,
  deleteFollow,
  getUserById,
  isFollowing,
} from "../store.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /api/follows – create follow relationship                    */
/* ------------------------------------------------------------------ */
const createFollowSchema = z.object({
  targetUserId: z.string().uuid(),
});

router.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = createFollowSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { targetUserId } = parsed.data;
  const followerId = req.userId!;

  // Check if trying to follow yourself
  if (followerId === targetUserId) {
    res.status(400).json({ error: "You cannot follow yourself" });
    return;
  }

  // Check if target user exists
  const targetUser = getUserById(targetUserId);
  if (!targetUser) {
    res.status(404).json({ error: "Target user not found" });
    return;
  }

  // Check if already following
  if (isFollowing(followerId, targetUserId)) {
    res.status(409).json({ error: "You are already following this user" });
    return;
  }

  const follow = createFollow(followerId, targetUserId);
  if (!follow) {
    res.status(500).json({ error: "Failed to create follow relationship" });
    return;
  }

  res.status(201).json(follow);
});

/* ------------------------------------------------------------------ */
/*  DELETE /api/follows/:id – remove follow relationship              */
/* ------------------------------------------------------------------ */
router.delete("/:id", requireAuth, (req: AuthedRequest, res) => {
  const followId = req.params.id;
  const requesterId = req.userId!;

  const result = deleteFollow(followId, requesterId);
  
  if (result === "not_found") {
    res.status(404).json({ error: "Follow relationship not found" });
    return;
  }
  
  if (result === "forbidden") {
    res.status(403).json({ error: "You can only unfollow your own follows" });
    return;
  }

  res.json({ message: "Successfully unfollowed" });
});

export default router;
