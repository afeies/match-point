import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { createUser, __resetStoreForTests } from "./store.js";
import { signToken } from "./auth/token.js";
import bcrypt from "bcryptjs";

describe("US10: Premium Subscription", () => {
  let app: ReturnType<typeof createApp>;
  let organizerToken: string;
  let organizerId: string;
  let playerToken: string;
  let playerId: string;

  beforeEach(() => {
    __resetStoreForTests();
    app = createApp();

    // Create an organizer
    const organizer = createUser({
      username: "organizer1",
      email: "organizer@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Test Organizer",
      games: ["Street Fighter 6"],
      region: "Pittsburgh",
      role: "organizer",
    });
    organizerId = organizer.id;
    organizerToken = signToken({ sub: organizerId, role: "organizer" });

    // Create a player
    const player = createUser({
      username: "player1",
      email: "player@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Test Player",
      games: ["Street Fighter 6"],
      region: "Pittsburgh",
      role: "player",
    });
    playerId = player.id;
    playerToken = signToken({ sub: playerId, role: "player" });
  });

  describe("POST /api/subscriptions - Create Subscription", () => {
    it("should create a Stripe payment intent and return client secret", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("clientSecret");
      expect(response.body.clientSecret).toMatch(/^pi_/); // Stripe payment intent format
      expect(response.body).toHaveProperty("subscriptionId");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .send({
          priceId: "price_monthly_premium",
        });

      expect(response.status).toBe(401);
    });

    it("should require organizer role", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("organizer");
    });

    it("should return 400 when priceId is missing", async () => {
      const response = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 409 when organizer already has active subscription", async () => {
      // Create first subscription
      await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      // Try to create second subscription
      const response = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain("active subscription");
    });
  });

  describe("POST /api/subscriptions/webhook - Stripe Webhook", () => {
    it("should mark subscription active on successful payment", async () => {
      // Create subscription
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      const subscriptionId = createResponse.body.subscriptionId;

      // Simulate successful payment webhook
      const webhookResponse = await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      expect(webhookResponse.status).toBe(200);

      // Verify subscription is active
      const statusResponse = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.status).toBe("active");
    });

    it("should handle payment failure webhook", async () => {
      // Create subscription
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      const subscriptionId = createResponse.body.subscriptionId;

      // Simulate failed payment webhook
      const webhookResponse = await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.payment_failed",
          data: {
            object: {
              metadata: {
                subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      expect(webhookResponse.status).toBe(200);

      // Verify subscription is not active
      const statusResponse = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.status).not.toBe("active");
    });
  });

  describe("GET /api/subscriptions/:userId - Get Subscription Status", () => {
    it("should return subscription status for organizer", async () => {
      const response = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("userId", organizerId);
      expect(response.body).toHaveProperty("status");
      expect(["active", "inactive", "expired", "cancelled"]).toContain(
        response.body.status
      );
    });

    it("should return inactive status when no subscription exists", async () => {
      const response = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("inactive");
    });

    it("should include expiry date for active subscriptions", async () => {
      // Create and activate subscription
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId: createResponse.body.subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      const response = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("active");
      expect(response.body).toHaveProperty("expiryDate");
    });

    it("should require authentication", async () => {
      const response = await request(app).get(
        `/api/subscriptions/${organizerId}`
      );

      expect(response.status).toBe(401);
    });

    it("should allow organizer to view own subscription", async () => {
      const response = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("Premium Feature Gating", () => {
    it("should return 403 for non-subscribers accessing premium features", async () => {
      const response = await request(app)
        .get("/api/premium/features")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("premium");
    });

    it("should return 200 for active subscribers accessing premium features", async () => {
      // Create and activate subscription
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId: createResponse.body.subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      const response = await request(app)
        .get("/api/premium/features")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("features");
    });
  });

  describe("Subscription Cancellation and Expiry", () => {
    it("should mark subscription as cancelled on cancellation webhook", async () => {
      // Create and activate subscription
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      const subscriptionId = createResponse.body.subscriptionId;

      await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      // Simulate cancellation webhook
      const webhookResponse = await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "customer.subscription.deleted",
          data: {
            object: {
              metadata: {
                subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      expect(webhookResponse.status).toBe(200);

      // Verify subscription is cancelled
      const statusResponse = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.status).toBe("cancelled");
    });

    it("should correctly handle expired subscriptions", async () => {
      // Create subscription with past expiry date
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      // Activate with past expiry
      await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId: createResponse.body.subscriptionId,
                userId: organizerId,
                expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
              },
            },
          },
        });

      const response = await request(app)
        .get(`/api/subscriptions/${organizerId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("expired");
    });

    it("should block premium features for expired subscriptions", async () => {
      // Create subscription with past expiry date
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      // Activate with past expiry
      await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId: createResponse.body.subscriptionId,
                userId: organizerId,
                expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              },
            },
          },
        });

      const response = await request(app)
        .get("/api/premium/features")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/subscriptions/:id - Cancel Subscription", () => {
    it("should allow organizer to cancel their own subscription", async () => {
      // Create and activate subscription
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      const subscriptionId = createResponse.body.subscriptionId;

      await request(app)
        .post("/api/subscriptions/webhook")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              metadata: {
                subscriptionId,
                userId: organizerId,
              },
            },
          },
        });

      // Cancel subscription
      const response = await request(app)
        .delete(`/api/subscriptions/${subscriptionId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("cancelled");
    });

    it("should require authentication", async () => {
      const response = await request(app).delete(
        "/api/subscriptions/test-sub-id"
      );

      expect(response.status).toBe(401);
    });

    it("should only allow owner to cancel subscription", async () => {
      // Create subscription for organizer1
      const createResponse = await request(app)
        .post("/api/subscriptions")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          priceId: "price_monthly_premium",
        });

      const subscriptionId = createResponse.body.subscriptionId;

      // Try to cancel with different user
      const response = await request(app)
        .delete(`/api/subscriptions/${subscriptionId}`)
        .set("Authorization", `Bearer ${playerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
