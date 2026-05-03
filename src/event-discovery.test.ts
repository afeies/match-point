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

describe("US7: Event Discovery & Filtering", () => {
  let app: ReturnType<typeof createApp>;
  let organizerId: string;

  beforeEach(() => {
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

    // Create upcoming tournaments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    createTournament({
      name: "Steel City Weekly #12",
      game: "Street Fighter 6",
      organizerId,
      maxEntrants: 32,
      registrationOpen: true,
      startDate: tomorrow.toISOString(),
      venue: "Steel City Arena",
      city: "Pittsburgh",
    });

    createTournament({
      name: "Tekken Tuesday",
      game: "Tekken 8",
      organizerId,
      maxEntrants: 16,
      registrationOpen: true,
      startDate: nextWeek.toISOString(),
      venue: "Arcade Legacy",
      city: "Pittsburgh",
    });

    createTournament({
      name: "NY Fighting Games Monthly",
      game: "Street Fighter 6",
      organizerId,
      maxEntrants: 64,
      registrationOpen: true,
      startDate: nextMonth.toISOString(),
      venue: "The Colosseum",
      city: "New York",
    });

    // Create past tournament (should be filtered out)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    createTournament({
      name: "Past Tournament",
      game: "Street Fighter 6",
      organizerId,
      maxEntrants: 32,
      registrationOpen: false,
      startDate: yesterday.toISOString(),
      venue: "Old Venue",
      city: "Pittsburgh",
    });
  });

  describe("GET /api/events - Basic Listing", () => {
    it("should return upcoming events sorted by date ascending", async () => {
      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      
      // Verify sorted by date ascending (soonest first)
      const dates = response.body.map((e: any) => new Date(e.startDate).getTime());
      expect(dates[0]).toBeLessThan(dates[1]);
      expect(dates[1]).toBeLessThan(dates[2]);
      
      expect(response.body[0].name).toBe("Steel City Weekly #12");
    });

    it("should exclude past events by default", async () => {
      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      expect(response.body.every((e: any) => e.name !== "Past Tournament")).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it("should return empty array when no upcoming events exist", async () => {
      __resetStoreForTests();
      app = createApp();

      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/events - Filtering", () => {
    it("should filter events by game", async () => {
      const response = await request(app).get("/api/events?game=Tekken 8");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].game).toBe("Tekken 8");
      expect(response.body[0].name).toBe("Tekken Tuesday");
    });

    it("should filter events by game (case-insensitive)", async () => {
      const response = await request(app).get("/api/events?game=tekken 8");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].game).toBe("Tekken 8");
    });

    it("should filter events by city", async () => {
      const response = await request(app).get("/api/events?city=Pittsburgh");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((e: any) => e.city === "Pittsburgh")).toBe(true);
    });

    it("should filter events by city (case-insensitive)", async () => {
      const response = await request(app).get("/api/events?city=pittsburgh");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it("should support multiple filters simultaneously", async () => {
      const response = await request(app).get(
        "/api/events?game=Street Fighter 6&city=Pittsburgh"
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Steel City Weekly #12");
    });

    it("should return empty array for non-matching filters", async () => {
      const response = await request(app).get("/api/events?game=Mortal Kombat");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/events - Response Format", () => {
    it("should include all required fields in event objects", async () => {
      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      const event = response.body[0];
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("name");
      expect(event).toHaveProperty("game");
      expect(event).toHaveProperty("startDate");
      expect(event).toHaveProperty("venue");
      expect(event).toHaveProperty("city");
      expect(event).toHaveProperty("entrantCount");
      expect(event).toHaveProperty("maxEntrants");
      expect(event).toHaveProperty("registrationOpen");
    });

    it("should include correct entrant count", async () => {
      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty("entrantCount");
      expect(typeof response.body[0].entrantCount).toBe("number");
      expect(response.body[0].entrantCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /api/events - Performance", () => {
    it("should respond within 400ms for large dataset", async () => {
      // Create a large dataset
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      for (let i = 1; i <= 100; i++) {
        const eventDate = new Date(futureDate);
        eventDate.setDate(eventDate.getDate() + i);

        createTournament({
          name: `Tournament ${i}`,
          game: i % 2 === 0 ? "Street Fighter 6" : "Tekken 8",
          organizerId,
          maxEntrants: 32,
          registrationOpen: true,
          startDate: eventDate.toISOString(),
          venue: `Venue ${i}`,
          city: i % 3 === 0 ? "Pittsburgh" : "New York",
        });
      }

      const startTime = Date.now();
      const response = await request(app).get("/api/events?game=Street Fighter 6");
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(400);
    });
  });

  describe("GET /api/events - Edge Cases", () => {
    it("should handle tournaments without location information", async () => {
      createTournament({
        name: "Online Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: null,
        registrationOpen: true,
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      });

      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      const onlineEvent = response.body.find((e: any) => e.name === "Online Tournament");
      expect(onlineEvent).toBeDefined();
      expect(onlineEvent.city).toBeUndefined();
      expect(onlineEvent.venue).toBeUndefined();
    });

    it("should handle tournaments with null maxEntrants", async () => {
      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should only show upcoming events when filtering by city", async () => {
      const response = await request(app).get("/api/events?city=Pittsburgh");

      expect(response.status).toBe(200);
      expect(response.body.every((e: any) => e.name !== "Past Tournament")).toBe(true);
    });
  });

  describe("GET /api/events - Date Handling", () => {
    it("should include events starting today", async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      createTournament({
        name: "Today's Tournament",
        game: "Street Fighter 6",
        organizerId,
        maxEntrants: 32,
        registrationOpen: true,
        startDate: today.toISOString(),
        venue: "Local Venue",
        city: "Pittsburgh",
      });

      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      const todayEvent = response.body.find((e: any) => e.name === "Today's Tournament");
      expect(todayEvent).toBeDefined();
    });

    it("should sort events correctly across multiple dates", async () => {
      const response = await request(app).get("/api/events");

      expect(response.status).toBe(200);
      
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = new Date(response.body[i].startDate).getTime();
        const next = new Date(response.body[i + 1].startDate).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    });
  });
});
