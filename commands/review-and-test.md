---
description: Run code-reviewer and code-tester in parallel on the current changes and summarize both
allowed-tools: Agent, Bash(git status:*), Bash(git diff:*)
---
Scope: $ARGUMENTS (if empty, the uncommitted changes from `git status` / `git diff`).

Launch the `code-reviewer` and `code-tester` agents in parallel: issue both Agent calls in a single response, giving each the same scope. Wait for both to finish.

Then output only this report:

## Code review
Findings grouped by severity (high / medium / low), each with file and one-line fix. "No issues" if none.

## Tests
Tests added (files), pass/fail counts, and each failure with file, cause, and suggested fix.

## Verdict
One line: ready to commit, or the blocking items to fix first.
