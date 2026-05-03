# User Story
As a player, I want to follow other players so that I can track their upcoming events, recent results, and activity without manually checking the platform every day.

Importance of the US
Following creates passive engagement: a player who follows their rival has a reason to return even when not entering a tournament. This social glue is essential for transitioning MatchPoint from a transactional tool into a community platform.

Machine Acceptance Criteria


POST /api/follows with a target user ID creates a follow relationship and returns HTTP 201.

DELETE /api/follows/:id removes the follow relationship and returns HTTP 200.

GET /api/users/:id/following returns a paginated list of followed users with their basic profile info.

409 returned on a duplicate follow attempt.

GET /api/users/:id/followers returns a paginated list of users who follow the given player.
Human Acceptance Criteria

A follow button is visible and clearly labeled on every player profile page.

Clicking Follow changes the button state immediately (no page reload required).

Followed players appear in a "Following" tab or list on the logged-in user's profile.

Unfollowing a player removes them from the Following list within one page load.

# Screens
- Following List - Empty
- Following List - Success
- Player Profile - Error
- Player Profile - Loading
- Player Profile - Success

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Players need to follow others to track rivals' events and results, creating passive engagement that keeps them returning to the platform.
- **How users reach it:** The Player Profile screen is reachable by tapping any player name in leaderboards, tournament brackets, or search results. The Following List is accessible from the logged-in user's profile via a "Following" tab.

## Component Reuse
- Player card component (avatar, display name, game tags) shared with leaderboards and tournament entrant lists
- Follow/Unfollow toggle button reused wherever a player card appears
- Global nav bar with consistent back navigation
- Shared empty-state illustration and message component
- Pagination/infinite-scroll component reused from replay browser and event lists

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for interactive elements)
- Follow/Unfollow button is at least 44×44 px and includes an aria-label reflecting current state (e.g., "Unfollow PlayerName")
- Player profile labels clearly associate data with headings (display name, games, region)
- Loading and error states communicated via aria-live regions so screen readers announce changes
- Focus management returns to the triggering element after following/unfollowing

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Follow button | Enables following a player from their profile | Follow players |
| Unfollow button | Removes a player from the following list | Follow players |
| Player card | Displays avatar, display name, and game tags | Follow players |
| Following tab | Shows the list of players the user follows | Follow players |
| Following count | Displays total number of followed players | Follow players |
| Empty state message | Informs the user they are not following anyone yet | Follow players |
| Error banner | Shows a loading failure message with retry option | Follow players |