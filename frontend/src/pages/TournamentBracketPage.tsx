import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { Check, Download, Share2, X, Trophy, Save } from "lucide-react";
import type { BracketMatch, BracketResponse, BracketRound } from "../api";
import { api, type TournamentDetail } from "../api";
import { useAuth } from "../auth-context";
import "../styles/bracket-view-page.css";
import "../styles/features.css";

type OutletCtx = { setCurrentEventTitle: (t: string | null) => void };

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function mockScores(matchId: string): [number, number] {
  const h = hashStr(matchId);
  if (h % 3 === 0) return [2, 0];
  if (h % 3 === 1) return [2, 1];
  return [1, 2];
}

export function winner1Wins(matchId: string): boolean {
  return hashStr(matchId) % 2 === 0;
}

export function roundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Grand finals";
  if (round === totalRounds - 1 && totalRounds >= 2) return "Semi finals";
  if (round === totalRounds - 2 && totalRounds >= 3) return "Quarter finals";
  return `Round ${round}`;
}

export function formatEventCode(id: string): string {
  const compact = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const y = new Date().getFullYear();
  return `MP-${y}-${compact.slice(0, 3)}`;
}

export function displayUrl(id: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/t/${id}/bracket`;
}

export function feederHint(round: number, matchSlot: number, side: 1 | 2): string | null {
  if (round <= 1) return null;
  const k = side === 1 ? 2 * matchSlot - 1 : 2 * matchSlot;
  return `(Match ${k} winner)`;
}

type SlotDisplay = {
  name: string;
  score: string;
  winner: boolean;
  live: boolean;
  hint: string | null;
};

export function buildSlotDisplays(
  m: BracketMatch,
  round: number,
  matchSlot: number,
  liveMatchId: string | null
): { top: SlotDisplay; bottom: SlotDisplay } {
  const bothNamed = m.player1 && m.player2;
  const byeTop = m.player1 && !m.player2;
  const byeBot = !m.player1 && m.player2;

  if (bothNamed) {
    const [s1, s2] = mockScores(m.id);
    const w1 = winner1Wins(m.id);
    const live = m.id === liveMatchId;
    return {
      top: {
        name: m.player1!.displayName,
        score: String(w1 ? Math.max(s1, s2) : Math.min(s1, s2)),
        winner: w1,
        live,
        hint: null,
      },
      bottom: {
        name: m.player2!.displayName,
        score: String(w1 ? Math.min(s1, s2) : Math.max(s1, s2)),
        winner: !w1,
        live,
        hint: null,
      },
    };
  }

  if (byeTop) {
    return {
      top: {
        name: m.player1!.displayName,
        score: "—",
        winner: true,
        live: false,
        hint: null,
      },
      bottom: {
        name: "Bye",
        score: "—",
        winner: false,
        live: false,
        hint: feederHint(round, matchSlot, 2),
      },
    };
  }

  if (byeBot) {
    return {
      top: {
        name: "Bye",
        score: "—",
        winner: false,
        live: false,
        hint: feederHint(round, matchSlot, 1),
      },
      bottom: {
        name: m.player2!.displayName,
        score: "—",
        winner: true,
        live: false,
        hint: null,
      },
    };
  }

  return {
    top: {
      name: "TBD",
      score: "—",
      winner: false,
      live: false,
      hint: feederHint(round, matchSlot, 1),
    },
    bottom: {
      name: "TBD",
      score: "—",
      winner: false,
      live: false,
      hint: feederHint(round, matchSlot, 2),
    },
  };
}

function MatchCard({
  m,
  round,
  totalRounds,
  matchSlot,
  liveMatchId,
  isGrand,
}: {
  m: BracketMatch;
  round: number;
  totalRounds: number;
  matchSlot: number;
  liveMatchId: string | null;
  isGrand: boolean;
}) {
  const { top, bottom } = buildSlotDisplays(m, round, matchSlot, liveMatchId);

  const inner = (
    <>
      <div className="bv-slot">
        <div className="bv-slot-left">
          {top.winner && <Check className="bv-check" size={16} strokeWidth={3} />}
          <span className="bv-slot-name">{top.name}</span>
          {top.live && <span className="bv-live-tag">LIVE</span>}
        </div>
        <span className="bv-score">{top.score}</span>
      </div>
      {top.hint && <div className="bv-tbd-hint" style={{ padding: "0 0.65rem 0.35rem" }}>{top.hint}</div>}
      <div className="bv-slot">
        <div className="bv-slot-left">
          {bottom.winner && <Check className="bv-check" size={16} strokeWidth={3} />}
          <span className="bv-slot-name">{bottom.name}</span>
          {bottom.live && <span className="bv-live-tag">LIVE</span>}
        </div>
        <span className="bv-score">{bottom.score}</span>
      </div>
      {bottom.hint && (
        <div className="bv-tbd-hint" style={{ padding: "0 0.65rem 0.5rem" }}>
          {bottom.hint}
        </div>
      )}
    </>
  );

  if (isGrand) {
    return (
      <div className="bv-match bv-match-grand">
        <div className="bv-match-grand-head">Championship match</div>
        <div className="bv-match-grand-body">
          <div className="bv-match-grand-vs">
            {top.name} <span style={{ color: "#94a3b8", fontWeight: 600 }}>vs</span> {bottom.name}
          </div>
          <div className="bv-match-grand-schedule">Starts Sunday, 8:00 PM EST</div>
        </div>
      </div>
    );
  }

  return <div className="bv-match">{inner}</div>;
}

export function pickLiveMatchId(bracket: BracketResponse): string | null {
  const r1 = bracket.rounds[0];
  if (!r1) return null;
  const live = r1.matches.find((m) => m.player1 && m.player2);
  return live?.id ?? null;
}

export function nextMatchLabel(bracket: BracketResponse, liveId: string | null): string {
  if (!liveId) return "Bracket is warming up — check back soon.";
  for (const r of bracket.rounds) {
    const m = r.matches.find((x) => x.id === liveId);
    if (m?.player1 && m.player2) {
      return `${m.player1.displayName} vs ${m.player2.displayName}`;
    }
  }
  return "Next match TBD";
}

export function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>();
  const { setCurrentEventTitle } = useOutletContext<OutletCtx>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState(true);
  const [copied, setCopied] = useState(false);

  // Score tracking state
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreSuccess, setScoreSuccess] = useState(false);

  const isOrganizer = user?.role === "organizer";

  const load = useCallback(async () => {
    if (!id) return;
    const [d, b] = await Promise.all([api.getTournament(id), api.getTournamentBracket(id)]);
    setDetail(d);
    setBracket(b);
    setCurrentEventTitle(d.name);
  }, [id, setCurrentEventTitle]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
      setCurrentEventTitle(null);
    };
  }, [load, setCurrentEventTitle]);

  const url = id ? displayUrl(id) : "";
  const liveId = bracket ? pickLiveMatchId(bracket) : null;

  const copyUrl = () => {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: detail?.name ?? "MatchPoint", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      copyUrl();
    }
  };

  const onExport = () => {
    if (!bracket || !detail) return;
    const blob = new Blob([JSON.stringify({ tournament: detail, bracket }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${detail.name.replace(/\s+/g, "-")}-bracket.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  async function handleScoreSubmit() {
    if (!selectedMatch || !selectedMatch.player1 || !selectedMatch.player2) return;
    
    const p1Score = parseInt(player1Score);
    const p2Score = parseInt(player2Score);

    if (isNaN(p1Score) || isNaN(p2Score)) {
      setScoreError("Please enter valid scores");
      return;
    }

    if (p1Score === p2Score) {
      setScoreError("Scores cannot be tied");
      return;
    }

    const winnerUserId = p1Score > p2Score ? selectedMatch.player1.userId : selectedMatch.player2.userId;

    try {
      setScoreLoading(true);
      setScoreError(null);
      await api.reportMatchScore(selectedMatch.id, {
        player1Score: p1Score,
        player2Score: p2Score,
        winnerUserId,
      });
      setScoreSuccess(true);
      setTimeout(() => {
        setScoreSuccess(false);
        setSelectedMatch(null);
        setPlayer1Score("");
        setPlayer2Score("");
      }, 2000);
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Failed to report score");
    } finally {
      setScoreLoading(false);
    }
  }

  const activeBracketMatches = bracket?.rounds.flatMap((r) =>
    r.matches.filter((m) => m.player1 && m.player2 && m.status !== "complete")
  ) || [];

  if (err && !detail) {
    return (
      <div className="bv-scope">
        <p style={{ color: "#b91c1c" }}>{err}</p>
        <Link to="/tournament">← Back</Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bv-scope">
        <p style={{ color: "var(--bv-muted)" }}>Loading bracket…</p>
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="bv-scope">
        <div className="bv-empty">
          <h2>Bracket not published yet</h2>
          <p style={{ margin: "0 0 1.25rem" }}>
            The organizer hasn&apos;t generated a bracket for this event, or it may still be in draft.
          </p>
          <Link to={`/t/${id}`} style={{ color: "var(--bv-navy)", fontWeight: 700 }}>
            ← Event details
          </Link>
        </div>
      </div>
    );
  }

  const subline = `Double elimination • ${bracket.playerCount} players • Prize pool $5,000`;
  const total = bracket.roundCount;

  return (
    <div className="bv-scope">
      {toast && (
        <div className="bv-toast">
          <button type="button" className="bv-toast-close" onClick={() => setToast(false)} aria-label="Dismiss">
            <X size={16} />
          </button>
          <div className="bv-toast-icon">
            <Check size={18} strokeWidth={3} />
          </div>
          <p className="bv-toast-msg">
            <strong style={{ display: "block", marginBottom: 4 }}>Bracket ready</strong>
            Tournament bracket generated successfully! All {bracket.playerCount} seedings are now locked.
          </p>
        </div>
      )}

      <div className="bv-header-row">
        <div>
          <p className="bv-event-id">{formatEventCode(id!)}</p>
          <h1 className="bv-title">{detail.name}</h1>
          <p className="bv-subline">{subline}</p>
        </div>
        <div className="bv-actions">
          <button type="button" className="bv-btn-share" onClick={() => void onShare()}>
            <Share2 size={16} />
            Share
          </button>
          <button type="button" className="bv-btn-export" onClick={onExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="bv-url-bar">
        <span className="bv-url-text">{url}</span>
        <button type="button" className="bv-btn-copy" onClick={copyUrl}>
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>

      <div className="bv-bracket-scroll">
        {bracket.rounds.map((r: BracketRound) => (
          <div key={r.round} className="bv-round-col">
            <div className="bv-round-label">{roundLabel(r.round, total)}</div>
            {r.matches.map((m: BracketMatch, idx: number) => {
              const isGrand = r.round === total && r.matches.length === 1;
              return (
                <MatchCard
                  key={m.id}
                  m={m}
                  round={r.round}
                  totalRounds={total}
                  matchSlot={idx + 1}
                  liveMatchId={liveId}
                  isGrand={isGrand}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="bv-bottom-grid">
        <div className="bv-pace-card">
          <h3 className="bv-pace-title">Tournament pace</h3>
          <div className="bv-pace-bar">
            <div className="bv-pace-fill" />
          </div>
          <p className="bv-pace-sub">50% of matches completed on schedule</p>
        </div>
        <div className="bv-next-card">
          <h3 className="bv-next-title">Next match</h3>
          <p className="bv-next-body">{nextMatchLabel(bracket, liveId)}</p>
        </div>
      </div>

      {/* Score Tracking Panel (Organizers Only) */}
      {isOrganizer && activeBracketMatches.length > 0 && (
        <div className="score-panel" style={{ marginTop: "2rem" }}>
          <div className="score-header">
            <h3>
              <Trophy size={22} />
              Report Match Score
            </h3>
          </div>

          {scoreSuccess && (
            <div className="success-banner">
              <Check size={20} />
              Score reported successfully!
            </div>
          )}

          {scoreError && (
            <div className="error-banner">
              <X size={20} />
              {scoreError}
            </div>
          )}

          {!selectedMatch ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--muted)", fontWeight: 600 }}>
                Select Match
              </label>
              <select
                onChange={(e) => {
                  const match = activeBracketMatches.find((m) => m.id === e.target.value);
                  setSelectedMatch(match || null);
                  setPlayer1Score("");
                  setPlayer2Score("");
                  setScoreError(null);
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text)",
                  fontSize: "1rem",
                }}
              >
                <option value="">Choose a match...</option>
                {activeBracketMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.player1?.displayName} vs {m.player2?.displayName} (Round {m.round})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="score-inputs">
                <div className="score-player">
                  <div className="score-player-name">{selectedMatch.player1?.displayName}</div>
                  <input
                    type="number"
                    className="score-input"
                    value={player1Score}
                    onChange={(e) => setPlayer1Score(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="score-vs">VS</div>
                <div className="score-player">
                  <div className="score-player-name">{selectedMatch.player2?.displayName}</div>
                  <input
                    type="number"
                    className="score-input"
                    value={player2Score}
                    onChange={(e) => setPlayer2Score(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="score-submit"
                  onClick={handleScoreSubmit}
                  disabled={scoreLoading || !player1Score || !player2Score}
                >
                  <Save size={20} />
                  {scoreLoading ? "Saving..." : "Submit Score"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSelectedMatch(null);
                    setPlayer1Score("");
                    setPlayer2Score("");
                    setScoreError(null);
                  }}
                  style={{ flex: "0 0 auto" }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
