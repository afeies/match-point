import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createUser,
  createTournament,
  addEntrant,
  setMatchResult,
  finalizeTournament,
  __resetStoreForTests,
} from "./store.js";
import bcrypt from "bcryptjs";

describe("US8: Player Leaderboard", () => {
  let app: ReturnType<typeof createApp>;
  let organizerId: string;
  let player1Id: string;
  let player2Id: string;
  let player3Id: string;
  let player4Id: string;

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

    const player2 = createUser({
      username: "player2",
      email: "player2@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Player Two",
      games: ["Street Fighter 6"],
      region: "Pittsburgh",
      role: "player",
    });
    player2Id = player2.id;

    const player3 = createUser({
      username: "player3",
      email: "player3@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Player Three",
      games: ["Tekken 8"],
      region: "Pittsburgh",
      role: "player",
    });
    player3Id = player3.id;

    const player4 = createUser({
      username: "player4",
      email: "player4@test.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      displayName: "Player Four",
      games: ["Street Fighter 6"],
      region: "Pittsburgh",
      role: "player",
    });
    player4Id = player4.id;
  });

  describe("GET /api/leaderboard - Basic Functionality", () => {
    it("should return empty leaderboard when no finalized tournaments exist", async () => {
      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should require game parameter", async () => {
      const response = await request(app).get("/api/leaderboard");

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return leaderboard ranked by points descending", async () => {
      // Create and finalize tournament with results
      const tournament = createTournament({
        name: "SF6 Weekly",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 4,
        registrationOpen: false,
      });

      // Set match results (player1 = 1st, player2 = 2nd, player4 = 3rd-4th)
      setMatchResult(tournament.id, player1Id, { placement: 1, wins: 3, losses: 0 });
      setMatchResult(tournament.id, player2Id, { placement: 2, wins: 2, losses: 1 });
      setMatchResult(tournament.id, player4Id, { placement: 3, wins: 1, losses: 2 });

      finalizeTournament(tournament.id);

      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].userId).toBe(player1Id);
      expect(response.body.data[0].points).toBeGreaterThan(response.body.data[1].points);
      expect(response.body.data[1].userId).toBe(player2Id);
      expect(response.body.data[1].points).toBeGreaterThan(response.body.data[2].points);
    });
  });

  describe("GET /api/leaderboard - Filtering", () => {
    it("should filter leaderboard by game", async () => {
      // Create SF6 tournament
      const sf6Tournament = createTournament({
        name: "SF6 Weekly",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(sf6Tournament.id, player1Id, { placement: 1, wins: 1, losses: 0 });
      setMatchResult(sf6Tournament.id, player2Id, { placement: 2, wins: 0, losses: 1 });
      finalizeTournament(sf6Tournament.id);

      // Create Tekken tournament
      const tekkenTournament = createTournament({
        name: "Tekken Tuesday",
        game: "Tekken 8",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(tekkenTournament.id, player3Id, { placement: 1, wins: 1, losses: 0 });
      finalizeTournament(tekkenTournament.id);

      const sf6Response = await request(app).get("/api/leaderboard?game=Street Fighter 6");
      const tekkenResponse = await request(app).get("/api/leaderboard?game=Tekken 8");

      expect(sf6Response.status).toBe(200);
      expect(sf6Response.body.data).toHaveLength(2);
      expect(sf6Response.body.data.every((p: any) => [player1Id, player2Id].includes(p.userId))).toBe(true);

      expect(tekkenResponse.status).toBe(200);
      expect(tekkenResponse.body.data).toHaveLength(1);
      expect(tekkenResponse.body.data[0].userId).toBe(player3Id);
    });

    it("should be case-insensitive for game filter", async () => {
      const tournament = createTournament({
        name: "SF6 Weekly",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(tournament.id, player1Id, { placement: 1, wins: 1, losses: 0 });
      finalizeTournament(tournament.id);

      const response = await request(app).get("/api/leaderboard?game=street fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/leaderboard - Player Rank Query", () => {
    beforeEach(() => {
      // Create tournament with multiple players
      const tournament = createTournament({
        name: "Big Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 4,
        registrationOpen: false,
      });

      setMatchResult(tournament.id, player1Id, { placement: 1, wins: 3, losses: 0 });
      setMatchResult(tournament.id, player2Id, { placement: 2, wins: 2, losses: 1 });
      setMatchResult(tournament.id, player4Id, { placement: 3, wins: 1, losses: 2 });
      finalizeTournament(tournament.id);
    });

    it("should return player rank when player_id is provided", async () => {
      const response = await request(app).get(
        `/api/leaderboard?game=Street Fighter 6&player_id=${player2Id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.playerRank).toBeDefined();
      expect(response.body.playerRank.rank).toBe(2);
      expect(response.body.playerRank.userId).toBe(player2Id);
    });

    it("should return 404 when player_id is not on leaderboard", async () => {
      const nonParticipant = createUser({
        username: "newplayer",
        email: "new@test.com",
        passwordHash: bcrypt.hashSync("password123", 10),
        displayName: "New Player",
        games: ["Street Fighter 6"],
        region: "Pittsburgh",
        role: "player",
      });

      const response = await request(app).get(
        `/api/leaderboard?game=Street Fighter 6&player_id=${nonParticipant.id}`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("not found");
    });
  });

  describe("GET /api/leaderboard - Pagination", () => {
    beforeEach(() => {
      // Create tournament with many players
      const tournament = createTournament({
        name: "Large Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: null,
        registrationOpen: false,
      });

      // Create 25 players with different placements
      for (let i = 1; i <= 25; i++) {
        const player = createUser({
          username: `player${i + 10}`,
          email: `player${i + 10}@test.com`,
          passwordHash: bcrypt.hashSync("password123", 10),
          displayName: `Player ${i + 10}`,
          games: ["Street Fighter 6"],
          region: "Pittsburgh",
          role: "player",
        });
        setMatchResult(tournament.id, player.id, { placement: i, wins: 25 - i, losses: i });
      }

      finalizeTournament(tournament.id);
    });

    it("should paginate results with default page size of 20", async () => {
      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(20);
      expect(response.body.total).toBe(25);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(20);
      expect(response.body.totalPages).toBe(2);
    });

    it("should return second page of results", async () => {
      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6&page=2");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(5);
      expect(response.body.page).toBe(2);
    });

    it("should support custom page size", async () => {
      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6&page_size=10");

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalPages).toBe(3);
    });
  });

  describe("GET /api/leaderboard - Points System", () => {
    it("should only include finalized tournaments in points calculation", async () => {
      // Finalized tournament
      const finalizedTournament = createTournament({
        name: "Finalized Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(finalizedTournament.id, player1Id, { placement: 1, wins: 1, losses: 0 });
      finalizeTournament(finalizedTournament.id);

      // Non-finalized tournament
      const ongoingTournament = createTournament({
        name: "Ongoing Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(ongoingTournament.id, player1Id, { placement: 1, wins: 1, losses: 0 });
      // Don't finalize

      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      // Points should only come from finalized tournament
      expect(response.body.data[0].points).toBe(100); // 1st place = 100 points
    });

    it("should aggregate points across multiple tournaments", async () => {
      // Tournament 1
      const tournament1 = createTournament({
        name: "Tournament 1",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(tournament1.id, player1Id, { placement: 1, wins: 1, losses: 0 });
      finalizeTournament(tournament1.id);

      // Tournament 2
      const tournament2 = createTournament({
        name: "Tournament 2",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(tournament2.id, player1Id, { placement: 2, wins: 0, losses: 1 });
      finalizeTournament(tournament2.id);

      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data[0].points).toBe(175); // 100 + 75
    });
  });

  describe("GET /api/leaderboard - Tiebreaker Logic", () => {
    it("should use total wins as first tiebreaker", async () => {
      const tournament = createTournament({
        name: "Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: null,
        registrationOpen: false,
      });

      // Both players get 3rd place (same points) but different wins
      setMatchResult(tournament.id, player1Id, { placement: 3, wins: 5, losses: 2 });
      setMatchResult(tournament.id, player2Id, { placement: 3, wins: 3, losses: 2 });
      finalizeTournament(tournament.id);

      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      expect(response.body.data[0].userId).toBe(player1Id); // More wins
      expect(response.body.data[1].userId).toBe(player2Id);
    });
  });

  describe("GET /api/leaderboard - Response Format", () => {
    it("should include all required fields", async () => {
      const tournament = createTournament({
        name: "Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 2,
        registrationOpen: false,
      });
      setMatchResult(tournament.id, player1Id, { placement: 1, wins: 1, losses: 0 });
      finalizeTournament(tournament.id);

      const response = await request(app).get("/api/leaderboard?game=Street Fighter 6");

      expect(response.status).toBe(200);
      const entry = response.body.data[0];
      expect(entry).toHaveProperty("rank");
      expect(entry).toHaveProperty("userId");
      expect(entry).toHaveProperty("displayName");
      expect(entry).toHaveProperty("points");
      expect(entry).toHaveProperty("totalWins");
      expect(entry).toHaveProperty("totalTournaments");
    });
  });
});
