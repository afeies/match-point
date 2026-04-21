import { describe, expect, it } from "vitest";
import { buildSingleEliminationBracket } from "./singleElimination.js";
import { recordMatchWinner } from "./bracketState.js";

describe("bracketState progression", () => {
  it("marks round 2 ready after two round-1 winners (4 players)", () => {
    const players = [
      { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "P1" },
      { userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", displayName: "P2" },
      { userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", displayName: "P3" },
      { userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", displayName: "P4" },
    ];
    const { bracket } = buildSingleEliminationBracket("tid", players);
    const r1 = bracket.rounds[0]!.matches;
    expect(r1.length).toBe(2);

    recordMatchWinner(bracket, r1[0]!.id, r1[0]!.player1!.userId);
    recordMatchWinner(bracket, r1[1]!.id, r1[1]!.player1!.userId);

    const r2m = bracket.rounds[1]!.matches[0]!;
    expect(r2m.status).toBe("ready");
    expect(r2m.player1).toBeTruthy();
    expect(r2m.player2).toBeTruthy();
  });
});
