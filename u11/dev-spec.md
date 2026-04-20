# US11 Dev Spec — Event Day Check-In

Short implementation spec for US11 (see `user-stories2.md` §US11 for the user story and full acceptance criteria). This is deliberately scoped to the diff vs. the already-merged US1/US2 backend + frontend.

## 1. Data Model Delta

Two fields are added to existing types in `src/types.ts`. Both default to `false` so existing in-memory rows stay valid.

| Type | New field | Default | Purpose |
|---|---|---|---|
| `Entrant` | `checkedIn: boolean` | `false` | Set to `true` when an organizer marks the player present; set back to `false` via un-check-in. Read by bracket generation to filter no-shows. |
| `Tournament` | `checkInClosed: boolean` | `false` | Latched once the organizer hits "Close Check-In"; gates bracket generation and rejects further check-in writes. |

No new tables/maps: both fields live inside the existing `entrantsByTournament` and `tournaments` maps in `src/store.ts`.

### New store helpers (`src/store.ts`)
- `setEntrantCheckedIn(tournamentId, entrantUserId, checkedIn) → Entrant | undefined` — flips the flag on a single entrant; returns the updated entrant or `undefined` if the tournament/entrant does not exist.
- `closeCheckIn(tournamentId) → Tournament | undefined` — sets `checkInClosed = true` on the tournament; returns the updated tournament.

`createTournament` must initialize `checkInClosed: false`; entrants created via `POST /register` must default `checkedIn` to `false`.

## 2. Endpoints

All routes live in `src/routes/tournaments.ts` and use the existing `requireAuth` + `requireOrganizer` middleware chain.

| Method | Path | Auth | Behavior |
|---|---|---|---|
| `POST` | `/api/tournaments/:id/checkin/close` | organizer | 404 if tournament missing; 409 if already `checkInClosed`; sets `checkInClosed: true`; returns `200` with `{ id, name, game, maxEntrants, registrationOpen, checkInClosed }`. |
| `POST` | `/api/tournaments/:id/checkin/:entrantId` | organizer | 404 if tournament missing; 409 if `checkInClosed`; 404 if entrant missing; sets `checkedIn: true`; returns `200` with `{ userId, displayName, gameSelection, registeredAt, checkedIn }`. |
| `DELETE` | `/api/tournaments/:id/checkin/:entrantId` | organizer | 404 if tournament missing; 409 if `checkInClosed`; 404 if entrant missing; sets `checkedIn: false`; returns `200` with `{ userId, displayName, gameSelection, registeredAt, checkedIn }`. |

> **Route ordering note:** `POST /:id/checkin/close` must be registered **before** `POST /:id/checkin/:entrantId` so the literal segment `close` is not treated as an `:entrantId` parameter.

Modifications to existing endpoints:

- `POST /api/tournaments/:id/bracket` — when `req.body.players` is absent or empty, returns **409** (`"Check-in must be closed before generating the bracket"`) if `checkInClosed === false`. When `checkInClosed === true` and `players` is omitted, bracket generation uses only entrants where `checkedIn === true`. Explicit `players` in the request body bypasses both checks (preserving backward compatibility with existing tests).
- `GET /api/tournaments/:id/entrants` — each entrant object in the response includes `checkedIn: boolean`.
- `GET /api/tournaments/:id` — response includes `checkInClosed: boolean` on the tournament and `checkedIn: boolean` on each embedded entrant object.
- `GET /api/tournaments` — each summary object in the list response includes `checkInClosed: boolean`.

`:entrantId` in the path is the `userId` of the entrant (consistent with how other routes reference entrants).

## 3. Frontend Surface

### API client (`frontend/src/api.ts`)

New types and updated DTOs:

- `EntrantRecord` interface: `{ userId, displayName, gameSelection, registeredAt, checkedIn: boolean }`.
- `TournamentSummary` includes `checkInClosed: boolean`.
- `TournamentDetail` extends `TournamentSummary` and includes `entrants: EntrantRecord[]`.
- `getEntrants` return type: `{ tournamentId: string; count: number; entrants: EntrantRecord[] }`.

New API methods:

```ts
checkInEntrant(tournamentId: string, entrantId: string): Promise<EntrantRecord>
// POST /api/tournaments/:id/checkin/:entrantId

uncheckInEntrant(tournamentId: string, entrantId: string): Promise<EntrantRecord>
// DELETE /api/tournaments/:id/checkin/:entrantId

closeCheckIn(tournamentId: string): Promise<{
  id: string;
  name: string;
  game: string;
  maxEntrants: number | null;
  registrationOpen: boolean;
  checkInClosed: boolean;
}>
// POST /api/tournaments/:id/checkin/close
```

### New page
`frontend/src/pages/TournamentCheckInPage.tsx`, reached at route `/t/:id/checkin` (organizer only). Contents:
- Header: tournament name + running counter `X / Y checked in`.
- Entrant list: one row per registered entrant with a single toggle button ("Check in" ↔ "Undo"). Tapping flips the flag via the new API.
- "Close Check-In" button (disabled until at least one entrant is checked in) → confirm modal ("Once closed, no-shows will be excluded from the bracket") → posts to `/checkin/close`.
- After close: navigate to `/t/:id/bracket` (which will now auto-generate without no-shows on the next organizer-triggered run, i.e. the detail page's existing `Generate bracket` button works).
- States: Loading (entrants fetch), Error (banner on failed API), Empty (no entrants — show "Sign ups required before check-in"), Closed (replace toggle with a read-only `Checked in` / `Did not attend` badge when `checkInClosed` is true).

### Changes to existing pages
- `TournamentDetail.tsx`
  - Organizer view: add a "Check-in" button next to "Generate bracket" that navigates to `/t/:id/checkin`.
  - Entrant list: for entrants where `checkInClosed && !checkedIn`, render a small "Did Not Attend" badge after the display name.
- `App.tsx` — register the new route under `DashboardLayout`.

## 4. Tests

One integration test per machine AC in a new `src/checkin.test.ts`, mirroring the vitest + supertest patterns already in `src/api.test.ts`. Minimum six tests:

1. `POST /checkin/:entrantId` with organizer auth → 200, entrant `checkedIn === true`.
2. `POST /checkin/:entrantId` called by a non-organizer player → 403.
3. `DELETE /checkin/:entrantId` reverses the flag → 200, entrant `checkedIn === false`.
4. `GET /entrants` includes `checkedIn` for every entrant.
5. `POST /bracket` once `checkInClosed` → excludes `checkedIn: false` entrants; called before close → 409.
6. `POST /checkin/close` → 200 + `checkInClosed: true`; a second `POST /checkin/:entrantId` afterwards → 409.

## 5. Human Test Checklist

`u11/HumanTests.md` mirrors the `US2HumanTests.md` format and covers the four human ACs (speed per toggle, running counter, explicit close confirmation, "Did Not Attend" indicator).
