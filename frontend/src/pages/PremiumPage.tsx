import { useEffect, useState } from "react";
import { Crown, Check, Zap, Star, TrendingUp, Shield, X } from "lucide-react";
import { useAuth } from "../auth-context";
import { api } from "../api";
import "../styles/features.css";

export function PremiumPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
    }
  }, [user]);

  async function loadSubscriptionStatus() {
    if (!user) return;
    try {
      const result = await api.getSubscriptionStatus(user.id);
      setStatus(result.status);
      setExpiryDate(result.expiryDate || null);
    } catch (err) {
      console.error("Failed to load subscription status:", err);
    }
  }

  async function handleSubscribe() {
    if (!user) {
      setError("Please log in to subscribe");
      return;
    }

    if (user.role !== "organizer") {
      setError("Premium is currently only available for organizers");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProcessingPayment(true);

      const result = await api.createSubscription("price_premium_monthly");
      
      // In a real app, this would redirect to Stripe Checkout with the clientSecret
      // For demo purposes, we'll simulate a successful payment
      setTimeout(() => {
        setProcessingPayment(false);
        setStatus("active");
        loadSubscriptionStatus();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subscription");
      setProcessingPayment(false);
    } finally {
      setLoading(false);
    }
  }

  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <div className="premium-page">
      <div className="premium-hero">
        <div className="premium-hero-content">
          <div className="premium-badge">
            <Crown size={20} />
            PREMIUM
          </div>
          <h1>Unlock Your Tournament Potential</h1>
          <p>Advanced features for serious organizers and competitors</p>
        </div>
      </div>

      {!user ? (
        <div className="error-banner">
          Please log in to view premium subscription options
        </div>
      ) : user.role !== "organizer" ? (
        <div className="error-banner">
          Premium subscriptions are currently only available for tournament organizers
        </div>
      ) : null}

      {isActive && (
        <div className="premium-status">
          <Check size={24} />
          <div>
            <strong>Premium Active</strong>
            {expiryDate && (
              <span style={{ marginLeft: "0.5rem", color: "var(--muted)" }}>
                • Renews {new Date(expiryDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1rem",
          background: "rgba(255, 107, 53, 0.1)",
          border: "1px solid rgba(255, 107, 53, 0.3)",
          borderRadius: "10px",
          color: "var(--accent)",
          fontWeight: 600,
          marginBottom: "1rem",
        }}>
          <div className="spinner" style={{ width: "20px", height: "20px" }} />
          Payment processing...
        </div>
      )}

      {error && (
        <div className="error-banner">
          <X size={20} />
          {error}
        </div>
      )}

      <div className="premium-pricing">
        <div className="premium-price">$9.99</div>
        <div className="premium-period">per month</div>
        {!isActive && user && user.role === "organizer" && (
          <button
            className="btn btn-primary"
            onClick={handleSubscribe}
            disabled={loading || isPending}
            style={{ fontSize: "1.1rem", padding: "0.85rem 2rem" }}
          >
            {loading ? "Processing..." : processingPayment ? "Opening Payment..." : "Subscribe Now"}
          </button>
        )}
      </div>

      <div className="premium-features">
        <div className="premium-feature">
          <div className="premium-feature-icon">
            <Zap size={24} />
          </div>
          <div className="premium-feature-content">
            <h3>Priority Match Notifications</h3>
            <p>Get instant alerts for your upcoming matches with real-time updates</p>
          </div>
        </div>

        <div className="premium-feature">
          <div className="premium-feature-icon">
            <Star size={24} />
          </div>
          <div className="premium-feature-content">
            <h3>Advanced Analytics</h3>
            <p>Deep insights into player performance, match statistics, and tournament trends</p>
          </div>
        </div>

        <div className="premium-feature">
          <div className="premium-feature-icon">
            <TrendingUp size={24} />
          </div>
          <div className="premium-feature-content">
            <h3>Custom Branding</h3>
            <p>Personalize your tournaments with custom logos, colors, and themes</p>
          </div>
        </div>

        <div className="premium-feature">
          <div className="premium-feature-icon">
            <Shield size={24} />
          </div>
          <div className="premium-feature-content">
            <h3>Premium Support</h3>
            <p>24/7 priority support from our tournament operations team</p>
          </div>
        </div>

        <div className="premium-feature">
          <div className="premium-feature-icon">
            <Crown size={24} />
          </div>
          <div className="premium-feature-content">
            <h3>Unlimited Replays</h3>
            <p>Store and share unlimited match replays with no file size restrictions</p>
          </div>
        </div>

        <div className="premium-feature">
          <div className="premium-feature-icon">
            <Check size={24} />
          </div>
          <div className="premium-feature-content">
            <h3>Early Access</h3>
            <p>Be the first to try new features and beta functionality</p>
          </div>
        </div>
      </div>

      {isActive && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Need to make changes? Contact support or manage your subscription in settings.
          </p>
        </div>
      )}
    </div>
  );
}
