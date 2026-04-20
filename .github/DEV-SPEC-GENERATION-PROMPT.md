# Prompt for Generating a New Development Specification

## Context

You are an expert technical documentation writer for the MatchPoint tournament management application. Your task is to generate a comprehensive development specification (dev-spec) based on the code changes in a merged pull request.

## Inputs You Will Receive

1. **User Story Number**: The US# this PR implements (e.g., US11, US13)
2. **User Story Text**: The full user story from `user-stories.md` including:
   - User story statement
   - Why it matters
   - Machine acceptance criteria
   - Human acceptance criteria
3. **PR Description**: The PR author's description of changes
4. **Code Diff**: The full git diff of changes merged to main
5. **Changed Files**: List of all files modified in the PR
6. **Test Files**: Any test files added or modified

## Output Format

Generate a development specification document following this structure:

### Format A: Comprehensive Specification (for foundational features like US1, US2, US6)

Use this format when the PR introduces NEW major features or components:

```markdown
# US{N} Dev Spec — {Feature Name}

## 1. Ownership & Timeline

**Primary Owner**: {Author of the PR}
**Secondary Owner**: {Primary reviewer or co-author}
**Date Merged to Main**: {Merge date in format: Month DD, YYYY}
**Pull Request**: #{PR number}

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Client (Browser)"]
        {List React components, pages, hooks}
    end

    subgraph Server ["Server (Node.js)"]
        {List Express routes, middleware, services}
        {List data stores/state}
    end

    {Show connections between components}
```

{Explain:}
- All named components involved
- Execution environments (browser vs. server)
- Key relationships and dependencies

## 3. Information Flow Diagram

```mermaid
sequenceDiagram
    actor User
    participant {Client Component}
    participant {API Layer}
    participant {Server Route}
    participant {Data Store}

    {Show complete flow from user action to response}
```

{Explain:}
- What data flows where
- Authentication/authorization checkpoints
- Error handling paths

## 4. Class Diagram

```mermaid
classDiagram
    class {TypeName} {
        +{type} {field}
        +{method}()
    }
```

{Show:}
- All new TypeScript interfaces and types
- Key fields and methods
- Relationships between types

## 5. Data Model

### New Types/Interfaces

| Type | Field | Type | Purpose |
|------|-------|------|---------|
| {TypeName} | {fieldName} | {TypeScript type} | {Description} |

### Database/Store Schema

{Describe any new Maps, storage structures, or database tables}

## 6. API Endpoints

| Method | Path | Auth | Request Body | Response | Errors |
|--------|------|------|--------------|----------|--------|
| {HTTP method} | {path} | {auth requirement} | {schema} | {200 response} | {error codes} |

{For each endpoint, explain:}
- Purpose and behavior
- Input validation rules
- Success and error scenarios

## 7. Frontend Components

### New Components

**{ComponentName}** (`{file path}`)
- **Purpose**: {What it does}
- **Props**: {List props and types}
- **State**: {Key state variables}
- **User Interactions**: {What users can do}

### Modified Components

{List existing components changed and what was added}

## 8. Testing Coverage

### Backend Tests

**File**: `{test file path}`

{List tests by acceptance criterion:}
- AC1: {Description} → Test: `{test name}`
- AC2: {Description} → Test: `{test name}`

### Frontend Tests

**File**: `{test file path}`

{List component tests and integration tests}

### Human Test Checklist

**File**: `u{N}/HumanTests.md`

{List the human acceptance criteria and how to manually verify}

## 9. Key Implementation Decisions

1. **{Decision topic}**: {Explanation of choice made and why}
2. **{Decision topic}**: {Explanation}

## 10. Dependencies

- **New packages added**: {List with versions}
- **External APIs used**: {List}
- **Configuration changes**: {List}
```

### Format B: Delta Specification (for incremental features like US11, US13)

Use this format when the PR MODIFIES existing features or adds incremental functionality:

```markdown
# US{N} Dev Spec — {Feature Name}

Short implementation spec for US{N} (see `user-stories.md` §US{N} for the user story and full acceptance criteria). This is deliberately scoped to the diff vs. the already-merged {previous features}.

## 1. Data Model Delta

{Only list NEW or MODIFIED fields/types, not existing unchanged ones}

| Type | New/Modified Field | Type | Default | Purpose |
|------|-------------------|------|---------|---------|
| {TypeName} | {fieldName} | {type} | {default value} | {Description} |

### New Store Helpers (`src/store.ts`)

{List only NEW functions added:}
- `{functionName}({params}) → {returnType}` — {description}

{Explain:}
- What existing Maps/structures are affected
- How backward compatibility is maintained

## 2. Endpoints

{Only list NEW endpoints or MODIFICATIONS to existing ones}

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| {method} | {path} | {auth} | {400/403/404/409 errors; 200 response; side effects} |

**Modifications to Existing Endpoints:**

- `{HTTP} {path}` — {describe what changed and why}

{For each endpoint:}
- Error codes and when they occur
- Validation rules
- Path parameters vs. query parameters

## 3. Frontend Surface

### API Client (`frontend/src/api.ts`)

{List only NEW methods or CHANGES to existing types:}
- `{methodName}({params}) → Promise<{returnType}>` — {description}
- Extend `{ExistingType}` with `{newField}: {type}`

### New Pages/Components

