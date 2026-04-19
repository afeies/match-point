# Quick Setup - LLM Code Review

> **TL;DR**: Add your OpenAI API key to GitHub Secrets, then the AI review will run automatically on all PRs.

## One-Time Setup (5 minutes)

### Step 1: Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in (or create account if needed)
3. Click **"Create new secret key"**
4. Name it: `github-matchpoint-reviews`
5. **Copy the key** (starts with `sk-proj-...`) - you won't see it again!
6. Add credits: https://platform.openai.com/settings/organization/billing
   - Minimum: $5 (will last for thousands of reviews)
   - Expected usage: ~$0.001 per review = $0.10 per 100 PRs

### Step 2: Add Secret to GitHub

1. Go to your repo: https://github.com/afeies/match-point
2. Click **Settings** (top right, requires admin access)
3. Sidebar → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name**: `OPENAI_API_KEY`
   - **Secret**: Paste the key from Step 1
6. Click **Add secret**

### Step 3: Verify It Works

1. Create a test branch:
   ```bash
   git checkout -b test-ai-review
   echo "# Test LLM Review" >> README.md
   git add README.md
   git commit -m "Test AI review system"
   git push -u origin test-ai-review
   ```

2. Open a PR: https://github.com/afeies/match-point/compare/main...test-ai-review

3. Wait ~60 seconds

4. Check for bot comment starting with "🤖 AI Code Review Summary"

5. If successful, close the test PR (or merge it, the change is harmless)

### Step 4: Check Actions Status

- Go to: https://github.com/afeies/match-point/actions
- You should see two workflows:
  - ✅ **CI Tests** (runs on all PRs)
  - ✅ **LLM Code Review** (runs on all PRs)

## Troubleshooting

### No bot comment appears

**Check 1**: Go to Actions tab → LLM Code Review → View the latest run
- If it says "OPENAI_API_KEY secret not configured" → repeat Step 2
- If it shows an error → read the error message in the logs

**Check 2**: Verify the secret name is exactly `OPENAI_API_KEY` (case-sensitive)

**Check 3**: Make sure you have enough OpenAI credits:
- https://platform.openai.com/usage
- Add more if balance is $0

### Bot comment says "Error: Unable to get review from OpenAI"

**Likely cause**: API key invalid or expired

**Fix**: Generate a new API key and update the secret

### Review quality is poor

**Option 1**: Upgrade the model (better but more expensive)
- Edit `.github/workflows/llm-code-review.yml`
- Change `"model": "gpt-4o-mini"` to `"model": "gpt-4o"`
- Commit and push

**Option 2**: Adjust the prompt
- Edit the prompt in `.github/workflows/llm-code-review.yml`
- Look for the `Load review prompt template` step
- Customize instructions

## Cost Estimates

| Scenario | Reviews | Model | Estimated Cost |
|----------|---------|-------|-----------------|
| U13 development | 5 PRs | GPT-4o-mini | ~$0.005/month |
| Full semester | 100 PRs | GPT-4o-mini | ~$0.10/month |
| High traffic | 500 PRs | GPT-4o-mini | ~$0.50/month |
| Premium quality | 100 PRs | GPT-4o | ~$1.00/month |

**Bottom line**: Extremely cheap for educational/small projects.

## Usage

Once set up, the system runs **automatically on every PR**. No per-PR configuration needed.

### For Developers

1. Open PR → AI review appears in ~60 seconds
2. Read the feedback
3. Address concerns
4. Request human review
5. Merge after human approval

See [.github/LLM-REVIEW-GUIDE.md](.github/LLM-REVIEW-GUIDE.md) for detailed usage instructions.

### For Staff/Graders

The system is fully **repeatable and auditable**:

- **Workflow file**: [.github/workflows/llm-code-review.yml](.github/workflows/llm-code-review.yml)
- **Past reviews**: Look for bot comments on any PR
- **Logs**: Actions tab → LLM Code Review → Select any run
- **Test it**: Open a test PR to see it in action

## Disabling (if needed)

To turn off the LLM review:

1. Go to `.github/workflows/llm-code-review.yml`
2. Delete the file, or
3. Add this at the top:
   ```yaml
   on:
     workflow_dispatch:  # Only run manually
   ```

## Next Steps

- ✅ Setup complete? Test with a real U13 PR
- 📖 Read the full guide: [.github/LLM-REVIEW-GUIDE.md](.github/LLM-REVIEW-GUIDE.md)
- 🔍 See U13 integration: [u13/LLM-REVIEW-INTEGRATION.md](u13/LLM-REVIEW-INTEGRATION.md)

---

**Questions?** Check the workflow logs in the Actions tab or read the troubleshooting section above.
