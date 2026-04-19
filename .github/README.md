# GitHub Workflows & Automation

This directory contains GitHub Actions workflows and documentation for the MatchPoint project's CI/CD and code review automation.

## 📁 Contents

### Workflows (`.github/workflows/`)

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| [test.yml](workflows/test.yml) | Run automated tests (backend + frontend) | Push to main, PRs to main |
| [llm-code-review.yml](workflows/llm-code-review.yml) | AI-powered code review | PRs opened/updated/reopened |

### Documentation

| File | Description |
|------|-------------|
| [QUICK-SETUP.md](QUICK-SETUP.md) | **Start here** - 5-minute setup guide for LLM reviews |
| [LLM-REVIEW-GUIDE.md](LLM-REVIEW-GUIDE.md) | Comprehensive guide to the AI review system |
| [LLM-REVIEW-PROMPT.md](LLM-REVIEW-PROMPT.md) | AI review prompt template and customization |
| [pull_request_template.md](pull_request_template.md) | PR template with AI review checklist |

## 🚀 Quick Start

### For First-Time Setup

1. **Add OpenAI API key** to GitHub Secrets (see [QUICK-SETUP.md](QUICK-SETUP.md))
2. **Test with a PR** - AI review should appear within 60 seconds
3. **Read the guide** - [LLM-REVIEW-GUIDE.md](LLM-REVIEW-GUIDE.md)

### For Daily Use

**Opening a PR?**
- AI review appears automatically (~60 seconds)
- Address concerns in the bot comment
- Request human review when ready

**Reviewing a PR?**
- Read AI review first for orientation
- Verify AI-flagged issues
- Focus human attention on design and business logic

## 🤖 How the LLM Review Works

```
PR opened/updated
    ↓
Workflow triggers
    ↓
Extract diff → Send to OpenAI GPT-4o-mini
    ↓
Generate structured review
    ↓
Post as bot comment ← Auto-updates on PR changes
    ↓
Human review ← Final approval required
    ↓
Merge
```

**Key points**:
- ✅ **Automatic** - No manual steps needed
- ✅ **Fast** - Results in ~30-60 seconds
- ✅ **Repeatable** - Same diff → similar review
- ✅ **Advisory** - Doesn't block merges; human approval required
- ✅ **Visible** - Comments on PR, logs in Actions tab

## 📊 What Gets Checked

### Automated Tests (`test.yml`)
- ✅ Backend unit tests (vitest)
- ✅ Frontend unit tests (vitest)
- ✅ All acceptance criteria tests
- ⚠️ **Must pass** for PR to be mergeable

### LLM Code Review (`llm-code-review.yml`)
- 💡 Code quality and TypeScript patterns
- 💡 Test coverage and quality
- 💡 Security vulnerabilities
- 💡 Maintainability and readability
- 💡 Documentation
- ℹ️ **Advisory only** - human approval still required

## 📖 Documentation Index

**Getting Started**:
- [QUICK-SETUP.md](QUICK-SETUP.md) - Setup instructions (5 min)

**Using the System**:
- [LLM-REVIEW-GUIDE.md](LLM-REVIEW-GUIDE.md) - Complete usage guide
- [pull_request_template.md](pull_request_template.md) - PR checklist

**Customization**:
- [LLM-REVIEW-PROMPT.md](LLM-REVIEW-PROMPT.md) - Prompt engineering guide
- [workflows/llm-code-review.yml](workflows/llm-code-review.yml) - Workflow source

**Project-Specific**:
- [../u13/LLM-REVIEW-INTEGRATION.md](../u13/LLM-REVIEW-INTEGRATION.md) - U13 implementation
- [../u13/CI-SETUP.md](../u13/CI-SETUP.md) - U13 testing setup

## 💰 Cost

LLM reviews are **extremely cheap**:
- ~$0.001 per review (GPT-4o-mini)
- ~$0.10 for 100 PRs (typical semester)
- ~$5 OpenAI credit lasts thousands of reviews

See [QUICK-SETUP.md](QUICK-SETUP.md#cost-estimates) for detailed breakdown.

## 🔧 Maintenance

### Regular Checks
- [ ] Monitor OpenAI API usage monthly
- [ ] Review AI feedback quality quarterly
- [ ] Update prompt if patterns change
- [ ] Check for GitHub Actions deprecations

### Troubleshooting

**No AI review appears?**
→ Check Actions tab → LLM Code Review → View logs

**API errors?**
→ Verify OPENAI_API_KEY secret is set and has credits

**Poor review quality?**
→ Consider upgrading to `gpt-4o` or adjusting prompt

See troubleshooting section in [QUICK-SETUP.md](QUICK-SETUP.md#troubleshooting).

## 🎓 Educational Value

The LLM review system provides:
- ✅ **Instant feedback** on common mistakes
- ✅ **Pattern recognition** across all PRs
- ✅ **Learning tool** for code quality
- ✅ **Consistency** in review standards

But humans still handle:
- ✋ Business logic validation
- ✋ Architecture decisions
- ✋ Trade-off evaluation
- ✋ Final approval

## 📜 History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-04-18 | Initial LLM review implementation (U13) |

## 🔗 Links

- **Workflows**: [Actions tab](https://github.com/afeies/match-point/actions)
- **OpenAI Platform**: https://platform.openai.com
- **GitHub Actions Docs**: https://docs.github.com/en/actions

---

**Need help?** Read [QUICK-SETUP.md](QUICK-SETUP.md) or check workflow logs in the Actions tab.
