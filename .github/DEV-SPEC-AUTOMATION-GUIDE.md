# LLM-Assisted Dev Spec Generation - User Guide

## Overview

This repository includes automated LLM-assisted documentation that generates and updates development specifications (dev-specs) when pull requests implementing user stories are merged to the main branch.

**Purpose**: Ensure every user story has an up-to-date development specification documenting the implementation, architecture, and testing approach — without manual documentation overhead.

## How It Works

### Trigger
When a PR is **merged** to the `main` branch, the `generate-dev-spec.yml` workflow automatically:

1. Detects which user story (US#) the PR implements
2. Extracts the code changes, PR details, and user story text
3. Calls an LLM (OpenAI GPT-4o) with structured prompts
4. Generates or updates the dev spec in `u{N}/dev-spec.md`
5. Commits the dev spec to the repository
6. Creates/updates a GitHub issue tracking the documentation

### User Story Detection

The workflow extracts the user story number from:
1. **PR Title** (e.g., "US13: Add match history" or "[US13] Match history")
2. **PR Labels** (e.g., label: "US13" or "US-13")
3. **Branch Name** (e.g., branch: "u13-match-history" or "us13-implementation")

**Recommendation**: Include the US number in your PR title for reliable detection.

### Generation vs. Update

The workflow automatically determines whether to generate a new dev spec or update an existing one:

- **New dev spec**: If `u{N}/dev-spec.md` doesn't exist
- **Update existing**: If the dev spec file already exists

Each mode uses a different prompt optimized for that task.

## Dev Spec Formats

The generated dev specs follow two formats depending on the type of change:

### Format A: Comprehensive Specification
Used for **new foundational features** (like US1, US2, US6):
- Architecture diagrams (Mermaid)
- Information flow diagrams
- Class diagrams showing all types
- Complete endpoint documentation
- Full component breakdown
- Comprehensive test coverage

### Format B: Delta Specification
Used for **incremental features** (like US11, US13):
- Data model deltas (only new/changed fields)
- New endpoints and modifications to existing ones
- Frontend surface changes
- Test coverage for new acceptance criteria
- Changes relative to existing codebase

The LLM automatically selects the appropriate format based on:
- Number of files changed
- Whether new major components/pages are introduced
- Size and scope of the diff

## Workflow Steps

Here's what happens when you merge a PR:

1. **PR Merged** → Workflow triggers
2. **Extract US#** → From title, labels, or branch
3. **Gather Context**:
   - PR diff
   - Changed files
   - User story text from `user-stories.md`
   - Existing dev spec (if updating)
4. **Build Prompt** → Using templates from `.github/DEV-SPEC-*-PROMPT.md`
5. **Call LLM** → OpenAI GPT-4o generates the dev spec
6. **Save File** → Writes to `u{N}/dev-spec.md`
7. **Create Issue** → Tracks the documentation work
8. **Commit & Push** → Commits dev spec to main

## Setup Requirements

### 1. OpenAI API Key

The workflow requires an OpenAI API key configured as a repository secret:

```bash
# In GitHub repository settings > Secrets and variables > Actions
# Add a secret named: OPENAI_API_KEY
# Value: your OpenAI API key (starts with sk-)
```

**Cost**: Using GPT-4o, each dev spec generation costs approximately $0.05-$0.15 depending on diff size.

### 2. Workflow Permissions

The workflow needs these permissions (configured in the workflow file):
- `contents: write` — To commit dev specs
- `pull-requests: write` — To read PR data
- `issues: write` — To create tracking issues

Ensure "Workflow permissions" in Settings > Actions > General allows workflows to write to the repository.

### 3. Branch Protection

If you have branch protection on `main`, you may need to:
- Allow the GitHub Actions bot to bypass branch protection for doc commits, OR
- Configure the workflow to create a bot PR instead of direct commits

## Using the Automation

### For PR Authors

**Ensure your PR is detected**:
1. Include the US number in your PR **title**, e.g.:
   - ✅ "US13: Add player match history"
   - ✅ "[US11] Implement check-in system"
   - ✅ "Implement US6 player profiles"

2. OR add a label like `US13` to your PR

3. Merge your PR to `main`

4. Wait ~2-3 minutes for the workflow to complete

5. **Check the results**:
   - **Actions Tab**: See workflow run and logs
   - **Commits**: Look for "docs: Generate dev spec for US{N}" commit
   - **Issues**: Find the auto-created issue tracking the doc generation
   - **Files**: Review `u{N}/dev-spec.md`

### For Reviewers

When reviewing a PR:
- The **dev spec is generated AFTER merge**, not before
- Focus your review on the code quality, tests, and acceptance criteria
- The dev spec will be auto-generated once approved and merged
- You can review/edit the generated dev spec in a follow-up PR if needed

### For Documentation Updates

If the generated dev spec needs manual edits:
1. Wait for auto-generation to complete
2. Create a new PR editing `u{N}/dev-spec.md`
3. Add human context, clarifications, or corrections
4. Merge the documentation PR

The automation will NOT overwrite manual edits unless the same US# PR is merged again (in which case it updates the spec).

## Prompt Customization

The prompts used for generation are stored in:
- `.github/DEV-SPEC-GENERATION-PROMPT.md` — For new dev specs
- `.github/DEV-SPEC-UPDATE-PROMPT.md` — For updating existing specs

To customize the output:
1. Edit the relevant prompt file
2. Modify the structure, guidelines, or examples
3. Commit the changes
4. Future runs will use the updated prompt

**Tip**: The prompts themselves are comprehensive templates. Read them to understand what guidance the LLM receives.

## Troubleshooting

### Issue: Workflow didn't trigger
**Solution**: Check PR title/labels/branch name includes US# pattern. If missing, manually create the dev spec.

### Issue: "Could not detect user story number"
**Solution**: The workflow couldn't find a US# in title, labels, or branch. Add it and re-merge or manually create.

### Issue: "OPENAI_API_KEY secret not configured"
**Solution**: Add the `OPENAI_API_KEY` secret in repository settings.

### Issue: Dev spec is inaccurate or incomplete
**Solution**: 
1. Review the workflow logs in Actions tab
2. Check if the diff was truncated (very large PRs)
3. Manually edit the dev spec in a follow-up PR
4. Consider adjusting the prompts for better guidance

### Issue: Workflow failed to push
**Solution**: 
1. Check workflow permissions in Settings > Actions
2. If branch protection is enabled, adjust protection rules or workflow approach
3. Download the dev spec from workflow artifacts and commit manually

### Issue: Generated diagrams don't render
**Solution**: 
1. Check Mermaid syntax in the dev spec
2. Test diagrams at https://mermaid.live
3. Fix syntax errors in a follow-up PR

## Workflow Outputs

### 1. Committed Dev Spec
**Location**: `u{N}/dev-spec.md` or `u{N}/DEVSPEC.md`  
**Content**: Full Markdown specification with diagrams, data models, endpoints, tests

### 2. GitHub Issue
**Title**: `[US{N}] Generate/Update Development Specification`  
**Purpose**: Track the documentation work  
**Links**: Connected to the PR that triggered generation

### 3. Workflow Summary
**Location**: Actions tab > Workflow run > Summary  
**Content**:
- Detected US number
- Diff size
- Whether spec was created or updated
- Preview of first 30 lines of generated spec

### 4. Artifact
**Name**: `generated-dev-spec-US{N}`  
**Purpose**: Backup of the generated file (persists even if commit fails)  
**Retention**: 90 days

## Example Usage

### Scenario 1: Implementing US13 (New Feature)

```bash
# 1. Create feature branch
git checkout -b u13-match-history

# 2. Implement feature following user story
... code changes ...

# 3. Open PR with clear title
Title: "US13: Add player match history tracking"

# 4. Get review and approval
... human review ...

# 5. Merge to main
... merge PR #52 ...

# 6. Automation runs (2-3 min)
# - Detects US13
# - Extracts diff and PR details
# - Calls LLM to generate dev spec
# - Creates u13/dev-spec.md
# - Creates issue #53
# - Commits to main

# 7. Review generated spec
git pull origin main
cat u13/dev-spec.md

# 8. (Optional) Edit and refine in follow-up PR
git checkout -b doc-u13-refinements
... edit u13/dev-spec.md ...
... open PR, review, merge ...
```

### Scenario 2: Updating US11 (Existing Feature)

```bash
# 1. Create update branch
git checkout -b u11-add-undo-checkin

# 2. Modify existing US11 code
... code changes ...

# 3. Open PR
Title: "US11: Add undo check-in button"

# 4. Merge to main
... merge PR #67 ...

# 5. Automation runs
# - Detects US11
# - Loads existing u11/dev-spec.md
# - Updates it with new changes
# - Adds "Updates" section at top
# - Updates relevant diagrams/sections
# - Commits updated spec

# 6. Review updated spec
git pull origin main
git diff HEAD~1 u11/dev-spec.md  # See what changed
```

## Integration with Existing Workflows

### Works With:
- ✅ LLM Code Review workflow (`.github/workflows/llm-code-review.yml`)
- ✅ CI Tests workflow (`.github/workflows/test.yml`)
- ✅ PR template review checklist
- ✅ Human test checklists (`u{N}/HumanTests.md`)

### Complements:
- **Code Review**: This generates *documentation* after merge; code review happens *before* merge
- **CI Tests**: This documents *what* was tested; CI verifies tests pass
- **Human Tests**: This documents *how* to manually test; HumanTests are the checklist

## Cost & Performance

### API Costs (OpenAI GPT-4o)
- **Input tokens**: ~5,000-15,000 tokens (diff + context)
- **Output tokens**: ~2,000-4,000 tokens (dev spec)
- **Cost per run**: $0.05-$0.15
- **Monthly estimate**: ~$3-$10 for 30-60 PRs

**Budget Tip**: Use GPT-4o-mini for 90% cost savings if quality is acceptable.

### Execution Time
- **Workflow duration**: 2-4 minutes
- **LLM call**: 30-90 seconds
- **Commit push**: 5-10 seconds

### Rate Limits
- OpenAI API: 500 RPM for most tiers
- GitHub Actions: 2,000 minutes/month (free tier)

No rate limit issues expected for normal development pace.

## Security Considerations

### API Key Protection
- Never commit the OpenAI API key to the repository
- Store only in GitHub Secrets (encrypted)
- Rotate key if exposed

### Generated Content
- LLM output should be reviewed, not blindly trusted
- Verify technical accuracy in generated specs
- Check that diagrams accurately reflect code
- Validate endpoint documentation matches implementation

### Access Control
- Only merged PRs trigger generation (not drafts or unmerged PRs)
- Only users with merge permissions can trigger workflow
- Dev specs are committed by GitHub Actions bot, visible in git history

## Maintenance

### Updating Prompts
Edit `.github/DEV-SPEC-*-PROMPT.md` files to:
- Add new sections to dev spec format
- Change diagram styles or requirements
- Adjust tone or level of detail
- Fix systematic errors in generated output

Changes take effect immediately for new runs.

### Updating Workflow
Edit `.github/workflows/generate-dev-spec.yml` to:
- Change LLM model (GPT-4o → GPT-4o-mini, etc.)
- Adjust token limits or temperature
- Modify user story detection logic
- Change commit message format

Test changes in a fork or feature branch first.

### Disabling Automation
To temporarily disable:
1. Go to Settings > Actions
2. Find "Generate Dev Spec" workflow
3. Click "Disable workflow"

To permanently remove:
```bash
git rm .github/workflows/generate-dev-spec.yml
git commit -m "Remove dev spec automation"
```

## FAQ

**Q: Can I manually trigger the workflow?**  
A: Currently, it only triggers on PR merge. You can add `workflow_dispatch` to enable manual runs.

**Q: What if my PR implements multiple user stories?**  
A: The workflow extracts the first US# found. Split into separate PRs or manually create dev specs.

**Q: Can I edit the generated dev spec?**  
A: Yes! Create a follow-up PR with edits. The automation won't overwrite unless a new PR for the same US# is merged.

**Q: Does this replace human documentation?**  
A: No. It generates a structured first draft. Human review and refinement are still valuable.

**Q: What if the LLM gets it wrong?**  
A: Review and edit the generated spec. If systematic errors occur, adjust the prompt templates.

**Q: Can we use a different LLM provider?**  
A: Yes, but requires modifying the workflow to call a different API (Azure OpenAI, Anthropic, etc.).

## Related Documentation

- **Prompt Templates**:
  - [DEV-SPEC-GENERATION-PROMPT.md](.github/DEV-SPEC-GENERATION-PROMPT.md)
  - [DEV-SPEC-UPDATE-PROMPT.md](.github/DEV-SPEC-UPDATE-PROMPT.md)
- **Workflow**: [generate-dev-spec.yml](.github/workflows/generate-dev-spec.yml)
- **User Stories**: [user-stories.md](../user-stories.md)
- **LLM Code Review**: [LLM-REVIEW-GUIDE.md](.github/LLM-REVIEW-GUIDE.md)

## Support & Feedback

**Issues**: Check the GitHub issue created for each dev spec generation  
**Logs**: Review workflow logs in the Actions tab  
**Questions**: Open a discussion or contact the team

---

**Last Updated**: April 2026  
**Maintainer**: Match Point Dev Team
