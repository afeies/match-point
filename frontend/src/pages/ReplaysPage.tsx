import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Film, Search, AlertCircle, Play, Calendar } from "lucide-react";
import { api, type ReplayDTO } from "../api";
import "../styles/replays.css";

type PageState = "loading" | "success" | "empty" | "error";

export function ReplaysPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [replays, setReplays] = useState<ReplayDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [gameFilter, setGameFilter] = useState<string>("");
  const [playerNameFilter, setPlayerNameFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const loadReplays = useCallback(async () => {
    setPageState("loading");
    setError(null);
    
    try {
      const params: any = { page, pageSize };
      if (gameFilter) params.game = gameFilter;
      if (playerNameFilter) params.playerName = playerNameFilter;
      
      const data = await api.searchReplays(params);
      setReplays(data.data);
      setTotal(data.total);
      setPageState(data.data.length === 0 ? "empty" : "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load replays");
      setPageState("error");
    }
  }, [page, gameFilter, playerNameFilter]);

  useEffect(() => {
    loadReplays();
  }, [loadReplays]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlayerNameFilter(searchInput);
    setPage(1);
  }

  function handleGameFilter(game: string) {
    setGameFilter(game);
    setPage(1);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="dashboard-page-head">
        <div>
          <p className="dashboard-kicker">Browse & Watch</p>
          <h1 className="dashboard-title">Match Replays</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="replays-filters">
        <form onSubmit={handleSearchSubmit} className="replays-search-form">
          <Search size={18} color="#94a3b8" />
          <input
            type="search"
            placeholder="Search by player name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search replays by player name"
          />
          <button type="submit">Search</button>
        </form>

        <div className="replays-game-filters">
          <button
            className={`replays-game-chip ${!gameFilter ? "active" : ""}`}
            onClick={() => handleGameFilter("")}
          >
            All Games
          </button>
          <button
            className={`replays-game-chip ${gameFilter === "Street Fighter 6" ? "active" : ""}`}
            onClick={() => handleGameFilter("Street Fighter 6")}
          >
            SF6
          </button>
          <button
            className={`replays-game-chip ${gameFilter === "Tekken 8" ? "active" : ""}`}
            onClick={() => handleGameFilter("Tekken 8")}
          >
            Tekken 8
          </button>
          <button
            className={`replays-game-chip ${gameFilter === "Guilty Gear Strive" ? "active" : ""}`}
            onClick={() => handleGameFilter("Guilty Gear Strive")}
          >
            GGST
          </button>
        </div>
      </div>

      {/* Loading State */}
      {pageState === "loading" && (
        <div className="replays-loading">
          <div className="replays-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="replay-card-skeleton" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {pageState === "error" && (
        <div className="replays-error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Failed to load replays</strong>
            <p>{error}</p>
          </div>
          <button onClick={loadReplays} className="replays-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {pageState === "empty" && (
        <div className="replays-empty-state">
          <Film size={64} color="#cbd5e1" />
          <h2>No replays found</h2>
          <p>
            {playerNameFilter || gameFilter
              ? "Try adjusting your filters to see more results"
              : "No replays have been uploaded yet. Check back soon!"}
          </p>
          {(playerNameFilter || gameFilter) && (
            <button
              onClick={() => {
                setGameFilter("");
                setPlayerNameFilter("");
                setSearchInput("");
                setPage(1);
              }}
              className="replays-clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Success State - Replay Grid */}
      {pageState === "success" && (
        <>
          <div className="replays-grid">
            {replays.map((replay) => (
              <div key={replay.id} className="replay-card">
                <div className="replay-card-thumbnail">
                  <div className="replay-card-thumbnail-placeholder">
                    <Play size={40} color="white" />
                  </div>
                  <div className="replay-card-duration">
                    {Math.round(replay.fileSizeBytes / (1024 * 1024))}MB
                  </div>
                </div>
                <div className="replay-card-content">
                  <h3 className="replay-card-title">{replay.title}</h3>
                  <div className="replay-card-matchup">
                    {replay.player1Name} vs {replay.player2Name}
                  </div>
                  <div className="replay-card-meta">
                    <span className="replay-card-game">{replay.game}</span>
                    <span className="replay-card-separator">•</span>
                    <Link to={`/t/${replay.tournamentId}`} className="replay-card-event">
                      {replay.tournamentName}
                    </Link>
                  </div>
                  <div className="replay-card-date">
                    <Calendar size={14} />
                    {new Date(replay.uploadDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <a
                    href={replay.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="replay-card-play-btn"
                  >
                    <Play size={16} />
                    Watch Replay
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="replays-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="replays-pagination-btn"
              >
                Previous
              </button>
              <span className="replays-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="replays-pagination-btn"
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
