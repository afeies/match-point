import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Film, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../auth-context";
import { api } from "../api";
import "../styles/features.css";

export function ReplayUploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [tournamentId, setTournamentId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [game, setGame] = useState("");
  const [fileSize, setFileSize] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to upload replays");
      return;
    }

    if (user.role !== "organizer") {
      setError("Only organizers can upload replays");
      return;
    }

    const fileSizeBytes = parseFloat(fileSize) * 1024 * 1024; // Convert MB to bytes
    if (fileSizeBytes > 2 * 1024 * 1024 * 1024) {
      setError("File size cannot exceed 2GB");
      return;
    }

    try {
      setLoading(true);
      await api.uploadReplay({
        tournamentId,
        videoUrl,
        title,
        playerNames: [player1, player2].filter(Boolean),
        game,
        fileSizeBytes: Math.floor(fileSizeBytes),
      });
      setSuccess(true);
      setTimeout(() => navigate("/replays"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload replay");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="replays-page">
        <div className="error-banner">
          <AlertCircle size={20} />
          Please log in to upload replays
        </div>
      </div>
    );
  }

  if (user.role !== "organizer") {
    return (
      <div className="replays-page">
        <div className="error-banner">
          <AlertCircle size={20} />
          Only tournament organizers can upload replays
        </div>
      </div>
    );
  }

  return (
    <div className="replays-page" style={{ maxWidth: "700px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Film size={36} />
          Upload Replay
        </h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Share match footage with the community
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="success-banner">
          <CheckCircle size={20} />
          Replay uploaded successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem" }}>
        <div className="field">
          <label>Tournament ID</label>
          <input
            type="text"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            placeholder="Enter tournament ID"
            required
          />
        </div>

        <div className="field">
          <label>Video URL</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            required
          />
        </div>

        <div className="field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Grand Finals - Epic Comeback"
            required
          />
        </div>

        <div className="field">
          <label>Player 1</label>
          <input
            type="text"
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
            placeholder="Player name"
            required
          />
        </div>

        <div className="field">
          <label>Player 2</label>
          <input
            type="text"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            placeholder="Player name"
            required
          />
        </div>

        <div className="field">
          <label>Game</label>
          <select value={game} onChange={(e) => setGame(e.target.value)} required>
            <option value="">Select a game</option>
            <option value="Street Fighter 6">Street Fighter 6</option>
            <option value="Tekken 8">Tekken 8</option>
            <option value="Guilty Gear Strive">Guilty Gear Strive</option>
            <option value="Mortal Kombat 1">Mortal Kombat 1</option>
            <option value="Super Smash Bros. Ultimate">Super Smash Bros. Ultimate</option>
          </select>
        </div>

        <div className="field">
          <label>File Size (MB)</label>
          <input
            type="number"
            step="0.01"
            value={fileSize}
            onChange={(e) => setFileSize(e.target.value)}
            placeholder="e.g., 450.5"
            required
          />
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Maximum 2048 MB (2GB)
          </span>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "1rem" }}>
          <Upload size={20} />
          {loading ? "Uploading..." : "Upload Replay"}
        </button>
      </form>
    </div>
  );
}
