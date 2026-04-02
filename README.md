# AIDD Custom Framework

Custom AIDD (AI-Driven Development) starter with overlay system.

## Two-Layer System

### 1. Base Overlay (always installed)
Files from `overlay/` directory installed on every `aidd install`.

### 2. Optional Plugins
Additional packages from `plugins/` that can be installed/removed.

## Structure

```
.
├── .aidd/
│   └── config.json     # Configuration (repo, branch)
├── .opencode/
│   └── commands/overlay/ # Overlay commands
├── overlay/             # Base files (commands, rules, agents, skills)
├── plugins/             # Optional plugins
├── opencode.json
└── AGENTS.md
```

## Overlay Commands

```text
aidd:overlay:install     # Install base overlay + list plugins
aidd:overlay:update      # Check overlay/plugin updates
aidd:overlay:clean       # Remove all overlay files
aidd:overlay:doctor      # Verify installation health

aidd:overlay:plugin:list     # List available plugins
aidd:overlay:plugin:add       # Install a plugin
aidd:overlay:plugin:remove    # Remove a plugin
```

## Tool Detection

Auto-detects AIDD tool and installs to correct directories:

| Tool | Directory | Commands | Rules | Agents | Skills |
|------|----------|----------|-------|--------|--------|
| Claude | `.claude/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |
| Copilot | `.github/` | `prompts/custom/` | `instructions/custom/` | `agents/custom/` | `skills/custom/` |
| Cursor | `.cursor/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |
| OpenCode | `.opencode/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |

## Configuration

Edit `.aidd/config.json`:

```json
{
  "overlay": {
    "repo": "owner/private-repo",
    "branch": "main"
  }
}
```

## Repository Structure

```
private-repo/
├── overlay/           # Base files (always installed)
│   ├── commands/
│   ├── rules/
│   ├── agents/
│   └── skills/
├── plugins/          # Optional plugins
│   ├── my-plugin-1/
│   │   ├── version.txt
│   │   ├── index.json
│   │   └── ...
│   └── index.json   # Plugin list
└── README.md
```

## Getting Started

1. Clone this repository
2. Run `aidd install` to install framework
3. Overlay files are auto-installed
4. Use `aidd:overlay:plugin list` to see optional plugins
5. Use `aidd:overlay:plugin add <name>` to install a plugin
