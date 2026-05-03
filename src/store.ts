import { randomUUID } from "crypto";
import {
  findMatch,
  recordMatchWinner as applyMatchWinner,
  syncBracketDerivedState,
} from "./bracket/bracketState.js";
import type {
  BracketResponse,
  Entrant,
  HistoryEntry,
  MatchResult,
  MatchCallNotification,
  PublicUserProfile,
  Tournament,
  User,
  UserRole,
  UserStats,
  Replay,
} from "./types.js";

const users = new Map<string, User>();
const usersByEmail = new Map<string, string>();
const usersByUsername = new Map<string, string>();
const tournaments = new Map<string, Tournament>();
const entrantsByTournament = new Map<string, Entrant[]>();
const bracketsByTournament = new Map<string, BracketResponse>();
const matchResults = new Map<string, Map<string, MatchResult>>();
const notificationsById = new Map<string, MatchCallNotification>();
const replays = new Map<string, Replay>();
const replaysByTournament = new Map<string, string[]>();
const matchReadyNotificationKeys = new Set<string>();

function matchReadyKey(tournamentId: string, matchId: string, playerId: string): string {
  return `${tournamentId}\0${matchId}\0${playerId}`;
}

/**
 * Creates unread match-call notifications for both players when a match becomes ready.
 * Idempotent per (matchId, playerId). Skips users who are not entrants in the tournament.
 * Runs immediately (always within the 2s SLA for this in-memory queue).
 */
export function enqueueMatchReadyNotifications(
  tournamentId: string,
  newlyReadyMatchIds: readonly string[]
): void {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return;
  const entrants = getEntrants(tournamentId);
  const entrantIds = new Set(entrants.map((e) => e.userId));

  for (const matchId of newlyReadyMatchIds) {
    const m = findMatch(bracket, matchId);
    if (!m || m.status !== "ready" || !m.player1 || !m.player2) continue;

    for (const player of [m.player1, m.player2]) {
      if (!entrantIds.has(player.userId)) continue;
      const key = matchReadyKey(tournamentId, m.id, player.userId);
      if (matchReadyNotificationKeys.has(key)) continue;
      matchReadyNotificationKeys.add(key);

      const opponent = player.userId === m.player1.userId ? m.player2 : m.player1;
      const n: MatchCallNotification = {
        id: randomUUID(),
        userId: player.userId,
        kind: "match_call",
        tournamentId,
        matchId: m.id,
        round: m.round,
        opponentDisplayName: opponent.displayName,
        stationLabel: m.stationLabel ?? null,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notificationsById.set(n.id, n);
    }
  }
}

export function listUnreadMatchCallNotifications(userId: string): MatchCallNotification[] {
  return [...notificationsById.values()].filter(
    (n) => n.userId === userId && !n.read && n.kind === "match_call"
  );
}

export function getNotificationById(id: string): MatchCallNotification | undefined {
  return notificationsById.get(id);
}

export function markNotificationRead(id: string, ownerUserId: string): "ok" | "not_found" | "forbidden" {
  const n = notificationsById.get(id);
  if (!n) return "not_found";
  if (n.userId !== ownerUserId) return "forbidden";
  n.read = true;
  return "ok";
}

export function reportBracketMatchWinner(
  tournamentId: string,
  matchId: string,
  winnerUserId: string
): { bracket: BracketResponse; newlyReadyMatchIds: string[] } | undefined {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return undefined;
  const newlyReady = applyMatchWinner(bracket, matchId, winnerUserId);
  return { bracket, newlyReadyMatchIds: newlyReady };
}

export function submitMatchScore(
  tournamentId: string,
  matchId: string,
  player1Score: number,
  player2Score: number
): { match: import("./types.js").BracketMatch; bracket: BracketResponse } | undefined {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return undefined;

  const match = findMatch(bracket, matchId);
  if (!match) return undefined;

  // Validate match is not already complete
  if (match.status === "complete") {
    throw new Error("Match is already complete and cannot be updated");
  }

  // Validate scores
  if (player1Score < 0 || player2Score < 0) {
    throw new Error("Scores cannot be negative");
  }

  if (!Number.isInteger(player1Score) || !Number.isInteger(player2Score)) {
    throw new Error("Scores must be integers");
  }

  if (player1Score === player2Score) {
    throw new Error("Scores cannot be tied - there must be a winner");
  }

  // Determine winner
  const winnerUserId =
    player1Score > player2Score ? match.player1?.userId : match.player2?.userId;

  if (!winnerUserId) {
    throw new Error("Cannot determine winner - missing player data");
  }

  // Update match scores
  match.player1Score = player1Score;
  match.player2Score = player2Score;

  // Advance winner to next round (this will set winnerUserId and status to complete)
  const newlyReady = applyMatchWinner(bracket, matchId, winnerUserId);
  enqueueMatchReadyNotifications(tournamentId, newlyReady);

  return { match, bracket };
}

export function setMatchStationLabel(
  tournamentId: string,
  matchId: string,
  stationLabel: string | null
): boolean {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return false;
  const m = findMatch(bracket, matchId);
  if (!m) return false;
  m.stationLabel = stationLabel;
  return true;
}

export function createUser(input: {
  username?: string;
  email: string;
  passwordHash: string;
  displayName: string;
  games?: string[];
  region?: string;
  role: UserRole;
}): User {
  const id = randomUUID();
  const username = (input.username ?? input.displayName).trim();
  const user: User = {
    id,
    username,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    displayName: input.displayName,
    games: input.games ?? [],
    region: input.region ?? "",
    role: input.role,
  };
  users.set(id, user);
  usersByEmail.set(user.email, id);
  usersByUsername.set(user.username.toLowerCase(), id);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const id = usersByEmail.get(email.toLowerCase());
  const user = id ? users.get(id) : undefined;
  if (!user || user.deletedAt) return undefined;
  return user;
}

export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function findUserByUsername(username: string): User | undefined {
  const id = usersByUsername.get(username.toLowerCase());
  return id ? users.get(id) : undefined;
}

export function isEmailTaken(email: string): boolean {
  return usersByEmail.has(email.toLowerCase());
}

export function isUsernameTaken(username: string): boolean {
  return usersByUsername.has(username.toLowerCase());
}

export function softDeleteUser(id: string): User | undefined {
  const user = users.get(id);
  if (!user || user.deletedAt) return undefined;

  user.deletedAt = new Date().toISOString();
  usersByEmail.delete(user.email.toLowerCase());
  usersByUsername.delete(user.username.toLowerCase());
  users.set(user.id, user);
  return user;
}

export function updateUserProfile(
  id: string,
  patch: {
    username?: string;
    displayName?: string;
    games?: string[];
    region?: string;
  }
): User | undefined {
  const user = users.get(id);
  if (!user || user.deletedAt) return undefined;

  if (patch.username && patch.username !== user.username) {
    usersByUsername.delete(user.username.toLowerCase());
    user.username = patch.username;
    usersByUsername.set(user.username.toLowerCase(), user.id);
  }
  if (typeof patch.displayName === "string") user.displayName = patch.displayName;
  if (Array.isArray(patch.games)) user.games = [...patch.games];
  if (typeof patch.region === "string") user.region = patch.region;

  users.set(user.id, user);
  return user;
}

export function toPublicUserProfile(user: User): PublicUserProfile {
  const stats = getUserStats(user.id);
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    games: [...user.games],
    region: user.region,
    role: user.role,
    totalTournaments: stats.totalTournaments,
    totalWins: stats.totalWins,
    totalLosses: stats.totalLosses,
    bestPlacement: stats.bestPlacement,
  };
}

