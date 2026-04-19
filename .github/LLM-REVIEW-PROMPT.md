# LLM Code Review Prompt Template

This prompt template is used by the automated LLM code review GitHub Action. It guides the AI to provide structured, actionable feedback on pull requests.

## Template Structure

The AI reviewer is instructed to focus on five key areas:

### 1. Code Quality & Patterns
- TypeScript best practices adherence
- Potential bugs or unhandled edge cases  
- Error handling appropriateness
- Type safety and interface definitions

### 2. Testing
- Test coverage for new functionality
- Edge case and error scenario testing
- Test description clarity

### 3. Security
- Potential security vulnerabilities
- Input validation
- Authentication/authorization checks

### 4. Maintainability
- Code readability and structure
- Naming conventions
- Complexity management
- Consistency with project patterns

### 5. Documentation
- Comment quality (present but not excessive)
- API documentation
- PR description adequacy

## Expected Output Format

The AI generates reviews in this format:

```markdown
## 🤖 AI Code Review Summary

**Overall Assessment**: [Brief 1-2 sentence summary]

### ✅ Strengths
- [Positive aspects of the code]

### ⚠️ Concerns & Suggestions
- [Issues found and improvement suggestions]

### 🔍 Questions for Human Reviewers
- [Items requiring human judgment or domain knowledge]

---
*This review is AI-generated and should complement, not replace, human code review.*
```

## Customization

To customize the review focus areas:

1. Edit `.github/workflows/llm-code-review.yml`
2. Modify the `Load review prompt template` step
3. Adjust the prompt to emphasize different aspects or add project-specific guidelines

## Model Selection

Current model: **GPT-4o-mini** (cost-effective, fast)

Alternative models (update `model` field in workflow):
- `gpt-4o` - Higher quality, slower, more expensive
- `gpt-4-turbo` - Balanced option
- Other OpenAI models as available

## Temperature Setting

Current: **0.3** (focused, consistent reviews)

- Lower (0.0-0.2): More deterministic, conservative
- Higher (0.4-0.7): More creative, varied feedback
- Not recommended above 0.7 for code review

## Token Limits

- **Input**: Diffs truncated to ~10KB to fit within context window
- **Output**: Limited to 2000 tokens (~1500 words)
- Large PRs will receive partial review with a warning

## Integration with Human Review

The AI review is designed to **complement, not replace** human judgment:

- **AI handles**: Pattern detection, common mistakes, style consistency
- **Humans decide**: Architecture decisions, business logic correctness, prioritization
- **Both review**: Security implications, error handling, test coverage

All PRs still require human approval before merging.
