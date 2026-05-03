# MatchPoint Automation Architecture Summary

## Overview

This document describes the comprehensive automation infrastructure for the MatchPoint tournament management system, with extensive automation implemented for User Stories 11-13 (U11-U13). The system includes automated testing, AI-powered code review, and automated documentation generation.

---

## 1. Automation Pipeline Architecture

### Visual Pipeline Flow

```
Developer Workflow (U11-U13)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────┐
│ Developer       │
│ Creates Branch  │
│ (e.g., u13-*)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Implements      │
│ Feature + Tests │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: PULL REQUEST OPENED                                               │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────────────────┐
         │                                                              │
         ▼                                                              ▼
┌────────────────────┐                                    ┌────────────────────┐
│ GitHub Action:     │                                    │ GitHub Action:     │
│ CI Tests           │                                    │ LLM Code Review    │
│ (test.yml)         │                                    │ (llm-code-review)  │
└────────┬───────────┘                                    └────────┬───────────┘
         │                                                         │
         │ • Checkout code                                         │ • Checkout code
         │ • Setup Node.js 20                                      │ • Get PR diff
         │ • Install deps (root + frontend)                        │ • Load prompt
         │ • Run backend tests (npm test)                          │ • Call OpenAI
         │   - src/history.test.ts (U13)                           │   GPT-4o-mini
         │   - src/checkin.test.ts (U11)                           │ • Generate review
         │   - src/notifications.test.ts (U12)                     │
         │ • Run frontend tests                                    │
         │   (npm test --prefix frontend)                          │
         │                                                         │
         ▼                                                         ▼
┌────────────────────┐                                    ┌────────────────────┐
│ ✅ Tests Pass      │                                    │ 🤖 Bot Posts      │
│ or                 │                                    │ Review Comment     │
│ ❌ Tests Fail      │                                    │ to PR              │
│                    │                                    │                    │
│ • Status check on  │                                    │ Includes:          │
│   PR               │                                    │ • Strengths ✅     │
│ • Blocks merge if  │                                    │ • Concerns ⚠️      │
│   fails            │                                    │ • Questions 🔍     │
└────────┬───────────┘                                    │                    │
         │                                                │ Auto-updates on    │
         │                                                │ new commits        │
         │                                                └──────────┬─────────┘
         │                                                           │
         └───────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Developer Reviews      │
                    │ Feedback:              │
                    │ • Fixes test failures  │
                    │ • Addresses AI concerns│
                    │ • Pushes new commits   │
                    └────────────┬───────────┘
                                 │
                                 │ (Loop: Tests & Review re-run on each push)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Request Human Review   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Human Reviewer         │
                    │ • Reads AI review      │
                    │ • Verifies logic       │
                    │ • Approves PR          │
                    └────────────┬───────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: PULL REQUEST MERGED TO MAIN                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │ GitHub Action:             │
                    │ Generate Dev Spec          │
                    │ (generate-dev-spec.yml)    │
                    └────────────┬───────────────┘
                                 │
                                 │ • Extract US# from PR title/label/branch
                                 │ • Check if dev-spec.md exists
                                 │ • Get PR diff + changed files
                                 │ • Extract user story text
                                 │ • Load appropriate prompt template:
                                 │   - DEV-SPEC-GENERATION-PROMPT.md (new)
                                 │   - DEV-SPEC-UPDATE-PROMPT.md (update)
                                 │ • Call OpenAI GPT-4o with context
                                 │ • Generate/update dev spec
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │ Commit to Main:            │
                    │ • u{N}/dev-spec.md created │
                    │   or updated               │
                    │ • Commit message:          │
                    │   "Generate dev spec for   │
                    │    US{N} from PR #{X}"     │
                    │ • Create/update GitHub     │
                    │   issue tracking doc work  │
                    └────────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │ ✅ Automation Complete     │
                    │                            │
                    │ Artifacts:                 │
                    │ • Code in main branch      │
                    │ • Tests passing            │
                    │ • AI review in PR history  │
                    │ • Dev spec documented      │
                    └────────────────────────────┘
```

