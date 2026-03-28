# User Story
As a player, I want to browse and filter upcoming local tournaments by game and location so that I can find events to attend without searching across Discord, Reddit, and Facebook.

Importance of the US
Event fragmentation is the central player-facing problem MatchPoint solves. Event discovery is the primary entry point for new users — if players cannot quickly find relevant events, they have no reason to create a profile, register, or return.

Machine Acceptance Criteria


GET /api/events with optional params (game, city, radius_km) returns filtered, upcoming events sorted by date ascending.

Events with a start date in the past are excluded from the default results.

Each event object includes: name, game, date, venue name, city, and current entrant count.

Response time under 400 ms for datasets up to 5,000 events.

Empty results return an empty array with HTTP 200 (not 404).
Human Acceptance Criteria

A player can find events in their city for their game within 3 clicks from the home page.

Events are sorted by date with the soonest first by default.

Applying a game or location filter visibly narrows the results without a full page reload.

Each event card shows enough information to decide whether to attend without clicking through.


# Screens
- Tournament Discovery - Empty State
- Tournament Discovery - Error State
- Tournament Discovery - Loading State
- Tournament Discovery - Main View

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Tournament discovery is the primary entry point for new players — consolidating events from Discord, Reddit, and Facebook into a single filterable view.
- **How users reach it:** This is the default landing screen accessible from the "Events" tab in the main nav bar. Users can also deep-link to a filtered view (e.g., by game) from external shares.

## Component Reuse
- Event card component (name, game, date, venue, entrant count) reused on the organizer dashboard and player profile event history
- Game and location filter dropdowns shared with the leaderboard and replay browser
- Global nav bar with active tab state
- Shared empty-state component (illustration + message + CTA)
- Loading skeleton cards matching event card dimensions

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for event card text and filter labels)
- Filter controls have visible labels and are keyboard-navigable with arrow keys
- Each event card is a single focusable element with a descriptive aria-label (e.g., "Street Fighter 6 tournament, March 30, Steel City Arena, 24 entrants")
- All tap targets (cards, filters, pagination) are at least 44×44 px
- Empty and error states use aria-live regions to announce status changes

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Event card | Shows tournament name, game, date, venue, and entrant count | Browse events |
| Game filter dropdown | Filters events by game title | Browse events |
| Location filter | Filters events by city or radius | Browse events |
| Search bar | Allows keyword search across event names | Browse events |
| Empty state message | Informs the user no events match the current filters | Browse events |
| Error banner | Shows a load failure message with retry option | Browse events |
| Loading skeleton cards | Placeholder cards shown while events are loading | Browse events |