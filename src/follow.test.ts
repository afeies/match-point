import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createUser,
  __resetStoreForTests,
} from "./store.js";
import { signToken } from "./auth/token.js";
import bcrypt from "bcryptjs";

describe("US9: Follow Players", () => {
  let app: ReturnType<typeof createApp>;
  let player1Token: string;
  let player1Id: string;
  let player2Token: string;
  let player2Id: string;
  let player3Id: string;

  beforeEach(() => {
    __resetStoreForTests();
    app = createApp();

    // Create players
    const player1 = createUser({
      username: "player1",
      email: "player1@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Player One",
      games: ["Street Fighter 6"],
      region: "Pittsburgh",
      role: "player",
    });
    player1Id = player1.id;
    player1Token = signToken({ sub: player1Id, role: "player" });

    const player2 = createUser({
      username: "player2",
      email: "player2@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Player Two",
      games: ["Tekken 8"],
      region: "Pittsburgh",
      role: "player",
    });
    player2Id = player2.id;
    player2Token = signToken({ sub: player2Id, role: "player" });

    const player3 = createUser({
      username: "player3",
      email: "player3@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Player Three",
      games: ["Street Fighter 6"],
      region: "New York",
      role: "player",
    });
    player3Id = player3.id;
  });

  describe("POST /api/follows - Create Follow", () => {
    it("should create a follow relationship and return 201", async () => {
      const response = await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.followerId).toBe(player1Id);
      expect(response.body.followingId).toBe(player2Id);
      expect(response.body).toHaveProperty("createdAt");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/follows")
        .send({ targetUserId: player2Id });

      expect(response.status).toBe(401);
    });

    it("should return 400 when targetUserId is missing", async () => {
      const response = await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 404 when target user does not exist", async () => {
      const response = await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: "00000000-0000-0000-0000-000000000000" });

      expect(response.status).toBe(404);
    });

    it("should return 409 on duplicate follow attempt", async () => {
      // First follow
      await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });

      // Duplicate follow
      const response = await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain("already following");
    });

    it("should not allow following yourself", async () => {
      const response = await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player1Id });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("yourself");
    });
  });

  describe("DELETE /api/follows/:id - Remove Follow", () => {
    let followId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });
      followId = response.body.id;
    });

    it("should remove follow relationship and return 200", async () => {
      const response = await request(app)
        .delete(`/api/follows/${followId}`)
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it("should require authentication", async () => {
      const response = await request(app).delete(`/api/follows/${followId}`);

      expect(response.status).toBe(401);
    });

    it("should return 404 when follow does not exist", async () => {
      const response = await request(app)
        .delete("/api/follows/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(404);
    });

    it("should only allow the follower to unfollow", async () => {
      const response = await request(app)
        .delete(`/api/follows/${followId}`)
        .set("Authorization", `Bearer ${player2Token}`); // Different user

      expect(response.status).toBe(403);
    });

    it("should verify follow is removed from following list", async () => {
      await request(app)
        .delete(`/api/follows/${followId}`)
        .set("Authorization", `Bearer ${player1Token}`);

      const response = await request(app)
        .get(`/api/users/${player1Id}/following`)
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe("GET /api/users/:id/following - List Following", () => {
    beforeEach(async () => {
      // Player 1 follows Player 2 and Player 3
      await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });

      await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player3Id });
    });

    it("should return list of followed users", async () => {
      const response = await request(app)
        .get(`/api/users/${player1Id}/following`)
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      
      const userIds = response.body.data.map((u: any) => u.id);
      expect(userIds).toContain(player2Id);
      expect(userIds).toContain(player3Id);
    });

    it("should return empty list when not following anyone", async () => {
      const response = await request(app)
        .get(`/api/users/${player2Id}/following`)
        .set("Authorization", `Bearer ${player2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should include user profile information in results", async () => {
      const response = await request(app)
        .get(`/api/users/${player1Id}/following`)
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(200);
      const user = response.body.data[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("displayName");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("games");
      expect(user).toHaveProperty("region");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get(`/api/users/${player1Id}/following?page_size=1`)
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe("GET /api/users/:id/followers - List Followers", () => {
    beforeEach(async () => {
      // Player 1 and Player 3 follow Player 2
      await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });

      const player3Token = signToken({ sub: player3Id, role: "player" });
      await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player3Token}`)
        .send({ targetUserId: player2Id });
    });

    it("should return list of followers", async () => {
      const response = await request(app)
        .get(`/api/users/${player2Id}/followers`)
        .set("Authorization", `Bearer ${player2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      
      const userIds = response.body.data.map((u: any) => u.id);
      expect(userIds).toContain(player1Id);
      expect(userIds).toContain(player3Id);
    });

    it("should return empty list when no followers", async () => {
      const response = await request(app)
        .get(`/api/users/${player1Id}/followers`)
        .set("Authorization", `Bearer ${player1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should include user profile information in results", async () => {
      const response = await request(app)
        .get(`/api/users/${player2Id}/followers`)
        .set("Authorization", `Bearer ${player2Token}`);

      expect(response.status).toBe(200);
      const user = response.body.data[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("displayName");
      expect(user).toHaveProperty("username");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get(`/api/users/${player2Id}/followers?page_size=1`)
        .set("Authorization", `Bearer ${player2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe("Follow Counts", () => {
    it("should track correct following and follower counts", async () => {
      // Player 1 follows Player 2
      await request(app)
        .post("/api/follows")
        .set("Authorization", `Bearer ${player1Token}`)
        .send({ targetUserId: player2Id });

      const following = await request(app)
        .get(`/api/users/${player1Id}/following`)
        .set("Authorization", `Bearer ${player1Token}`);

      const followers = await request(app)
        .get(`/api/users/${player2Id}/followers`)
        .set("Authorization", `Bearer ${player2Token}`);

      expect(following.body.total).toBe(1);
      expect(followers.body.total).toBe(1);
    });
  });
});