export function createTournament(input: {
  name: string;
  game: string;
  organizerId: string;
  maxEntrants?: number | null;
  registrationOpen?: boolean;
}): Tournament {
  const id = randomUUID();
  const tournament: Tournament = {
    id,
    name: input.name,
    game: input.game,
    organizerId: input.organizerId,
    maxEntrants: input.maxEntrants ?? null,
    registrationOpen: input.registrationOpen ?? true,
    createdAt: new Date().toISOString(),
    checkInClosed: false,
  };
  tournaments.set(id, tournament);
  entrantsByTournament.set(id, []);
  return tournament;
}

export function updateTournament(
  id: string,
  updates: Partial<Pick<Tournament, "registrationOpen" | "maxEntrants">>
): Tournament | undefined {
  const t = tournaments.get(id);
  if (!t) return undefined;
  if (updates.registrationOpen !== undefined) t.registrationOpen = updates.registrationOpen;
  if (updates.maxEntrants !== undefined) t.maxEntrants = updates.maxEntrants;
  return t;
}

export function getTournament(id: string): Tournament | undefined {
  return tournaments.get(id);
}

export function listTournaments(): Tournament[] {
  return [...tournaments.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addEntrant(tournamentId: string, entrant: Entrant): void {
  const list = entrantsByTournament.get(tournamentId);
  if (!list) throw new Error("Unknown tournament");
  list.push({ ...entrant, checkedIn: entrant.checkedIn ?? false });
}

export function getEntrants(tournamentId: string): Entrant[] {
  return entrantsByTournament.get(tournamentId) ?? [];
}

export function setEntrantCheckedIn(
  tournamentId: string,
  entrantUserId: string,
  checkedIn: boolean
): Entrant | undefined {
  const list = entrantsByTournament.get(tournamentId);
  if (!list) return undefined;
  const entrant = list.find((e) => e.userId === entrantUserId);
  if (!entrant) return undefined;
  entrant.checkedIn = checkedIn;
  return entrant;
}

export function closeCheckIn(tournamentId: string): Tournament | undefined {
  const t = tournaments.get(tournamentId);
  if (!t) return undefined;
  t.checkInClosed = true;
  return t;
}

export function setTournamentBracket(tournamentId: string, bracket: BracketResponse): void {
  const newlyReady = syncBracketDerivedState(bracket);
  bracketsByTournament.set(tournamentId, bracket);
  enqueueMatchReadyNotifications(tournamentId, newlyReady);
}

export function getTournamentBracket(tournamentId: string): BracketResponse | undefined {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return undefined;

  // Check if tournament is complete and add winner
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (finalRound && finalRound.matches.length > 0) {
    const finalMatch = finalRound.matches[0];
    if (finalMatch && finalMatch.status === "complete" && finalMatch.winnerUserId) {
      const winner =
        finalMatch.player1?.userId === finalMatch.winnerUserId
          ? finalMatch.player1
          : finalMatch.player2;
      return {
        ...bracket,
        tournamentWinner: winner ?? null,
      };
    }
  }

  // Handle single-player tournament
  if (bracket.playerCount === 1 && bracket.rounds.length > 0) {
    const firstMatch = bracket.rounds[0]?.matches[0];
    if (firstMatch?.player1) {
      return {
        ...bracket,
        tournamentWinner: firstMatch.player1,
      };
    }
  }

  return bracket;
}

export function setMatchResult(
  tournamentId: string,
  userId: string,
  result: MatchResult
): void {
  let tournamentResults = matchResults.get(tournamentId);
  if (!tournamentResults) {
    tournamentResults = new Map();
    matchResults.set(tournamentId, tournamentResults);
  }
  tournamentResults.set(userId, result);
}

export function finalizeTournament(tournamentId: string): Tournament | undefined {
  const t = tournaments.get(tournamentId);
  if (!t) return undefined;
  t.finalized = true;
  return t;
}

export function getUserStats(userId: string): UserStats {
  const stats: UserStats = {
    totalTournaments: 0,
    totalWins: 0,
    totalLosses: 0,
    bestPlacement: null,
  };

  for (const [tournamentId, tournament] of tournaments.entries()) {
    if (!tournament.finalized) continue;

    const entrants = entrantsByTournament.get(tournamentId) ?? [];
    const isEntrant = entrants.some((e) => e.userId === userId);
    if (!isEntrant) continue;

    const tournamentResults = matchResults.get(tournamentId);
    const result = tournamentResults?.get(userId);
    if (!result) continue;

    stats.totalTournaments++;
    stats.totalWins += result.wins;
    stats.totalLosses += result.losses;

    if (stats.bestPlacement === null || result.placement < stats.bestPlacement) {
      stats.bestPlacement = result.placement;
    }
  }

  return stats;
}

export function getUserHistory(
  userId: string,
  options?: { game?: string; page?: number; pageSize?: number }
): { history: HistoryEntry[]; page: number; pageSize: number; total: number } {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const gameFilter = options?.game?.toLowerCase();

  const allHistory: HistoryEntry[] = [];

  for (const [tournamentId, tournament] of tournaments.entries()) {
    if (!tournament.finalized) continue;

    const entrants = entrantsByTournament.get(tournamentId) ?? [];
    const isEntrant = entrants.some((e) => e.userId === userId);
    if (!isEntrant) continue;

    if (gameFilter && tournament.game.toLowerCase() !== gameFilter) continue;

    const tournamentResults = matchResults.get(tournamentId);
    const result = tournamentResults?.get(userId);
    if (!result) continue;

    allHistory.push({
      tournamentId: tournament.id,
      name: tournament.name,
      game: tournament.game,
      date: tournament.createdAt,
      placement: result.placement,
      wins: result.wins,
      losses: result.losses,
    });
  }

  // Sort by date descending
  allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = allHistory.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const history = allHistory.slice(startIndex, endIndex);

  return { history, page, pageSize, total };
}

/** Test helper: reset all in-memory state */
export function __resetStoreForTests(): void {
  users.clear();
  usersByEmail.clear();
  usersByUsername.clear();
  tournaments.clear();
  entrantsByTournament.clear();
  bracketsByTournament.clear();
  matchResults.clear();
  notificationsById.clear();
  matchReadyNotificationKeys.clear();
  replays.clear();
  replaysByTournament.clear();
}

/* ------------------------------------------------------------------ */
/*  Replay Functions                                                  */
/* ------------------------------------------------------------------ */

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

export function createReplay(input: {
  tournamentId: string;
  title: string;
  game: string;
  playerNames: string[];
  uploadedBy: string;
  videoUrl: string;
  fileSize: number;
}): Replay {
  const replay: Replay = {
    id: randomUUID(),
    tournamentId: input.tournamentId,
    title: input.title,
    game: input.game,
    playerNames: input.playerNames,
    uploadedBy: input.uploadedBy,
    videoUrl: input.videoUrl,
    uploadedAt: new Date().toISOString(),
    fileSize: input.fileSize,
  };

  replays.set(replay.id, replay);

  // Add to tournament's replay list
  const tournamentReplays = replaysByTournament.get(input.tournamentId) ?? [];
  tournamentReplays.push(replay.id);
  replaysByTournament.set(input.tournamentId, tournamentReplays);

  return replay;
}

export function getReplayById(id: string): Replay | undefined {
  return replays.get(id);
}

export function getReplaysByTournament(tournamentId: string): Replay[] {
  const replayIds = replaysByTournament.get(tournamentId) ?? [];
  return replayIds
    .map((id) => replays.get(id))
    .filter((r): r is Replay => r !== undefined)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function validateReplayFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}