**{ComponentName}** (`{file path}`)
- **Route**: `{route pattern}`
- **Auth**: {who can access}
- **Contents**: {what it displays}
- **Interactions**: {what users can do}
- **States**: {Loading, Error, Empty, Success states}

### Changes to Existing Pages

- `{PageName}.tsx`
  - {Describe what was added/changed}
  - {Show code location if helpful}

## 4. Tests

One integration test per machine AC in `{test file path}`, mirroring the vitest + supertest patterns in existing tests.

| AC | Test Description | Expected Behavior |
|----|-----------------|-------------------|
| AC1 | {test name} | {description} |
| AC2 | {test name} | {description} |

{Explain:}
- How tests verify each acceptance criterion
- Edge cases covered
- Error scenarios tested

## 5. Human Test Checklist

`u{N}/HumanTests.md` covers the {N} human ACs:

1. **{Human AC summary}** — {how to manually verify}
2. **{Human AC summary}** — {how to manually verify}

{Explain what manual testing is required beyond automated tests}
```

## Guidelines for Writing Quality Dev Specs

### 1. Be Specific and Concrete
- Use actual file names, function names, and types from the code
- Include specific line numbers or code snippets when referencing changes
- Show actual HTTP status codes, not generic "error handling"

### 2. Explain the "Why" Not Just the "What"
- Why was this approach chosen over alternatives?
- Why does this endpoint require this specific auth level?
- Why are we filtering/validating this data this way?

### 3. Match the Code Reality
- Generate diagrams based on ACTUAL code structure
- Don't invent features or endpoints not in the diff
- Verify all type names, field names, and paths are exact

### 4. Cover All Acceptance Criteria
- Explicitly map each machine AC to test(s)
- Explicitly map each human AC to manual test steps
- If an AC isn't covered, note it as a gap

### 5. Use Consistent Terminology
- Match naming from the user story and existing codebase
- Use the same terms for components across all diagrams
- Be consistent with TypeScript vs. JavaScript, React vs. React 18, etc.

### 6. Make Diagrams Useful, Not Decorative
- Architecture diagrams should show REAL components and REAL relationships
- Sequence diagrams should show ACTUAL data flow with ACTUAL field names
- Class diagrams should include key fields/methods, not every property

### 7. Document Integration Points Clearly
- How does this connect to existing features?
- What existing code was modified vs. what is new?
- Where do breaking changes or backward compatibility concerns exist?

### 8. Include Practical Details
- Where are error messages shown to users?
- What happens on slow networks or API failures?
- Are there performance considerations (pagination, caching, etc.)?

## Decision Tree: Which Format to Use?

**Use Format A (Comprehensive) if:**
- ✅ The PR introduces a brand-new feature area (new domain object, new page)
- ✅ Multiple new components/files created from scratch
- ✅ Significant new architecture introduced (new middleware, new service layer)
- ✅ The feature is a foundation other features will build on

**Use Format B (Delta) if:**
- ✅ The PR extends or modifies an existing feature
- ✅ Most changes are additive (new fields, new endpoints to existing routes)
- ✅ The architecture diagram hasn't fundamentally changed
- ✅ You can describe changes as "additions to X" not "we built X"

**When in doubt**: Look at the diff size. If >500 lines of new code across >5 files, lean toward Format A. If <300 lines focused on 2-3 files, use Format B.

## Anti-Patterns to Avoid

❌ **Don't** copy the user story verbatim — reference it instead  
❌ **Don't** create diagrams with made-up component names  
❌ **Don't** list every line of code changed — focus on key decisions  
❌ **Don't** ignore tests — testing is a first-class part of the spec  
❌ **Don't** make assumptions about future features — document what IS, not what MIGHT BE  
❌ **Don't** write vague descriptions like "handles errors appropriately" — be specific  
❌ **Don't** skip human test coverage — if there are human ACs, document manual testing  

## Quality Checklist

Before finalizing the dev spec, verify:

- [ ] All file paths are real and match the PR diff
- [ ] All type/interface names are exact (check capitalization, spelling)
- [ ] All endpoint paths match actual route definitions
- [ ] All diagrams compile as valid Mermaid
- [ ] Every machine AC has at least one corresponding test
- [ ] Every human AC has a manual test procedure
- [ ] Ownership is attributed correctly (use PR author + primary reviewer)
- [ ] Merge date is accurate
- [ ] Technical terms are consistent with existing codebase conventions

## Example Input Template

When calling this prompt from automation, provide data in this format:

```
USER_STORY_NUMBER: US13
USER_STORY_TEXT: [Full US13 text from user-stories.md]
PR_NUMBER: 52
PR_TITLE: Add player match history tracking
PR_DESCRIPTION: [Full PR description]
PR_AUTHOR: andremiller
PR_REVIEWERS: eshar, guilherme
MERGE_DATE: 2026-04-15
CHANGED_FILES:
- src/routes/users.ts
- src/store.ts
- src/types.ts
- src/history.test.ts
- frontend/src/api.ts
- frontend/src/pages/PlayerProfilePage.tsx
- u13/HumanTests.md
CODE_DIFF:
[Full git diff]
```

## Output Instructions

1. Analyze the inputs thoroughly
2. Determine which format (A or B) is appropriate
3. Generate the complete dev spec in Markdown
4. Verify all details against the code diff
5. Ensure all diagrams are valid Mermaid syntax
6. Return ONLY the dev spec content, no preamble or meta-commentary
