import { Users } from "lucide-react";

export function PlayersPage() {
  return (
    <>
      <div className="dashboard-page-head">
        <div>
          <p className="dashboard-kicker">Community</p>
          <h1 className="dashboard-title">Players</h1>
        </div>
      </div>
      <div className="dashboard-empty" style={{ padding: "2.5rem 1.5rem" }}>
        <div className="dashboard-empty-icon" style={{ color: "#cbd5e1" }}>
          <Users size={56} strokeWidth={1.25} />
        </div>
        <h3>Player directory</h3>
        <p>Search, filter, and manage registered players across your events. This section will connect to roster APIs in a future release.</p>
      </div>
    </>
  );
}
