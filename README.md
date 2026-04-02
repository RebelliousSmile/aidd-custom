# AIDD Custom Framework

Custom AIDD (AI-Driven Development) framework configuration with overlay plugin support.

## Features

- Custom commands for the AIDD workflow
- Overlay plugin system for extending functionality
- Standard rules and templates

## Overlay Commands

```text
aidd:overlay:install   # Install plugins from private repo
aidd:overlay:update    # Check and apply plugin updates
aidd:overlay:clean     # Remove all overlay files
aidd:overlay:doctor    # Verify installation health
aidd:overlay:restore   # Restore files from backup

aidd:overlay:plugin:list    # List available plugins
aidd:overlay:plugin:add     # Install a specific plugin
aidd:overlay:plugin:remove   # Remove a plugin
```

## Configuration

Add to `.aidd/config.json`:

```json
{
  "overlay": {
    "repo": "owner/private-repo",
    "branch": "main"
  }
}
```

## Plugin Structure

Plugins should contain:

```
plugins/
├── index.json        # Plugin manifest
├── version.txt       # Version number
└── .opencode/       # Files to install
    ├── commands/
    ├── agents/
    ├── rules/
    └── templates/
```

## Getting Started

1. Clone this repository
2. Run `aidd install` to install framework files
3. Configure overlay repo in `.aidd/config.json`
4. Use `aidd:overlay:plugin list` to see available plugins
