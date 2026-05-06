# aidd-custom

CLI to install a custom overlay of commands, rules, agents, skills and templates into AI development tool directories (Claude Code, GitHub Copilot, Cursor, OpenCode).

## Install

```bash
npm install -g aidd-custom
```

## Commands

```bash
aidd-custom setup -r owner/repo   # Set global overlay repository
aidd-custom setup                 # Show current configuration

aidd-custom install               # Install overlay into detected tool dirs
aidd-custom install --global      # Install to ~/.claude (all projects)
aidd-custom install --no-overlay  # Skip overlay (no-op, prints a message)

aidd-custom clean                 # Remove overlay files tracked by index
aidd-custom clean --global        # Clean global ~/.claude install

aidd-custom doctor                # Check installation health
```

## Configuration

Priority order (highest to lowest):

1. `.aidd/config.json` in current project
2. `~/.config/aidd-custom/config.json` (global, set via `aidd-custom setup`)
3. Built-in default: `RebelliousSmile/aidd-overlay`

```json
{
  "overlay": {
    "repo": "owner/private-repo",
    "branch": "main"
  }
}
```

## Overlay repository structure

Commands and rules live together in a flat `aidd/` directory. The filename prefix determines the destination:

- `NN_name.md` (underscore) → command → `.<tool>/commands/NN/NN_name.md`
- `NN-name.md` (dash) → rule → `.<tool>/rules/NN/NN-name.md`

```
private-repo/
├── aidd/
│   ├── 00_behavior.md      # command  → .<tool>/commands/00/00_behavior.md
│   ├── 01_onboard.md       # command  → .<tool>/commands/01/01_onboard.md
│   ├── 00-architecture.md  # rule     → .<tool>/rules/00/00-architecture.md
│   └── 01-standards.md     # rule     → .<tool>/rules/01/01-standards.md
├── agents/
│   └── my-agent.md         # → .<tool>/agents/my-agent.md
├── skills/
│   └── my-skill/           # subdir preserved as-is (multi-file skills supported)
│       └── skill.md        # → .<tool>/skills/my-skill/skill.md
└── templates/
    └── aidd/               # namespace subdir preserved
        └── my-template.md  # → aidd_docs/templates/aidd/my-template.md
```

**Key rule**: the numeric prefix (`NN`) becomes the subdirectory name; the full filename is kept. Underscore (`_`) after the number = command, dash (`-`) after the number = rule.

## Tool support matrix

| Tool | Commands | Rules | Agents | Skills | Instructions |
|------|----------|-------|--------|--------|--------------|
| Claude Code | `.claude/commands` | `.claude/rules` | `.claude/agents` | `.claude/skills` | `CLAUDE.md` |
| OpenCode | `.opencode/commands/aidd` | `.opencode/rules` | `.opencode/agents` | `.opencode/skills` | `AGENTS.md` |
| Cursor | `.cursor/commands` | `.cursor/rules` | — | — | `.cursor/rules/*.mdc` |
| GitHub Copilot | `.github/prompts` | `.github/instructions` | — | — | `.github/copilot-instructions.md` |

## Index-based tracking

All installed files are listed in `.aidd/overlay.json`. `clean` removes exactly those files; `doctor` checks each one is present on disk and compares counts with the remote overlay.
