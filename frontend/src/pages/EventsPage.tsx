import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapPin, Calendar, Trophy, Users, Gamepad2, Search } from "lucide-react";
import { api } from "../api";
import "../styles/features.css";

interface Event {
  id: string;
  name: string;
  game: string;
  startDate: string;
  venue: string | null;
  city: string | null;
  entrantCount: number;
}

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameFilter = searchParams.get("game") || "";
  const cityFilter = searchParams.get("city") || "";

  useEffect(() => {
    loadEvents();
  }, [gameFilter, cityFilter]);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (gameFilter) params.game = gameFilter;
      if (cityFilter) params.city = cityFilter;

      const result = await api.searchEvents(params);
      setEvents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  function handleGameFilter(game: string) {
    const params = new URLSearchParams(searchParams);
    if (game) {
      params.set("game", game);
    } else {
      params.delete("game");
    }
    setSearchParams(params);
  }

  function handleCitySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get("city") as string;
    const params = new URLSearchParams(searchParams);
    if (city) {
      params.set("city", city);
    } else {
      params.delete("city");
    }
    setSearchParams(params);
  }

  function formatEventDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (diffDays < 0) return `${formatted} (Past)`;
    if (diffDays === 0) return `${formatted} (Today!)`;
    if (diffDays === 1) return `${formatted} (Tomorrow)`;
    if (diffDays <= 7) return `${formatted} (${diffDays} days)`;
    return formatted;
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>
          <Trophy size={42} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
          Upcoming Events
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem", margin: "0.5rem 0 0" }}>
          Discover tournaments happening near you
        </p>
      </div>

      <div className="events-filters">
        <form onSubmit={handleCitySearch} style={{ flex: 1, minWidth: "250px" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={20}
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
            />
            <input
              type="text"
              name="city"
              placeholder="Search by city..."
              defaultValue={cityFilter}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 3rem",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text)",
                fontSize: "1rem",
              }}
            />
          </div>
        </form>

        <select
          value={gameFilter}
          onChange={(e) => handleGameFilter(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text)",
            fontSize: "1rem",
          }}
        >
          <option value="">All Games</option>
          <option value="Street Fighter 6">Street Fighter 6</option>
          <option value="Tekken 8">Tekken 8</option>
          <option value="Guilty Gear Strive">Guilty Gear Strive</option>
          <option value="Mortal Kombat 1">Mortal Kombat 1</option>
          <option value="Super Smash Bros. Ultimate">Super Smash Bros. Ultimate</option>
        </select>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.1rem" }}>
            <div className="spinner" />
            Loading events...
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Trophy size={80} />
          </div>
          <h3>No upcoming events found</h3>
          <p>Try adjusting your filters or check back later for new tournaments</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <Link key={event.id} to={`/t/${event.id}`} style={{ textDecoration: "none" }}>
              <div className="event-card">
                <div className="event-icon">
                  <Trophy size={32} />
                </div>
                <div className="event-content">
                  <h3 className="event-name">{event.name}</h3>
                  <div className="event-details">
                    <span className="event-detail">
                      <Gamepad2 size={16} />
                      {event.game}
                    </span>
                    <span className="event-detail">
                      <Calendar size={16} />
                      {formatEventDate(event.startDate)}
                    </span>
                    {event.venue && (
                      <span className="event-detail">
                        <MapPin size={16} />
                        {event.venue}
                        {event.city && `, ${event.city}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="event-entrants">
                  <Users size={18} />
                  {event.entrantCount} {event.entrantCount === 1 ? "entrant" : "entrants"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
