---
name: updeps
description: Upgrade all outdated npm/yarn/pnpm dependencies to the registry's latest versions and verify the project still works (install → lint → typecheck → build → runtime smoke test). Isolates incompatible majors instead of blindly keeping them. Use when the user asks to update/upgrade packages or dependencies, check outdated packages, or mentions "yarn outdated" / "npm outdated".
---

# Upgrade dependencies to latest, verified

Upgrade every outdated dependency to its latest version, prove the project still works, and hold back only what is demonstrably incompatible — with evidence. Follow the phases in order.

## 1. Survey

Versions are read straight from the registry by the bundled `scripts/latest.mjs` (next to this file). It asks `npm view <pkg> dist-tags.latest` for every dependency, so it follows the machine's npm registry, proxy and CA settings, and it only ever edits package.json — never the lockfile. Do not reach for a third-party updater.

- Detect the package manager from the lockfile (`yarn.lock` → yarn, `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm) and respect `packageManager` in package.json — needed for the install and verify commands.
- Run `node <skill-dir>/scripts/latest.mjs` in the project root to list every available update classified by bump type (pass a path to each workspace's package.json for monorepos). **Majors are the risk points**; minor/patch are low-risk. If a major is listed, check its ecosystem support before assuming it will work (peer ranges, framework support) — but the real test is phase 3.
- Confirm the working tree is clean (or at least note pre-existing changes) so upgrade damage can be isolated later with `git stash`.

## 2. Upgrade

- Run `node <skill-dir>/scripts/latest.mjs -w` to write the latest versions into package.json for ALL packages including majors — the point is to *test* latest, not to guess. The existing range style (e.g. `^`) is preserved, and because only package.json changes, the git diff stays the human-readable record of what was bumped (never make the lockfile the thing to review).
  - Hold packages back with `-x a,b` (comma-separated). When the user asked for specific packages, or wants to approve majors one by one, exclude the rest the same way.
  - If the script reports packages it could not query, fix the registry access (`npm config get registry`, proxy, CA) rather than skipping them; as a last resort look the version up with `npm view <pkg> dist-tags.latest` and edit package.json by hand to the same effect.
  - **Previously held-back majors**: check recent commit messages for packages pinned back with an incompatibility reason (e.g. "TypeScript stays on 6.x"). Quickly re-check whether the blocker is resolved (the blocking tool's supported range / release notes); if not, exclude that package with `-x` instead of re-breaking the build.
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
- **Deprecation lint errors from an upgraded library**: migrate the code to the replacement API instead of pinning the old version. Before editing, check the installed package's `.d.ts` to confirm the replacement covers everything the call sites use — every prop, argument, and exported constant — not just the main entry point.
- **Stale or corrupted install tree** (`Cannot find module` for a transitive dep after the upgrade, or a build tool ran its own installs mid-flight): clean reinstall before deeper diagnosis — remove `node_modules` and the lockfile, then install. The hoister can leave packages nested where the new graph no longer resolves them even when their lockfile entries are unchanged, and regenerating the lockfile also refreshes transitive deps, which suits an upgrade task.

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

Do **not** commit unless the user asks.
