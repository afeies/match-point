export type UserRole = "organizer" | "player";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
}

export interface Tournament {
  id: string;
  name: string;
  game: string;
  organizerId: string;
  createdAt: string;
}

export interface Entrant {
  userId: string;
  displayName: string;
  registeredAt: string;
}

export interface BracketPlayer {
  userId: string;
  displayName: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  slot: number;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  /** Winner advances to this match id in the next round, if any */
  advancesToMatchId: string | null;
}

export interface BracketRound {
  round: number;
  matches: BracketMatch[];
}

export interface BracketResponse {
  tournamentId: string;
  playerCount: number;
  roundCount: number;
  rounds: BracketRound[];
}
