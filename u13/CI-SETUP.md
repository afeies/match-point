# U13 CI/Automated Testing Setup

## Overview
This document describes the automated testing and code review infrastructure for US13 (Player Match History).

This includes both **automated tests** (vitest) and **LLM-assisted code review** (AI-powered PR feedback).

## Test Files
- **Backend Tests**: `src/history.test.ts` (8 tests)
  - Tests all acceptance criteria for the `/api/users/:id/history` endpoint
  - Tests user stats aggregation in `/api/users/:id` endpoint
  - Validates pagination, filtering, and error handling

## GitHub Actions Workflow

### Workflow Files

**.github/workflows/test.yml** - Automated Testing
**.github/workflows/llm-code-review.yml** - AI Code Review

These workflows run on:
- **Push events** to the `main` branch
- **Pull requests** targeting the `main` branch

### Jobs
1. **backend-tests**
   - Runs all backend tests using `npm test` (vitest)
   - Includes the 8 U13 tests in `src/history.test.ts`
   
2. **frontend-tests**
   - Runs all frontend tests using `npm test --prefix frontend`
   - Includes tests for PlayerProfilePage which displays match history

### Test Coverage for U13

The backend tests (`src/history.test.ts`) verify:

1. ✅ `GET /api/users/:id/history` returns 200 with correct fields for finalized tournaments
2. ✅ Filtering by `?game=<game>` works and returns empty array when no matches
3. ✅ Pagination params `page` and `pageSize` are respected, `total` is accurate
4. ✅ `GET /api/users/:id` includes totalTournaments, totalWins, totalLosses, bestPlacement
5. ✅ Returns 404 for non-existent users
6. ✅ Returns empty history for users with no finalized tournaments
7. ✅ Excludes non-finalized tournaments from history
8. ✅ Game filter is case-insensitive

## LLM-Assisted Code Review

### Overview

In addition to automated tests, U13 includes an **AI-powered code review system** that runs on every pull request.

**Purpose**: Provide fast, consistent feedback on code quality, testing, security, and maintainability.

**Key Point**: AI review is **advisory only** - human approval still required for all merges.

### LLM Review Job

The `llm-review` job in `.github/workflows/llm-code-review.yml`:

1. **Extracts** the PR diff
2. **Sends** to OpenAI GPT-4o-mini with structured review prompt
3. **Posts** AI-generated review as a bot comment on the PR
4. **Updates** automatically when PR changes

### Review Focus Areas

The AI reviewer checks:
- ✅ **Code Quality**: TypeScript patterns, bugs, error handling
- ✅ **Testing**: Coverage, edge cases, test quality
- ✅ **Security**: Vulnerabilities, validation, auth
- ✅ **Maintainability**: Readability, naming, complexity
- ✅ **Documentation**: Comments, API docs

### Where Reviews Appear

1. **PR Comments** - Bot posts "🤖 AI Code Review Summary"
2. **Actions Tab** - Full workflow logs
3. **PR Checks** - Status indicator

### Using the AI Review

**For PR Authors**:
1. Open PR → wait ~60 seconds
2. Read bot comment feedback
3. Address concerns in "⚠️ Concerns & Suggestions"
4. Push fixes (review auto-updates)
5. Request human review when ready

**For Human Reviewers**:
1. Read AI review first for overview
2. Verify AI-flagged issues
3. Focus on business logic and design
4. Review "🔍 Questions for Human Reviewers" section
5. Make final approval decision

### Documentation

- **Full Guide**: [.github/LLM-REVIEW-GUIDE.md](../.github/LLM-REVIEW-GUIDE.md)
- **U13 Integration**: [u13/LLM-REVIEW-INTEGRATION.md](LLM-REVIEW-INTEGRATION.md)
- **Prompt Template**: [.github/LLM-REVIEW-PROMPT.md](../.github/LLM-REVIEW-PROMPT.md)

## Running Tests Locally

### Backend tests only
```bash
npm test
```

### Frontend tests only
```bash
npm test --prefix frontend
```

### All tests
```bash
npm test && npm test --prefix frontend
```

## Viewing CI Results

1. Navigate to the [Actions tab](https://github.com/afeies/match-point/actions) in GitHub
2. View workflows:
   - **CI Tests** - Test results (backend + frontend)
   - **LLM Code Review** - AI review runs
3. Select a workflow run to see detailed logs
4. For PRs, both workflows must complete successfully (tests must pass; LLM review is informational)

## Related Issues & Documentation

- #44 - US13: Player Match History on Profile (implementation)
- #49 - Add CI/Automated Tests for US13 (test setup)
- **LLM Review Integration**: [u13/LLM-REVIEW-INTEGRATION.md](LLM-REVIEW-INTEGRATION.md)
- **LLM Review Guide**: [.github/LLM-REVIEW-GUIDE.md](../.github/LLM-REVIEW-GUIDE.md)
