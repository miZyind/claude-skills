---
name: cpd
description: Commit all current changes, push, then deploy — unless the project deploys itself through a GitHub Actions workflow on push, in which case stop after the push. Use when the user says "/cpd", "cpd", or "commit all & push & deploy".
---

# cpd — commit, push, deploy

One command for the end-of-task ritual. Do the three steps in order, stop at the first failure, and report what actually happened (a failed push or deploy is reported as failed, never glossed over).

## 1. Commit all

- `git status --short` and `git diff --stat` first. "All" means every change in the working tree, but look at the list: a file you did not touch and cannot explain (secrets, generated junk, someone else's WIP) is surfaced to the user, not committed.
- Stage **by explicit path** (`git add path/one path/two`), never `git add -A` / `git add .`. Run `git status --short` again and confirm the staged set is exactly what you expect.
- If the repo has a fast check (`npm run typecheck`, `tsc --noEmit`, `cargo check`, `npm run lint`, …) run it and only commit on green.
- Commit **on the current branch** (no new branch, even on main/master). Conventional Commits prefix, subject and body in **English** regardless of the conversation language. End with the attribution line the session's system reminder prescribes.
- Nothing to commit → say so and still continue with push/deploy if the user asked for them (there may be unpushed commits).

## 2. Push

- `git push`. On a non-fast-forward rejection: `git fetch`, show `git log --oneline HEAD..origin/<branch>`, then `git rebase origin/<branch>`. Resolve conflicts by keeping both sides' intent, re-run the fast check, `git rebase --continue`, push again. Never `--force` on a shared branch.
- Push to the branch's existing upstream; do not invent remotes or branches.

## 3. Deploy — or not

Decide **before** deploying:

1. **GitHub Actions deploys on push?** Look in `.github/workflows/*.yml` for a job that runs on `push` to this branch and deploys (`wrangler-action`, `wrangler deploy`, `vercel`, `netlify`, `firebase deploy`, `pages deploy`, `docker push`, `ssh … deploy`, a step literally named deploy, etc.). If yes → **stop after the push**. Tell the user the workflow name and that CI will deploy; if `gh` is available, print the run URL from `gh run list --limit 1`.
2. Otherwise pick the project's deploy entry point, first match wins:
   - `package.json` has a `deploy` script → `npm run deploy` (or the repo's package manager).
   - `wrangler.jsonc` / `wrangler.toml` present → `npx wrangler deploy`.
   - `Makefile` with a `deploy` target → `make deploy`.
   - A `deploy` section in the project's `AGENTS.md` or `CLAUDE.md` / README that names a command → use that.
   - None found → do not guess; report that no deploy path exists and stop.
3. Run it, show the tail of its output (URL, version ID), and do one smoke check when a URL is printed: `curl -s -o /dev/null -w "%{http_code}"` on it (an auth-walled app answering 401/302 counts as alive). If the project's `AGENTS.md` or `CLAUDE.md` documents a post-deploy verification step, do that instead.

## 4. Report

Three lines, one per step: commit hash + subject, push result (branch, rebase if any), deploy result (version/URL, or "left to GitHub Actions: <workflow>", or "no deploy path"). Mention anything you skipped and why.
