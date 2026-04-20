# US13: LLM-Assisted Dev Spec Generation - Implementation Summary

## Overview

This document summarizes the LLM-assisted code documentation automation implemented for User Story 13. The system automatically generates and updates development specifications when pull requests are approved and merged.

## Deliverables

### 1. Prompts for Generating New Development Specifications

**File**: [`.github/DEV-SPEC-GENERATION-PROMPT.md`](.github/DEV-SPEC-GENERATION-PROMPT.md)

**Purpose**: Provides comprehensive instructions to an LLM for generating a new development specification from scratch based on a merged PR.

**Key Features**:
- Two format options (Comprehensive vs. Delta) with automatic selection logic
- Detailed section-by-section structure with examples
- Mermaid diagram templates (architecture, information flow, class diagrams)
- Guidelines for quality, specificity, and accuracy
- Explicit mapping to acceptance criteria
- Decision tree for format selection
- Anti-patterns and quality checklist

**Input Format**:
```
USER_STORY_NUMBER: US{N}
USER_STORY_TEXT: [Full text from user-stories.md]
PR_NUMBER: {number}
PR_TITLE: {title}
PR_DESCRIPTION: {description}
PR_AUTHOR: {username}
PR_REVIEWERS: {usernames}
MERGE_DATE: {ISO date}
CHANGED_FILES: [list]
CODE_DIFF: [git diff]
```

**Output**: Complete Markdown dev spec following project conventions.

---

### 2. Prompts for Updating Existing Development Specifications

**File**: [`.github/DEV-SPEC-UPDATE-PROMPT.md`](.github/DEV-SPEC-UPDATE-PROMPT.md)

**Purpose**: Provides instructions for updating an existing dev spec when a PR modifies or extends a previously implemented user story.

**Key Features**:
- Preserves original structure and ownership
- Adds version history with PR tracking
- Four update strategies (Additive, Behavioral, Refactoring, Deprecation)
- Clear marking of what changed (inline annotations, version tables)
- Diagram update guidelines
- Migration and design evolution patterns
- Traceability with PR numbers and dates

**Input Format**:
```
USER_STORY_NUMBER: US{N}
EXISTING_DEV_SPEC: [Current content of u{N}/dev-spec.md]
USER_STORY_TEXT: [Current text, if changed]
ORIGINAL_PR_NUMBER: {original PR}
ORIGINAL_MERGE_DATE: {date}
UPDATE_PR_NUMBER: {new PR}
UPDATE_PR_TITLE: {title}
UPDATE_PR_DESCRIPTION: {description}
UPDATE_PR_AUTHOR: {username}
UPDATE_PR_REVIEWERS: {usernames}
UPDATE_MERGE_DATE: {date}
CHANGED_FILES: [list]
CODE_DIFF: [diff of changes only]
```

**Output**: Updated Markdown dev spec with version history and change tracking.

---

### 3. GitHub Actions Workflow

**File**: [`.github/workflows/generate-dev-spec.yml`](.github/workflows/generate-dev-spec.yml)

**Triggers**: When a pull request is merged to the `main` branch

**Key Steps**:
1. **Extract User Story Number** from PR title, labels, or branch name
2. **Detect Mode**: Check if dev spec exists (generate new vs. update)
3. **Gather Context**: PR diff, changed files, user story text
4. **Load Appropriate Prompt**: Generation or update template
5. **Call OpenAI API** (GPT-4o model) with structured prompt
6. **Save Dev Spec** to `u{N}/dev-spec.md`
7. **Create/Update GitHub Issue** tracking the documentation work
8. **Commit Changes** to main branch with descriptive message
9. **Upload Artifact** for backup and review

**Requirements**:
- `OPENAI_API_KEY` repository secret must be configured
- Workflow permissions: `contents: write`, `pull-requests: write`, `issues: write`

**Cost**: ~$0.05-$0.15 per dev spec generation using GPT-4o

**Duration**: 2-4 minutes per run

---

### 4. Documentation

**File**: [`.github/DEV-SPEC-AUTOMATION-GUIDE.md`](.github/DEV-SPEC-AUTOMATION-GUIDE.md)

**Contents**:
- How the automation works
- Setup requirements (API key, permissions)
- Usage guide for PR authors and reviewers
- Prompt customization instructions
- Troubleshooting common issues
- Cost and performance analysis
- Security considerations
- FAQ and examples

---

