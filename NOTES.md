# code-quality plugin

## What it does

Bundles a review-and-test workflow for uncommitted changes:

| Component | Path | Role |
|---|---|---|
| `code-reviewer` agent | `agents/code-reviewer.md` | Reads the changes and reports bugs, missing error handling, and unclear names by severity |
| `code-tester` agent | `agents/code-tester.md` | Writes and runs tests for the changes, reports failures |
| `/code-quality:review-and-test` command | `commands/review-and-test.md` | Runs both agents on the same scope and prints one report: review, tests, verdict |
| `review-checklist` skill | `skills/review-checklist/` | Checklist (security, error handling, tests, naming) for judging whether a diff is ready |
| `block-secret-files` hook | `hooks/` | PreToolUse guard that blocks `Edit`, `Write`, `NotebookEdit` and `Bash` calls touching secret files (`.env`, `*.pem`, `id_rsa`, `*.tfvars`, ...). Fails closed: a missing `jq` or malformed input exits 2 |

## Install

From Claude Code, in this repo:

```
/plugin marketplace add my-code-tools
/plugin install code-quality@my-code-tools
/reload-plugins
```

Run it:

```
/code-quality:review-and-test              # uncommitted changes
/code-quality:review-and-test <scope>      # e.g. a path or branch
```

The hook needs `jq` on `PATH` and `hooks/block-secret-files.sh` must be executable.

## Scoping decision: why the reviewer has no write tools

`code-reviewer` gets `tools: Read, Grep, Glob` and `model: sonnet`.

- **Read-only on purpose.** A reviewer's job is to report, not fix. With no `Edit`, `Write` or `Bash`, it cannot change the code it is judging, so its findings stay independent of the changes it might otherwise "fix" silently. It also cannot run anything, so reviewing is safe on any diff.
- **Sonnet, not a larger model.** Reading a diff and flagging bugs is a bounded task. The cheaper model is enough and keeps the parallel run inexpensive.
- **Contrast with `code-tester`.** It does need `Edit`, `Write` and `Bash` (to create test files and run the suite), so it gets them. Its "only touch test files" rule is a prompt instruction, not enforced; restricting its `Bash` or adding a write-scoping hook would make that real.
- **Known gap.** The reviewer has no `Bash`, so it cannot run `git diff` itself. It relies on the scope passed in by the command. Adding `Bash(git diff:*)` and `Bash(git status:*)` would fix that without granting write access.

## Why the command runs in parallel, not in sequence

`review-and-test` launches `code-reviewer` and `code-tester` in a single response (two `Agent` calls at once), then waits for both.

**Parallel (reviewer + tester):**
- They are independent. Neither needs the other's output: the reviewer reads code, the tester writes tests and runs them against the same changes.
- They do not conflict on files. The reviewer is read-only; the tester writes only test files.
- Wall-clock time is the slower of the two, not the sum.

**Sequential (agents, then report):**
- The final report depends on both results, so the command waits for both before writing anything.
- The report is produced by the command itself, not a third agent, so findings are merged in one place with a fixed shape (review, tests, verdict).

**Trade-off:** because the reviewer does not see test results and the tester does not see review findings, a bug the reviewer flags may also surface as a test failure and appear twice. That is accepted in exchange for speed and isolation.
