import { Settings } from "lucide-react";

export function SettingsPage() {
  return (
    <>
      <div className="dashboard-page-head">
        <div>
          <p className="dashboard-kicker">Account</p>
          <h1 className="dashboard-title">Settings</h1>
        </div>
      </div>
      <div className="dashboard-stat-card" style={{ maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--dash-brand)",
            }}
          >
            <Settings size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Organization defaults</div>
            <div style={{ fontSize: "0.8rem", color: "var(--dash-muted)" }}>Branding, notifications, and integrations</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--dash-muted)", lineHeight: 1.5 }}>
          Settings will let you configure event defaults, staff roles, and third-party tools. For now, use tournament pages to run events.
        </p>
      </div>
    </>
  );
}