## Prompts Summary

### Prompt 1: Generate New Dev Spec

**Location**: `.github/DEV-SPEC-GENERATION-PROMPT.md`

**Content Summary**:
- **Context**: Expert technical writer for MatchPoint
- **Inputs**: US#, user story text, PR details, code diff, changed files
- **Output Format A (Comprehensive)**: 10 sections
  1. Ownership & Timeline
  2. Architecture Diagram (Mermaid)
  3. Information Flow Diagram (Mermaid)
  4. Class Diagram (Mermaid)
  5. Data Model (tables)
  6. API Endpoints (table + details)
  7. Frontend Components (descriptions)
  8. Testing Coverage (backend, frontend, human tests)
  9. Key Implementation Decisions
  10. Dependencies
- **Output Format B (Delta)**: 5 sections
  1. Data Model Delta (only changes)
  2. Endpoints (new + modifications)
  3. Frontend Surface (new methods, modified types)
  4. Tests (mapped to ACs)
  5. Human Test Checklist
- **Decision Tree**: Format A for new features >500 lines, Format B for extensions <300 lines
- **Guidelines**: 
  - Be specific with file names, types, endpoints
  - Explain "why" not just "what"
  - Match code reality exactly
  - Cover all acceptance criteria
  - Make diagrams useful, based on actual code
  - Document integration points
- **Quality Checklist**: 14 verification items

**Usage**: Call with structured input data when a PR merging new feature is detected.

---

### Prompt 2: Update Existing Dev Spec

**Location**: `.github/DEV-SPEC-UPDATE-PROMPT.md`

**Content Summary**:
- **Context**: Expert technical writer updating documentation
- **Inputs**: US#, existing dev spec, updated user story, PR details, code diff
- **Core Principle**: Preserve what hasn't changed, clearly mark what has
- **Update Pattern**:
  - Add "Updates" section at top with version table
  - Mark changes inline with "(Added PR #N)" or "(Deprecated PR #N)"
  - Update diagrams to reflect new state
  - Maintain traceability with PR numbers
- **Four Update Strategies**:
  1. **Additive**: Add new content, extend tables, note "(Added PR #N)"
  2. **Behavioral**: Show before/after comparison, mark superseded behavior
  3. **Refactoring**: Update implementation, note "API unchanged"
  4. **Deprecation**: Mark deprecated features with ~~strikethrough~~
- **Diagram Updates**: Add nodes, update relationships, keep focused
- **Design Evolution**: Document significant technical decision changes
- **Edge Cases**: User story changes, major refactors, hotfixes, multiple PRs
- **Quality Checklist**: 10 verification items

**Usage**: Call when updating an existing feature that already has a dev spec.

---

## Next Steps for You

### Immediate Actions Required

#### 1. Configure OpenAI API Key

You need to manually add the OpenAI API key to your repository:

1. Go to: https://github.com/afeies/match-point/settings/secrets/actions
2. Click "New repository secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (starts with `sk-...`)
5. Click "Add secret"

**Cost Note**: Using GPT-4o, expect ~$0.05-$0.15 per dev spec generation. Budget ~$3-$10/month for normal development pace.

#### 2. Verify Workflow Permissions

Check that GitHub Actions can write to your repository:

1. Go to: https://github.com/afeies/match-point/settings/actions
2. Under "Workflow permissions", ensure:
   - "Read and write permissions" is selected
   - "Allow GitHub Actions to create and approve pull requests" is checked (if you want bot commits)

#### 3. Test the Automation

**Option A: Create a Test PR**

```bash
# Create a test branch
git checkout -b test-dev-spec-automation

# Make a trivial change to a file
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Dev spec automation"
git push -u origin test-dev-spec-automation

# Open PR with title: "US13: Test dev spec generation"
# Merge the PR
# Wait 2-3 minutes
# Check:
# - Actions tab for workflow run
# - u13/dev-spec.md for generated file
# - Issues for auto-created issue
```

**Option B: Use an Existing PR**

If you have an existing merged PR for US13:
1. The workflow already ran (check Actions tab)
2. Look for commit "docs: Generate dev spec for US13"
3. Review `u13/dev-spec.md` if it was created

#### 4. Create GitHub Issues for Other User Stories

For each user story that already has a dev spec (U1, U2, U6, U11, etc.), you can manually create tracking issues:

