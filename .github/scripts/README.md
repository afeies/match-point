# Claude PR review

Automated, LLM-assisted code review that runs on every pull request.

## How it's triggered

The workflow [`claude-review.yml`](../workflows/claude-review.yml) runs on three events:

| Trigger | When it fires |
|---|---|
| `pull_request` (`opened`, `synchronize`, `reopened`) | Any PR is opened or pushed to |
| `issue_comment` containing `/claude-review` | A reviewer asks for a re-run on an existing PR |
| `workflow_dispatch` with a `pr_number` input | Manual/retroactive run from the Actions tab |

## Where the output appears

1. **PR comment** — posted by `github-actions[bot]` under the header
   `### Claude automated code review`. Re-runs update the same comment in place
   (kept stable via the `<!-- claude-pr-review -->` HTML marker).
2. **Workflow artifact** — `claude-review-pr-<N>` on the Actions run page,
   containing the raw diff sent to the model and the Markdown response.
3. **Workflow logs** — the `Run Claude review` step in the run log.

## What the review contains

The script in [`claude-review.mjs`](./claude-review.mjs) sends the PR title,
description, changed-file list, and unified diff to `claude-opus-4-7` with a
system prompt that forces a fixed section layout:

- **Summary** — 2-3 sentences
- **Risk assessment** — Low / Medium / High + justification
- **Findings** — numbered list, each tagged `[blocker] / [major] / [minor] / [nit]`, citing `file:line`
- **Test coverage** — whether tests were added and what's missing
- **Security** — injection / authz / secrets / validation
- **Suggested follow-ups** — non-blocking nice-to-haves

The diff is capped at ~200 KB so large PRs don't blow the model's input budget.

## Human judgment

This workflow is **advisory only**. The PR template (`.github/pull_request_template.md`)
requires a human reviewer to:

1. Read the Claude comment.
2. Accept, reject, or annotate each finding.
3. Approve the PR themselves before merge.

Merges still go through the normal GitHub review + CI gates — the Claude
comment is one input, not an approval.

## Setup (one-time, repo admin)

1. Create an Anthropic API key at <https://console.anthropic.com/>.
2. In the GitHub repo: **Settings → Secrets and variables → Actions →
   New repository secret**. Name: `ANTHROPIC_API_KEY`. Value: the key.
3. The workflow already has `permissions: pull-requests: write` so no further
   config is needed.

If the secret is missing, the workflow still runs and posts a comment
explaining the setup step — it never silently fails.

## Re-running on a merged PR

```bash
# from the Actions tab, pick "Claude PR Review" → "Run workflow"
# and supply the PR number as input. Or:
gh workflow run claude-review.yml -f pr_number=53
```
