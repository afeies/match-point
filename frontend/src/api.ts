export type UserRole = "organizer" | "player";

export interface UserProfile {
  id: string;
  username?: string;
  displayName: string;
  games: string[];
  region?: string;
  createdAt: string;
  totalTournaments: number;
  totalWins: number;
  totalLosses: number;
  bestPlacement: number | null;
}

export interface HistoryEntry {
  tournamentId: string;
  name: string;
  game: string;
  date: string;
  placement: number;
  wins: number;
  losses: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface TournamentSummary {
  id: string;
  name: string;
  game: string;
  entrantCount: number;
  maxEntrants: number | null;
  registrationOpen: boolean;
  createdAt: string;
  checkInClosed: boolean;
}

export interface EntrantRecord {
  userId: string;
  displayName: string;
  gameSelection: string;
  registeredAt: string;
  checkedIn: boolean;
}

export interface TournamentDetail extends TournamentSummary {
  entrants: EntrantRecord[];
}

export interface BracketPlayer {
  userId: string;
  displayName: string;
}

export type BracketMatchStatus = "pending" | "ready" | "complete";

export interface BracketMatch {
  id: string;
  round: number;
  slot: number;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  advancesToMatchId: string | null;
  status: BracketMatchStatus;
  winnerUserId: string | null;
  stationLabel?: string | null;
}

export interface MatchCallNotificationDTO {
  id: string;
  tournamentId: string;
  matchId: string;
  round: number;
  opponentDisplayName: string;
  stationLabel: string | null;
  createdAt: string;
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

const jsonHeaders = {
  "Content-Type": "application/json",
};

function getStoredToken(): string | null {
  return localStorage.getItem("mp_token");
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem("mp_token", token);
  else localStorage.removeItem("mp_token");
}

function errorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === "string") return e;
    return "Validation failed";
  }
  return `Request failed (${status})`;
}

type ApiInit = RequestInit & { auth?: boolean };

async function request<T>(path: string, init: ApiInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const sendAuth = init.auth !== false;
  const token = sendAuth ? getStoredToken() : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || res.statusText);
  }

  if (!res.ok) {
    throw new Error(errorMessage(data, res.status));
  }
  return data as T;
}

