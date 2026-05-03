import bcrypt from "bcryptjs";
import { createUser, createTournament, addEntrant, findUserByEmail } from "./store.js";

export function seedDemoData(): void {
  if (findUserByEmail("organizer@matchpoint.gg")) return;

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const password = "matchpoint1";

  const org1 = createUser({ email: "organizer@matchpoint.gg", passwordHash: hash(password), displayName: "TourneyAdmin", username: "tourneyadmin", games: ["Street Fighter 6", "Tekken 8"], region: "Pittsburgh", role: "organizer" });
  const org2 = createUser({ email: "organizer2@matchpoint.gg", passwordHash: hash(password), displayName: "PGH_Organizer", username: "pgh_organizer", games: ["Super Smash Bros. Ultimate"], region: "Pittsburgh", role: "organizer" });

  const players = [];
  const gamesList = ["Street Fighter 6", "Tekken 8", "Guilty Gear Strive", "Super Smash Bros. Ultimate"];
  for (let i = 1; i <= 30; i++) {
    const player = createUser({ email: `player${i}@matchpoint.gg`, passwordHash: hash(password), displayName: `Player_${i}`, username: `player_${i}`, games: [gamesList[(i - 1) % gamesList.length]], region: "Pittsburgh", role: "player" });
    players.push(player);
  }

  const t1 = createTournament({ name: "South Side Weekly - SF6", game: "Street Fighter 6", organizerId: org1.id });
  const t2 = createTournament({ name: "Oakland Throwdown - Tekken 8", game: "Tekken 8", organizerId: org1.id });
  const t3 = createTournament({ name: "CMU Smash Night", game: "Super Smash Bros. Ultimate", organizerId: org2.id });

  for (let i = 0; i < 8; i++) { addEntrant(t1.id, { userId: players[i].id, displayName: players[i].displayName, gameSelection: "Street Fighter 6", checkedIn: false, registeredAt: new Date().toISOString() }); }
  for (let i = 8; i < 14; i++) { addEntrant(t2.id, { userId: players[i].id, displayName: players[i].displayName, gameSelection: "Tekken 8", checkedIn: false, registeredAt: new Date().toISOString() }); }
  for (let i = 14; i < 18; i++) { addEntrant(t3.id, { userId: players[i].id, displayName: players[i].displayName, gameSelection: "Super Smash Bros. Ultimate", checkedIn: false, registeredAt: new Date().toISOString() }); }

  console.log("[seed] Created 2 organizers, 30 players, and 3 tournaments");
}
