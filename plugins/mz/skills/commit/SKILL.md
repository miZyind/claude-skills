---
name: commit
description: Stage and commit the current task's changes safely — explicit per-path staging (never git add -A), a status+diff confirmation gate, an optional build/lint/test green-check, a Conventional Commits message, and push only when asked. Use when the user says "commit", "/commit", or "commit and push".
---

# Commit

Commit the work for the current task with a clean, auditable staging step. Follow this exactly.

## 1. Survey

- Run `git status` and `git diff --stat` to see everything that changed.
- Identify which files belong to **this task**. Unrelated changes do not get committed.

## 2. Stage explicitly

- Stage **only** the task's files, **by explicit path**: `git add path/one path/two`.
- **Never** `git add -A` or `git add .` — they sweep in unintended files, and stale paths have silently dropped intended files.

## 3. Confirm before committing

- Run `git status` again and `git diff --staged`.
- Verify all three: every intended file is staged, nothing unexpected is staged, nothing was dropped.
- If the repo has a fast check for its stack (`cargo check`, `npm run lint`, `tsc --noEmit`, etc.), run it and only commit on green. Skip if there is no quick check or it does not apply.

## 4. Commit

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Reference the relevant story / task / design-doc ID in the body when one exists.
- Commit **on the current branch** — do not create a new branch, even on main/master.

## 5. Push

- Push **only** when the user has explicitly asked to push.
