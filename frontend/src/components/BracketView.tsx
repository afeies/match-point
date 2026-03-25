import type { BracketResponse } from "../api";

function slotName(p: { displayName: string } | null): string {
  if (!p) return "Bye";
  return p.displayName;
}

export function BracketView({ bracket }: { bracket: BracketResponse }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        {bracket.playerCount} players · {bracket.roundCount} round{bracket.roundCount === 1 ? "" : "s"}
      </p>
      <div
        className="bracket-scroll"
        style={{
          display: "flex",
          gap: "1.25rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          alignItems: "stretch",
        }}
      >
        {bracket.rounds.map((round) => (
          <div
            key={round.round}
            style={{
              flex: "0 0 auto",
              minWidth: 200,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--muted)",
              }}
            >
              Round {round.round}
              {round.round === bracket.roundCount ? " · Finals" : ""}
            </div>
            {round.matches.map((m) => (
              <div key={m.id} className="card" style={{ padding: "0.75rem 0.85rem" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: "0.92rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.35rem 0",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: m.player1 && !m.player2 ? 600 : 500,
                    }}
                  >
                    {slotName(m.player1)}
                  </div>
                  <div style={{ fontWeight: m.player2 && !m.player1 ? 600 : 500 }}>{slotName(m.player2)}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
