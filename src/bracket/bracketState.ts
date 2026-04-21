import type { BracketMatch, BracketPlayer, BracketResponse } from "../types.js";

export class BracketProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BracketProgressError";
  }
}

export function findMatch(
  bracket: BracketResponse,
  matchId: string
): BracketMatch | undefined {
  for (const r of bracket.rounds) {
    const m = r.matches.find((x) => x.id === matchId);
    if (m) return m;
  }
  return undefined;
}

function snapshotReadyIds(bracket: BracketResponse): Set<string> {
  const s = new Set<string>();
  for (const r of bracket.rounds) {
    for (const m of r.matches) {
      if (m.status === "ready") s.add(m.id);
    }
  }
  return s;
}

function recomputeStatuses(bracket: BracketResponse): void {
  for (const r of bracket.rounds) {
    for (const m of r.matches) {
      if (m.winnerUserId) {
        m.status = "complete";
        continue;
      }
      if (m.player1 && m.player2) m.status = "ready";
      else m.status = "pending";
    }
  }
}

function propagateWinner(
  bracket: BracketResponse,
  match: BracketMatch,
  winner: BracketPlayer
): void {
  if (!match.advancesToMatchId) return;
  const next = findMatch(bracket, match.advancesToMatchId);
  if (!next) return;
  const parsed = /^r(\d+)-m(\d+)$/.exec(match.id);
  if (!parsed) return;
  const matchNum = Number(parsed[2]);
  const idx = matchNum - 1;
  if (idx % 2 === 0) next.player1 = winner;
  else next.player2 = winner;
}

/**
 * Resolves byes, reconciles `ready` / `pending` / `complete`, and returns match ids
 * that **newly** became `ready` since the start of this call.
 */
export function syncBracketDerivedState(bracket: BracketResponse): string[] {
  const beforeReady = snapshotReadyIds(bracket);

  let changed = true;
  while (changed) {
    changed = false;
    for (const r of bracket.rounds) {
      for (const m of r.matches) {
        if (m.winnerUserId) continue;
        const p1 = m.player1;
        const p2 = m.player2;
        /** True round-1 byes only: later rounds may have one slot filled while waiting for the other feeder. */
        if (r.round > 1) continue;
        if (p1 && !p2) {
          m.winnerUserId = p1.userId;
          m.status = "complete";
          propagateWinner(bracket, m, p1);
          changed = true;
        } else if (!p1 && p2) {
          m.winnerUserId = p2.userId;
          m.status = "complete";
          propagateWinner(bracket, m, p2);
          changed = true;
        }
      }
    }
  }

  recomputeStatuses(bracket);

  const afterReady = snapshotReadyIds(bracket);
  return [...afterReady].filter((id) => !beforeReady.has(id));
}

export function recordMatchWinner(
  bracket: BracketResponse,
  matchId: string,
  winnerUserId: string
): string[] {
  const match = findMatch(bracket, matchId);
  if (!match) throw new BracketProgressError("Match not found");
  if (match.status !== "ready") throw new BracketProgressError("Match not ready");
  const p1 = match.player1?.userId;
  const p2 = match.player2?.userId;
  if (!p1 || !p2) throw new BracketProgressError("Match missing players");
  if (winnerUserId !== p1 && winnerUserId !== p2) {
    throw new BracketProgressError("Invalid winner");
  }

  const winnerPlayer = winnerUserId === p1 ? match.player1! : match.player2!;
  match.winnerUserId = winnerUserId;
  match.status = "complete";

  propagateWinner(bracket, match, winnerPlayer);

  return syncBracketDerivedState(bracket);
}
