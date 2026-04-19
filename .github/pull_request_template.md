# Pull Request

## Summary

<!-- 1-3 sentences describing what this PR changes and why. Link the user story. -->

## User story

<!-- e.g. US11 / US12 / US13. Link to user-stories.md section if applicable. -->

## How I tested

<!-- Commands you ran locally, manual steps, etc. -->

- [ ] `npx tsc --noEmit`
- [ ] `npm test` (API)
- [ ] `cd frontend && npm test && npm run build`

## Reviewer checklist

- [ ] CI (`.github/workflows/ci.yml`) is green.
- [ ] The **Claude automated code review** comment has been posted on this PR.
      Re-run it by commenting `/claude-review` if the diff has changed.
- [ ] I have read the Claude findings and either addressed them or left a
      reply explaining why each is not actionable. The LLM output is
      **advisory** — human approval is still required.
- [ ] At least one human reviewer has approved.
