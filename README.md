# AIDD Custom Framework

Custom AIDD (AI-Driven Development) starter with custom plugin system.

## Structure

```
.
├── .aidd/
│   └── config.json     # Custom plugin configuration
├── .opencode/
│   └── commands/custom/ # Custom plugin commands
├── opencode.json
└── AGENTS.md
```

## Custom Plugin Commands

```text
aidd:custom:install          # Install plugins from private repo
aidd:custom:update           # Check and apply plugin updates
aidd:custom:clean            # Remove all plugin files
aidd:custom:doctor           # Verify installation health
aidd:custom:restore          # Restore files from backup
aidd:custom:plugin:list      # List available plugins
aidd:custom:plugin:add       # Install a specific plugin
aidd:custom:plugin:remove    # Remove a plugin
```

## Tool Detection

The system auto-detects your AIDD tool and installs plugins to the correct directories:

| Tool | Directory | Commands | Rules | Agents | Skills |
|------|----------|----------|-------|--------|--------|
| Claude Code | `.claude/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |
| Copilot | `.github/` | `prompts/custom/` | `instructions/custom/` | `agents/custom/` | `skills/custom/` |
| Cursor | `.cursor/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |
| OpenCode | `.opencode/` | `commands/custom/` | `rules/custom/` | `agents/custom/` | `skills/custom/` |

## Configuration

Edit `.aidd/config.json`:

```json
{
  "custom": {
    "repo": "owner/private-repo",
    "branch": "main"
  }
}
```

## Plugin Structure

Plugins should be organized as:

```
plugins/
├── index.json        # Plugin manifest
├── version.txt       # Version number
├── commands/        # Slash commands
├── rules/            # Coding rules
├── agents/           # Specialized agents
└── skills/           # Custom skills
```

## Getting Started

1. Clone this repository into your AIDD project
2. Run `aidd install` to install framework files
3. Configure custom repo in `.aidd/config.json`
4. Use `aidd:custom:plugin list` to see available plugins
