import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Film, Search, Gamepad2, Calendar, Users, Play } from "lucide-react";
import { api } from "../api";
import "../styles/features.css";

interface Replay {
  id: string;
  tournamentId: string;
  videoUrl: string;
  title: string;
  playerNames: string[];
  game: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export function ReplaysPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const gameFilter = searchParams.get("game") || "";
  const playerFilter = searchParams.get("player") || "";

  useEffect(() => {
    loadReplays();
  }, [page, gameFilter, playerFilter]);

  async function loadReplays() {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, page_size: pageSize };
      if (gameFilter) params.game = gameFilter;
      if (playerFilter) params.player_name = playerFilter;

      const result = await api.searchReplays(params);
      setReplays(result.replays);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load replays");
    } finally {
      setLoading(false);
    }
  }

  function handleGameFilter(game: string) {
    const params = new URLSearchParams(searchParams);
    if (game) {
      params.set("game", game);
    } else {
      params.delete("game");
    }
    setSearchParams(params);
    setPage(1);
  }

  function handlePlayerSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const player = formData.get("player") as string;
    const params = new URLSearchParams(searchParams);
    if (player) {
      params.set("player", player);
    } else {
      params.delete("player");
    }
    setSearchParams(params);
    setPage(1);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="replays-page">
      <div className="replays-hero">
        <div className="replays-hero-content">
          <h1>
            <Film size={48} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
            Match Replays
          </h1>
          <p>Relive the greatest moments. Study the best plays. Learn from the pros.</p>
        </div>
      </div>

      <div className="replays-filters">
        <form onSubmit={handlePlayerSearch} className="replays-search">
          <div style={{ position: "relative" }}>
            <Search
              size={20}
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
            />
            <input
              type="text"
              name="player"
              placeholder="Search by player name..."
              defaultValue={playerFilter}
              style={{ paddingLeft: "3rem" }}
            />
          </div>
        </form>

        <select
          value={gameFilter}
          onChange={(e) => handleGameFilter(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text)",
            fontSize: "1rem",
          }}
        >
          <option value="">All Games</option>
          <option value="Street Fighter 6">Street Fighter 6</option>
          <option value="Tekken 8">Tekken 8</option>
          <option value="Guilty Gear Strive">Guilty Gear Strive</option>
          <option value="Mortal Kombat 1">Mortal Kombat 1</option>
          <option value="Super Smash Bros. Ultimate">Super Smash Bros. Ultimate</option>
        </select>
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
            Loading replays...
          </div>
        </div>
      ) : replays.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Film size={80} />
          </div>
          <h3>No replays found</h3>
          <p>Try adjusting your filters or check back later for new content</p>
        </div>
      ) : (
        <>
          <div className="replays-grid">
            {replays.map((replay) => (
              <div
                key={replay.id}
                className="replay-card"
                onClick={() => window.open(replay.videoUrl, "_blank")}
              >
                <div className="replay-thumbnail">
                  <Play size={64} />
                </div>
                <div className="replay-info">
                  <h3 className="replay-title">{replay.title}</h3>
                  <div className="replay-meta">
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Gamepad2 size={14} />
                      {replay.game}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Users size={14} />
                      {replay.playerNames.join(" vs ")}
                    </span>
                  </div>
                  <div className="replay-meta" style={{ marginTop: "0.5rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Calendar size={14} />
                      {formatDate(replay.uploadedAt)}
                    </span>
                    <span className="replay-badge">{formatFileSize(replay.fileSizeBytes)}</span>
                  </div>
                </div>
              </div>
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
