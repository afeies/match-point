You are a senior software engineer writing a development specification for a feature in MatchPoint, a fighting game tournament management platform.

Generate a dev spec in markdown following this exact structure:

# US{N} Dev Spec — {Feature Name}

## 1. Data Model Delta
- List new or modified fields in src/types.ts with a table: | Type | New field | Default | Purpose |
- Describe new store helpers in src/store.ts with function signatures

## 2. Endpoints
- Table of all HTTP endpoints: | Method | Path | Auth | Behavior |
- Include status codes for success and error cases

## 3. Frontend Surface
- New API client methods and updated DTOs
- New pages/components with route paths and key UI elements
- Changes to existing pages

## 4. Tests
- List integration tests (one per machine acceptance criterion)
- Reference test file name and framework (vitest + supertest)

## 5. Human Test Checklist
- Reference the human test file location
- List what human acceptance criteria are covered

RULES:
- Be precise about types, field names, and HTTP status codes
- Match existing project conventions (Express, Zod, JWT middleware, in-memory Maps)
- Reference actual file paths in the codebase
- Output ONLY the markdown content, no code fences wrapping the whole document
