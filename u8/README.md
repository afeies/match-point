# User Story
As a player, I want to see a ranked leaderboard based on local tournament results so that I can track my standing in the Pittsburgh FGC and measure my progress over time.

Importance of the US
Person 1 explicitly requested a player ranking system — it was the first pain point raised in discovery. Leaderboards create a retention loop: players return to check their rank after each tournament, transforming MatchPoint from a utility into a community hub.

Machine Acceptance Criteria


GET /api/leaderboard?game= returns a ranked list of players sorted by points descending.

Points update correctly within 1 hour of a tournament result being finalized.

GET /api/leaderboard?game=&player_id= returns the requesting player's rank and surrounding entries.

Pagination returns correct slices with an accurate total count.

Only tournaments marked as finalized contribute to leaderboard points.
Human Acceptance Criteria

A player can find their own rank on the leaderboard for their game within 2 clicks.

Rank changes from a recent tournament are reflected on the leaderboard within 24 hours.

The active game filter is clearly displayed so the player knows which leaderboard they are viewing.

The leaderboard distinguishes between players with the same point total using a visible tiebreaker.

# Screens
- MatchPoint - Connection Error
- MatchPoint - Leaderboard Dashboard
- MatchPoint - Loading Ranks
- MatchPoint - No Results Yet
- MatchPoint - Rank Updated!

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Players need a ranked leaderboard to track their standing in the Pittsburgh FGC, creating a retention loop that brings them back after every tournament.
- **How users reach it:** Accessible from the main navigation bar ("Leaderboard" tab) or via a link on the post-tournament results screen. A game filter dropdown lets players switch between game-specific rankings.

## Component Reuse
- Rank row component (position, player name, points, trend indicator) shared with mini-leaderboard widgets on the dashboard
- Game filter dropdown reused from tournament discovery and replay browser
- Global nav bar with active tab highlighting
- Shared loading skeleton component for the table rows
- Shared error banner component with retry action

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for leaderboard text and rank numbers)
- Rank change indicators use both color and directional icons (↑ green, ↓ red) — not color alone
- Leaderboard table uses proper `<table>`, `<th>`, and `<td>` semantics with column headers for screen readers
- Active game filter is announced via aria-live when changed
- All interactive elements (filter, pagination) are at least 44×44 px tap targets

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Leaderboard rank row | Displays position, player name, points, and trend indicator | Leaderboard |
| Game filter dropdown | Switches between game-specific leaderboards | Leaderboard |
| Rank trend icon | Shows rank change direction (up/down/unchanged) | Leaderboard |
| Player name link | Navigates to the player's profile | Leaderboard |
| Pagination controls | Navigates between pages of ranked players | Leaderboard |
| "No Results Yet" message | Shown when no tournament results exist for the selected game | Leaderboard |
| Connection error banner | Displays failure to load rankings with retry option | Leaderboard |
| "Rank Updated!" toast | Confirms the player's rank has changed after a tournament | Leaderboard |