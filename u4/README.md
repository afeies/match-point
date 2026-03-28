# User Story
As a tournament organizer, I want to upload match video replays after an event ends so that players can find and revisit tournament footage in one centralized place.

Importance of the US
Paper prototype testing revealed replay browsing was the most positively received feature. Persons 3 and 18 both noted the frustration of manually distributing replays. This is a prerequisite for US5 (replay discovery).

Machine Acceptance Criteria


POST /api/replays accepts a video file and metadata (player names, game, event ID) and returns HTTP 201.

Uploaded file is stored and accessible via the returned URL within 30 seconds.

413 returned for files exceeding the size limit (configurable, default 2 GB).

Only authenticated organizers may upload replays for their own events (403 otherwise).

GET /api/replays/:id returns the full replay object including metadata and accessible video URL.
Human Acceptance Criteria

An organizer can upload a replay file with metadata filled in within 3 minutes.

A progress indicator is displayed during upload with a clear completion state.

The replay appears in the event's replay list immediately after upload completes.

Title, game, player names, and event name are correctly displayed on the replay card.
# Screens
- No Replays (Empty State)
- Replays Dashboard
- Upload Complete (Success)
- Upload Failed (Error)
- Uploading Replay (Loading)

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** Organizers need to upload match video replays after events so players can find tournament footage in one centralized place — a prerequisite for the replay browser (US5).
- **How users reach it:** From the organizer dashboard, users select an event and tap "Upload Replay." The Replays Dashboard lists existing uploads for that event. The upload flow progresses linearly: Replays Dashboard → file picker → Uploading Replay (Loading) → Upload Complete (or Upload Failed on error).

## Component Reuse
- Replay card component (thumbnail, title, players, game) shared with the player-facing replay browser
- Upload progress bar component shared with any future file-upload flows
- Shared primary action button for "Upload Replay" and "Retry"
- Global nav bar with organizer dashboard context
- Shared empty-state component for the "No Replays" screen
- Shared error banner with retry action

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for text, 3:1 for progress bar and buttons)
- Upload button and file picker are at least 44×44 px tap targets
- Progress bar includes aria-valuenow, aria-valuemin, and aria-valuemax attributes plus a text percentage label
- Success and failure states are announced via aria-live regions
- Metadata form fields (player names, game, event) have visible labels — not placeholder-only

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Upload replay button | Opens the file picker to select a video file | Upload replays |
| File picker | Allows the organizer to select a video from their device | Upload replays |
| Metadata form | Collects player names, game, and event ID for the replay | Upload replays |
| Upload progress bar | Shows upload percentage and estimated time remaining | Upload replays |
| Replay card | Displays uploaded replay details on the Replays Dashboard | Upload replays |
| Upload complete confirmation | Shows success message and link to the published replay | Upload replays |
| Upload failed error banner | Displays failure reason with a retry option | Upload replays |
| Empty state message | Shown when no replays have been uploaded for the event yet | Upload replays |