```bash
# Example for US1
gh issue create \
  --title "[US1] Development Specification" \
  --body "Dev spec: u1/dev-spec.md\nOriginal PR: #11\nMerge date: March 25, 2026" \
  --label "documentation,US1"

# Repeat for US2, US6, US11, etc.
```

Or I can create these issues for you if you'd like.

---

### Manual Steps for Deliverables

To complete the US13 requirements, you need:

#### ✅ Prompts for Generating New Dev Specs
**Status**: COMPLETE  
**File**: `.github/DEV-SPEC-GENERATION-PROMPT.md`

#### ✅ Prompts for Updating Existing Dev Specs
**Status**: COMPLETE  
**File**: `.github/DEV-SPEC-UPDATE-PROMPT.md`

#### ⏳ For Each Story: URL to Approved PR
**What you need**:
- For each user story (US1, US2, US6, US11, US13, etc.), provide the URL to the PR that:
  - Contains the code implementation
  - Contains the dev spec (either in the original PR or in a follow-up commit)
  - Was reviewed and approved

**Example**:
- US13: https://github.com/afeies/match-point/pull/52 (the current PR you mentioned)
- US11: [You need to provide this]
- US1: [You need to provide this]

#### ⏳ For Each Story: URL to GitHub Issue
**What you need**:
- For each user story, provide the URL to the GitHub issue tracking the dev spec creation

**How to get these**:
1. Once you configure the API key and merge a PR, the workflow auto-creates issues
2. For existing user stories, you can manually create issues (see step 4 above)
3. Or run: `gh issue list --label documentation` to find existing issues

**Example**:
- US13: [Will be auto-created when you merge a PR with "US13" in title]
- US11: [Create manually or point to existing issue]

---

### Repository State After This Implementation

Once you commit these files, your repository will have:

```
.github/
  workflows/
    generate-dev-spec.yml          ← New: Automation workflow
    llm-code-review.yml             ← Existing: Code review
    test.yml                        ← Existing: CI tests
  DEV-SPEC-GENERATION-PROMPT.md    ← New: Prompt for new specs
  DEV-SPEC-UPDATE-PROMPT.md        ← New: Prompt for updates
  DEV-SPEC-AUTOMATION-GUIDE.md     ← New: User guide
  LLM-REVIEW-GUIDE.md               ← Existing: Code review guide
  LLM-REVIEW-PROMPT.md              ← Existing: Code review prompt

u13/
  dev-spec.md                       ← Will be generated automatically
  prompt.md                         ← Existing
  HumanTests.md                     ← Existing
  LLM-REVIEW-INTEGRATION.md         ← Existing
  CI-SETUP.md                       ← Existing
  IMPLEMENTATION_NOTES.md           ← Existing

[Similar structure for u1/, u2/, u6/, u11/, u12/...]
```

---

## Testing the Automation

### Test Case 1: Generate New Dev Spec (US13)

**Scenario**: Merge a PR implementing US13

**Steps**:
1. Ensure PR title includes "US13"
2. Merge the PR to main
3. Wait 2-3 minutes

**Expected Results**:
- ✅ Workflow runs successfully (check Actions tab)
- ✅ File created: `u13/dev-spec.md`
- ✅ Issue created: "[US13] Generate/Update Development Specification"
- ✅ Commit message: "docs: Generate dev spec for US13 from PR #{number}"
- ✅ Dev spec contains:
  - Ownership section with PR author
  - Architecture diagrams (Mermaid)
  - Data model tables
  - API endpoints
  - Frontend components
  - Test coverage
  - Proper Markdown formatting

**How to Verify**:
```bash
# Pull latest
git pull origin main

# Check dev spec exists
ls -la u13/dev-spec.md

# Review content
cat u13/dev-spec.md

# Check commit
git log --oneline -5 | grep "dev spec"

# Check issue
gh issue list --label US13
```

### Test Case 2: Update Existing Dev Spec

**Scenario**: Merge another PR that modifies US13

**Steps**:
1. Make changes to US13 code
2. Open PR with "US13" in title (e.g., "US13: Fix pagination")
3. Merge the PR

**Expected Results**:
- ✅ Workflow runs successfully
- ✅ File updated: `u13/dev-spec.md`
- ✅ Issue comment added to existing US13 issue
- ✅ Dev spec contains:
  - "Updates" section at top
  - Version history table
  - Changed sections marked
  - Original content preserved

### Test Case 3: PR Without US Number

