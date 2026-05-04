import bcrypt from "bcryptjs";
import { createUser, createTournament, addEntrant, findUserByEmail, createReplay } from "./store.js";

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

  // Create sample replays with fighting game footage
  createReplay({
    tournamentId: t1.id,
    title: "South Side Weekly Finals - Player_1 vs Player_2",
    game: "Street Fighter 6",
    playerNames: ["Player_1", "Player_2"],
    uploadedBy: org1.id,
    videoUrl: "https://www.youtube.com/watch?v=VF9-sEbqDvU",
    fileSize: 524288000, // ~500MB
  });

  createReplay({
    tournamentId: t1.id,
    title: "Winners Semis - Player_3 vs Player_4",
    game: "Street Fighter 6",
    playerNames: ["Player_3", "Player_4"],
    uploadedBy: org1.id,
    videoUrl: "https://www.youtube.com/watch?v=YJQkM4mHlRo",
    fileSize: 387420489, // ~370MB
  });

  createReplay({
    tournamentId: t1.id,
    title: "Losers Bracket - Player_5 vs Player_6",
    game: "Street Fighter 6",
    playerNames: ["Player_5", "Player_6"],
    uploadedBy: org1.id,
    videoUrl: "https://www.youtube.com/watch?v=B-5N20kqh58",
    fileSize: 456789123, // ~435MB
  });

  createReplay({
    tournamentId: t2.id,
    title: "Oakland Throwdown Grand Finals - Player_8 vs Player_9",
    game: "Tekken 8",
    playerNames: ["Player_8", "Player_9"],
    uploadedBy: org1.id,
    videoUrl: "https://www.youtube.com/watch?v=yMVdmSqfQzc",
    fileSize: 612345678, // ~584MB
  });

  createReplay({
    tournamentId: t2.id,
    title: "Winners Finals - Player_10 vs Player_11",
    game: "Tekken 8",
    playerNames: ["Player_10", "Player_11"],
    uploadedBy: org1.id,
    videoUrl: "https://www.youtube.com/watch?v=XqCQ8Zlk4d8",
    fileSize: 498765432, // ~475MB
  });

  createReplay({
    tournamentId: t3.id,
    title: "CMU Smash Grand Finals - Player_14 vs Player_15",
    game: "Super Smash Bros. Ultimate",
    playerNames: ["Player_14", "Player_15"],
    uploadedBy: org2.id,
    videoUrl: "https://www.youtube.com/watch?v=0C7mL8V5vU4",
    fileSize: 534567890, // ~509MB
  });

  createReplay({
    tournamentId: t3.id,
    title: "CMU Smash Winners Semis - Player_16 vs Player_17",
    game: "Super Smash Bros. Ultimate",
    playerNames: ["Player_16", "Player_17"],
    uploadedBy: org2.id,
    videoUrl: "https://www.youtube.com/watch?v=9L7CRE9UuWI",
    fileSize: 423456789, // ~403MB
  });

  createReplay({
    tournamentId: t1.id,
    title: "Pools - Player_7 vs Player_8",
    game: "Street Fighter 6",
    playerNames: ["Player_7", "Player_8"],
    uploadedBy: org1.id,
    videoUrl: "https://www.youtube.com/watch?v=JteCMq1IRmw",
    fileSize: 298765432, // ~284MB
  });

  console.log("[seed] Created 2 organizers, 30 players, 3 tournaments, and 8 replays");
}
