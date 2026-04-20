# Prompt for Updating an Existing Development Specification

## Context

You are an expert technical documentation writer for the MatchPoint tournament management application. Your task is to UPDATE an existing development specification (dev-spec) to reflect changes made in a merged pull request that modifies or extends a previously implemented user story.

## Inputs You Will Receive

1. **User Story Number**: The US# being updated (e.g., US11, US13)
2. **Existing Dev Spec**: The current content of `u{N}/dev-spec.md`
3. **User Story Text**: The updated user story from `user-stories.md` (if changed)
4. **PR Description**: Description of what was changed/added
5. **Code Diff**: The git diff showing changes to previously implemented code
6. **Changed Files**: List of files modified
7. **Previous PR Number**: The original PR that implemented this feature
8. **Update PR Number**: The new PR making changes

## Your Task

Update the existing dev spec to accurately reflect the current state of the codebase after the changes. Maintain the existing structure and format while incorporating new information.

## Guidelines

### 1. Preserve What Hasn't Changed

- Keep all sections that are still accurate
- Don't rewrite content unnecessarily
- Maintain the original format (Format A or Format B from the generation prompt)
- Keep the original ownership and merge date, but add update annotations

### 2. Clearly Mark What Changed

Add an "Updates" section at the top:

```markdown
# US{N} Dev Spec — {Feature Name}

## Updates

**Latest Update**: {Date} (PR #{new PR number})
**Original Implementation**: {Date} (PR #{original PR number})

### Changes in PR #{new PR number}
- {Brief description of what changed}
- {What was added}
- {What was modified}
- {What was deprecated/removed}

---

{Rest of original spec, updated as needed}
```

### 3. Update Specific Sections

#### If Data Model Changed:
- Add new fields to existing tables
- Mark deprecated fields with ~~strikethrough~~ and note "(Deprecated in PR #{N})"
- Update "New Store Helpers" with additional functions
- Add a subsection "Modified Since Original Implementation" if needed

#### If Endpoints Changed:
- Update endpoint table with new routes
- Mark changed behavior with asterisks and footnotes
- Update response schemas if they changed
- Add new error codes introduced

#### If Frontend Changed:
- Update component descriptions with new props/state
- Add new components or pages
- Update routing table
- Modify interaction flows

#### If Tests Changed:
- Add new test cases to the list
- Update test file references
- Note changes in test coverage
- Add new edge cases covered

#### If Architecture Changed:
- **Update diagrams** to reflect new components or relationships
- Add new sequence flows
- Update class diagrams with new types
- Note architectural decisions that evolved

### 4. Version History Pattern

Use this pattern for tracking multiple updates:

```markdown
## Updates

| Date | PR | Changes |
|------|----|---------| 
| {Latest date} | #{Latest PR} | {Latest changes} |
| {Previous date} | #{Previous PR} | {Previous changes} |
| {Original date} | #{Original PR} | Initial implementation |
```

### 5. Maintain Traceability

- Link to specific PR numbers for each change
- Reference commit SHAs for major refactors if provided
- Keep both old and new information when behavior fundamentally changed
- Use comparison tables when helpful:

```markdown
### Endpoint Behavior Evolution

| Version | Before (PR #{old}) | After (PR #{new}) |
|---------|-------------------|------------------|
| {Aspect} | {Old behavior} | {New behavior} |
```

### 6. Update Diagrams Accurately

When updating Mermaid diagrams:

- Add new components/nodes
- Update relationships/edges
- Remove obsolete connections (mark with comments if significant)
- Ensure diagram still compiles
- Keep diagram focused — don't add every minor detail

Example:

```markdown
## 3. Architecture Diagram (Updated PR #{N})

```mermaid
graph TD
    subgraph Client ["Client (Browser)"]
        {Existing components}
        NewComponent["{New Component}\n(Added PR #{N})"]
    end
    
    {Updated relationships}
```

{Explain what changed from original architecture}
```

### 7. Decision Log Pattern

Add a "Design Evolution" section if significant technical decisions changed:

```markdown
## Design Evolution

### Migration from {Old Approach} to {New Approach} (PR #{N})

**Reason**: {Why the change was needed}

**What Changed**:
- {Specific change 1}
- {Specific change 2}

**Migration Path**: {How existing data/code was migrated}

**Breaking Changes**: {Yes/No — describe if yes}
```

## Update Strategies by Change Type

### Strategy 1: Additive Changes (Most Common)

When the PR **adds** functionality without changing existing behavior:

- Add new content to existing sections
- Extend tables with new rows
- Add new components to diagrams
- Keep "original" tone — don't rewrite everything
- Note "(Added PR #{N})" inline where helpful

Example:
```markdown
## 2. Endpoints

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| GET | /api/users/:id | none | {original description} |
| GET | /api/users/:id/history | none | {new description} (Added PR #52) |
```

### Strategy 2: Behavioral Changes

When the PR **modifies** how existing features work:

- Show before/after comparison
- Update descriptions completely if behavior fundamentally changed
- Mark old behavior as superseded
- Update tests section to reflect new expectations

Example:
```markdown
## 2. Endpoints

### `POST /api/tournaments/:id/bracket`

**Updated Behavior (PR #45)**:
- Now validates entrant check-in status before generating bracket
- Returns 409 if check-in not closed (new in PR #45)
- ~~Previously allowed bracket generation anytime~~ (deprecated PR #45)
```

