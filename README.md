# code-quality

Claude Code plugin that reviews and tests your uncommitted changes in parallel, and blocks edits to secret files.

## Components

| Component | Path | Role |
|---|---|---|
| `code-reviewer` agent | `agents/code-reviewer.md` | Read-only review: bugs, missing error handling, unclear names |
| `code-tester` agent | `agents/code-tester.md` | Writes and runs tests for the changes, reports failures |
| `/code-quality:review-and-test` | `commands/review-and-test.md` | Runs both agents in parallel, prints review, tests, verdict |
| `review-checklist` skill | `skills/review-checklist/` | Checklist: security, error handling, tests, naming |
| `block-secret-files` hook | `hooks/` | PreToolUse guard denying `Edit`/`Write`/`NotebookEdit`/`Bash` on secret files (`.env`, `*.pem`, `id_rsa`, `*.tfvars`, ...). Fails closed (exit 2) |

## Requirements

- Claude Code
- `jq` (used by the hook; the hook blocks all matched calls if it's missing)

## Install

From a clone of this repo, inside Claude Code:

```
/plugin marketplace add .
/plugin install code-quality@code-quality
/reload-plugins
```

Or straight from GitHub: `/plugin marketplace add <owner>/<repo>`.

## Run

```
/code-quality:review-and-test              # uncommitted changes
/code-quality:review-and-test <scope>      # e.g. a path or branch
```

The agents and skill are also available to Claude automatically as `code-quality:code-reviewer`, `code-quality:code-tester` and `code-quality:review-checklist`.

## Layout

```
.claude-plugin/   plugin.json, marketplace.json
agents/  commands/  skills/  hooks/
course-api/       sample Express app used to exercise the plugin
.github/          plugin validation workflow
```
