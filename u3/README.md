# User Story
As a tournament organizer, I want to update match scores in real time during an event so that players and spectators can follow the current bracket state without needing a physical scoreboard or separate stream.

Importance of the US
Persons 15 and 11 explicitly asked for streamlined score tracking. The current workflow requires organizers to manually track results — if one person leaves, the whole system breaks. This directly replaces the most fragile part of organizers' current setup.

Machine Acceptance Criteria


PUT /api/matches/:id/score with valid score data returns HTTP 200 and the updated match object.

Bracket state reflects the winner advancing to the next round within 3 seconds of score submission.

Scores update on the public bracket page without a full page reload (polling or WebSocket).

403 returned when a non-organizer user attempts to submit a score update.

400 returned for invalid score formats (e.g., negative values, non-integers).
Human Acceptance Criteria- [ ] An organizer can input a match result in 3 clicks or fewer from the bracket view.

The bracket display visibly updates — the winner's name moves to the next round — without a manual refresh.

Spectators on a separate device see score changes within 5 seconds.

A completed bracket clearly indicates the overall tournament winner.

# Screens
- Empty Bracket State
- Loading Bracket State
- Main Bracket View
- Tournament Winner State

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Organizers need to update match scores in real time during an event so players and spectators can follow the bracket without a physical scoreboard.
- **How users reach it:** From the organizer dashboard, the organizer selects an active tournament to open the Main Bracket View. Spectators reach the same bracket via a public shareable URL. Score entry is inline — tapping a match in the bracket opens a score input.

## Component Reuse
- Bracket connector/match-node component designed for reuse across single-elimination and future double-elimination formats
- Score input component (player names + score fields + submit) reusable for any match-based scoring
- Global nav bar with tournament context breadcrumb
- Shared loading skeleton matching bracket layout dimensions
- Shared empty-state component for brackets with no matches yet
- Toast/notification component for real-time score confirmation

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for player names and scores, 3:1 for bracket lines and UI controls)
- Score input fields have explicit labels (e.g., "Score for PlayerA") and are keyboard-navigable
- All interactive elements (match nodes, submit buttons) are at least 44×44 px
- Real-time bracket updates are announced via aria-live regions for screen readers
- The tournament winner state uses both visual emphasis and a text announcement ("Tournament Winner: PlayerName")

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Bracket view | Visualizes the tournament bracket with rounds and match nodes | Live scoring |
| Match node | Displays two player names and their scores in a single matchup | Live scoring |
| Score input fields | Allows the organizer to enter match results | Live scoring |
| Submit score button | Saves the score and advances the winner to the next round | Live scoring |
| Winner banner | Highlights the tournament champion on the final bracket state | Live scoring |
| Real-time update indicator | Signals that the bracket is receiving live score changes | Live scoring |
| Empty bracket message | Shown when the bracket has been created but no matches exist yet | Live scoring |
| Loading skeleton | Placeholder matching bracket layout while data loads | Live scoring |