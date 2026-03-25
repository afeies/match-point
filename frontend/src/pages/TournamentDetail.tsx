import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type TournamentDetail } from "../api";
import { useAuth } from "../auth-context";

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user, ready } = useAuth();
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [hasPublishedBracket, setHasPublishedBracket] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const d = await api.getTournament(id);
    setDetail(d);
    const b = await api.getTournamentBracket(id);
    setHasPublishedBracket(b !== null);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Not found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onRegister() {
    if (!id || !user) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await api.registerForTournament(id);
      setMsg("You are registered for this event.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function onBracket() {
    if (!id || user?.role !== "organizer") return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await api.generateBracket(id);
      setHasPublishedBracket(true);
      setMsg("Bracket generated from current entrants.");
      nav(`/t/${id}/bracket`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not generate bracket");
    } finally {
      setBusy(false);
    }
  }

  if (err && !detail) return <div className="error-banner">{err}</div>;
  if (!detail) return <p className="muted">Loading…</p>;

  const already = user && detail.entrants.some((e) => e.userId === user.id);
  const canRegister = ready && user?.role === "player" && !already;
  const isOrg = user?.role === "organizer";

  return (
    <div>
      <p style={{ marginBottom: "1rem" }}>
        <Link to="/tournament">← Tournament</Link>
      </p>
      <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.35rem" }}>{detail.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {detail.game} · {detail.entrantCount} entr{detail.entrantCount === 1 ? "ant" : "ants"}
      </p>

      {msg && <div className="success-banner">{msg}</div>}
      {err && <div className="error-banner">{err}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "1.25rem 0", alignItems: "center" }}>
        {hasPublishedBracket && (
          <Link
            to={`/t/${id}/bracket`}
            className="btn btn-primary"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            View bracket
          </Link>
        )}
        {canRegister && (
          <button type="button" className="btn btn-primary" onClick={onRegister} disabled={busy}>
            Sign up for this event
          </button>
        )}
        {ready && user?.role === "player" && already && (
          <span className="muted">You are registered.</span>
        )}
        {ready && !user && (
          <span className="muted">
            <Link to={`/login?next=${encodeURIComponent(`/t/${id ?? ""}`)}`}>Log in</Link> as a player to sign up.
          </span>
        )}
        {isOrg && (
          <button type="button" className="btn btn-ghost" onClick={onBracket} disabled={busy}>
            Generate bracket
          </button>
        )}
      </div>

      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.65rem" }}>Entrants</h2>
      {detail.entrants.length === 0 ? (
        <p className="muted">No one has signed up yet.</p>
      ) : (
        <ol style={{ paddingLeft: "1.25rem", margin: 0 }}>
          {detail.entrants.map((e) => (
            <li key={e.userId} style={{ marginBottom: 4 }}>
              {e.displayName}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