export const api = {
  register(body: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }): Promise<{ token: string; user: AuthUser }> {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
      auth: false,
    });
  },

  login(body: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
      auth: false,
    });
  },

  listTournaments(): Promise<TournamentSummary[]> {
    return request("/api/tournaments", { auth: false });
  },

  getTournament(id: string): Promise<TournamentDetail> {
    return request(`/api/tournaments/${id}`, { auth: false });
  },

  createTournament(body: { name: string; game: string }): Promise<{ id: string; name: string; game: string }> {
    return request("/api/tournaments", {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
  },

  registerForTournament(
    tournamentId: string,
    body: { displayName: string; gameSelection: string }
  ): Promise<{
    tournamentId: string;
    userId: string;
    displayName: string;
    gameSelection: string;
    registeredAt: string;
  }> {
    return request(`/api/tournaments/${tournamentId}/register`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
  },

  getEntrants(
    tournamentId: string
  ): Promise<{
    tournamentId: string;
    count: number;
    entrants: EntrantRecord[];
  }> {
    return request(`/api/tournaments/${tournamentId}/entrants`, { auth: false });
  },

  checkInEntrant(tournamentId: string, entrantId: string): Promise<EntrantRecord> {
    return request(`/api/tournaments/${tournamentId}/checkin/${entrantId}`, {
      method: "POST",
      headers: jsonHeaders,
    });
  },

  uncheckInEntrant(tournamentId: string, entrantId: string): Promise<EntrantRecord> {
    return request(`/api/tournaments/${tournamentId}/checkin/${entrantId}`, {
      method: "DELETE",
    });
  },

  closeCheckIn(
    tournamentId: string
  ): Promise<{
    id: string;
    name: string;
    game: string;
    maxEntrants: number | null;
    registrationOpen: boolean;
    checkInClosed: boolean;
  }> {
    return request(`/api/tournaments/${tournamentId}/checkin/close`, {
      method: "POST",
      headers: jsonHeaders,
    });
  },

  generateBracket(tournamentId: string): Promise<BracketResponse> {
    return request(`/api/tournaments/${tournamentId}/bracket`, {
      method: "POST",
      body: "{}",
      headers: jsonHeaders,
    });
  },

  /** Public: returns null if bracket has not been published yet. */
  async getTournamentBracket(tournamentId: string): Promise<BracketResponse | null> {
    const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
    if (res.status === 404) return null;
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Invalid response");
    }
    if (!res.ok) {
      throw new Error(errorMessage(data, res.status));
    }
    return data as BracketResponse;
  },

  getUser(id: string): Promise<UserProfile> {
    return request(`/api/users/${id}`, { auth: false });
  },

  getUserHistory(
    userId: string,
    options?: { game?: string; page?: number; pageSize?: number }
  ): Promise<{
    history: HistoryEntry[];
    page: number;
    pageSize: number;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options?.game) params.set("game", options.game);
    if (options?.page) params.set("page", options.page.toString());
    if (options?.pageSize) params.set("pageSize", options.pageSize.toString());
    const query = params.toString();
    const path = query ? `/api/users/${userId}/history?${query}` : `/api/users/${userId}/history`;
    return request(path, { auth: false });
  },

  patchUser(
    id: string,
    body: { displayName?: string; games?: string[]; region?: string }
  ): Promise<UserProfile> {
    return request(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
  },

  getMatchCallNotifications(userId: string): Promise<MatchCallNotificationDTO[]> {
    return request(`/api/users/${userId}/notifications`, { headers: jsonHeaders });
  },

  ackMatchCallNotification(notificationId: string): Promise<{ ok: boolean }> {
    return request(`/api/notifications/${notificationId}/ack`, {
      method: "POST",
      headers: jsonHeaders,
    });
  },

  // US3: Live Score Tracking
  reportMatchScore(
    matchId: string,
    body: { player1Score: number; player2Score: number; winnerUserId: string }
  ): Promise<{ id: string; player1Score: number; player2Score: number; winnerUserId: string }> {
    return request(`/api/matches/${matchId}/score`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
  },

  getMatchScore(matchId: string): Promise<{
    matchId: string;
    player1Score: number;
    player2Score: number;
    winnerUserId: string;
  } | null> {
    return request(`/api/matches/${matchId}/score`).catch(() => null);
  },

  // US4: Replay Upload & Storage
  uploadReplay(body: {
    tournamentId: string;
    videoUrl: string;
    title: string;
    playerNames: string[];
    game: string;
    fileSizeBytes: number;
  }): Promise<{
    id: string;
    tournamentId: string;
    videoUrl: string;
    title: string;
    playerNames: string[];
    game: string;
    fileSizeBytes: number;
    uploadedAt: string;
  }> {
    return request("/api/replays", {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
  },

  getReplay(id: string): Promise<{
    id: string;
    tournamentId: string;
    videoUrl: string;
    title: string;
    playerNames: string[];
    game: string;
    fileSizeBytes: number;
    uploadedAt: string;
  }> {
    return request(`/api/replays/${id}`, { auth: false });
  },

  getTournamentReplays(tournamentId: string): Promise<
    Array<{
      id: string;
      tournamentId: string;
      videoUrl: string;
      title: string;
      playerNames: string[];
      game: string;
      fileSizeBytes: number;
      uploadedAt: string;
    }>
  > {
    return request(`/api/tournaments/${tournamentId}/replays`, { auth: false });
  },

  // US5: Replay Discovery & Browsing
  searchReplays(params?: {
    game?: string;
    event_id?: string;
    player_name?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    replays: Array<{
      id: string;
      tournamentId: string;
      videoUrl: string;
      title: string;
      playerNames: string[];
      game: string;
      fileSizeBytes: number;
      uploadedAt: string;
    }>;
    page: number;
    page_size: number;
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.game) query.set("game", params.game);
    if (params?.event_id) query.set("event_id", params.event_id);
    if (params?.player_name) query.set("player_name", params.player_name);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.page_size) query.set("page_size", params.page_size.toString());
    const path = query.toString() ? `/api/replays?${query}` : "/api/replays";
    return request(path, { auth: false });
  },

  // US7: Event Discovery & Filtering
  searchEvents(params?: {
    game?: string;
    city?: string;
  }): Promise<
    Array<{
      id: string;
      name: string;
      game: string;
      startDate: string;
      venue: string | null;
      city: string | null;
      entrantCount: number;
    }>
  > {
    const query = new URLSearchParams();
    if (params?.game) query.set("game", params.game);
    if (params?.city) query.set("city", params.city);
    const path = query.toString() ? `/api/events?${query}` : "/api/events";
    return request(path, { auth: false });
  },

  // US8: Player Leaderboard
  getLeaderboard(params: {
    game: string;
    player_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    leaderboard: Array<{
      userId: string;
      displayName: string;
      points: number;
      wins: number;
      tournaments: number;
      rank: number;
    }>;
    page: number;
    page_size: number;
    total: number;
  }> {
    const query = new URLSearchParams();
    query.set("game", params.game);
    if (params.player_id) query.set("player_id", params.player_id);
    if (params.page) query.set("page", params.page.toString());
    if (params.page_size) query.set("page_size", params.page_size.toString());
    return request(`/api/leaderboard?${query}`, { auth: false });
  },

  // US9: Follow Players
  followPlayer(targetUserId: string): Promise<{
    id: string;
    followerId: string;
    followingId: string;
    createdAt: string;
  }> {
    return request("/api/follows", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
      headers: jsonHeaders,
    });
  },

  unfollowPlayer(followId: string): Promise<{ ok: boolean }> {
    return request(`/api/follows/${followId}`, {
      method: "DELETE",
    });
  },

  getUserFollowing(
    userId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<{
    users: Array<{
      id: string;
      displayName: string;
      games: string[];
      region?: string;
    }>;
    page: number;
    page_size: number;
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.page_size) query.set("page_size", params.page_size.toString());
    const path = query.toString()
      ? `/api/users/${userId}/following?${query}`
      : `/api/users/${userId}/following`;
    return request(path, { auth: false });
  },

  getUserFollowers(
    userId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<{
    users: Array<{
      id: string;
      displayName: string;
      games: string[];
      region?: string;
    }>;
    page: number;
    page_size: number;
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", params.page.toString());
    if (params?.page_size) query.set("page_size", params.page_size.toString());
    const path = query.toString()
      ? `/api/users/${userId}/followers?${query}`
      : `/api/users/${userId}/followers`;
    return request(path, { auth: false });
  },

  // US10: Premium Subscription
  createSubscription(priceId: string): Promise<{
    subscriptionId: string;
    clientSecret: string;
  }> {
    return request("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({ priceId }),
      headers: jsonHeaders,
    });
  },

  getSubscriptionStatus(userId: string): Promise<{
    status: "active" | "pending" | "expired" | "cancelled" | "inactive";
    expiryDate?: string;
  }> {
    return request(`/api/subscriptions/${userId}`, { auth: false });
  },

  cancelSubscription(subscriptionId: string): Promise<{ ok: boolean }> {
    return request(`/api/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
  },
};
