import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth-context";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, ready } = useAuth();

  return (
    <div className="app-shell">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <Link to="/dashboard" style={{ textDecoration: "none", color: "var(--text)" }}>
          <span style={{ fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Match<span style={{ color: "var(--accent)" }}>Point</span>
          </span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {ready && user && <Link to="/dashboard">Dashboard</Link>}
          {ready && user?.role === "organizer" && (
            <Link to="/tournament?create=1">New tournament</Link>
          )}
          {!ready ? (
            <span className="muted">…</span>
          ) : user ? (
            <>
              <span className="muted">
                {user.displayName}
                <span className="mono" style={{ marginLeft: 6, fontSize: "0.8em" }}>
                  ({user.role})
                </span>
              </span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
