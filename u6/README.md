# User Story
As a player, I want to create a profile listing my display name, games I play, and general location so that organizers and other community members can recognize and find me across events.

Importance of the US
A player profile is the identity foundation of MatchPoint. Without it, registration (US2), leaderboards (US8), and social features (US9) have no persistent user entity to anchor to. Enables cross-event reputation, which Person 1 requested directly.

Machine Acceptance Criteria


POST /api/users creates a user with required fields (username, email, games array, region) and returns HTTP 201.

GET /api/users/:id returns the full public profile without requiring authentication.

409 returned for duplicate username or email.

PATCH /api/users/:id with valid auth updates only the provided fields and returns the updated profile.

Deleted or non-existent user IDs return 404.
Human Acceptance Criteria

A new user can complete profile creation in under 2 minutes.

The profile page clearly shows the player's display name, games, and region.

Edits to the profile are reflected immediately on the profile page after saving.

The profile is publicly viewable by anyone without requiring a login.

# Screens
- Player Profile - Empty State
- Player Profile - Error State
- Player Profile - Loading State
- Player Profile - Main View
- Player Profile - Success State

# UI States
- Empty
- Loading
- Error
- Success

# Design Rationale

## Navigation
- **Why this screen exists:** A player profile is the identity foundation of MatchPoint — it anchors registration, leaderboards, and social features to a persistent, recognizable user entity.
- **How users reach it:** New users arrive here during onboarding after sign-up. Existing profiles are reachable by tapping a player name anywhere in the app (leaderboards, brackets, following lists). Users edit their own profile via a "Settings" or "Edit Profile" link on their profile page.

## Component Reuse
- Player card component (avatar, display name, game tags, region) reused across leaderboards, following lists, and entrant lists
- Game tag chips shared with tournament discovery filters and leaderboard game selector
- Global nav bar with profile icon linking back to own profile
- Shared form input components (text fields, multi-select for games, region dropdown) used across profile creation and tournament creation
- Shared empty-state and error banner components

## Accessibility
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for profile text, 3:1 for interactive elements)
- All form fields have visible labels and associated `<label>` elements — not placeholder-only
- Game tag chips include aria-labels (e.g., "Remove Street Fighter 6 from your games")
- Action buttons (Save, Edit, Cancel) are at least 44×44 px
- Success and error feedback is announced via aria-live regions for screen readers

# UI Element Mapping
| Element | Purpose | User Story |
|--------|--------|-----------|
| Display name field | Input for the player's public username | Create profile |
| Games multi-select | Lets the player choose which games they play | Create profile |
| Region dropdown | Selects the player's general location | Create profile |
| Email field | Input for the player's email address | Create profile |
| Save button | Submits the profile creation or edit form | Create profile |
| Avatar placeholder | Shows a default image until the player uploads one | Create profile |
| Profile header | Displays the player's name, games, and region on the public view | Create profile |
| Edit profile link | Opens the profile form in edit mode | Create profile |
| Error banner | Shows validation or server errors on form submission | Create profile |
| Success toast | Confirms profile was saved successfully | Create profile |