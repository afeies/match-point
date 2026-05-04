import { Crown, Shield, Zap, CheckCircle2 } from "lucide-react";

export function PremiumPage() {
  return (
    <>
      <div className="dashboard-page-head">
        <div>
          <p className="dashboard-kicker">Pricing</p>
          <h1 className="dashboard-title">Upgrade to Premium</h1>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>
        <div className="dashboard-stat-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Crown size={28} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>Premium Plan</div>
              <div style={{ fontSize: "0.9rem", color: "var(--dash-muted)" }}>
                Unlock all tournament formats and advanced features
              </div>
            </div>
          </div>

          <div style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            $15<span style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--dash-muted)" }}>/year</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--dash-muted)", marginBottom: "1.5rem" }}>
            Billed annually
          </p>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>What's included</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Double elimination brackets</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Round robin tournaments</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Swiss system support</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Unlimited tournament history</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Advanced analytics and reports</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Priority email support</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <span>Custom branding options</span>
            </li>
          </ul>

          <button
            type="button"
            style={{
              marginTop: "2rem",
              width: "100%",
              padding: "0.875rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Crown size={20} />
            Upgrade Now
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="dashboard-stat-card" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
                margin: "0 auto 0.75rem",
              }}
            >
              <Zap size={24} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Fast Setup</div>
            <div style={{ fontSize: "0.8rem", color: "var(--dash-muted)" }}>
              Start using premium features instantly after upgrade
            </div>
          </div>

          <div className="dashboard-stat-card" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                margin: "0 auto 0.75rem",
              }}
            >
              <Shield size={24} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>30-Day Guarantee</div>
            <div style={{ fontSize: "0.8rem", color: "var(--dash-muted)" }}>
              Cancel anytime, full refund within 30 days
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f8fafc", borderRadius: 8, fontSize: "0.875rem", color: "var(--dash-muted)" }}>
          <strong>Note:</strong> This is a demonstration page. Payment processing is not implemented in this prototype. In production, this would integrate with Stripe or a similar payment provider.
        </div>
      </div>
    </>
  );
}
