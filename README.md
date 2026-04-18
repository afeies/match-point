# match-point

A central hub for fighting game tournaments.

## Continuous integration

Automated tests run on **pull requests** and on **pushes** to `main`, `master`, `develop`, or `integration`.

| Workflow | What it runs |
|----------|----------------|
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | `npx tsc --noEmit`, `npm test` (API / Vitest), `frontend`: `npm test`, `npm run build` |

The API test suite includes **US12 (match-call notifications)** in `src/notifications.test.ts` (Vitest + Supertest against the real Express app).

## Local checks (same gates as CI)

From the repository root:

```bash
npx tsc --noEmit
npm test
cd frontend && npm test && npm run build
```
