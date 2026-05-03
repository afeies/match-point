import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createUser,
  createTournament,
  createReplay,
  __resetStoreForTests,
} from "./store.js";
import { signToken } from "./auth/token.js";
import bcrypt from "bcryptjs";

describe("US5: Replay Discovery & Browsing", () => {
  let app: ReturnType<typeof createApp>;
  let organizerToken: string;
  let organizerId: string;
  let tournament1Id: string;
  let tournament2Id: string;

  beforeEach(async () => {
    __resetStoreForTests();
    app = createApp();

    // Create organizer
    const organizer = createUser({
      username: "organizer1",
      email: "organizer@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Tournament Organizer",
      games: ["Street Fighter 6", "Tekken 8"],
      region: "Pittsburgh",
      role: "organizer",
    });
    organizerId = organizer.id;
    organizerToken = signToken({ sub: organizerId, role: "organizer" });

    // Create tournaments
    const tournament1 = createTournament({
      name: "Steel City Weekly #12",
      game: "Street Fighter 6",
      organizerId,
      maxEntrants: null,
      registrationOpen: true,
    });
    tournament1Id = tournament1.id;

    const tournament2 = createTournament({
      name: "Tekken Tuesday",
      game: "Tekken 8",
      organizerId,
      maxEntrants: null,
      registrationOpen: true,
    });
    tournament2Id = tournament2.id;

    // Create test replays with delays to ensure distinct timestamps
    createReplay({
      tournamentId: tournament1Id,
      title: "Grand Finals - Ryu vs Ken",
      game: "Street Fighter 6",
      playerNames: ["Ryu", "Ken"],
      uploadedBy: organizerId,
      videoUrl: "https://example.com/sf6-gf.mp4",
      fileSize: 50000000,
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    createReplay({
      tournamentId: tournament1Id,
      title: "Winner's Finals - Ryu vs Chun-Li",
      game: "Street Fighter 6",
      playerNames: ["Ryu", "Chun-Li"],
      uploadedBy: organizerId,
      videoUrl: "https://example.com/sf6-wf.mp4",
      fileSize: 60000000,
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    createReplay({
      tournamentId: tournament2Id,
      title: "Grand Finals - Jin vs Kazuya",
      game: "Tekken 8",
      playerNames: ["Jin", "Kazuya"],
      uploadedBy: organizerId,
      videoUrl: "https://example.com/tekken-gf.mp4",
      fileSize: 70000000,
    });
  });

  describe("GET /api/replays - Basic Listing", () => {
    it("should return all replays in reverse-chronological order by default", async () => {
      const response = await request(app).get("/api/replays");

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(3);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(20);
      
      // Most recent first
      expect(response.body.data[0].game).toBe("Tekken 8");
      expect(response.body.data[1].game).toBe("Street Fighter 6");
      expect(response.body.data[2].game).toBe("Street Fighter 6");
    });

    it("should return empty data array when no replays exist", async () => {
      __resetStoreForTests();
      app = createApp();

      const response = await request(app).get("/api/replays");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe("GET /api/replays - Filtering", () => {
    it("should filter replays by game", async () => {
      const response = await request(app).get("/api/replays?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data.every((r: any) => r.game === "Street Fighter 6")).toBe(true);
    });

    it("should filter replays by game (case-insensitive)", async () => {
      const response = await request(app).get("/api/replays?game=street fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it("should filter replays by tournament ID", async () => {
      const response = await request(app).get(`/api/replays?event_id=${tournament1Id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data.every((r: any) => r.tournamentId === tournament1Id)).toBe(true);
    });

    it("should filter replays by player name", async () => {
      const response = await request(app).get("/api/replays?player_name=Ryu");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data.every((r: any) => r.playerNames.includes("Ryu"))).toBe(true);
    });

    it("should filter replays by player name (case-insensitive)", async () => {
      const response = await request(app).get("/api/replays?player_name=ryu");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it("should support multiple filters simultaneously", async () => {
      const response = await request(app).get(
        "/api/replays?game=Street Fighter 6&player_name=Chun-Li"
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe("Winner's Finals - Ryu vs Chun-Li");
    });

    it("should return empty results for non-matching filters", async () => {
      const response = await request(app).get("/api/replays?game=Mortal Kombat");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe("GET /api/replays - Pagination", () => {
    beforeEach(() => {
      // Add more replays to test pagination
      for (let i = 1; i <= 25; i++) {
        createReplay({
          tournamentId: tournament1Id,
          title: `Match ${i}`,
          game: "Street Fighter 6",
          playerNames: [`Player ${i}A`, `Player ${i}B`],
          uploadedBy: organizerId,
          videoUrl: `https://example.com/match${i}.mp4`,
          fileSize: 50000000,
        });
      }
    });

    it("should paginate results with default page size of 20", async () => {
      const response = await request(app).get("/api/replays");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(20);
      expect(response.body.total).toBe(28); // 3 original + 25 new
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(20);
      expect(response.body.totalPages).toBe(2);
    });

    it("should return second page of results", async () => {
      const response = await request(app).get("/api/replays?page=2");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(8);
      expect(response.body.page).toBe(2);
      expect(response.body.total).toBe(28);
    });

    it("should support custom page size", async () => {
      const response = await request(app).get("/api/replays?page_size=10");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalPages).toBe(3);
    });

    it("should limit page size to 100", async () => {
      const response = await request(app).get("/api/replays?page_size=500");

      expect(response.status).toBe(200);
      expect(response.body.pageSize).toBe(100);
    });

    it("should return empty array for page beyond total pages", async () => {
      const response = await request(app).get("/api/replays?page=999");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.page).toBe(999);
    });

    it("should handle pagination with filters", async () => {
      const response = await request(app).get(
        "/api/replays?game=Street Fighter 6&page_size=10"
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.total).toBe(27); // 2 original + 25 new SF6 replays
    });
  });

  describe("GET /api/replays - Performance", () => {
    it("should respond within 500ms for large dataset", async () => {
      // Create a large dataset
      for (let i = 1; i <= 100; i++) {
        createReplay({
          tournamentId: tournament1Id,
          title: `Match ${i}`,
          game: "Street Fighter 6",
          playerNames: [`Player ${i}A`, `Player ${i}B`],
          uploadedBy: organizerId,
          videoUrl: `https://example.com/match${i}.mp4`,
          fileSize: 50000000,
        });
      }

      const startTime = Date.now();
      const response = await request(app).get("/api/replays?game=Street Fighter 6");
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe("GET /api/replays - Response Format", () => {
    it("should include all required fields in replay objects", async () => {
      const response = await request(app).get("/api/replays");

      expect(response.status).toBe(200);
      const replay = response.body.data[0];
      expect(replay).toHaveProperty("id");
      expect(replay).toHaveProperty("title");
      expect(replay).toHaveProperty("game");
      expect(replay).toHaveProperty("playerNames");
      expect(replay).toHaveProperty("tournamentId");
      expect(replay).toHaveProperty("videoUrl");
      expect(replay).toHaveProperty("uploadedAt");
      expect(replay).toHaveProperty("uploadedBy");
      expect(replay).toHaveProperty("fileSize");
    });

    it("should include correct pagination metadata", async () => {
      const response = await request(app).get("/api/replays");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("pageSize");
      expect(response.body).toHaveProperty("totalPages");
    });
  });

  describe("GET /api/replays - Edge Cases", () => {
    it("should handle invalid page number gracefully", async () => {
      const response = await request(app).get("/api/replays?page=-1");

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1); // Default to page 1
    });

    it("should handle invalid page size gracefully", async () => {
      const response = await request(app).get("/api/replays?page_size=0");

      expect(response.status).toBe(200);
      expect(response.body.pageSize).toBe(20); // Default to 20
    });

    it("should handle non-numeric page parameters", async () => {
      const response = await request(app).get("/api/replays?page=abc");

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
    });
  });
});
