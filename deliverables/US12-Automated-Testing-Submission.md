# User Story 12 — Automated Testing & CI (Submission Source for PDF)

**Instructions:** Open this file in your editor or Google Docs, adjust the bracketed placeholders, then **Print → Save as PDF** (or use Pandoc / Word “Save as PDF”) to produce the deliverable PDF your instructor requested.

---

## 1. User story

**US12 — Match-call in-app notifications:** When a bracket match becomes playable (`ready`), eligible entrants receive in-app notifications; they can list unread notifications and acknowledge them; only the owning user may read their list or ack their rows; enqueue is idempotent per `(tournament, match, player)`; progression into later rounds can enqueue new notifications.

Specification reference: `u12/dev-spec.md`.

---

## 2. Testing framework

- **Framework:** Vitest (Node/Vite-native; Jest-compatible assertions).
- **API tests:** Supertest against the real Express app (`createApp()`).

---

## 3. Tests that correspond to US12 (what each asserts)

| Automated test (file: `src/notifications.test.ts`) | Behavior asserted |
|---------------------------------------------------|-------------------|
| `enqueues notifications for both entrants when a match becomes ready (bracket generation)` | After bracket generation with two checked-in entrants, each player receives exactly one unread notification with correct `tournamentId`, `round`, `matchId`, `createdAt`, opponent display name, and `stationLabel` null via HTTP. |
| `GET /api/users/:id/notifications returns 403 for another user` | Listing notifications for a different user id than the JWT subject returns **403**. |
| `POST /api/notifications/:id/ack returns 200, 404, and 403 appropriately` | Ack returns **200** `{ ok: true }` for owner; list is empty after ack; unknown id → **404**; another user’s notification → **403**. |
| `does not notify a user who is not an entrant (fixture: bracket override list)` | Ghost user id in bracket receives **no** notifications; registered entrant still receives one. |
| `is idempotent for the same (tournament, match, player) when match-ready is replayed` | Posting the same bracket body twice does not duplicate notifications (same notification `id`). |
| `enqueues when a later-round match becomes ready after reporting a winner` | After organizers post winners for two round-1 matches, a **round 2** match-call appears in the player’s notification list (`round === 2`). |
| **Also:** `src/bracket/bracketState.integration.test.ts` — `marks round 2 ready after two round-1 winners (4 players)` | Regression guard: later-round matches are not incorrectly auto-completed while waiting for the second feeder (bracket engine supports US12 enqueue semantics). |

---

## 4. CI visibility (GitHub Actions)

**Workflow file:** `.github/workflows/ci.yml`

**Triggers:** `pull_request`, and `push` to `main`, `master`, `develop`, or `integration`.

**Jobs / steps relevant to US12:**

1. `npm ci` (API)
2. `npx tsc --noEmit`
3. `npm test` — runs all API Vitest files, including `src/notifications.test.ts`
4. `frontend`: `npm ci`, `npm test`, `npm run build`

---

## 5. Successful CI run (paste link after you push)

**Green GitHub Actions run URL (required for your PDF):**

`[PASTE YOUR ACTIONS RUN URL HERE — e.g. https://github.com/<org>/<repo>/actions/runs/<run_id> ]`

**Optional — local verification output (same commands as CI):**

```bash
npx tsc --noEmit
npm test
cd frontend && npm test && npm run build
```

---

## 6. Pull request (paste link after merge)

**PR that added/updated US12 tests and CI (can be combined with implementation PR):**

`[PASTE PR URL HERE]`

**Primary commit SHAs (optional):** `[paste short SHAs after merge]`

---

## 7. GitHub hygiene checklist (course requirements)

Complete these on GitHub; the LLM cannot complete them without your account.

| Step | Done? | Notes |
|------|-------|-------|
| Create **issue** for the *test/CI work* | ☐ | Link it to your **US12 story issue** (e.g. “Related to #___”) |
| Create **branch** from `main` / integration branch | ☐ | e.g. `test/us12-notifications-ci` |
| Commit with **issue reference** | ☐ | e.g. `Closes #___` or `Refs #___` |
| **Code review** before opening PR | ☐ | Peer review policy per your team |
| Open **PR**, get review, **merge** to main | ☐ | Attach Actions link in PR description |

---

## 8. LLM assistance disclosure (attach shareable logs / URLs)

**Requirement:** Provide what your syllabus asks (e.g. ChatGPT share link, Claude share, or Cursor transcript URL).

**This work used an LLM to:** design US12 backend + Vitest coverage, debug bracket bye-handling for later rounds, wire CI documentation, and produce this submission outline.

**Shareable URL(s):**

`[PASTE SHARE LINK TO LLM CHAT OR CURSOR TRANSCRIPT HERE]`

---

## 9. Instructor checklist mapping

| Requirement | Evidence in this repo |
|-------------|------------------------|
| Real automated tests (not “LLM ran once”) | `src/notifications.test.ts`, `src/bracket/bracketState.integration.test.ts` |
| CI on PR/push | `.github/workflows/ci.yml` |
| Describe tests & assertions | Section **3** above |
| Link passing CI run | Section **5** |
| Link PR / commits | Section **6** |
| LLM logs URL | Section **8** |

---

*End of submission source document.*
