import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth, requireOrganizer } from "../middleware/auth.js";
import {
  createSubscription,
  getUserSubscription,
  activateSubscription,
  cancelSubscription,
  getSubscriptionById,
} from "../store.js";

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /api/subscriptions – create subscription                     */
/* ------------------------------------------------------------------ */
const createSubscriptionSchema = z.object({
  priceId: z.string().min(1),
});

router.post("/", requireAuth, requireOrganizer, (req: AuthedRequest, res) => {
  const parsed = createSubscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { priceId } = parsed.data;
  const userId = req.userId!;

  const subscription = createSubscription(userId, priceId);
  if (!subscription) {
    res.status(409).json({ error: "You already have an active subscription" });
    return;
  }

  res.status(201).json({
    subscriptionId: subscription.id,
    clientSecret: subscription.clientSecret,
  });
});

/* ------------------------------------------------------------------ */
/*  POST /api/subscriptions/webhook – Stripe webhook                  */
/* ------------------------------------------------------------------ */
router.post("/webhook", (req, res) => {
  const { type, data } = req.body;

  if (!type || !data || !data.object) {
    res.status(400).json({ error: "Invalid webhook payload" });
    return;
  }

  const metadata = data.object.metadata;
  if (!metadata || !metadata.subscriptionId) {
    res.status(400).json({ error: "Missing subscription metadata" });
    return;
  }

  const { subscriptionId, userId, expiryDate } = metadata;

  switch (type) {
    case "payment_intent.succeeded":
      activateSubscription(subscriptionId, expiryDate);
      break;
    case "customer.subscription.deleted":
      {
        const sub = getSubscriptionById(subscriptionId);
        if (sub) {
          cancelSubscription(subscriptionId, sub.userId);
        }
      }
      break;
    case "payment_intent.payment_failed":
      // Don't activate subscription on failed payment
      break;
  }

  res.json({ received: true });
});

/* ------------------------------------------------------------------ */
/*  GET /api/subscriptions/:userId – get subscription status          */
/* ------------------------------------------------------------------ */
router.get("/:userId", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.params.userId;

  const subscription = getUserSubscription(userId);
  
  if (!subscription) {
    res.json({
      userId,
      status: "inactive",
    });
    return;
  }

  res.json({
    userId: subscription.userId,
    status: subscription.status,
    expiryDate: subscription.expiryDate,
    createdAt: subscription.createdAt,
    activatedAt: subscription.activatedAt,
  });
});

/* ------------------------------------------------------------------ */
/*  DELETE /api/subscriptions/:id – cancel subscription               */
/* ------------------------------------------------------------------ */
router.delete("/:id", requireAuth, (req: AuthedRequest, res) => {
  const subscriptionId = req.params.id;
  const requesterId = req.userId!;

  const result = cancelSubscription(subscriptionId, requesterId);

  if (result === "not_found") {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  if (result === "forbidden") {
    res.status(403).json({ error: "You can only cancel your own subscription" });
    return;
  }

  res.json({ message: "Subscription cancelled successfully" });
});

export default router;
