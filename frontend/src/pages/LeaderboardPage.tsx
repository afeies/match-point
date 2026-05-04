import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, AlertCircle, Medal, Crown } from "lucide-react";
import { api, type LeaderboardEntry } from "../api";
import { useAuth } from "../auth-context";
import "../styles/leaderboard.css";

type PageState = "loading" | "success" | "empty" | "error";

export function LeaderboardPage() {
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [gameFilter, setGameFilter] = useState<string>("Street Fighter 6");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const loadLeaderboard = useCallback(async () => {
    setPageState("loading");
    setError(null);
    
    try {
      const params: any = { page, pageSize };
      if (gameFilter) params.game = gameFilter;
      
      const data = await api.getLeaderboard(params);
      setEntries(data.data);
      setTotal(data.total);
      setPageState(data.data.length === 0 ? "empty" : "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      setPageState("error");
    }
  }, [page, gameFilter]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  function handleGameFilter(game: string) {
    setGameFilter(game);
    setPage(1);
  }

  const totalPages = Math.ceil(total / pageSize);
  const myEntry = user ? entries.find((e) => e.userId === user.id) : null;

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown size={20} color="#fbbf24" />;
    if (rank === 2) return <Medal size={20} color="#94a3b8" />;
    if (rank === 3) return <Medal size={20} color="#cd7f32" />;
    return null;
  }

  return (
    <>
      <div className="dashboard-page-head">
        <div>
          <p className="dashboard-kicker">Rankings</p>
          <h1 className="dashboard-title">Player Leaderboard</h1>
        </div>
      </div>

      {/* Game Filter */}
      <div className="leaderboard-filters">
        <label htmlFor="game-filter" className="leaderboard-filter-label">
          Game:
        </label>
        <div className="leaderboard-game-buttons">
          <button
            className={`leaderboard-game-btn ${gameFilter === "Street Fighter 6" ? "active" : ""}`}
            onClick={() => handleGameFilter("Street Fighter 6")}
          >
            Street Fighter 6
          </button>
          <button
            className={`leaderboard-game-btn ${gameFilter === "Tekken 8" ? "active" : ""}`}
            onClick={() => handleGameFilter("Tekken 8")}
          >
            Tekken 8
          </button>
          <button
            className={`leaderboard-game-btn ${gameFilter === "Guilty Gear Strive" ? "active" : ""}`}
            onClick={() => handleGameFilter("Guilty Gear Strive")}
          >
            Guilty Gear Strive
          </button>
        </div>
      </div>

      {/* My Rank Card */}
      {myEntry && pageState === "success" && (
        <div className="leaderboard-my-rank-card">
          <div className="leaderboard-my-rank-icon">
            <TrendingUp size={24} />
          </div>
          <div className="leaderboard-my-rank-content">
            <div className="leaderboard-my-rank-label">Your Rank</div>
            <div className="leaderboard-my-rank-number">#{myEntry.rank}</div>
          </div>
          <div className="leaderboard-my-rank-stats">
            <div>
              <span className="leaderboard-my-rank-stat-label">Points</span>
              <span className="leaderboard-my-rank-stat-value">{myEntry.points}</span>
            </div>
            <div>
              <span className="leaderboard-my-rank-stat-label">Wins</span>
              <span className="leaderboard-my-rank-stat-value">
                {myEntry.totalWins}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {pageState === "loading" && (
        <div className="leaderboard-loading">
          <div className="leaderboard-skeleton-list">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="leaderboard-row-skeleton" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {pageState === "error" && (
        <div className="leaderboard-error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Failed to load leaderboard</strong>
            <p>{error}</p>
          </div>
          <button onClick={loadLeaderboard} className="leaderboard-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {pageState === "empty" && (
        <div className="leaderboard-empty-state">
          <Trophy size={64} color="#cbd5e1" />
          <h2>No rankings yet</h2>
          <p>Be the first to compete and climb the leaderboard for {gameFilter}!</p>
        </div>
      )}

      {/* Success State - Leaderboard Table */}
      {pageState === "success" && (
        <>
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="leaderboard-th-rank">Rank</th>
                  <th className="leaderboard-th-player">Player</th>
                  <th className="leaderboard-th-points">Points</th>
                  <th className="leaderboard-th-record">Wins</th>
                  <th className="leaderboard-th-tournaments">Events</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isCurrentUser = user && entry.userId === user.id;
                  return (
                    <tr
                      key={entry.userId}
                      className={`leaderboard-row ${isCurrentUser ? "leaderboard-row-current" : ""}`}
                    >
                      <td className="leaderboard-td-rank">
                        <div className="leaderboard-rank-cell">
                          {getRankIcon(entry.rank)}
                          <span className="leaderboard-rank-number">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="leaderboard-td-player">
                        <Link to={`/players/${entry.userId}`} className="leaderboard-player-link">
                          {entry.displayName}
                          {isCurrentUser && <span className="leaderboard-you-badge">You</span>}
                        </Link>
                      </td>
                      <td className="leaderboard-td-points">
                        <strong>{entry.points}</strong>
                      </td>
                      <td className="leaderboard-td-record">
                        <span className="leaderboard-wins">{entry.totalWins}</span>
                      </td>
                      <td className="leaderboard-td-tournaments">{entry.totalTournaments}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="leaderboard-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="leaderboard-pagination-btn"
              >
                Previous
              </button>
              <span className="leaderboard-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="leaderboard-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
