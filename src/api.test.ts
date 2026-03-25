import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { __resetStoreForTests } from "./store.js";

function ceilLog2(n: number): number {
  return Math.ceil(Math.log2(n));
}

afterEach(() => {
  __resetStoreForTests();
});

async function register(
  app: ReturnType<typeof createApp>,
  role: "organizer" | "player",
  suffix: string
) {
  const email = `${role}-${suffix}@test.local`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password: "password123",
      displayName: `${role} ${suffix}`,
      role,
    });
  expect(res.status).toBe(201);
  return { token: res.body.token as string, email };
}

describe("POST /api/tournaments", () => {
  it("returns 201 with id, name, game for organizer", async () => {
    const app = createApp();
    const { token } = await register(app, "organizer", "a");
    const res = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Winter Jam", game: "Street Fighter 6" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Winter Jam",
      game: "Street Fighter 6",
    });
    expect(typeof res.body.id).toBe("string");
    expect(res.body.id.length).toBeGreaterThan(0);
  });

  it("returns 403 for authenticated player", async () => {
    const app = createApp();
    const { token } = await register(app, "player", "p1");
    const res = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Open", game: "GGST" });
    expect(res.status).toBe(403);
  });

  it("returns 401 without auth", async () => {
    const app = createApp();
    const res = await request(app).post("/api/tournaments").send({ name: "X", game: "Y" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/tournaments/:id/bracket", () => {
  it("returns 400 when fewer than 2 players", async () => {
    const app = createApp();
    const { token } = await register(app, "organizer", "o");
    const tRes = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T", game: "G" });
    const tid = tRes.body.id as string;

    const res = await request(app)
      .post(`/api/tournaments/${tid}/bracket`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        players: [
          { userId: "11111111-1111-4111-8111-111111111111", displayName: "Only" },
        ],
      });
    expect(res.status).toBe(400);
  });

  it("returns single-elimination bracket with ceil(log2(n)) rounds", async () => {
    const app = createApp();
    const { token } = await register(app, "organizer", "o");
    const tRes = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T", game: "G" });
    const tid = tRes.body.id as string;

    const players = [
      { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "Alice" },
      { userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", displayName: "Bob" },
      { userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", displayName: "Carol" },
      { userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", displayName: "Dan" },
      { userId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", displayName: "Eve" },
    ];

    const res = await request(app)
      .post(`/api/tournaments/${tid}/bracket`)
      .set("Authorization", `Bearer ${token}`)
      .send({ players });

    expect(res.status).toBe(200);
    expect(res.body.roundCount).toBe(ceilLog2(players.length));
    expect(res.body.rounds).toHaveLength(res.body.roundCount);
    for (const round of res.body.rounds) {
      const expectedMatches = 2 ** (res.body.roundCount - round.round);
      expect(round.matches).toHaveLength(expectedMatches);
    }
  });

  it("is deterministic for identical player inputs (any request order)", async () => {
    const app = createApp();
    const { token } = await register(app, "organizer", "o");
    const tRes = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T", game: "G" });
    const tid = tRes.body.id as string;

    const playersA = [
      { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "Zed" },
      { userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", displayName: "Amy" },
      { userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", displayName: "Ben" },
    ];
    const playersB = [...playersA].reverse();

    const r1 = await request(app)
      .post(`/api/tournaments/${tid}/bracket`)
      .set("Authorization", `Bearer ${token}`)
      .send({ players: playersA });
    const r2 = await request(app)
      .post(`/api/tournaments/${tid}/bracket`)
      .set("Authorization", `Bearer ${token}`)
      .send({ players: playersB });

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body).toEqual(r2.body);
  });

  it("returns 403 when a player tries to generate a bracket", async () => {
    const app = createApp();
    const { token: orgToken } = await register(app, "organizer", "o");
    const { token: pToken } = await register(app, "player", "p1");

    const tRes = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${orgToken}`)
      .send({ name: "T", game: "G" });
    const tid = tRes.body.id as string;

    const res = await request(app)
      .post(`/api/tournaments/${tid}/bracket`)
      .set("Authorization", `Bearer ${pToken}`)
      .send({
        players: [
          { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "A" },
          { userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", displayName: "B" },
        ],
      });
    expect(res.status).toBe(403);
  });

  it("builds bracket from registrations when body omits players", async () => {
    const app = createApp();
    const { token: orgToken } = await register(app, "organizer", "o");
    const { token: p1 } = await register(app, "player", "p1");
    const { token: p2 } = await register(app, "player", "p2");

    const tRes = await request(app)
      .post("/api/tournaments")
      .set("Authorization", `Bearer ${orgToken}`)
      .send({ name: "Locals", game: "Tekken 8" });
    const tid = tRes.body.id as string;

    await request(app)
      .post(`/api/tournaments/${tid}/register`)
      .set("Authorization", `Bearer ${p1}`);
    await request(app)
      .post(`/api/tournaments/${tid}/register`)
      .set("Authorization", `Bearer ${p2}`);

    const res = await request(app)
      .post(`/api/tournaments/${tid}/bracket`)
      .set("Authorization", `Bearer ${orgToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.playerCount).toBe(2);
    expect(res.body.roundCount).toBe(1);
  });
});
