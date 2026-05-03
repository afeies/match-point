# User Story
As a player, I want to search and browse match replays by game, event, or player name so that I can study my own matches and watch others without digging through YouTube or Twitch archives.

Importance of the US
This prompted the strongest positive reaction during paper prototype testing — testers described it as a "third place" for FGC content. Persons 3, 18, and 20 all expressed pain around content discoverability. Completes the replay workflow from US4.

Machine Acceptance Criteria


GET /api/replays with optional query params (game, event_id, player_name) returns a filtered, paginated list (default 20 per page).

An empty filter returns all public replays in reverse-chronological order.

Search response time is under 500 ms for a dataset of up to 10,000 replays.

Each replay object includes: title, game, players, event name, date, and video URL.

Pagination returns correct slices with accurate total count metadata.
Human Acceptance Criteria

A player can find a specific match by player name within 3 clicks from the replay browse page.

Each replay card shows enough information to identify the match before clicking.

Clicking play loads the video inline or opens it without broken links.

Filtering by game or player name visibly narrows results without a full page reload.

# Screens
- Replay Browser - Empty State
- Replay Browser - Error State
- Replay Browser - Loading State
- Replay Browser - Success State

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Players need a centralized place to search and browse match replays by game, event, or player name instead of digging through YouTube and Twitch archives.
- **How users reach it:** Accessible from the main nav bar ("Replays" tab). Players can also navigate here from a tournament's detail page via a "Watch Replays" link or from a player profile's match history.

## Component Reuse
- Replay card component (thumbnail, title, players, game, event name, date) shared with the organizer's replay management view
- Game/event/player filter bar shared with tournament discovery and leaderboard screens
- Global nav bar with active tab highlighting
- Shared empty-state component (illustration + message)
- Shared loading skeleton cards and error banner with retry action
- Pagination/infinite-scroll component reused from event lists and following lists

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for card text, 3:1 for filter controls)
- Replay cards are focusable with descriptive aria-labels (e.g., "Player A vs Player B — SF6 — Steel City Weekly #12")
- Filter inputs have visible labels and support keyboard navigation
- Video player controls meet accessibility standards (keyboard-operable, labeled play/pause/volume)
- All tap targets (cards, filters, pagination) are at least 44×44 px

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Replay card | Displays thumbnail, title, players, game, event, and date | Browse replays |
| Game filter dropdown | Filters replays by game title | Browse replays |
| Event filter dropdown | Filters replays by tournament event | Browse replays |
| Player name search | Searches replays by player name | Browse replays |
| Video player | Plays the selected replay inline | Browse replays |
| Pagination controls | Navigates between pages of replay results | Browse replays |
| Empty state message | Informs the user no replays match the current filters | Browse replays |
| Error banner | Shows a load failure message with retry option | Browse replays |