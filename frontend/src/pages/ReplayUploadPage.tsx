import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, AlertCircle, CheckCircle, Film } from "lucide-react";
import { api, type TournamentSummary } from "../api";
import { useAuth } from "../auth-context";
import "../styles/replay-upload.css";

export function ReplayUploadPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [game, setGame] = useState("");
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== "organizer") {
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // Load organizer's tournaments
    async function loadTournaments() {
      try {
        const data = await api.listTournaments();
        setTournaments(data);
      } catch (err) {
        setError("Failed to load your tournaments");
      }
    }
    loadTournaments();
  }, [ready, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      await api.createReplay({
        title,
        tournamentId,
        game,
        player1Name,
        player2Name,
        videoUrl,
        fileSizeBytes: fileSizeBytes || 1024 * 1024 * 100, // Default 100MB if not specified
      });
      
      setSuccess(true);
      // Reset form
      setTitle("");
      setTournamentId("");
      setGame("");
      setPlayer1Name("");
      setPlayer2Name("");
      setVideoUrl("");
      setFileSizeBytes(0);
      
      // Redirect to replays page after 2 seconds
      setTimeout(() => {
        navigate("/replays");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload replay");
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !user) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <div className="dashboard-page-head">
        <div>
          <p className="dashboard-kicker">Organizer Tools</p>
          <h1 className="dashboard-title">Upload Match Replay</h1>
        </div>
      </div>

      <div className="replay-upload-container">
        {success && (
          <div className="replay-upload-success-banner">
            <CheckCircle size={20} />
            <div>
              <strong>Replay uploaded successfully!</strong>
              <p>Redirecting to replays page...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="replay-upload-error-banner">
            <AlertCircle size={20} />
            <div>
              <strong>Upload failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="replay-upload-card">
          <div className="replay-upload-header">
            <Film size={32} />
            <div>
              <h2>Upload Match Replay</h2>
              <p>Share tournament footage with the community</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="replay-upload-form">
            <div className="replay-upload-field">
              <label htmlFor="title">
                Replay Title <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Grand Finals - Winter Cup 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="replay-upload-field">
              <label htmlFor="tournament">
                Tournament <span className="required">*</span>
              </label>
              <select
                id="tournament"
                value={tournamentId}
                onChange={(e) => {
                  setTournamentId(e.target.value);
                  const selected = tournaments.find((t) => t.id === e.target.value);
                  if (selected) setGame(selected.game);
                }}
                required
              >
                <option value="">Select a tournament</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.game})
                  </option>
                ))}
              </select>
            </div>

            <div className="replay-upload-field">
              <label htmlFor="game">
                Game <span className="required">*</span>
              </label>
              <input
                id="game"
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="e.g., Street Fighter 6"
                required
              />
            </div>

            <div className="replay-upload-row">
              <div className="replay-upload-field">
                <label htmlFor="player1">
                  Player 1 <span className="required">*</span>
                </label>
                <input
                  id="player1"
                  type="text"
                  placeholder="Player 1 name"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  required
                />
              </div>

              <div className="replay-upload-field">
                <label htmlFor="player2">
                  Player 2 <span className="required">*</span>
                </label>
                <input
                  id="player2"
                  type="text"
                  placeholder="Player 2 name"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="replay-upload-field">
              <label htmlFor="videoUrl">
                Video URL <span className="required">*</span>
              </label>
              <input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
              />
              <small className="replay-upload-hint">
                Supports YouTube, Twitch, or direct video links
              </small>
            </div>

            <div className="replay-upload-field">
              <label htmlFor="fileSize">File Size (MB)</label>
              <input
                id="fileSize"
                type="number"
                placeholder="100"
                value={fileSizeBytes ? Math.round(fileSizeBytes / (1024 * 1024)) : ""}
                onChange={(e) => setFileSizeBytes(Number(e.target.value) * 1024 * 1024)}
                min="1"
              />
              <small className="replay-upload-hint">Approximate file size in megabytes</small>
            </div>

            <div className="replay-upload-actions">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="replay-upload-cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="replay-upload-submit-btn" disabled={loading}>
                <Upload size={16} />
                {loading ? "Uploading..." : "Upload Replay"}
              </button>
            </div>
          </form>
        </div>

        <div className="replay-upload-info-card">
          <h3>Upload Guidelines</h3>
          <ul>
            <li>Ensure you have permission to share the video content</li>
            <li>Videos should be tournament matches from your organized events</li>
            <li>Maximum file size is 2 GB per upload</li>
            <li>Supported formats: MP4, WebM, or video platform links</li>
          </ul>
        </div>
      </div>
    </>
  );
}
