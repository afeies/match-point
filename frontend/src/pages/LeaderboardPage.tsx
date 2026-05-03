import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { api } from "../api";
import "../styles/features.css";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  wins: number;
  tournaments: number;
  rank: number;
}

const GAMES = [
  "Street Fighter 6",
  "Tekken 8",
  "Guilty Gear Strive",
  "Mortal Kombat 1",
  "Super Smash Bros. Ultimate",
];

export function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const selectedGame = searchParams.get("game") || GAMES[0];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedGame, page]);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getLeaderboard({
        game: selectedGame,
        page,
        page_size: pageSize,
      });
      setLeaderboard(result.leaderboard);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  function handleGameChange(game: string) {
    setSearchParams({ game });
    setPage(1);
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown size={24} style={{ color: "#ffd700" }} />;
    if (rank === 2) return <Medal size={24} style={{ color: "#c0c0c0" }} />;
    if (rank === 3) return <Award size={24} style={{ color: "#cd7f32" }} />;
    return null;
  }

  function getRankClass(rank: number) {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "";
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>
          <Trophy size={48} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
          Player Rankings
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0.5rem 0 0" }}>
          Compete. Climb. Conquer.
        </p>
      </div>

      <div className="leaderboard-game-selector">
        {GAMES.map((game) => (
          <button
            key={game}
            className={`game-tab ${selectedGame === game ? "active" : ""}`}
            onClick={() => handleGameChange(game)}
          >
            {game}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.1rem" }}>
            <div className="spinner" />
            Loading rankings...
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Trophy size={80} />
          </div>
          <h3>No rankings yet</h3>
          <p>Be the first to compete in {selectedGame} tournaments!</p>
        </div>
      ) : (
        <>
          <div className="leaderboard-table">
            <div className="lb-row header">
              <div>Rank</div>
              <div>Player</div>
              <div>Points</div>
              <div>Wins</div>
              <div>Tournaments</div>
            </div>
            {leaderboard.map((entry) => (
              <Link
                key={entry.userId}
                to={`/players/${entry.userId}`}
                style={{ textDecoration: "none", display: "contents" }}
              >
                <div className="lb-row">
                  <div className={`lb-rank ${getRankClass(entry.rank)}`}>
                    {getRankIcon(entry.rank) || `#${entry.rank}`}
                  </div>
                  <div className="lb-player">
                    <div className="lb-avatar">{getInitials(entry.displayName)}</div>
                    <span className="lb-name">{entry.displayName}</span>
                  </div>
                  <div className="lb-stat points">{entry.points}</div>
                  <div className="lb-stat">{entry.wins}</div>
                  <div className="lb-stat">{entry.tournaments}</div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
