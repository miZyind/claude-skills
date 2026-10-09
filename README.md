# Claude Skills

A personal [plugin marketplace](https://code.claude.com/docs/en/plugins/create-marketplace) for Claude Code. It ships two plugins: `mz`, whose skills are reusable, battle-tested workflows packaged as `SKILL.md` files, and `matt`, which tracks a third-party skill straight from its upstream repository.

## Skills

### `mz`

| Skill | Invoke | Description |
| ----- | ------ | ----------- |
| [commit](plugins/mz/skills/commit/SKILL.md) | `/mz:commit` | Stage the current task's files by explicit path, confirm the staged set, run the repo's fast check, then write a Conventional Commits message on the current branch. Pushes only when asked. |
| [cpd](plugins/mz/skills/cpd/SKILL.md) | `/mz:cpd` | Commit all, push, then deploy — or stop after the push when a GitHub Actions workflow deploys on push. |
| [updeps](plugins/mz/skills/updeps/SKILL.md) | `/mz:updeps` | Upgrade all outdated npm/yarn/pnpm dependencies to latest via [taze](https://github.com/antfu-collective/taze), then prove the project still works through a verification ladder (install → lint → typecheck → build → runtime smoke test). Incompatible majors are isolated and pinned back with concrete evidence. |

### `matt`

| Skill | Invoke | Description |
| ----- | ------ | ----------- |
| [grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) | `/matt:grilling` | Matt Pocock's relentless interview that walks a plan's design tree in rounds, asking the whole frontier of answerable questions each round with a recommended answer for each. |

The `matt` plugin holds no files here. Its marketplace entry is a `git-subdir` source pointing at `skills/productivity` in [mattpocock/skills](https://github.com/mattpocock/skills), with the manifest declared inline and limited to `grilling`. Because the entry sets no `version`, every upstream commit is a new version, so auto-update follows Matt's changes instead of freezing a copy.

## Installation

In a Claude Code session (2.1.275 or later), one step per plugin:

```
/plugin install mz --marketplace miZyind/claude-skills
/plugin install matt --marketplace miZyind/claude-skills
```

Or from the shell, register the marketplace once and install the plugins:

```sh
claude plugin marketplace add miZyind/claude-skills
claude plugin install mz@mz
claude plugin install matt@mz
```

Claude Code records both in `~/.claude/settings.json` under `extraKnownMarketplaces` and `enabledPlugins`. A machine that receives that settings file clones the marketplace and installs the plugins by itself at the next session start.

To follow new commits automatically, set `"autoUpdate": true` on the `mz` entry in `~/.claude/settings.json`, or toggle **Enable auto-update** under `/plugin` → Marketplaces. Neither plugin declares a `version`, so every push here, and every upstream commit for `matt`, counts as a new version.

Skills are namespaced by their plugin: `/mz:commit`, `/mz:cpd`, `/mz:updeps`, `/matt:grilling`. Natural-language requests still trigger them through their descriptions.

## Repository layout

```
.claude-plugin/marketplace.json     # the catalog: mz (relative path) and matt (git-subdir, inline manifest)
plugins/mz/
├── .claude-plugin/plugin.json      # plugin manifest; no version, so it tracks commits
└── skills/<skill-name>/SKILL.md    # YAML frontmatter (name, description) + workflow instructions
```

The frontmatter `description` determines when Claude auto-triggers the skill; the Markdown body is the workflow Claude follows once triggered. Larger skills may add extra files (scripts, references) next to their `SKILL.md`.

## Authoring guidelines

- Encode lessons learned from real sessions — a skill earns its place by capturing steps that were non-obvious the first time.
- Prefer evidence over assumption: skills here instruct Claude to prove causes (baselines, isolation) and verify results against real runtime behavior, not just green builds.
- Keep the `description` rich in trigger keywords; it is the matching surface.
- Third-party skills go in as upstream-tracking entries like `matt`, never as copied files, so they cannot drift.
- Run `claude plugin validate .` before pushing.
