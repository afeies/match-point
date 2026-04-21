import { randomUUID } from "crypto";
import {
  recordMatchWinner as applyBracketWinner,
  BracketProgressError,
  findMatch,
} from "./bracket/bracketState.js";
import type {
  BracketResponse,
  Entrant,
  MatchCallNotification,
  PublicUserProfile,
  Tournament,
  User,
  UserRole,
} from "./types.js";

const users = new Map<string, User>();
const usersByEmail = new Map<string, string>();
const usersByUsername = new Map<string, string>();
const tournaments = new Map<string, Tournament>();
const entrantsByTournament = new Map<string, Entrant[]>();
const bracketsByTournament = new Map<string, BracketResponse>();
const notificationsById = new Map<string, MatchCallNotification>();
/** Idempotency: `${tournamentId}\0${matchId}\0${playerId}` */
const matchReadyNotificationKeys = new Set<string>();

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
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    games: [...user.games],
    region: user.region,
    role: user.role,
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
  bracketsByTournament.set(tournamentId, bracket);
}

export function getTournamentBracket(tournamentId: string): BracketResponse | undefined {
  return bracketsByTournament.get(tournamentId);
}

export function enqueueMatchReadyNotifications(
  tournamentId: string,
  newlyReadyMatchIds: string[]
): void {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket || newlyReadyMatchIds.length === 0) return;

  const entrants = getEntrants(tournamentId);
  const entrantIds = new Set(entrants.map((e) => e.userId));

  for (const matchId of newlyReadyMatchIds) {
    const match = findMatch(bracket, matchId);
    if (!match || match.status !== "ready") continue;

    const p1 = match.player1;
    const p2 = match.player2;
    if (!p1 || !p2) continue;

    for (const player of [p1, p2]) {
      if (!entrantIds.has(player.userId)) continue;

      const key = `${tournamentId}\0${matchId}\0${player.userId}`;
      if (matchReadyNotificationKeys.has(key)) continue;
      matchReadyNotificationKeys.add(key);

      const opponent =
        player.userId === p1.userId ? p2.displayName : p1.displayName;

      const row: MatchCallNotification = {
        id: randomUUID(),
        userId: player.userId,
        kind: "match_call",
        tournamentId,
        matchId,
        round: match.round,
        opponentDisplayName: opponent,
        stationLabel: match.stationLabel ?? null,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notificationsById.set(row.id, row);
    }
  }
}

export function listUnreadMatchCallNotifications(userId: string): MatchCallNotification[] {
  return [...notificationsById.values()].filter(
    (n) => n.userId === userId && n.kind === "match_call" && !n.read
  );
}

export function getNotificationById(id: string): MatchCallNotification | undefined {
  return notificationsById.get(id);
}

export function markNotificationRead(
  notificationId: string,
  ownerUserId: string
): "ok" | "not_found" | "forbidden" {
  const n = notificationsById.get(notificationId);
  if (!n) return "not_found";
  if (n.userId !== ownerUserId) return "forbidden";
  n.read = true;
  return "ok";
}

export function setMatchStationLabel(
  tournamentId: string,
  matchId: string,
  stationLabel: string | null
): boolean {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return false;
  const match = findMatch(bracket, matchId);
  if (!match) return false;
  match.stationLabel = stationLabel;
  bracketsByTournament.set(tournamentId, bracket);
  return true;
}

export function reportBracketMatchWinner(
  tournamentId: string,
  matchId: string,
  winnerUserId: string
):
  | { ok: true; bracket: BracketResponse; newlyReadyMatchIds: string[] }
  | { ok: false; error: string }
  | undefined {
  const bracket = bracketsByTournament.get(tournamentId);
  if (!bracket) return undefined;
  try {
    const newlyReadyMatchIds = applyBracketWinner(bracket, matchId, winnerUserId);
    bracketsByTournament.set(tournamentId, bracket);
    return { ok: true, bracket, newlyReadyMatchIds };
  } catch (e) {
    if (e instanceof BracketProgressError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

/** Test helper: reset all in-memory state */
export function __resetStoreForTests(): void {
  users.clear();
  usersByEmail.clear();
  usersByUsername.clear();
  tournaments.clear();
  entrantsByTournament.clear();
  bracketsByTournament.clear();
  notificationsById.clear();
  matchReadyNotificationKeys.clear();
}