# LLM-Assisted Code Review System

## Overview

This repository uses an automated LLM-powered code review system that runs on every pull request. The system provides structured, AI-generated feedback to complement human code review.

**Key Point**: This is an **assistive tool**, not a replacement for human review. All PRs still require human approval before merging.

## How It Works

### Automated Workflow

1. **Trigger**: Runs automatically when a PR is opened, updated, or reopened
2. **Analysis**: Extracts the PR diff and sends it to OpenAI's API with a structured prompt
3. **Review Generation**: GPT-4o-mini analyzes the code and generates a review
4. **Posting**: Review appears as a bot comment on the PR within ~30-60 seconds
5. **Updates**: If the PR is updated, the review comment is automatically refreshed

### What the AI Reviewer Checks

- ✅ **Code Quality**: TypeScript patterns, potential bugs, error handling
- ✅ **Testing**: Coverage, edge cases, test quality
- ✅ **Security**: Vulnerabilities, input validation, auth checks  
- ✅ **Maintainability**: Readability, naming, complexity
- ✅ **Documentation**: Comments, API docs, PR descriptions

See [.github/LLM-REVIEW-PROMPT.md](.github/LLM-REVIEW-PROMPT.md) for the full prompt template.

## Setup

### Prerequisites

1. **GitHub Repository**: With Actions enabled
2. **OpenAI API Key**: With credits/quota available

### Configuration

1. **Add OpenAI API Key**:
   - Go to repository Settings → Secrets and variables → Actions
   - Create a new repository secret: `OPENAI_API_KEY`
   - Paste your OpenAI API key (starts with `sk-...`)
   
   > ⚠️ Without this secret, the workflow will run but post a "API key not configured" message

2. **Workflow Files**:
   - `.github/workflows/llm-code-review.yml` - Main workflow (already configured)
   - `.github/LLM-REVIEW-PROMPT.md` - Prompt documentation (for customization)

3. **Permissions**:
   The workflow needs `pull-requests: write` permission (already configured)

## Using the AI Reviews

### For PR Authors

1. **Open your PR** as usual
2. **Wait ~30-60 seconds** for the bot comment to appear
3. **Read the AI feedback**:
   - ✅ **Strengths**: What the code does well
   - ⚠️ **Concerns**: Issues to address before merging
   - 🔍 **Questions**: Items for human reviewers to consider
4. **Address concerns** by pushing new commits (review auto-updates)
5. **Request human review** once AI concerns are addressed

### For PR Reviewers