### Strategy 3: Refactoring/Restructuring

When the PR **refactors** without changing external behavior:

- Update implementation details
- Keep API contracts the same (note "API unchanged")
- Update internal architecture diagrams
- Add notes about performance improvements or code quality

Example:
```markdown
## 5. Implementation Notes

**Code Refactor (PR #63)**: 
- Moved bracket generation logic from `tournaments.ts` to dedicated `bracket/` service
- **External API unchanged** — all endpoints maintain same contracts
- Improved test isolation and maintainability
```

### Strategy 4: Deprecation/Removal

When the PR **removes** or **deprecates** features:

- Mark deprecated features clearly
- Note what replaced them (if anything)
- Update "Migration Guide" if needed
- Keep deprecated docs visible but marked

Example:
```markdown
## 2. Endpoints

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| GET | /api/users/:id | Active | {description} |
| ~~POST~~ | ~~`/api/users/bulk`~~ | Deprecated PR #70 | Use `/api/users/:id` individually instead |
```

## Output Structure

Your updated dev spec should:

1. **Start with Updates section** showing the change history
2. **Keep original structure** (don't switch from Format A to B or vice versa)
3. **Mark changes inline** where appropriate
4. **Update all diagrams** to reflect current state
5. **Preserve original ownership** but note contributors to updates
6. **Maintain tone consistency** with the original document

## Anti-Patterns to Avoid

❌ **Don't** rewrite the entire doc — update only what changed  
❌ **Don't** lose original context — keep the evolution visible  
❌ **Don't** remove working diagrams — update them instead  
❌ **Don't** break existing links/references from other docs  
❌ **Don't** change the file structure — keep section numbers/names  
❌ **Don't** assume what changed — verify against the diff  
❌ **Don't** ignore test updates — tests are part of the spec  

## Quality Checklist for Updates

Before finalizing the updated dev spec, verify:

- [ ] Updates section clearly lists all changes
- [ ] PR numbers are correct and linked
- [ ] All new file paths exist in the codebase
- [ ] All updated diagrams compile as valid Mermaid
- [ ] Changed sections are marked (inline notes or version tables)
- [ ] Original information is preserved or explicitly marked as deprecated
- [ ] Tests section reflects new/modified tests
- [ ] If ACs changed, the spec reflects the new ACs
- [ ] Dates and merge information are accurate
- [ ] No content was accidentally deleted without marking as deprecated

## Example Input Template

When calling this prompt from automation, provide data in this format:

```
USER_STORY_NUMBER: US11
EXISTING_DEV_SPEC:
[Full current content of u11/dev-spec.md]

USER_STORY_TEXT:
[Current US11 text from user-stories.md]

ORIGINAL_PR_NUMBER: 38
ORIGINAL_MERGE_DATE: 2026-04-01

UPDATE_PR_NUMBER: 67
UPDATE_PR_TITLE: Add undo check-in functionality
UPDATE_PR_DESCRIPTION:
[Full PR description of the changes]

UPDATE_PR_AUTHOR: eshar
UPDATE_PR_REVIEWERS: andremiller
UPDATE_MERGE_DATE: 2026-04-18

CHANGED_FILES:
- src/routes/tournaments.ts
- src/checkin.test.ts
- frontend/src/pages/TournamentCheckInPage.tsx

CODE_DIFF:
[Full git diff showing only the changes in this update]
```

## Edge Cases

### Case 1: User Story Text Changed

If the user story itself was updated (e.g., new ACs added):

```markdown
## Updates

**Latest Update**: {Date} (PR #{N})

### User Story Changes
- Acceptance criteria updated to include {new AC}
- Clarified: {what was clarified}

### Implementation Changes
- {Corresponding code changes}
```

### Case 2: Major Refactor Changing Everything

If >50% of the content would change:

- Consider creating a new "v2" section
- Keep original implementation documented
- Note "See Original Implementation (deprecated)" sections
- Or use side-by-side comparison:

```markdown
## Architecture Evolution

### Original Architecture (PR #{old})
- {Brief summary or link to git history}

### Current Architecture (PR #{new})
{Updated diagram and description}

**Migration**: {How we got from old to new}
```

### Case 3: Hotfix or Bug Fix

For small bug fixes that don't change the spec materially:

```markdown
## Updates

**Latest**: Bug fix PR #75 (Apr 20, 2026) — Fixed null check in getUserHistory. Dev spec unchanged.
```

No need to update the entire document for trivial fixes.

### Case 4: Multiple Simultaneous PRs

If multiple PRs updated the same feature:

```markdown
## Updates

| Date | PR | Changes |
|------|----|---------| 
| Apr 18 | #68 | Added filtering by date range |
| Apr 18 | #67 | Added undo check-in button |
| Apr 15 | #66 | Performance optimization (no API changes) |
| Apr 01 | #38 | Initial implementation |
```

Update all relevant sections to reflect the cumulative changes.

## Output Instructions

1. Read and understand the existing dev spec structure
2. Analyze the code diff to identify what actually changed
3. Determine update strategy (additive, behavioral, refactor, deprecation)
4. Update only the sections that need updating
5. Add Updates section at the top
6. Verify all diagrams still compile
7. Ensure traceability with PR numbers and dates
8. Return ONLY the updated dev spec content in full (complete markdown file)
9. Do NOT include meta-commentary or explanations outside the dev spec itself
