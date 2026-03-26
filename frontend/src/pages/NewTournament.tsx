import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";
import { api } from "../api";
import "../styles/dashboard.css";

export function NewTournament() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !user) nav("/login?next=/new", { replace: true });
  }, [ready, user, nav]);

  if (!ready) return <p style={{ color: "var(--dash-muted)" }}>Loading…</p>;

  if (ready && user?.role !== "organizer") {
    return (
      <div>
        <div
          style={{
            padding: "0.85rem 1rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#991b1b",
            marginBottom: "1rem",
          }}
        >
          Only organizers can create tournaments.
        </div>
        <Link to="/dashboard" className="dashboard-link">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (ready && !user) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const t = await api.createTournament({ name, game });
      nav(`/t/${t.id}`, { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="dashboard-page-head" style={{ marginBottom: "1.25rem" }}>
        <div>
          <p className="dashboard-kicker">Organizer</p>
          <h1 className="dashboard-title">Create Tournament</h1>
        </div>
      </div>
      {err && (
        <div
          style={{
            padding: "0.85rem 1rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#991b1b",
            marginBottom: "1rem",
          }}
        >
          {err}
        </div>
      )}
      <form onSubmit={onSubmit} className="dashboard-form">
        <div className="dashboard-form-field">
          <label htmlFor="name">Event name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
        </div>
        <div className="dashboard-form-field">
          <label htmlFor="game">Game</label>
          <input id="game" value={game} onChange={(e) => setGame(e.target.value)} required maxLength={120} />
        </div>
        <button type="submit" className="dashboard-btn-primary" disabled={loading}>
          {loading ? "Publishing…" : "Publish event"}
        </button>
      </form>
    </div>
  );
}
