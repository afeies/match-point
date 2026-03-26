import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Search,
  ShieldCheck,
  Trophy,
  UserPlus,
} from "lucide-react";
import { api, type TournamentSummary } from "../api";
import { useAuth } from "../auth-context";
import "../styles/tournament-engine.css";

type Phase = "find" | "setup";
type SetupStep = 1 | 2 | 3;

type Basics = {
  name: string;
  game: string;
  dateLabel: string;
  description: string;
};

const defaultBasics: Basics = {
  name: "Apex Masters Invitational",
  game: "Apex Legends",
  dateLabel: "Sept 24 - 26, 2024",
  description:
    "Regional championship featuring double-elimination format and a $5,000 prize pool. Top squads from the region compete for seeding into nationals.",
};

type OutletCtx = {
  setCurrentEventTitle: (title: string | null) => void;
};

const ROSTER_TOTAL = 128;

export function TournamentHubPage() {
  const { user } = useAuth();
  const { setCurrentEventTitle } = useOutletContext<OutletCtx>();
  const [params, setParams] = useSearchParams();

  const [phase, setPhase] = useState<Phase>("find");
  const [setupStep, setSetupStep] = useState<SetupStep>(1);
  const [basics, setBasics] = useState<Basics>(defaultBasics);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [list, setList] = useState<TournamentSummary[] | null>(null);
  const [findQuery, setFindQuery] = useState("");

  const [rosterProgress, setRosterProgress] = useState(0);

  const loadList = useCallback(async () => {
    const items = await api.listTournaments();
    setList(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadList();
      } catch {
        if (!cancelled) setList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadList]);

  useEffect(() => {
    if (params.get("create") === "1" && user?.role === "organizer") {
      setPhase("setup");
      setSetupStep(1);
      setErr(null);
      setParams({}, { replace: true });
    }
  }, [params, setParams, user?.role]);

  useEffect(() => {
    if (phase === "setup") {
      setCurrentEventTitle(basics.name || "New event");
    } else {
      setCurrentEventTitle(null);
    }
    return () => setCurrentEventTitle(null);
  }, [phase, basics.name, setCurrentEventTitle]);

  useEffect(() => {
    if (phase !== "setup" || setupStep !== 2) {
      setRosterProgress(0);
      return;
    }
    setRosterProgress(0);
    const id = window.setInterval(() => {
      setRosterProgress((p) => {
        if (p >= 64) {
          window.clearInterval(id);
          return 64;
        }
        return p + 4;
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [phase, setupStep]);

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = findQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.game.toLowerCase().includes(q)
    );
  }, [list, findQuery]);

  function startCreate() {
    setErr(null);
    setBasics(defaultBasics);
    setCreatedId(null);
    setPhase("setup");
    setSetupStep(1);
  }

  function backToFind() {
    setPhase("find");
    setSetupStep(1);
    setCreatedId(null);
    void loadList();
  }

  async function submitBasics(e: React.FormEvent) {
    e.preventDefault();
    if (user?.role !== "organizer") return;
    setErr(null);
    if (createdId) {
      setSetupStep(2);
      return;
    }
    setBusy(true);
    try {
      const t = await api.createTournament({ name: basics.name, game: basics.game });
      setCreatedId(t.id);
      setSetupStep(2);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not create event");
    } finally {
      setBusy(false);
    }
  }

  const rosterPct = Math.round((rosterProgress / ROSTER_TOTAL) * 100);

  const stepper = (s: SetupStep) => (
    <div className="te-stepper" aria-label="Setup progress">
      <div className={`te-step ${s > 1 ? "done" : s === 1 ? "current" : ""}`}>
        <span className="te-step-circle">1</span>
        <span>Basics</span>
      </div>
      <div className={`te-step-line ${s > 1 ? "done" : ""}`} aria-hidden />
      <div className={`te-step ${s > 2 ? "done" : s === 2 ? "current" : ""}`}>
        <span className="te-step-circle">2</span>
        <span>Roster</span>
      </div>
      <div className={`te-step-line ${s > 2 ? "done" : ""}`} aria-hidden />
      <div className={`te-step ${s === 3 ? "current" : ""}`}>
        <span className="te-step-circle">3</span>
        <span>Engine</span>
      </div>
    </div>
  );

  const detailsRail = (showProceed: boolean) => (
    <aside className="te-hub-aside">
      <div className="te-rail-card">
        <div className="te-rail-date">
          <div className="te-rail-date-icon">
            <CalendarDays size={20} />
          </div>
          <span className="te-rail-date-text">{basics.dateLabel}</span>
        </div>
        <div className="te-rail-event">
          <Trophy size={22} color="#2d3e98" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3>{basics.name}</h3>
            <p className="te-rail-desc">{basics.description}</p>
          </div>
        </div>
      </div>

      {showProceed && createdId ? (
        <div className="te-rail-cta">
          <Link to={`/t/${createdId}`} className="te-btn-proceed">
            PROCEED TO BRACKET
            <ChevronRight size={18} />
          </Link>
          <button type="button" className="te-draft-link" style={{ border: "none", background: "none", width: "100%", cursor: "pointer" }} onClick={backToFind}>
            SAVE AS DRAFT
          </button>
        </div>
      ) : null}

      <div className="te-system-card">
        <div className="te-system-left">
          <ShieldCheck size={18} color="#2d3e98" />
          SYSTEM VALIDATED
        </div>
        <span className="te-system-ver">V 1.04</span>
      </div>
    </aside>
  );

  if (phase === "find") {
    return (
      <div className="te-scope">
        <div className="te-kicker">Tournament</div>
        <h1 className="te-page-title" style={{ marginBottom: "0.25rem" }}>
          Find &amp; create events
        </h1>
        <p style={{ margin: "0 0 1.5rem", color: "var(--te-muted)", fontSize: "0.9rem" }}>
          Search published tournaments or start a new event workflow.
        </p>

        <div className="te-find-toolbar">
          <div className="te-find-search">
            <Search size={18} color="#94a3b8" />
            <input
              type="search"
              placeholder="Search events..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              aria-label="Search events"
            />
          </div>
          {user?.role === "organizer" ? (
            <button type="button" className="te-btn-create" onClick={startCreate}>
              New event setup
            </button>
          ) : null}
        </div>

        {!list ? (
          <p style={{ color: "var(--te-muted)" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="te-progress-card" style={{ textAlign: "left" }}>
            <h2 style={{ textAlign: "center" }}>No tournaments match</h2>
            <p className="te-progress-sub" style={{ textAlign: "center" }}>
              Try another search or check back after an organizer publishes an event.
            </p>
            {user?.role === "organizer" ? (
              <div style={{ textAlign: "center" }}>
                <button type="button" className="te-btn-create" onClick={startCreate}>
                  Start setup wizard
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="te-find-list">
            {filtered.map((t) => (
              <div key={t.id} className="te-find-row">
                <Link to={`/t/${t.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <h4>{t.name}</h4>
                  <div className="te-find-meta">
                    {t.game} · {t.entrantCount} entr{t.entrantCount === 1 ? "ant" : "ants"}
                  </div>
                </Link>
                <Link to={`/t/${t.id}`} className="te-link-open">
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* Setup flow */
  if (user?.role !== "organizer") {
    return (
      <div className="te-scope">
        <div className="te-error">Only organizers can run event setup.</div>
        <button type="button" className="te-btn-secondary" onClick={backToFind}>
          Back to find events
        </button>
      </div>
    );
  }

  if (setupStep === 1) {
    return (
      <div className="te-scope">
        <div className="te-hub-grid">
          <div className="te-hub-main">
            <div className="te-hub-head">
              <div>
                <p className="te-kicker">New event creation</p>
                <h1 className="te-page-title">Setup Tournament</h1>
              </div>
              {stepper(1)}
            </div>
            {err && <div className="te-error">{err}</div>}
            <form className="te-basics-form" onSubmit={submitBasics}>
              <div className="te-field">
                <label htmlFor="te-name">Event title</label>
                <input
                  id="te-name"
                  value={basics.name}
                  onChange={(e) => setBasics((b) => ({ ...b, name: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>
              <div className="te-field">
                <label htmlFor="te-game">Game</label>
                <input
                  id="te-game"
                  value={basics.game}
                  onChange={(e) => setBasics((b) => ({ ...b, game: e.target.value }))}
                  required
                  maxLength={120}
                />
              </div>
              <div className="te-field">
                <label htmlFor="te-dates">Scheduled dates (display)</label>
                <input
                  id="te-dates"
                  value={basics.dateLabel}
                  onChange={(e) => setBasics((b) => ({ ...b, dateLabel: e.target.value }))}
                  placeholder="Sept 24 - 26, 2024"
                />
              </div>
              <div className="te-field">
                <label htmlFor="te-desc">Description</label>
                <textarea
                  id="te-desc"
                  value={basics.description}
                  onChange={(e) => setBasics((b) => ({ ...b, description: e.target.value }))}
                />
              </div>
              <div className="te-btn-row">
                <button type="button" className="te-btn-secondary" onClick={backToFind}>
                  Cancel
                </button>
                <button type="submit" className="te-btn-create" disabled={busy}>
                  {busy ? "Saving…" : "Continue to roster"}
                </button>
              </div>
            </form>
          </div>
          {detailsRail(false)}
        </div>
      </div>
    );
  }

  if (setupStep === 2) {
    return (
      <div className="te-scope">
        <div className="te-hub-grid">
          <div className="te-hub-main">
            <div className="te-hub-head">
              <div>
                <p className="te-kicker">New event creation</p>
                <h1 className="te-page-title">Setup Tournament</h1>
              </div>
              {stepper(2)}
            </div>

            <div className="te-progress-card">
              <div className="te-progress-icon">
                <UserPlus size={28} strokeWidth={2} />
              </div>
              <h2>Adding Players…</h2>
              <p className="te-progress-sub">
                We&apos;re verifying {ROSTER_TOTAL} player profiles and calculating initial seeding indices.
              </p>
              <div className="te-bar-track">
                <div className="te-bar-fill" style={{ width: `${rosterPct}%` }} />
              </div>
              <div className="te-step-label">
                STEP {rosterProgress} OF {ROSTER_TOTAL}
              </div>
            </div>

            <div className="te-bottom-row">
              <div className="te-live-card">
                <p className="te-live-title">LIVE STATUS</p>
                <div className="te-live-row">
                  <span className="te-live-dot" />
                  Auto-Seeding Enabled
                </div>
                <p className="te-live-copy">
                  Deterministic seeding rules are active. Player order is stabilized before bracket generation.
                </p>
              </div>
              <div className="te-protip">
                <div className="te-protip-label">PRO TIP</div>
                <p>Connect Discord to automatically notify players when the bracket goes live.</p>
              </div>
            </div>

            <div className="te-btn-row" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="te-btn-secondary" onClick={() => setSetupStep(1)}>
                Back
              </button>
              <button type="button" className="te-btn-create" onClick={() => setSetupStep(3)}>
                Continue to engine
              </button>
            </div>
          </div>
          {detailsRail(true)}
        </div>
      </div>
    );
  }

  /* Step 3 - Engine */
  return (
    <div className="te-scope">
      <div className="te-hub-grid">
        <div className="te-hub-main">
          <div className="te-hub-head">
            <div>
              <p className="te-kicker">New event creation</p>
              <h1 className="te-page-title">Setup Tournament</h1>
            </div>
            {stepper(3)}
          </div>

          <div className="te-engine-placeholder">
            <p style={{ margin: "0 0 1rem", fontWeight: 700, color: "#1a1f36" }}>Bracket engine</p>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem" }}>
              Configure single elimination (live today) or upgrade for double-elim, round robin, and Swiss formats.
            </p>
            {createdId ? (
              <Link to={`/t/${createdId}`} className="te-btn-create" style={{ display: "inline-flex" }}>
                Open event &amp; generate bracket
              </Link>
            ) : null}
          </div>

          <div className="te-btn-row">
            <button type="button" className="te-btn-secondary" onClick={() => setSetupStep(2)}>
              Back
            </button>
            <button type="button" className="te-btn-secondary" onClick={backToFind}>
              Done
            </button>
          </div>
        </div>
        {detailsRail(!!createdId)}
      </div>
    </div>
  );
}
