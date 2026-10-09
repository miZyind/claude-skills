# Claude Skills

A personal [plugin marketplace](https://code.claude.com/docs/en/plugins/create-marketplace) for Claude Code. It ships one plugin, `mz`, whose skills are reusable, battle-tested workflows packaged as `SKILL.md` files.

## Skills

| Skill | Invoke | Description |
| ----- | ------ | ----------- |
| [commit](plugins/mz/skills/commit/SKILL.md) | `/mz:commit` | Stage the current task's files by explicit path, confirm the staged set, run the repo's fast check, then write a Conventional Commits message on the current branch. Pushes only when asked. |
| [cpd](plugins/mz/skills/cpd/SKILL.md) | `/mz:cpd` | Commit all, push, then deploy — or stop after the push when a GitHub Actions workflow deploys on push. |
| [grill-me](plugins/mz/skills/grill-me/SKILL.md) | `/mz:grill-me` | Interview me relentlessly about a plan until every branch of the decision tree is resolved. |
| [updeps](plugins/mz/skills/updeps/SKILL.md) | `/mz:updeps` | Upgrade all outdated npm/yarn/pnpm dependencies to latest via [taze](https://github.com/antfu-collective/taze), then prove the project still works through a verification ladder (install → lint → typecheck → build → runtime smoke test). Incompatible majors are isolated and pinned back with concrete evidence. |

## Installation

In a Claude Code session (2.1.275 or later), one step:

```
/plugin install mz --marketplace miZyind/claude-skills
```

Or from the shell, register the marketplace once and install the plugin:

```sh
claude plugin marketplace add miZyind/claude-skills
claude plugin install mz@mz
```

Claude Code records both in `~/.claude/settings.json` under `extraKnownMarketplaces` and `enabledPlugins`. A machine that receives that settings file clones the marketplace and installs the plugin by itself at the next session start.

To follow new commits automatically, set `"autoUpdate": true` on the `mz` entry in `~/.claude/settings.json`, or toggle **Enable auto-update** under `/plugin` → Marketplaces. The plugin declares no `version`, so every push counts as a new version.

Skills are namespaced by the plugin: `/mz:commit`, `/mz:cpd`, `/mz:grill-me`, `/mz:updeps`. Natural-language requests still trigger them through their descriptions.

## Repository layout

```
.claude-plugin/marketplace.json     # the catalog: one entry, mz
plugins/mz/
├── .claude-plugin/plugin.json      # plugin manifest; no version, so it tracks commits
└── skills/<skill-name>/SKILL.md    # YAML frontmatter (name, description) + workflow instructions
```

The frontmatter `description` determines when Claude auto-triggers the skill; the Markdown body is the workflow Claude follows once triggered. Larger skills may add extra files (scripts, references) next to their `SKILL.md`.

## Authoring guidelines

- Encode lessons learned from real sessions — a skill earns its place by capturing steps that were non-obvious the first time.
- Prefer evidence over assumption: skills here instruct Claude to prove causes (baselines, isolation) and verify results against real runtime behavior, not just green builds.
- Keep the `description` rich in trigger keywords; it is the matching surface.
- Run `claude plugin validate .` before pushing.
