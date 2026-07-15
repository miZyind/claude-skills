---
name: updeps
description: Upgrade all outdated npm/yarn/pnpm dependencies to latest via taze and verify the project still works (install → lint → typecheck → build → runtime smoke test). Isolates incompatible majors instead of blindly keeping them. Use when the user asks to update/upgrade packages or dependencies, check outdated packages, or mentions "taze" / "yarn outdated" / "npm outdated".
---

# Upgrade dependencies to latest, verified

Upgrade every outdated dependency to its latest version, prove the project still works, and hold back only what is demonstrably incompatible — with evidence. Follow the phases in order.

## 1. Survey

- Detect the package manager from the lockfile (`yarn.lock` → yarn, `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm) and respect `packageManager` in package.json — needed for the install and verify commands. taze itself is package-manager agnostic (it only reads the registry and edits package.json; it never touches the lockfile).
- Run `npx taze major` to list every available update classified by bump type (add `-r` for monorepos). **Majors are the risk points**; minor/patch are low-risk. If a major is listed, check its ecosystem support before assuming it will work (peer ranges, framework support) — but the real test is phase 3.
- Confirm the working tree is clean (or at least note pre-existing changes) so upgrade damage can be isolated later with `git stash`.

## 2. Upgrade

- Run `npx taze latest -w` to write the latest versions into package.json for ALL packages including majors — the point is to *test* latest, not to guess. taze preserves the existing range style (e.g. `^`), and because only package.json changes, the git diff stays the human-readable record of what was bumped (never make the lockfile the thing to review).
  - Scope with `--include` / `--exclude` when the user asked for specific packages; use `npx taze major -I` (interactive) when the user wants to approve majors one by one.
  - Fallback if taze cannot run (offline/registry issues): read the PM's own `outdated` output and edit package.json manually to the same effect.
  - **Previously held-back majors**: check recent commit messages for packages pinned back with an incompatibility reason (e.g. "TypeScript stays on 6.x"). Quickly re-check whether the blocker is resolved (the blocking tool's supported range / release notes); if not, `--exclude` that package instead of re-breaking the build.
- Install with the project's package manager to regenerate the lockfile. **Read the install warnings**: peer-dependency ranges that exclude a new major (e.g. `typescript@>=4.8.4 <6.1.0` when installing 7.x) are early evidence of incompatibility — note them before anything breaks.

## 3. Verify ladder (cheap → expensive)

Run in order; stop and diagnose at the first failure:

1. Lint (`yarn lint` or equivalent, must be as strict as the repo's own config, e.g. `--max-warnings 0`).
2. Typecheck (`tsc --noEmit` if not covered by build).
3. Production build.
4. Runtime smoke test (phase 5).

## 4. Diagnose failures — prove, don't guess

- **Establish a baseline before blaming the upgrade**: `git stash` → clean install from the old lockfile → rerun the failing check. If it fails there too, the problem is pre-existing; report it, don't fold it into the upgrade. `git stash pop` afterwards.
- **Isolate the offending package**: revert the most suspicious major first (peer-dep warnings tell you which), reinstall, rerun. One variable at a time.
- **Incompatible major** (toolchain crashes, framework refuses the version): pin back to the newest *working* version, and record the concrete evidence (exact error + which tool's supported range excludes it) for the final report. Never leave the repo broken just to have "latest" in package.json.
- **`Cannot find module` for a transitive dep after upgrading (yarn 1)**: the hoister may have re-nested packages even when lockfile entries for them are unchanged. Fix by regenerating the lockfile: `rm -rf yarn.lock node_modules && yarn install`. This also refreshes transitive deps, which suits an upgrade task.
- **Deprecation lint errors from an upgraded library**: migrate the code to the replacement API instead of pinning the old version. Before editing, check the installed package's `.d.ts` to confirm the replacement supports every prop/argument the call site uses (including CSS class constants referenced in styles).
- Corrupted `node_modules` (e.g. a build tool ran its own installs mid-flight): clean reinstall before deeper diagnosis.

## 5. Runtime smoke test

"Builds" is not "works". Exercise the real app:

- Serve the production build. If the default port is occupied, use another port (`-p`) — never kill the unknown occupant.
- `curl` the key routes (pages + API endpoints) and require 200s.
- Drive the UI with Playwright MCP: load the main page, and **specifically exercise any code path you migrated** in phase 4 (e.g. trigger the component whose API changed). Check the browser console for errors. Screenshot the result and Read it yourself to confirm.
- Clean up: close the browser, stop the background server.

## 6. Report

State clearly, with evidence:

- Which packages were updated (and that transitive deps were refreshed, if the lockfile was regenerated).
- Which were held back, pinned to what, and the exact incompatibility proof — plus what to wait for before retrying.
- What code migrations were made and how they were verified at runtime.
- Full verification results (lint / typecheck / build / smoke test).

Do **not** commit unless the user asks; when they do, use the `commit` skill.
