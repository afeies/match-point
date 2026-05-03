import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createUser,
  createTournament,
  __resetStoreForTests,
} from "./store.js";
import { signToken } from "./auth/token.js";
import bcrypt from "bcryptjs";

describe("US4: Replay Upload & Storage", () => {
  let app: ReturnType<typeof createApp>;
  let organizerToken: string;
  let organizerId: string;
  let playerToken: string;
  let playerId: string;
  let tournamentId: string;

  beforeEach(() => {
    __resetStoreForTests();
    app = createApp();

    // Create organizer
    const organizer = createUser({
      username: "organizer1",
      email: "organizer@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Tournament Organizer",
      games: ["Street Fighter 6"],
      region: "Pittsburgh",
      role: "organizer",
    });
    organizerId = organizer.id;
    organizerToken = signToken({ sub: organizerId, role: "organizer" });

    // Create player
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

    // Create tournament
    const tournament = createTournament({
      name: "Test Tournament",
      game: "Street Fighter 6",
      organizerId,
      maxEntrants: null,
      registrationOpen: true,
    });
    tournamentId = tournament.id;
  });

  describe("Replay Upload", () => {
    it("should upload replay with metadata and return 201", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Grand Finals - Player A vs Player B",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000, // 50 MB
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        tournamentId,
        title: "Grand Finals - Player A vs Player B",
        game: "Street Fighter 6",
        playerNames: ["Player A", "Player B"],
        uploadedBy: organizerId,
        videoUrl: expect.stringContaining("http"),
        uploadedAt: expect.any(String),
        fileSize: 50000000,
      });
    });

    it("should return 403 when player (non-organizer) attempts upload", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          tournamentId,
          title: "Test Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          // Missing title
          game: "Street Fighter 6",
          playerNames: ["Player A"],
        });

      expect(response.status).toBe(400);
    });

    it("should return 413 for files exceeding size limit (2GB)", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Large Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/large-video.mp4",
          fileSize: 3000000000, // 3 GB - exceeds 2GB limit
        });

      expect(response.status).toBe(413);
      expect(response.body.error).toContain("size");
    });

    it("should return 404 when tournament does not exist", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId: "00000000-0000-0000-0000-000000000000", // Valid UUID but doesn't exist
          title: "Test Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      expect(response.status).toBe(404);
    });

    it("should return 403 when organizer tries to upload for another organizer's tournament", async () => {
      // Create another organizer
      const otherOrganizer = createUser({
        username: "organizer2",
        email: "organizer2@test.com",
        passwordHash: bcrypt.hashSync("password123", 10),
        displayName: "Other Organizer",
        games: ["Street Fighter 6"],
        region: "Pittsburgh",
        role: "organizer",
      });
      const otherOrganizerToken = signToken({
        sub: otherOrganizer.id,
        role: "organizer",
      });

      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${otherOrganizerToken}`)
        .send({
          tournamentId, // Original organizer's tournament
          title: "Test Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("own");
    });
  });

  describe("Replay Retrieval", () => {
    it("should get replay by ID", async () => {
      // First upload a replay
      const uploadResponse = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Test Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      const replayId = uploadResponse.body.id;

      // Get the replay
      const response = await request(app).get(`/api/replays/${replayId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: replayId,
        tournamentId,
        title: "Test Replay",
        game: "Street Fighter 6",
        playerNames: ["Player A", "Player B"],
        videoUrl: expect.stringContaining("http"),
        uploadedBy: organizerId,
        uploadedAt: expect.any(String),
        fileSize: 50000000,
      });
    });

    it("should return 404 for non-existent replay", async () => {
      const response = await request(app).get("/api/replays/non-existent-id");

      expect(response.status).toBe(404);
    });

    it("should allow public access to replay (no auth required)", async () => {
      // Upload replay
      const uploadResponse = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Public Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      const replayId = uploadResponse.body.id;

      // Access without authentication
      const response = await request(app).get(`/api/replays/${replayId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(replayId);
    });
  });

  describe("Replay Listing", () => {
    it("should list replays for a tournament", async () => {
      // Upload multiple replays
      const upload1 = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Match 1",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video1.mp4",
          fileSize: 50000000,
        });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const upload2 = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Match 2",
          game: "Street Fighter 6",
          playerNames: ["Player C", "Player D"],
          videoUrl: "https://example.com/video2.mp4",
          fileSize: 60000000,
        });

      // List replays for tournament
      const response = await request(app).get(
        `/api/tournaments/${tournamentId}/replays`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe("Match 2"); // Most recent first
      expect(response.body[1].title).toBe("Match 1");
    });

    it("should return empty array for tournament with no replays", async () => {
      const response = await request(app).get(
        `/api/tournaments/${tournamentId}/replays`
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("Replay Metadata", () => {
    it("should store correct upload timestamp", async () => {
      const beforeUpload = new Date().toISOString();

      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "Timestamped Replay",
          game: "Street Fighter 6",
          playerNames: ["Player A", "Player B"],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      const afterUpload = new Date().toISOString();

      expect(response.status).toBe(201);
      expect(response.body.uploadedAt).toBeDefined();
      expect(new Date(response.body.uploadedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeUpload).getTime()
      );
      expect(new Date(response.body.uploadedAt).getTime()).toBeLessThanOrEqual(
        new Date(afterUpload).getTime()
      );
    });

    it("should handle multiple player names", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "8-Player Match",
          game: "Smash Ultimate",
          playerNames: [
            "P1",
            "P2",
            "P3",
            "P4",
            "P5",
            "P6",
            "P7",
            "P8",
          ],
          videoUrl: "https://example.com/8player.mp4",
          fileSize: 100000000,
        });

      expect(response.status).toBe(201);
      expect(response.body.playerNames).toHaveLength(8);
    });

    it("should validate at least one player name required", async () => {
      const response = await request(app)
        .post("/api/replays")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          tournamentId,
          title: "No Players",
          game: "Street Fighter 6",
          playerNames: [],
          videoUrl: "https://example.com/video.mp4",
          fileSize: 50000000,
        });

      expect(response.status).toBe(400);
    });
  });
});
