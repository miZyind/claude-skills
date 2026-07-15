# Claude Skills

A personal collection of [Agent Skills](https://code.claude.com/docs/en/skills) for Claude Code — reusable, battle-tested workflows packaged as `SKILL.md` files.

## Skills

| Skill | Description |
| ----- | ----------- |
| [updeps](skills/updeps/SKILL.md) | Upgrades all outdated npm/yarn/pnpm dependencies to latest via [taze](https://github.com/antfu-collective/taze), then proves the project still works through a verification ladder (install → lint → typecheck → build → runtime smoke test). Incompatible majors are isolated and pinned back with concrete evidence instead of being silently kept or left broken. |

## Installation

Each skill is a directory under `skills/` containing a `SKILL.md`. Install one by symlinking (preferred — updates in this repo apply immediately) or copying it into a skills directory:

```sh
# User scope — available in every project
ln -s /path/to/claude-skills/skills/updeps ~/.claude/skills/updeps

# Project scope — shared with your team via that project's repo
ln -s /path/to/claude-skills/skills/updeps <project>/.claude/skills/updeps
```

Newly installed skills are picked up when a session starts. Invoke a skill explicitly with `/<name>` (e.g. `/updeps`), or just describe the task naturally — Claude auto-triggers the skill when the request matches its description.

## Repository layout

```
skills/
└── <skill-name>/
    └── SKILL.md    # YAML frontmatter (name, description) + workflow instructions
```

The frontmatter `description` determines when Claude auto-triggers the skill; the Markdown body is the workflow Claude follows once triggered. Larger skills may add extra files (scripts, references) next to their `SKILL.md`.

## Authoring guidelines

- Encode lessons learned from real sessions — a skill earns its place by capturing steps that were non-obvious the first time.
- Prefer evidence over assumption: skills here instruct Claude to prove causes (baselines, isolation) and verify results against real runtime behavior, not just green builds.
- Keep the `description` rich in trigger keywords; it is the matching surface.
