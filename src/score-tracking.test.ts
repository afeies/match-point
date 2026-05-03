import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import {
  createUser,
  createTournament,
  addEntrant,
  setTournamentBracket,
  __resetStoreForTests,
} from "./store.js";
import { buildSingleEliminationBracket } from "./bracket/singleElimination.js";
import { signToken } from "./auth/token.js";
import bcrypt from "bcryptjs";

describe("US3: Live Score Tracking", () => {
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

  describe("Score Submission", () => {
    it("should update match score and record winner", async () => {
      // Setup: Create 4 players and generate bracket
      const players = Array.from({ length: 4 }, (_, i) => {
        const user = createUser({
          username: `player${i}`,
          email: `player${i}@test.com`,
          passwordHash: bcrypt.hashSync("password123", 10),
          displayName: `Player ${i}`,
          games: ["Street Fighter 6"],
          region: "Pittsburgh",
          role: "player",
        });
        addEntrant(tournamentId, {
          userId: user.id,
          displayName: user.displayName,
          gameSelection: "Street Fighter 6",
          registeredAt: new Date().toISOString(),
          checkedIn: true,
        });
        return { userId: user.id, displayName: user.displayName };
      });

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      // Get first match
      const match = bracket.rounds[0].matches[0];

      // Submit score
      const response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("match");
      expect(response.body.match).toMatchObject({
        id: match.id,
        player1Score: 2,
        player2Score: 1,
        winnerUserId: match.player1!.userId,
        status: "complete",
      });
    });

    it("should return 403 when non-organizer attempts to submit score", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const match = bracket.rounds[0].matches[0];

      const response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          player1Score: 2,
          player2Score: 1,
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid score formats", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const match = bracket.rounds[0].matches[0];

      // Negative score
      let response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: -1,
          player2Score: 1,
        });
      expect(response.status).toBe(400);

      // Non-integer score
      response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2.5,
          player2Score: 1,
        });
      expect(response.status).toBe(400);

      // Missing scores
      response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
        });
      expect(response.status).toBe(400);
    });

    it("should return 400 for tied scores", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const match = bracket.rounds[0].matches[0];

      const response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("tie");
    });

    it("should return 404 for non-existent match", async () => {
      const response = await request(app)
        .put("/api/tournaments/${tournamentId}/matches/non-existent-match-id/score")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 1,
        });

      expect(response.status).toBe(404);
    });
  });

  describe("Bracket Advancement", () => {
    it("should advance winner to next round within 3 seconds", async () => {
      // Create 4 players for a 2-round bracket
      const players = Array.from({ length: 4 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const match = bracket.rounds[0].matches[0];
      const startTime = Date.now();

      // Submit score for first match
      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 0,
        });

      const endTime = Date.now();
      const elapsedSeconds = (endTime - startTime) / 1000;

      // Get updated bracket
      const bracketResponse = await request(app)
        .get(`/api/tournaments/${tournamentId}/bracket`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(elapsedSeconds).toBeLessThan(3);
      expect(bracketResponse.status).toBe(200);

      // Check that winner advanced to finals
      const finals = bracketResponse.body.rounds[1].matches[0];
      const winnerId = match.player1!.userId;
      expect(
        finals.player1?.userId === winnerId || finals.player2?.userId === winnerId
      ).toBe(true);
    });

    it("should mark bracket as complete when final match is won", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const finalMatch = bracket.rounds[0].matches[0];

      // Submit score for final match
      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${finalMatch.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 3,
          player2Score: 1,
        });

      // Get updated bracket
      const response = await request(app)
        .get(`/api/tournaments/${tournamentId}/bracket`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rounds[0].matches[0].status).toBe("complete");
      expect(response.body.rounds[0].matches[0].winnerUserId).toBe(
        finalMatch.player1!.userId
      );
    });
  });

  describe("Real-time Updates", () => {
    it("should reflect score updates without full page reload", async () => {
      const players = Array.from({ length: 4 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      // Get initial bracket state
      const initialResponse = await request(app)
        .get(`/api/tournaments/${tournamentId}/bracket`)
        .set("Authorization", `Bearer ${organizerToken}`);

      const match = bracket.rounds[0].matches[0];

      // Submit score
      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 1,
        });

      // Poll for updated bracket (simulating spectator polling)
      const updatedResponse = await request(app)
        .get(`/api/tournaments/${tournamentId}/bracket`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.body.rounds[0].matches[0].winnerUserId).toBe(
        match.player1!.userId
      );
      expect(updatedResponse.body.rounds[0].matches[0].player1Score).toBe(2);
      expect(updatedResponse.body.rounds[0].matches[0].player2Score).toBe(1);

      // Verify it's different from initial state
      expect(initialResponse.body.rounds[0].matches[0].winnerUserId).toBeNull();
    });

    it("should allow public access to bracket without authentication", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      // Access bracket without auth token (spectator view)
      const response = await request(app).get(
        `/api/tournaments/${tournamentId}/bracket`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("rounds");
    });
  });

  describe("Score History and Display", () => {
    it("should preserve scores after match completion", async () => {
      const players = Array.from({ length: 4 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const match1 = bracket.rounds[0].matches[0];
      const match2 = bracket.rounds[0].matches[1];

      // Submit scores for both semifinal matches
      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match1.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 3,
          player2Score: 1,
        });

      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match2.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 0,
        });

      // Get bracket and verify scores are preserved
      const response = await request(app)
        .get(`/api/tournaments/${tournamentId}/bracket`)
        .set("Authorization", `Bearer ${organizerToken}`);

      const updatedMatches = response.body.rounds[0].matches;
      expect(updatedMatches[0].player1Score).toBe(3);
      expect(updatedMatches[0].player2Score).toBe(1);
      expect(updatedMatches[1].player1Score).toBe(2);
      expect(updatedMatches[1].player2Score).toBe(0);
    });

    it("should include tournament winner in bracket response when complete", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const finalMatch = bracket.rounds[0].matches[0];

      // Complete the tournament
      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${finalMatch.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 3,
          player2Score: 0,
        });

      // Get final bracket state
      const response = await request(app)
        .get(`/api/tournaments/${tournamentId}/bracket`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tournamentWinner).toBeDefined();
      expect(response.body.tournamentWinner.userId).toBe(finalMatch.player1!.userId);
      expect(response.body.tournamentWinner.displayName).toBe(
        finalMatch.player1!.displayName
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle bye advancement without score submission", async () => {
      // Create 3 players to force a bye
      const players = Array.from({ length: 3 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      // One player should have a bye to round 2
      const round2Match = bracket.rounds[1].matches[0];
      expect(round2Match.player1 !== null || round2Match.player2 !== null).toBe(true);
    });

    it("should not allow score update on already completed match", async () => {
      const players = Array.from({ length: 2 }, (_, i) => ({
        userId: `user-${i}`,
        displayName: `Player ${i}`,
      }));

      const bracket = buildSingleEliminationBracket(tournamentId, players);
      setTournamentBracket(tournamentId, bracket);

      const match = bracket.rounds[0].matches[0];

      // Submit score once
      await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 2,
          player2Score: 1,
        });

      // Try to update again
      const response = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${match.id}/score`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          player1Score: 3,
          player2Score: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("already complete");
    });

    it("should reject single-player tournament", async () => {
      const players = [
        {
          userId: "user-0",
          displayName: "Only Player",
        },
      ];

      // Single player tournament should be rejected
      expect(() => {
        buildSingleEliminationBracket(tournamentId, players);
      }).toThrow("At least two players are required");
    });
  });
});
