# US12 Dev Spec — Match-call in-app notifications

Implementation spec for US12 (match ready → player notifications). Builds on US1/US2/US11 bracket + entrants.

## 1. Data Model Delta (`src/types.ts`)

- **`BracketMatchStatus`** — type alias `"pending" | "ready" | "complete"`.
- **`BracketMatch`** gains:
  - `status: BracketMatchStatus`
  - `winnerUserId: string | null`
  - `stationLabel?: string | null` (optional metadata for the venue)
- **`MatchCallNotificationKind`** — type alias `"match_call"`.
- **`MatchCallNotification`** (in-memory): `id`, `userId`, `kind: MatchCallNotificationKind`, `tournamentId`, `matchId`, `round`, `opponentDisplayName`, `stationLabel: string | null`, `read: boolean`, `createdAt: string`.
- **`MatchCallNotificationDTO`** — API response shape: `id`, `tournamentId`, `matchId`, `round`, `opponentDisplayName`, `stationLabel: string | null`, `createdAt`. (Omits `kind`, `read`, `userId`.)

## 2. Bracket State (`src/bracket/bracketState.ts`)

- **`syncBracketDerivedState(bracket)`** — After byes are normalized in round 1, recomputes feeder advancement into later rounds (using recorded winners + bye rules), assigns each match `status`, and returns **`matchId`s that newly transitioned to `ready`** (for notification enqueue).
- **`recordMatchWinner(bracket, matchId, winnerUserId)`** — Organizer-facing progression; runs sync and returns the same `newlyReady` id list.
- **`findMatch(bracket, matchId)`** — Utility to locate a `BracketMatch` by id within a `BracketResponse`.

`buildSingleEliminationBracket` initializes `status`, `winnerUserId`, and `stationLabel` on every match.

## 3. Store (`src/store.ts`)

In-memory maps:
- `notificationsById: Map<string, MatchCallNotification>`
- `matchReadyNotificationKeys: Set<string>` — idempotency set keyed by `` `${tournamentId}\0${matchId}\0${playerId}` ``

Exported functions related to US12:

- **`enqueueMatchReadyNotifications(tournamentId, newlyReadyMatchIds)`** — For each ready match, for each side: skip if user is **not** in `getEntrants(tournamentId)`; skip if idempotency key exists; else insert unread `match_call` notification. Called explicitly by the winner route handler after `reportBracketMatchWinner`.
- **`listUnreadMatchCallNotifications(userId)`** — Returns all unread `match_call` notifications for the given user.
- **`getNotificationById(id)`** — Returns a single `MatchCallNotification | undefined`.
- **`markNotificationRead(id, ownerUserId)`** — Returns `"ok" | "not_found" | "forbidden"`. Marks notification `read = true` if found and owned by caller.
- **`reportBracketMatchWinner(tournamentId, matchId, winnerUserId)`** — Calls `applyMatchWinner` from bracketState, persists bracket, returns `{ bracket: BracketResponse, newlyReadyMatchIds: string[] } | undefined` (undefined when bracket not found).
- **`setMatchStationLabel(tournamentId, matchId, stationLabel)`** — Returns `boolean`. Used in tests to set a non-null station label on a match.
- **`setTournamentBracket(tournamentId, bracket)`** — Persists the bracket (does **not** automatically call `enqueueMatchReadyNotifications`; the caller — tournament route or test — does that separately).

> **Note:** Unlike the original spec, `setTournamentBracket` does **not** automatically call `enqueueMatchReadyNotifications`. The `POST /:id/matches/:matchId/winner` route handler calls both `reportBracketMatchWinner` and then `enqueueMatchReadyNotifications` explicitly.

## 4. HTTP API

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| `GET` | `/api/users/:id/notifications` | Bearer | **200** — array of unread `MatchCallNotificationDTO`s for caller only; **403** if `:id` ≠ JWT subject. |
| `POST` | `/api/notifications/:id/ack` | Bearer | **200** `{ ok: true }`; **404** notification not found; **403** if notification belongs to another user. |
| `POST` | `/api/tournaments/:id/matches/:matchId/winner` | Organizer | Body `{ winnerUserId: string (UUID) }`. Advances bracket via `reportBracketMatchWinner`, then calls `enqueueMatchReadyNotifications`. Returns **200** `{ bracket }`. **400** invalid progression (`BracketProgressError`) or bad body; **404** tournament or bracket not found. |

Route registration notes:
- `GET /api/users/:id/notifications` is registered **before** `GET /api/users/:id` in the users router.
- `POST /api/notifications/:id/ack` is handled in `src/routes/notifications.ts`, mounted at `/api/notifications`.
- `POST /api/tournaments/:id/matches/:matchId/winner` is handled in `src/routes/tournaments.ts`, registered before `POST /api/tournaments/:id/bracket`.

### Response shapes

**`GET /api/users/:id/notifications`** — `200`:
```json
[
  {
    "id": "uuid",
    "tournamentId": "uuid",
    "matchId": "uuid",
    "round": 1,
    "opponentDisplayName": "string",
    "stationLabel": "string | null",
    "createdAt": "ISO8601"
  }
]
```

**`POST /api/notifications/:id/ack`** — `200`:
```json
{ "ok": true }
```

**`POST /api/tournaments/:id/matches/:matchId/winner`** — `200`:
```json
{ "bracket": { /* BracketResponse */ } }
```

## 5. Frontend Surface

**`frontend/src/api.ts`**:
- Types exported: `BracketMatchStatus`, `BracketMatch` (with `status`, `winnerUserId`, `stationLabel`), `MatchCallNotificationDTO`.
- `api.getMatchCallNotifications(userId: string): Promise<MatchCallNotificationDTO[]>` — `GET /api/users/:userId/notifications` with auth.
- `api.ackMatchCallNotification(notificationId: string): Promise<{ ok: boolean }>` — `POST /api/notifications/:notificationId/ack` with auth.

**`DashboardLayout`** — Bell control loads unread list (poll ~45s), dropdown with round/opponent/station/time, links to `/t/:tournamentId/bracket`, **Got it** → ack.

## 6. Tests

- **`src/notifications.test.ts`** — Maps each machine acceptance criterion:
  - Notifications enqueued when match transitions to `ready`
  - `GET /api/users/:id/notifications` returns correct DTO shape
  - `GET /api/users/:id/notifications` returns **403** when `:id` ≠ JWT subject
  - `POST /api/notifications/:id/ack` returns **200** `{ ok: true }`
  - `POST /api/notifications/:id/ack` returns **404** for unknown id
  - `POST /api/notifications/:id/ack` returns **403** for another user's notification
  - Non-entrant is not notified
  - Idempotency: duplicate enqueue does not create duplicate notifications
  - Later-round match becomes `ready` after winner is recorded
  - `stationLabel` appears in notification payload

## 7. Human Test Checklist

See `u12/HumanTests.md`.