1. **Read the AI review first** to get an overview
2. **Use it as a checklist**:
   - Verify AI-flagged concerns
   - Focus human attention on areas AI identified
   - Evaluate AI suggestions (they're not always correct!)
3. **Focus human review** on:
   - Business logic correctness
   - Architecture and design decisions
   - Domain-specific requirements
   - AI-identified "Questions for Human Reviewers"
4. **Make the final call**: You have veto power over all AI suggestions

### Example Review Flow

```
1. Dev opens PR #123
   └→ AI review posts within 60s

2. Dev reads AI feedback
   └→ "⚠️ Missing error handling in getUserHistory"
   └→ Dev adds try-catch, pushes commit

3. AI review updates automatically
   └→ "✅ Error handling added"

4. Human reviewer assigned
   └→ Reviews AI feedback
   └→ Verifies error handling is correct
   └→ Checks business logic (not AI-reviewed)
   └→ Approves PR

5. PR merged
```

## Where to Find Review Output

AI reviews appear in **three places**:

1. **PR Comments Tab** (most visible):
   - Bot comment labeled "🤖 AI Code Review Summary"
   - Updates automatically when PR changes

2. **Actions Tab** → LLM Code Review workflow:
   - Full workflow logs
   - Step summary with metadata
   - Useful for debugging if review fails

3. **PR Checks Section**:
   - Shows "LLM Code Review" workflow status
   - Green check = review posted successfully
   - Red X = API error or configuration issue

## Repeatability & Verification

### How to Verify the System Works

1. **Check workflow file**: [.github/workflows/llm-code-review.yml](.github/workflows/llm-code-review.yml)
2. **View past reviews**: Look at any closed PR with the bot comment
3. **Inspect workflow runs**: Actions tab → LLM Code Review → Select a run
4. **Test manually**: Open a test PR and observe the bot comment

### Reproducibility

- ✅ **Deterministic**: Same diff → similar review (temperature=0.3)
- ✅ **Auditable**: All workflow runs logged in GitHub Actions
- ✅ **Versioned**: Workflow and prompt stored in git
- ✅ **Transparent**: Review logic visible in workflow file

## Human Judgment & Final Approval

### What AI Handles Well

- Spotting common patterns and anti-patterns
- Checking test coverage basics
- Identifying missing error handling
- Flagging potential security issues
- Enforcing code style consistency

### What Requires Human Review

- ✋ **Architecture decisions**: Is this the right approach?
- ✋ **Business logic**: Does it match requirements?
- ✋ **Trade-offs**: Performance vs. readability, etc.
- ✋ **Context**: Why was this done this way?
- ✋ **Prioritization**: Which issues are blockers vs. nice-to-haves?

### Approval Requirements

- ⚠️ **AI review does NOT auto-approve** PRs
- ✅ **Human approval still required** via GitHub review system
- 🤖 AI review is **advisory only**
- 👤 Final merge decision made by **human reviewers**

## Cost & Resource Usage

### OpenAI API Costs

- **Model**: GPT-4o-mini (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
- **Typical PR**: ~5,000 input + 1,000 output tokens = **~$0.001 per review**
- **Monthly (50 PRs)**: ~$0.05/month

> 💡 For higher quality reviews, switch to `gpt-4o` in workflow (adds ~$0.01 per review)

### Rate Limits

- OpenAI free tier: 3 RPM (requests per minute)
- If you hit rate limits, PRs opened in quick succession may fail
- Solution: Upgrade to paid tier or add retry logic to workflow

## Troubleshooting

### "API key not configured" message

**Cause**: `OPENAI_API_KEY` secret not set

**Fix**: Add the secret in repository Settings → Secrets → Actions

### No bot comment appears

**Possible causes**:
1. Workflow file missing or disabled
2. API key invalid or out of credits
3. GitHub Actions permissions issue

**Debug**: Actions tab → LLM Code Review → View logs

### Review quality issues

**AI missed something obvious**:
- This is expected! AI reviews are imperfect
- Human reviewers catch what AI misses
- Report patterns to improve prompt

**AI flagged false positives**:
- Common with complex business logic
- Use human judgment to override
- Consider adding context to PR description

## Customization

### Adjust Review Focus

Edit the prompt in `.github/workflows/llm-code-review.yml`:

```yaml
- name: Load review prompt template
  run: |
    cat > review_prompt.txt << 'EOF'
    # Customize this prompt
    EOF
```

### Change AI Model

Update `model` field in the OpenAI API call:

```json
"model": "gpt-4o"  // Higher quality
"model": "gpt-4-turbo"  // Balanced
"model": "gpt-4o-mini"  // Current (fast & cheap)
```

### Disable for Specific PRs

Add `[skip-ai]` to PR title or description (requires workflow modification)

## Examples & Demos

### U13 Implementation

The LLM review system was implemented and demonstrated in U13 (Player Match History):

- **PR with AI review**: See u13 branch PR (link in [u13/LLM-REVIEW-INTEGRATION.md](u13/LLM-REVIEW-INTEGRATION.md))
- **Review output**: Bot comment on that PR
- **Workflow logs**: Actions tab for that PR

## Further Reading

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [LLM Review Prompt Template](.github/LLM-REVIEW-PROMPT.md)

## Maintenance

### Regular Tasks

- [ ] Monitor OpenAI API usage/costs monthly
- [ ] Review and update prompt quarterly
- [ ] Check for workflow deprecations (GitHub Actions changes)
- [ ] Evaluate new LLM models as they're released

### Version History

- **v1.0** (2026-04-18): Initial implementation with GPT-4o-mini
  - Structured review format
  - Auto-update on PR changes
  - Embedded in U13 workflow

---

**Questions?** Check the workflow logs in Actions tab or review `.github/workflows/llm-code-review.yml`
