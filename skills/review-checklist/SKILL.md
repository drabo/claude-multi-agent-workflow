---
name: review-checklist
description: Checklist for reviewing and testing code changes (security, error handling, tests, naming). Use when reviewing a diff, preparing a PR, or judging whether code is ready to commit.
---
# Review checklist

Apply to each changed file. Report only items that fail.

## Correctness
- Off-by-one, null/empty inputs, unhandled promise rejections or exceptions.
- Errors are handled at the right layer and never swallowed silently.

## Security
- No secrets, tokens, or credentials in code or config.
- External input is validated; queries are parameterized; no `eval`/shell string concatenation.
- New dependencies are pinned and necessary.

## Tests
- Every changed behavior has a test: happy path, edge case, error path.
- Tests assert behavior, not implementation details; no flaky timing or network dependence.

## Readability
- Names say what things are; comments explain why, not what.
- No dead code, duplicated logic, or unrelated changes in the diff.

## Commit hygiene
- Conventional Commits message (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`).
- One logical change per commit.