**Scenario**: Merge a PR without "US#" in title/labels/branch

**Expected Results**:
- ⏭️ Workflow runs but skips generation
- ℹ️ Summary shows "Could not detect user story number from PR"
- ℹ️ No files created or modified

---

## Monitoring & Maintenance

### Check Workflow Status

```bash
# View recent workflow runs
gh run list --workflow=generate-dev-spec.yml

# View specific run details
gh run view <run-id>

# View workflow logs
gh run view <run-id> --log
```

### View Generated Dev Specs

```bash
# List all dev spec files
find . -name "dev-spec.md" -o -name "DEVSPEC.md"

# See recent changes to dev specs
git log --oneline --all -- '**/dev-spec.md'
```

### Review Issues

```bash
# List all dev spec tracking issues
gh issue list --label documentation

# View specific issue
gh issue view <issue-number>
```

---

## Cost Tracking

To monitor OpenAI API usage:

1. Go to: https://platform.openai.com/usage
2. Filter by date range
3. Look for API calls from the workflow

**Expected Usage**:
- Model: GPT-4o
- Input tokens: 5,000-15,000 per run (diff + context)
- Output tokens: 2,000-4,000 per run (dev spec)
- Cost per run: ~$0.10
- Monthly cost (30 PRs): ~$3

To reduce costs:
- Use GPT-4o-mini (90% cost savings)
- Edit `.github/workflows/generate-dev-spec.yml`
- Change `"model": "gpt-4o"` to `"model": "gpt-4o-mini"`

---

## Customization Options

### Change LLM Model

Edit `.github/workflows/generate-dev-spec.yml`:

```yaml
# Line ~280
"model": "gpt-4o-mini",  # Or "gpt-4o", "gpt-4-turbo", etc.
```

### Adjust Output Length

Edit `.github/workflows/generate-dev-spec.yml`:

```yaml
# Line ~285
"max_tokens": 6000,  # Increase for longer specs
```

### Modify Prompt Content

Edit `.github/DEV-SPEC-GENERATION-PROMPT.md` or `.github/DEV-SPEC-UPDATE-PROMPT.md`:
- Add new sections
- Change diagram requirements
- Adjust tone or style
- Add project-specific guidelines

### Change File Naming

Edit `.github/workflows/generate-dev-spec.yml`:

```yaml
# Line ~95
SPEC_FILE="$US_FOLDER/dev-spec.md"  # Or DEVSPEC.md, specification.md, etc.
```

---

## Frequently Asked Questions

**Q: Do I need to create issues manually?**  
A: No, the workflow auto-creates issues when it generates dev specs.

**Q: Can I edit the generated dev specs?**  
A: Yes! Create a follow-up PR with manual edits. The automation won't overwrite unless you merge another PR for the same US#.

**Q: What if the generated spec is inaccurate?**  
A: Review and edit it. If you see systematic issues, adjust the prompt templates.

**Q: Can I trigger the workflow manually?**  
A: Currently no, but you can add `workflow_dispatch` trigger to `.github/workflows/generate-dev-spec.yml`.

**Q: What if I forgot to include US# in my PR?**  
A: The workflow will skip generation. You can either manually create the dev spec or create a trivial follow-up PR with the US# in the title.

---

## Success Criteria

Your automation is working correctly when:

- ✅ Merging a PR with "US#" in title triggers the workflow
- ✅ Dev spec file is created/updated in `u#/dev-spec.md`
- ✅ GitHub issue tracks the documentation work
- ✅ Commit is pushed to main with descriptive message
- ✅ Dev spec contains accurate diagrams and documentation
- ✅ Workflow completes in 2-4 minutes
- ✅ No manual intervention required for standard cases

---

## Summary

You now have a fully automated LLM-assisted dev spec generation system! 

**To activate it**:
1. Add `OPENAI_API_KEY` secret to repository
2. Verify workflow permissions
3. Merge a PR with "US#" in the title
4. Wait ~3 minutes and review the generated `u#/dev-spec.md`

**The prompts are ready to use** and documented in:
- `.github/DEV-SPEC-GENERATION-PROMPT.md`
- `.github/DEV-SPEC-UPDATE-PROMPT.md`

Let me know if you need me to create the GitHub issues for existing user stories, or if you have any questions!

---

**Implementation Date**: April 18, 2026  
**Automation Status**: Ready to deploy  
**Next Action**: Configure OpenAI API key and test
