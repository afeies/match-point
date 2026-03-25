import { randomUUID } from "crypto";
import type { Entrant, Tournament, User, UserRole } from "./types.js";

const users = new Map<string, User>();
const usersByEmail = new Map<string, string>();
const tournaments = new Map<string, Tournament>();
const entrantsByTournament = new Map<string, Entrant[]>();

export function createUser(input: {
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
}): User {
  const id = randomUUID();
  const user: User = {
    id,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    displayName: input.displayName,
    role: input.role,
  };
  users.set(id, user);
  usersByEmail.set(user.email, id);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const id = usersByEmail.get(email.toLowerCase());
  return id ? users.get(id) : undefined;
}

export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function createTournament(input: {
  name: string;
  game: string;
  organizerId: string;
}): Tournament {
  const id = randomUUID();
  const tournament: Tournament = {
    id,
    name: input.name,
    game: input.game,
    organizerId: input.organizerId,
    createdAt: new Date().toISOString(),
  };
  tournaments.set(id, tournament);
  entrantsByTournament.set(id, []);
  return tournament;
}

export function getTournament(id: string): Tournament | undefined {
  return tournaments.get(id);
}

export function addEntrant(tournamentId: string, entrant: Entrant): void {
  const list = entrantsByTournament.get(tournamentId);
  if (!list) throw new Error("Unknown tournament");
  list.push(entrant);
}

export function getEntrants(tournamentId: string): Entrant[] {
  return entrantsByTournament.get(tournamentId) ?? [];
}

/** Test helper: reset all in-memory state */
export function __resetStoreForTests(): void {
  users.clear();
  usersByEmail.clear();
  tournaments.clear();
  entrantsByTournament.clear();
}
