// Structured PR review script — called from .github/workflows/claude-review.yml.
//
// Reads the PR diff + file list from disk, asks Claude for a structured review,
// and writes the Markdown result to OUTPUT_PATH so the workflow can post it as
// a PR comment and/or upload it as an artifact.
//
// The prompt intentionally enforces a fixed section layout so reviewers see
// consistent output across PRs and can compare runs across stories.

import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const {
  ANTHROPIC_API_KEY,
  PR_NUMBER = "",
  PR_TITLE = "",
  PR_BODY = "",
  PR_HEAD_REF = "",
  DIFF_PATH = ".claude-review/diff.patch",
  FILES_PATH = ".claude-review/files.txt",
  OUTPUT_PATH = ".claude-review/review.md",
} = process.env;

if (!ANTHROPIC_API_KEY) {
  writeFallback(
    "ANTHROPIC_API_KEY is not set on this repository. Add it under " +
      "*Settings → Secrets and variables → Actions* to enable automated review."
  );
  process.exit(0);
}

const diff = safeRead(DIFF_PATH);
const files = safeRead(FILES_PATH);

if (!diff.trim()) {
  writeFallback("No diff detected between the PR base and head — nothing to review.");
  process.exit(0);
}

const systemPrompt = `You are a senior software engineer performing a code review on a
GitHub pull request for the "match-point" project (a fighting-game tournament hub:
TypeScript/Node Express API + Vitest tests, plus a frontend).

Produce a concise review in GitHub-flavored Markdown with EXACTLY these sections,
in this order, and no others:

**Summary** — 2-3 sentences describing what this PR does.
**Risk assessment** — one of: Low / Medium / High, plus a one-line justification.
**Findings** — a numbered list. Each item is a single finding in the form:
  \`N. [severity] path/to/file:line — what's wrong and the suggested fix.\`
  Use severity tags: [blocker], [major], [minor], [nit]. If there are no
  findings of a given severity, omit them. If there are no findings at all,
  write "No issues found."
**Test coverage** — comment on whether tests were added/updated and whether
  edge cases look covered. Flag missing tests as [major] findings above.
**Security** — call out injection, authz, secrets, or input-validation issues.
  If none, write "No security concerns identified."
**Suggested follow-ups** — optional bullet list of nice-to-haves that should
  NOT block merge.

Rules:
- Be specific: cite file paths and line numbers from the diff.
- Do not restate the diff. Do not praise. Do not hedge with "consider maybe".
- If the diff is truncated or unclear, say so explicitly in Summary.
- Keep the whole review under ~500 words.`;

const userPrompt = `PR #${PR_NUMBER}: ${PR_TITLE}
Branch: ${PR_HEAD_REF}

PR description:
${PR_BODY || "(no description provided)"}

Changed files (git diff --name-status):
\`\`\`
${files || "(empty)"}
\`\`\`

Unified diff (may be truncated to ~200KB):
\`\`\`diff
${diff}
\`\`\``;

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

try {
  const resp = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) {
    writeFallback("Claude returned an empty response.");
  } else {
    fs.writeFileSync(OUTPUT_PATH, text);
  }
} catch (err) {
  const msg = err && err.message ? err.message : String(err);
  writeFallback(`Claude API call failed: ${msg}`);
  // Still exit 0 — we want the comment to post rather than fail the workflow.
}

function safeRead(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function writeFallback(reason) {
  fs.writeFileSync(
    OUTPUT_PATH,
    `**Summary** — Automated review was skipped.\n\n**Reason** — ${reason}`
  );
}