### Bullet-Level Pipeline Summary

#### **Trigger 1: Developer Opens/Updates PR**
1. **CI Tests Workflow** (`test.yml`)
   - Trigger: Push to main OR Pull request to main
   - Runs: Backend tests (vitest) + Frontend tests (vitest)
   - Output: ✅/❌ Status check on PR (blocks merge if fails)
   
2. **LLM Code Review Workflow** (`llm-code-review.yml`)
   - Trigger: PR opened, synchronized, or reopened
   - Steps:
     a. Extract PR diff (limited to 10KB)
     b. Send to OpenAI GPT-4o-mini with structured prompt
     c. Generate review (Quality, Testing, Security, Maintainability, Docs)
     d. Post as bot comment "🤖 AI Code Review Summary"
     e. Auto-update comment on new commits
   - Output: Advisory review comment (doesn't block merge)
   
3. **Developer Response**
   - Reads AI feedback
   - Fixes test failures
   - Addresses concerns
   - Pushes fixes (triggers re-run of tests + review update)
   - Requests human review when ready
   
4. **Human Review**
   - Reviews AI feedback first
   - Verifies business logic and design
   - Approves or requests changes
   - Makes final merge decision

#### **Trigger 2: PR Merged to Main**
5. **Dev Spec Generation Workflow** (`generate-dev-spec.yml`)
   - Trigger: PR closed AND merged to main
   - Steps:
     a. Extract US# from PR title/labels/branch (e.g., "US13", "u13-*")
     b. Detect mode: new spec vs. update (check if `u{N}/dev-spec.md` exists)
     c. Gather context:
        - PR diff (up to 50KB)
        - Changed files list
        - User story text from `user-stories.md`
        - Existing dev spec (if updating)
     d. Load prompt template:
        - `.github/DEV-SPEC-GENERATION-PROMPT.md` (new)
        - `.github/DEV-SPEC-UPDATE-PROMPT.md` (update)
     e. Call OpenAI GPT-4o with full context
     f. Generate complete dev spec (Markdown)
     g. Save to `u{N}/dev-spec.md`
     h. Create/update GitHub issue
     i. Commit to main with message: "Generate dev spec for US{N} from PR #{X}"
     j. Upload artifact for review
   - Output: Committed dev spec in `u{N}/dev-spec.md`

---

## 2. Automation Components Breakdown

### A. GitHub Actions Workflows

| Workflow | File | Trigger | Purpose | Cost |
|----------|------|---------|---------|------|
| **CI Tests** | `.github/workflows/test.yml` | Push/PR to main | Run automated tests | Free (GitHub) |
| **LLM Code Review** | `.github/workflows/llm-code-review.yml` | PR open/update/reopen | AI-powered code review | ~$0.001/review |
| **Dev Spec Generation** | `.github/workflows/generate-dev-spec.yml` | PR merged to main | Auto-generate documentation | ~$0.05-0.15/spec |

### B. Test Coverage (U11-U13)

| User Story | Test File | Test Count | What's Tested |
|------------|-----------|------------|---------------|
| **US11** (Check-in) | `src/checkin.test.ts` | 6+ | Check-in endpoints, organizer auth, check-in state, bracket filtering |
| **US12** (Notifications) | `src/notifications.test.ts` | 8+ | Match-call notifications, enqueue on ready, auth, ack, idempotency |
| **US13** (Match History) | `src/history.test.ts` | 8+ | History endpoint, pagination, filtering, stats aggregation, error cases |

All tests run automatically on every push/PR via the CI Tests workflow.

### C. LLM Prompts & Templates

| File | Purpose | Used By |
|------|---------|---------|
| `.github/LLM-REVIEW-PROMPT.md` | Code review prompt template | `llm-code-review.yml` |
| `.github/DEV-SPEC-GENERATION-PROMPT.md` | Prompt for creating new dev specs | `generate-dev-spec.yml` |
| `.github/DEV-SPEC-UPDATE-PROMPT.md` | Prompt for updating existing dev specs | `generate-dev-spec.yml` |

### D. Documentation & Guides

| File | Purpose |
|------|---------|
| `.github/QUICK-SETUP.md` | 5-minute setup guide for new developers |
| `.github/LLM-REVIEW-GUIDE.md` | Comprehensive guide to AI review system |
| `.github/DEV-SPEC-AUTOMATION-GUIDE.md` | Guide to dev spec automation |
| `.github/README.md` | Overview of all workflows and automation |
| `u11/HumanTests.md` | Manual test checklist for U11 |
| `u12/HumanTests.md` | Manual test checklist for U12 |
| `u13/CI-SETUP.md` | CI/testing setup for U13 |
| `u13/LLM-REVIEW-INTEGRATION.md` | How LLM review was integrated for U13 |
| `u13/AUTOMATION-SUMMARY.md` | U13-specific automation summary |

---

## 3. Setup Instructions for New Developers

### Prerequisites
- GitHub account with write access to the repository
- OpenAI API account (for LLM-powered features)
- Git, Node.js 20+, npm

### Step-by-Step Setup

#### 1️⃣ **Clone Repository and Install Dependencies**
```bash
# Clone the repo
git clone https://github.com/afeies/match-point.git
cd match-point

# Install backend dependencies
npm ci

# Install frontend dependencies
npm ci --prefix frontend
```

#### 2️⃣ **Run Tests Locally (Optional but Recommended)**
```bash
# Run backend tests
npm test

# Run frontend tests
npm test --prefix frontend

# Run specific test suites
npm test src/history.test.ts      # U13 tests
npm test src/checkin.test.ts      # U11 tests
npm test src/notifications.test.ts # U12 tests
```

This verifies your local environment matches CI.

#### 3️⃣ **Configure GitHub Secrets (Repository Admin Only)**

**Required Secret: OPENAI_API_KEY**

If you're a repository admin setting up the automation:

1. **Get OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Sign in (create account if needed)
   - Click "Create new secret key"
   - Name it: `github-matchpoint-reviews`
   - Copy the key (starts with `sk-proj-...` or `sk-...`)
   - Add credits: https://platform.openai.com/settings/organization/billing
     - Minimum: $5 (lasts for thousands of reviews)
     - Expected cost: ~$0.001 per review, ~$0.10 per dev spec

2. **Add Secret to GitHub**:
   - Go to repository: https://github.com/afeies/match-point
   - Click **Settings** (requires admin access)
   - Sidebar → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `OPENAI_API_KEY`
   - Secret: Paste the OpenAI key
   - Click **Add secret**

3. **Verify Workflow Permissions**:
   - Go to **Settings** → **Actions** → **General**
   - Under "Workflow permissions", ensure:
     - ✅ "Read and write permissions" is selected
     - ✅ "Allow GitHub Actions to create and approve pull requests" is checked
   - Click **Save**

#### 4️⃣ **Test the Automation (First-Time Verification)**

**Test CI Tests Workflow:**
```bash
# Create a test branch
git checkout -b test-ci-workflows
echo "# Testing CI" >> README.md
git add README.md
git commit -m "Test: Verify CI workflows"
git push -u origin test-ci-workflows

# Open PR on GitHub
# Expected: CI Tests workflow runs and passes ✅
```

**Test LLM Code Review:**
1. After opening the PR above, wait ~60 seconds
2. Check PR comments for: "🤖 AI Code Review Summary"
3. If bot comment appears → Success! ✅
4. If not → Check Actions tab for errors

**Test Dev Spec Generation:**
1. Create a branch for a user story (e.g., `u14-test-feature`)
2. Make a small change, commit, push, open PR with title: "US14: Test feature"
3. Get PR approved and merge
4. Check if `u14/dev-spec.md` was created after merge
5. Clean up: delete the test dev spec if not needed

**Troubleshooting:**
- **No bot comment?** → Check Actions tab → LLM Code Review → View logs
  - Error "OPENAI_API_KEY secret not configured" → Repeat Step 3
  - Other errors → Check OpenAI account has credits
- **Tests failing locally?** → Check Node.js version (needs 20+)
- **Dev spec not generated?** → Check PR title includes "US#" or branch name includes "u#"

#### 5️⃣ **Understand the Developer Workflow**

When working on a user story (e.g., US15):

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b u15-my-feature

# 2. Implement feature
# - Write code
# - Write tests in src/*.test.ts or frontend/tests/*.test.tsx
# - Test locally: npm test

# 3. Commit and push
git add .
git commit -m "Implement US15: My feature description"
git push -u origin u15-my-feature

# 4. Open PR on GitHub
# - Title: "US15: My feature" (include US# for auto-detection)
# - Description: Describe changes, link to acceptance criteria
# - Wait ~60 seconds for AI review comment

# 5. Address feedback
# - Read AI review bot comment
# - Fix any test failures (shown in PR checks)
# - Address concerns in AI review
# - Push fixes (triggers re-run of tests + review update)

# 6. Request human review
# - Tag a reviewer or wait for assignment
# - Respond to human feedback

# 7. Merge
# - After approval, click "Squash and merge" or "Merge"
# - Dev spec will be auto-generated within ~2 minutes
# - Check u15/dev-spec.md was committed to main
```

#### 6️⃣ **Daily Usage Tips**

**For PR Authors:**
- ✅ Include US# in PR title or branch name for dev spec auto-detection
- ✅ Write tests before opening PR (CI will run them automatically)
- ✅ Read AI review comments (usually posted within 60 seconds)
- ✅ Address "⚠️ Concerns & Suggestions" before requesting human review
- ✅ Use human reviewer time for design/logic, not nitpicks

**For PR Reviewers:**
- ✅ Read AI review first to get quick orientation
- ✅ Verify AI-flagged issues are legitimate
- ✅ Focus on: business logic, architecture, acceptance criteria coverage
- ✅ Check "🔍 Questions for Human Reviewers" section
- ✅ Don't rubber-stamp — AI is advisory only

**For Debugging CI Failures:**
- Check **Actions** tab → Click failed workflow → View logs
- Common issues:
  - Test failures: Run `npm test` locally to debug
  - Linting errors: Check error output in logs
  - API key issues: Verify secret is configured correctly

#### 7️⃣ **Cost Management**

**Current Usage (Based on Semester Load):**
| Scenario | Reviews/Month | Dev Specs/Month | Total Cost/Month |
|----------|---------------|-----------------|------------------|
| Low (5 PRs) | 10 | 5 | ~$0.30 |
| Medium (20 PRs) | 40 | 10 | ~$1.00 |
| High (50 PRs) | 100 | 20 | ~$3.00 |

**To monitor costs:**
- OpenAI Dashboard: https://platform.openai.com/usage
- Set up billing alerts in OpenAI settings

**To reduce costs:**
- Option 1: Use GPT-4o-mini for both (current setup for reviews)
- Option 2: Disable dev spec generation (remove workflow file)
- Option 3: Only run on specific branches/labels

#### 8️⃣ **Customization Options**

**Adjust AI Review Prompt:**
- Edit `.github/workflows/llm-code-review.yml`
- Find the "Load review prompt template" step
- Modify the prompt text to emphasize different aspects

**Change LLM Model:**
- In `llm-code-review.yml` or `generate-dev-spec.yml`
- Change `"model": "gpt-4o-mini"` to `"model": "gpt-4o"` (better quality, higher cost)

**Disable Specific Workflows:**
- Rename workflow file to `.yml.disabled`
- Or add to top of workflow:
  ```yaml
  on:
    workflow_dispatch:  # Only run manually
  ```

---

## 4. Key Automation Artifacts

### Generated by Automation

| Artifact | Location | Generated By | When |
|----------|----------|--------------|------|
| Dev Specs | `u{N}/dev-spec.md` | `generate-dev-spec.yml` | PR merge |
| AI Review Comments | PR comments | `llm-code-review.yml` | PR open/update |
| Test Results | Actions logs | `test.yml` | Push/PR |
| GitHub Issues | Issues tab | `generate-dev-spec.yml` | PR merge (tracking) |

### Human-Maintained

| File | Purpose | Updated By |
|------|---------|------------|
| `user-stories.md` | User story definitions | Product owner |
| `src/*.test.ts` | Backend tests | Developers |
| `frontend/tests/*.test.tsx` | Frontend tests | Developers |
| `u{N}/HumanTests.md` | Manual test checklists | Developers |
| `.github/*-PROMPT.md` | LLM prompt templates | Automation maintainer |

---

## 5. Repeatability & Auditability

All automation in this project is **fully repeatable** and **auditable**:

### Repeatability
✅ **All workflows are versioned in Git**
- `.github/workflows/*.yml` files define exact steps
- Prompts in `.github/*-PROMPT.md` are versioned
- Anyone can inspect, fork, or reproduce

✅ **Deterministic inputs**
- Same PR diff → similar review (temperature 0.2-0.3)
- LLM outputs include model version and timestamp

✅ **Local testing possible**
- All tests can run locally: `npm test`
- Workflows can be replicated manually (see workflow YAML)

### Auditability
✅ **Full history in GitHub**
- Actions tab: All workflow runs with logs
- PR comments: AI review history preserved
- Commits: Dev spec generation commits tracked

✅ **Human oversight required**
- AI reviews are advisory only (don't block merges)
- Human approval required for all PRs
- Dev specs can be manually edited post-generation

✅ **Visible outputs**
- Test results: PR status checks
- AI reviews: Public PR comments
- Dev specs: Committed to repo (visible in diffs)

---

## 6. Summary & Key Benefits

### What's Automated
1. ✅ **Code Testing** — Every push/PR runs full test suite
2. ✅ **Code Review** — AI provides instant feedback on quality, security, testing
3. ✅ **Documentation** — Dev specs auto-generated on PR merge

### What's Not Automated (Requires Human Judgment)
1. ❌ **Final approval** — Humans must approve PRs
2. ❌ **Business logic verification** — Humans verify acceptance criteria
3. ❌ **Architecture decisions** — Humans review design choices

### Benefits
- **Speed**: Instant feedback (AI review in 60s, tests in 2-3 mins)
- **Consistency**: Same standards applied to all PRs
- **Quality**: Catches common issues before human review
- **Documentation**: Always up-to-date dev specs
- **Learning**: Developers learn from AI feedback
- **Efficiency**: Human reviewers focus on high-value tasks

### Limitations
- **Cost**: Requires OpenAI API credits (~$1-3/month for typical usage)
- **Setup**: Initial configuration needed (API keys, permissions)
- **Accuracy**: AI can miss context-specific issues
- **Dependency**: Relies on third-party service (OpenAI)

---

## 7. References

**Workflow Files:**
- `.github/workflows/test.yml` — CI test automation
- `.github/workflows/llm-code-review.yml` — AI code review
- `.github/workflows/generate-dev-spec.yml` — Dev spec generation

**Documentation:**
- `.github/QUICK-SETUP.md` — 5-minute setup guide
- `.github/LLM-REVIEW-GUIDE.md` — AI review comprehensive guide
- `.github/DEV-SPEC-AUTOMATION-GUIDE.md` — Dev spec automation guide
- `u13/AUTOMATION-SUMMARY.md` — U13-specific automation details

**Prompt Templates:**
- `.github/LLM-REVIEW-PROMPT.md` — Code review prompt
- `.github/DEV-SPEC-GENERATION-PROMPT.md` — New dev spec prompt
- `.github/DEV-SPEC-UPDATE-PROMPT.md` — Update dev spec prompt

**Test Files (U11-U13):**
- `src/checkin.test.ts` — U11 automated tests
- `src/notifications.test.ts` — U12 automated tests
- `src/history.test.ts` — U13 automated tests

---

**Last Updated:** April 20, 2026  
**Automation Scope:** User Stories 11-13 (with CI/CD for entire project)  
**LLM Models:** OpenAI GPT-4o (dev specs), GPT-4o-mini (code review)
